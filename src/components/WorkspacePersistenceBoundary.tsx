"use client";

import { createJSONStorage } from "zustand/middleware";
import { useEffect, useState, type ReactNode } from "react";
import useStore from "@/store/useStore";
import { createSessionOnlyStateStorage } from "@/lib/workspace/sessionStateStorage.mjs";

const LEGACY_SENSITIVE_KEYS = [
  "ai-code-editor-storage",
  "ai_code_editor_project_snapshots_v1",
  "cursor_ai_fs_sync_v1",
  "cursor_ai_file_history_v1",
  "cursor_ai_agent_history_v1",
];

export default function WorkspacePersistenceBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storage = createJSONStorage<ReturnType<typeof useStore.getState>>(() =>
      createSessionOnlyStateStorage(
        window.sessionStorage,
        window.localStorage,
      ),
    );

    if (storage) {
      useStore.persist.setOptions({ storage });
      for (const key of LEGACY_SENSITIVE_KEYS) {
        window.localStorage.removeItem(key);
      }
      useStore.setState({ ...useStore.getState() });
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div
        role="status"
        className="grid min-h-screen place-items-center bg-[#1e1e1e] text-sm text-gray-400"
      >
        Preparing private browser session…
      </div>
    );
  }

  return children;
}
