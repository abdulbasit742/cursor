export interface SelfTestResult {
  name: string;
  passed: boolean;
  details: string;
  durationMs: number;
}

export interface SelfTestReport {
  passed: boolean;
  createdAt: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  durationMs: number;
  results: SelfTestResult[];
}

export interface ProjectFileMap {
  [path: string]: string;
}

function runTest(name: string, condition: boolean, details: string): SelfTestResult {
  const started = Date.now();

  return {
    name,
    passed: condition,
    details,
    durationMs: Math.max(1, Date.now() - started),
  };
}

export function runAgentSelfTest(files: ProjectFileMap): SelfTestReport {
  const started = Date.now();
  const fileNames = Object.keys(files);

  const results: SelfTestResult[] = [
    runTest("Project contains files", fileNames.length > 0, `${fileNames.length} files detected`),
    runTest(
      "package.json exists",
      Boolean(files["package.json"]),
      files["package.json"] ? "package.json found" : "package.json missing"
    ),
    runTest(
      "tsconfig.json exists",
      Boolean(files["tsconfig.json"]),
      files["tsconfig.json"] ? "TypeScript config found" : "tsconfig.json missing"
    ),
    runTest(
      "Next.js app directory exists",
      fileNames.some((file) => file.startsWith("app/") || file.startsWith("src/app/")),
      "Checked for App Router structure"
    ),
    runTest(
      "Source directory exists",
      fileNames.some((file) => file.startsWith("src/")),
      "Checked src directory"
    ),
    runTest(
      "Tailwind config exists",
      fileNames.some((file) => file.toLowerCase().includes("tailwind")),
      "Tailwind configuration scan complete"
    ),
    runTest(
      "TypeScript files detected",
      fileNames.some((file) => file.endsWith(".ts") || file.endsWith(".tsx")),
      "Checked for TS/TSX files"
    ),
  ];

  const passedTests = results.filter((result) => result.passed).length;
  const failedTests = results.length - passedTests;

  return {
    passed: failedTests === 0,
    createdAt: new Date().toISOString(),
    totalTests: results.length,
    passedTests,
    failedTests,
    durationMs: Math.max(1, Date.now() - started),
    results,
  };
}

export function generateSelfTestSummary(report: SelfTestReport): string {
  if (report.passed) return `All ${report.totalTests} tests passed successfully.`;
  return `${report.failedTests} test(s) failed out of ${report.totalTests}.`;
}

export function getFailedTests(report: SelfTestReport): SelfTestResult[] {
  return report.results.filter((result) => !result.passed);
}

export function getPassedTests(report: SelfTestReport): SelfTestResult[] {
  return report.results.filter((result) => result.passed);
}
