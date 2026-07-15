"use client";

import { AlertTriangle, Pause, Play, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useStore from "@/store/useStore";
import { flattenFiles } from "@/utils/fileTree";
import {
  buildPreviewDocument,
  createPreviewConsent,
  inspectPreviewJavaScript,
  isPreviewConsentCurrent,
} from "@/lib/workspace/previewPolicy.mjs";

type PreviewConsent = Readonly<{ html: string; js: string }>;

export default function LivePreview() {
  const files = useStore((state) => state.files);
  const [refreshKey, setRefreshKey] = useState(0);
  const [scriptConsent, setScriptConsent] = useState<PreviewConsent | null>(null);

  const flatFiles = flattenFiles(files);
  const htmlFile = flatFiles.find((file) => file.name.endsWith(".html"));
  const cssFile = flatFiles.find((file) => file.name.endsWith(".css"));
  const jsFile = flatFiles.find((file) => file.name.endsWith(".js"));
  const html = htmlFile?.content || "";
  const css = cssFile?.content || "";
  const js = jsFile?.content || "";

  const scriptStatus = useMemo(
    () => inspectPreviewJavaScript({ html, js }),
    [html, js],
  );
  const scriptsEnabled = scriptStatus.allowed
    && isPreviewConsentCurrent(scriptConsent, { html, js });

  useEffect(() => {
    if (scriptConsent && !isPreviewConsentCurrent(scriptConsent, { html, js })) {
      setScriptConsent(null);
    }
  }, [html, js, scriptConsent]);

  const srcDoc = useMemo(
    () => buildPreviewDocument({ html, css, js, allowScripts: scriptsEnabled }),
    [html, css, js, scriptsEnabled, refreshKey],
  );

  const enableScripts = () => {
    if (!scriptStatus.allowed) return;
    const approved = window.confirm(
      "Run the current standalone JavaScript in the preview sandbox?\n\n"
      + "Network requests, forms, popups, frames, and parent-page access remain blocked. "
      + "The code can still use CPU or make the preview unresponsive. Consent applies only to the exact current HTML and JavaScript and is revoked when either changes.",
    );
    if (!approved) return;
    setScriptConsent(createPreviewConsent({ html, js }));
    setRefreshKey((key) => key + 1);
  };

  const disableScripts = () => {
    setScriptConsent(null);
    setRefreshKey((key) => key + 1);
  };

  return (
    <div data-testid="live-preview" className="h-full bg-white flex flex-col border-l app-border">
      <div className="min-h-10 panel-bg border-b app-border flex items-center justify-between gap-2 px-3 shrink-0">
        <span className="text-sm">Live Preview</span>
        <div className="flex items-center gap-2">
          <span
            className="hidden xl:inline-flex items-center gap-1 text-[11px] text-emerald-300"
            title="Preview uses an opaque-origin iframe with network, forms, popups, and parent access disabled"
          >
            <ShieldCheck size={13} />Sandboxed · network off
          </span>
          <button
            onClick={() => setRefreshKey((key) => key + 1)}
            className="p-1 app-hover rounded"
            title="Refresh preview"
            aria-label="Refresh preview"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {!htmlFile ? (
        <div className="flex-1 bg-white text-gray-500 flex items-center justify-center text-sm p-8 text-center">
          No HTML file found. Create an index.html file to preview your app.
        </div>
      ) : (
        <>
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2">
                {scriptsEnabled ? (
                  <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={15} />
                ) : (
                  <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={15} />
                )}
                <div>
                  <p className="font-semibold">
                    {scriptsEnabled
                      ? "JavaScript running with exact-content consent"
                      : "Scripts paused · static HTML/CSS preview only"}
                  </p>
                  <p className="mt-0.5 text-slate-500">
                    {scriptsEnabled
                      ? "Editing the current HTML or JavaScript revokes consent automatically. Sandboxed code can still consume CPU."
                      : scriptStatus.blockedReason || "Review and explicitly approve the current standalone JavaScript before it can execute."}
                  </p>
                  {scriptStatus.htmlScriptCount > 0 && (
                    <p className="mt-0.5 text-slate-500">
                      {scriptStatus.htmlScriptCount} HTML script element(s) removed. Only the reviewed standalone .js file can run.
                    </p>
                  )}
                </div>
              </div>

              {scriptsEnabled ? (
                <button
                  type="button"
                  onClick={disableScripts}
                  className="inline-flex shrink-0 items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 font-medium hover:bg-slate-100"
                >
                  <Pause size={13} /> Stop scripts
                </button>
              ) : (
                <button
                  type="button"
                  onClick={enableScripts}
                  disabled={!scriptStatus.allowed}
                  className="inline-flex shrink-0 items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play size={13} /> Review & run JavaScript
                </button>
              )}
            </div>
          </div>

          <iframe
            data-testid="preview-iframe"
            key={`${refreshKey}-${scriptsEnabled ? "scripts" : "static"}`}
            srcDoc={srcDoc}
            title={scriptsEnabled ? "Sandboxed live preview with approved scripts" : "Static sandboxed preview with scripts disabled"}
            className="flex-1 w-full bg-white"
            sandbox={scriptsEnabled ? "allow-scripts" : ""}
            referrerPolicy="no-referrer"
          />
        </>
      )}
    </div>
  );
}
