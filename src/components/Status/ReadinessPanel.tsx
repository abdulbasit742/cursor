"use client";

import { useMemo } from "react";
import {
  generateSelfTestSummary,
  getFailedTests,
  runAgentSelfTest,
  type ProjectFileMap,
} from "@/lib/agent/selfTest";

interface ReadinessPanelProps {
  files: ProjectFileMap;
  title?: string;
}

function statusClass(passed: boolean): string {
  return passed ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300";
}

export function ReadinessPanel({ files, title = "Project Readiness" }: ReadinessPanelProps) {
  const report = useMemo(() => runAgentSelfTest(files), [files]);
  const failedTests = getFailedTests(report);

  return (
    <section className="flex h-full flex-col border border-[#3e3e3e] bg-[#252526] text-gray-100">
      <div className="border-b border-[#3e3e3e] p-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="text-xs text-gray-400">AI project validation and diagnostics</p>
          </div>

          <span className={`rounded px-3 py-1 text-xs font-medium ${statusClass(report.passed)}`}>
            {report.passed ? "READY" : "ISSUES FOUND"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b border-[#3e3e3e] p-3 md:grid-cols-4">
        <div className="rounded bg-[#1e1e1e] p-3">
          <p className="text-xs text-gray-500">Total Tests</p>
          <p className="mt-1 text-2xl font-bold">{report.totalTests}</p>
        </div>
        <div className="rounded bg-[#1e1e1e] p-3">
          <p className="text-xs text-gray-500">Passed</p>
          <p className="mt-1 text-2xl font-bold text-green-300">{report.passedTests}</p>
        </div>
        <div className="rounded bg-[#1e1e1e] p-3">
          <p className="text-xs text-gray-500">Failed</p>
          <p className="mt-1 text-2xl font-bold text-red-300">{report.failedTests}</p>
        </div>
        <div className="rounded bg-[#1e1e1e] p-3">
          <p className="text-xs text-gray-500">Duration</p>
          <p className="mt-1 text-2xl font-bold">{report.durationMs}ms</p>
        </div>
      </div>

      <div className="border-b border-[#3e3e3e] p-3">
        <p className="rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3 text-sm text-gray-300">
          {generateSelfTestSummary(report)}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          {report.results.map((result) => (
            <article key={result.name} className="rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{result.name}</h3>
                  <p className="mt-1 text-sm text-gray-400">{result.details}</p>
                </div>

                <span className={`rounded px-2 py-1 text-xs font-medium ${statusClass(result.passed)}`}>
                  {result.passed ? "PASS" : "FAIL"}
                </span>
              </div>
            </article>
          ))}
        </div>

        {failedTests.length > 0 && (
          <div className="mt-4 rounded border border-red-900 bg-red-950/30 p-3">
            <h3 className="font-semibold text-red-300">Recommended Actions</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-200">
              {failedTests.map((test) => (
                <li key={test.name}>Resolve issue in: {test.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

export default ReadinessPanel;
