// Trustabl Agent Reliability Analyzer as plain functions, for agents that write
// and run code in a sandbox. Call scan(), filter the result in your own code,
// and print only what the request needs.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { ensureTrustabl } from "./lib/trustabl-bin.js";

export { ensureTrustabl };

/** Most severe first. */
export const SEVERITIES = ["critical", "high", "medium", "low", "info"];

function run(bin, args) {
  const r = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (r.error) throw new Error(`Could not run trustabl: ${r.error.message}`);
  return r;
}

/**
 * Scan a local directory or a GitHub repository URL. Resolves to the full
 * ScanResult (the same JSON as `trustabl scan --format json`).
 */
export async function scan(target, options = {}) {
  if (typeof target !== "string" || !target) {
    throw new Error("scan(target): pass a local directory or a GitHub repository URL such as https://github.com/owner/repo");
  }
  const bin = await ensureTrustabl();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trustabl-scan-"));
  const out = path.join(dir, "result.json");
  const args = ["scan", target, "--format", "json", "--no-progress", "--no-color", "-o", out];
  if (options.rulesRef) args.push("--rules-ref", options.rulesRef);
  if (options.detectors?.length) args.push("--detectors", options.detectors.join(","));
  if (options.vulnScan) args.push("--vuln-scan");
  if (options.secretScan) args.push("--secret-scan");
  if (options.licenseScan) args.push("--license-scan");
  if (options.includeTestPaths) args.push("--include-test-paths");
  if (options.offline) args.push("--no-rules-update");
  try {
    const r = run(bin, args);
    // The report file is the success signal: a scan can exit non-zero and still have reported.
    if (!fs.existsSync(out)) throw new Error(`trustabl scan failed (exit ${r.status}): ${r.stderr.trim() || "no output"}`);
    return JSON.parse(fs.readFileSync(out, "utf8"));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** A few numbers instead of the whole result: score, findings per severity, inventory counts. */
export function summarize(result) {
  const findings = Object.fromEntries(SEVERITIES.map((s) => [s, 0]));
  for (const f of result.findings ?? []) findings[f.severity] = (findings[f.severity] ?? 0) + 1;
  return {
    score: result.overall_score,
    findings,
    inventory: {
      agents: result.agents?.length ?? 0,
      tools: result.tools?.length ?? 0,
      mcpServers: result.mcp_servers?.length ?? 0,
      subagents: result.subagents?.length ?? 0,
      skills: result.skills?.length ?? 0,
    },
    // True when nothing was evaluated: the score is then meaningless, not perfect.
    nothingScanned: Boolean(result.no_agent_surfaces),
  };
}

/** The analyzer's version, commit and build date. */
export async function version() {
  const r = run(await ensureTrustabl(), ["version"]);
  if (r.status !== 0) throw new Error(`trustabl version failed: ${r.stderr.trim()}`);
  return r.stdout.trim();
}
