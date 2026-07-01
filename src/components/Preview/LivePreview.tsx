"use client";

import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import useStore from "@/store/useStore";
import { flattenFiles } from "@/utils/fileTree";

export default function LivePreview() {
  const files = useStore((state) => state.files);
  const [refreshKey, setRefreshKey] = useState(0);

  const flatFiles = flattenFiles(files);
  const htmlFile = flatFiles.find((file) => file.name.endsWith(".html"));
  const cssFile = flatFiles.find((file) => file.name.endsWith(".css"));
  const jsFile = flatFiles.find((file) => file.name.endsWith(".js"));

  const srcDoc = useMemo(() => {
    const html = htmlFile?.content || "";
    const css = cssFile?.content || "";
    const js = jsFile?.content || "";

    return `<!DOCTYPE html>
<html>
  <head>
    <style>${css}</style>
  </head>
  <body>
    ${html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")}
    <script>
      try {
        ${js}
      } catch (error) {
        document.body.innerHTML += '<pre style="color:red;background:#111;padding:12px;">' + error + '</pre>';
      }
    </script>
  </body>
</html>`;
  }, [htmlFile?.content, cssFile?.content, jsFile?.content, refreshKey]);

  return (
    <div data-testid="live-preview" className="h-full bg-white flex flex-col border-l app-border">
      <div className="h-10 panel-bg border-b app-border flex items-center justify-between px-3 shrink-0">
        <span className="text-sm">Live Preview</span>

        <button
          onClick={() => setRefreshKey((key) => key + 1)}
          className="p-1 app-hover rounded"
          title="Refresh preview"
        >
          <RefreshCw size={16} />
        </button>
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
          title="Live Preview"
          className="flex-1 w-full bg-white"
          sandbox="allow-scripts"
        />
      )}
    </div>
  );
}
