export type Severity = "critical" | "high" | "medium" | "low" | "info";

export const SEVERITIES: Severity[];

export interface ScanOptions {
  /** Detection-rules branch or tag (default: the rules repo's default branch). */
  rulesRef?: string;
  /** Detector categories to run, e.g. ["claude_sdk", "mcp"] (default: all). */
  detectors?: string[];
  /** Match dependencies against OSV and report known CVEs. */
  vulnScan?: boolean;
  /** Flag hardcoded secrets. */
  secretScan?: boolean;
  /** Flag copyleft dependency licenses. */
  licenseScan?: boolean;
  /** Score findings in test files too. */
  includeTestPaths?: boolean;
  /** Use cached rules only; no network fetch for rules. */
  offline?: boolean;
}

export interface Finding {
  rule_id: string;
  category: string;
  /** tool | agent | subagent | repo; empty for META findings. */
  scope: string;
  severity: Severity;
  tool_name: string;
  file_path: string;
  start_line: number;
  end_line: number;
  title: string;
  explanation: string;
  suggested_fix: string;
  /** 0..1 */
  confidence: number;
  /** "test" for findings in test-path files. */
  origin?: string;
}

/** The full `trustabl scan --format json` result. Only the commonly used fields are typed. */
export interface ScanResult {
  scan_id: string;
  repo: string;
  findings: Finding[];
  overall_score: number;
  agents: unknown[];
  tools: unknown[];
  mcp_servers: unknown[];
  subagents: unknown[];
  skills: unknown[];
  sdks: unknown[];
  rules_version: string;
  no_agent_surfaces?: boolean;
  [field: string]: unknown;
}

export interface Summary {
  score: number;
  findings: Record<Severity, number>;
  inventory: { agents: number; tools: number; mcpServers: number; subagents: number; skills: number };
  /** True when nothing was evaluated: the score is then meaningless, not perfect. */
  nothingScanned: boolean;
}

/** Scan a local directory or a GitHub repository URL. */
export function scan(target: string, options?: ScanOptions): Promise<ScanResult>;

/** A few numbers instead of the whole result. */
export function summarize(result: ScanResult): Summary;

/** The analyzer's version, commit and build date. */
export function version(): Promise<string>;

/** Absolute path of the verified `trustabl` binary, downloading it on first use. */
export function ensureTrustabl(opts?: { env?: Record<string, string | undefined>; home?: string }): Promise<string>;
