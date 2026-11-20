import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { scan, summarize, version } from "../index.js";
import { assetName, expectedChecksum, normalizeTag, platformTarget, setting } from "../lib/trustabl-bin.js";

const fixture = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixture");

test("asset names match the release matrix", () => {
  assert.equal(assetName("v0.1.16", platformTarget("linux", "x64")), "trustabl_0.1.16_linux_amd64.tar.gz");
  assert.equal(assetName("v0.1.16", platformTarget("darwin", "arm64")), "trustabl_0.1.16_darwin_arm64.tar.gz");
  assert.equal(assetName("v0.1.16", platformTarget("win32", "arm64")), "trustabl_0.1.16_windows_amd64.zip");
  assert.throws(() => platformTarget("aix", "x64"));
});

test("checksum lookup matches the exact asset only", () => {
  const sums = "aaa  trustabl_0.1.16_linux_amd64.tar.gz\nbbb  trustabl_0.1.16_linux_amd64.tar.gz.sbom\n";
  assert.equal(expectedChecksum(sums, "trustabl_0.1.16_linux_amd64.tar.gz"), "aaa");
  assert.equal(expectedChecksum(sums, "trustabl_0.1.16_darwin_arm64.tar.gz"), null);
});

test("settings ignore unsubstituted placeholders", () => {
  assert.equal(setting("${TRUSTABL_VERSION}"), undefined);
  assert.equal(setting("  "), undefined);
  assert.equal(setting(" v0.1.16 "), "v0.1.16");
  assert.equal(normalizeTag("0.1.16"), "v0.1.16");
});

test("summarize counts findings and flags empty scans", () => {
  const s = summarize({ overall_score: 0.5, findings: [{ severity: "high" }, { severity: "high" }, { severity: "low" }], tools: [{}] });
  assert.deepEqual(s.findings, { critical: 0, high: 2, medium: 0, low: 1, info: 0 });
  assert.equal(s.inventory.tools, 1);
  assert.equal(s.nothingScanned, false);
  assert.equal(summarize({ findings: [], no_agent_surfaces: true }).nothingScanned, true);
});

test("scan() rejects a missing target", async () => {
  await assert.rejects(scan(""), /local directory or a GitHub repository URL/);
});

// Downloads and verifies the real release binary, then scans the fixture agent.
test("scans a real agent end to end", { timeout: 300_000 }, async () => {
  assert.match(await version(), /\d+\.\d+\.\d+/);
  const result = await scan(fixture);
  const s = summarize(result);
  assert.ok(s.inventory.tools >= 1, `expected the fixture tool in the inventory, got ${JSON.stringify(s.inventory)}`);
  assert.ok(result.findings.length > 0, "expected findings on a shell-running tool");
  assert.equal(s.nothingScanned, false);
});
