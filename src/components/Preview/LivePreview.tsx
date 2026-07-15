"use client";

import { RefreshCw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import useStore from "@/store/useStore";
import { flattenFiles } from "@/utils/fileTree";
import { buildPreviewDocument } from "@/lib/workspace/previewPolicy.mjs";

export default function LivePreview() {
  const files = useStore((state) => state.files);
  const [refreshKey, setRefreshKey] = useState(0);

  const flatFiles = flattenFiles(files);
  const htmlFile = flatFiles.find((file) => file.name.endsWith(".html"));
  const cssFile = flatFiles.find((file) => file.name.endsWith(".css"));
  const jsFile = flatFiles.find((file) => file.name.endsWith(".js"));

  const srcDoc = useMemo(
    () => buildPreviewDocument({
      html: htmlFile?.content || "",
      css: cssFile?.content || "",
      js: jsFile?.content || "",
    }),
    [htmlFile?.content, cssFile?.content, jsFile?.content, refreshKey],
  );

  return (
    <div data-testid="live-preview" className="h-full bg-white flex flex-col border-l app-border">
      <div className="min-h-10 panel-bg border-b app-border flex items-center justify-between gap-2 px-3 shrink-0">
        <span className="text-sm">Live Preview</span>
        <div className="flex items-center gap-2">
          <span className="hidden xl:inline-flex items-center gap-1 text-[11px] text-emerald-300" title="Preview runs in an opaque-origin iframe with network, forms, popups, and parent access disabled">
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
        <iframe
          data-testid="preview-iframe"
          key={refreshKey}
          srcDoc={srcDoc}
          title="Sandboxed live preview"
          className="flex-1 w-full bg-white"
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}
