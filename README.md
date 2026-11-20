# Code execution for the Trustabl Agent Reliability Analyzer

The [Trustabl Agent Reliability Analyzer](https://github.com/trustabl/agent-reliability-analyzer)
as plain functions, for agents that write and run code in a sandbox.

Instead of calling a tool and receiving the whole scan result into its context,
an agent writes a short script: it scans, filters the result in code, and
prints only what the request needs. The full result stays in the sandbox.

```js
import { scan, summarize } from "@trustabl/code-execution-agent-reliability-analyzer";

const result = await scan(".");
console.log(summarize(result));
for (const f of result.findings.filter((f) => f.severity === "high")) {
  console.log(`${f.rule_id} ${f.file_path}:${f.start_line} ${f.title}`);
}
```

On the one-file agent in `test/fixture`, the full result is 13,403 characters;
the script above prints about 400.

This package sits alongside the analyzer's other integrations (CLI, MCP server,
plugins, CI actions). It does not replace any of them.

## Install

```bash
npm install @trustabl/code-execution-agent-reliability-analyzer
```

Node 20 or later. On first use the package downloads the pinned `trustabl`
release for your OS and architecture from GitHub Releases, checks it against the
release's `checksums.txt`, and caches it in `~/.trustabl-code-execution/analyzer/`. A
binary that does not match is never run.

| Variable | Effect |
| --- | --- |
| `TRUSTABL_BIN` | Use this `trustabl` binary instead of downloading one. |
| `TRUSTABL_VERSION` | Download this release tag instead of the pinned one. |
| `GITHUB_TOKEN` | Authenticate the download, to avoid GitHub's anonymous rate limit. |

## API

- `scan(target, options?)`: scan a local directory or a GitHub repository URL.
  Resolves to the full result, the same JSON as `trustabl scan --format json`.
  Options: `vulnScan`, `secretScan`, `licenseScan`, `includeTestPaths`,
  `detectors` (array), `rulesRef`, `offline`.
- `summarize(result)`: the score, findings per severity, inventory counts, and
  `nothingScanned` (true when nothing was analysed, so the score means nothing).
- `version()`: the analyzer's version, commit and build date.
- `SEVERITIES`: `["critical", "high", "medium", "low", "info"]`.

Types ship in `index.d.ts`.

## Skill

`skills/code-execution-agent-reliability-analyzer/SKILL.md` teaches an agent
this workflow: install, scan, filter, print only the answer. Copy it into your
agent's skills folder.

## Sandbox

The `Dockerfile` builds a reference sandbox with Node, this package and a
verified binary already in place:

```bash
docker build -t code-execution-agent-reliability-analyzer .
docker run --rm -v "$PWD:/workspace" code-execution-agent-reliability-analyzer node script.mjs
```

Any sandbox with Node and network access to github.com works too.

## What runs where

- Scanning runs locally inside your sandbox. No source code is uploaded.
- The first scan fetches detection rules from
  [trustabl/agent-reliability-rules](https://github.com/trustabl/agent-reliability-rules);
  `offline: true` uses the cached rules.
- The analyzer's telemetry is opt-in and off by default; see its
  [TELEMETRY.md](https://github.com/trustabl/agent-reliability-analyzer/blob/main/TELEMETRY.md).

## License

Apache-2.0
