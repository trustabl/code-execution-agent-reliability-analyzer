---
name: code-execution-agent-reliability-analyzer
description: Scan AI-agent code for reliability and safety gaps by writing and running a short script with the Trustabl Agent Reliability Analyzer package, then report only what the user asked for. Use when the user wants a repository or folder of agent, tool, subagent, skill or MCP-server code checked, scored or reviewed for risky patterns, and you can run code (a sandbox, a container, or a terminal).
---

# Trustabl Agent Reliability Analyzer, by code execution

Do not paste the full scan result into the conversation. Write a script that
scans, filters in code, and prints only what the request needs. A full result
is tens of kilobytes; the answer is usually a few lines.

## Setup (once per sandbox)

```bash
npm install @trustabl/code-execution-agent-reliability-analyzer
```

Needs Node 20+ and network access to github.com: the first call downloads the
pinned `trustabl` release and verifies it against the release `checksums.txt`.
It refuses to run a binary that does not match. Set `GITHUB_TOKEN` if GitHub
rate-limits the download. In the reference image (`Dockerfile` in this repo)
the package and binary are already installed.

## The API

```js
import { scan, summarize, SEVERITIES, version } from "@trustabl/code-execution-agent-reliability-analyzer";

const result = await scan(".");               // a folder, or "https://github.com/owner/repo"
const s = summarize(result);                  // { score, findings: {critical, high, ...}, inventory, nothingScanned }
```

`scan(target, options)` options: `vulnScan`, `secretScan`, `licenseScan`,
`includeTestPaths`, `detectors` (array), `rulesRef`, `offline`.

Each finding has `severity`, `rule_id`, `title`, `file_path`, `start_line`,
`end_line`, `explanation`, `suggested_fix`, `confidence`, `scope`, `tool_name`.

## Patterns

Headline only:

```js
console.log(JSON.stringify(summarize(await scan("."))));
```

Critical and high findings, one line each:

```js
const r = await scan(".");
for (const f of r.findings.filter((f) => ["critical", "high"].includes(f.severity))) {
  console.log(`${f.severity} ${f.rule_id} ${f.file_path}:${f.start_line} ${f.title}`);
}
```

Fixes for one file:

```js
const r = await scan(".");
for (const f of r.findings.filter((f) => f.file_path === "src/tools.py")) {
  console.log(`${f.start_line}: ${f.title}\n  fix: ${f.suggested_fix}`);
}
```

## Reading results honestly

- Check `summarize(result).nothingScanned` first. If it is true, nothing was
  analysed and the score means nothing: say so instead of reporting a pass.
- A finding is a weakness, not a proven exploit. Severity reflects the shape of
  the risk.
- Findings in test files are reported but not scored unless `includeTestPaths`.
