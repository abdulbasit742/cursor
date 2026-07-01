"use client";

import Editor from "@monaco-editor/react";
import { Code2 } from "lucide-react";
import useStore from "@/store/useStore";
import EditorTabs from "./EditorTabs";

export default function CodeEditor() {
  const activeFile = useStore((state) => state.activeFile);
  const editorSettings = useStore((state) => state.editorSettings);
  const updateFileContent = useStore((state) => state.updateFileContent);

  return (
    <div data-testid="code-editor" className="flex-1 h-full app-bg flex flex-col min-w-0">
      <EditorTabs />

      {!activeFile ? (
        <div className="flex-1 app-bg flex items-center justify-center text-center p-8">
          <div>
            <Code2 className="mx-auto text-blue-400" size={34} />
            <h2 className="mt-4 font-semibold">No file selected</h2>
            <p className="mt-2 text-sm app-muted">
              Open a file from Explorer or create a new file to start editing.
            </p>
          </div>
        </div>
      ) : (
        <Editor
          height="100%"
          language={activeFile.language}
          value={activeFile.content}
          theme="vs-dark"
          onChange={(value) => {
            updateFileContent(activeFile.id, value || "");
          }}
          options={{
            fontSize: editorSettings.fontSize,
            minimap: { enabled: editorSettings.minimap },
            wordWrap: editorSettings.wordWrap,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: editorSettings.tabSize,
            lineNumbers: editorSettings.lineNumbers,
            renderWhitespace: editorSettings.renderWhitespace,
            smoothScrolling: editorSettings.smoothScrolling,
            padding: {
              top: 12
            }
          }}
        />
      )}
    </div>
  );
}
