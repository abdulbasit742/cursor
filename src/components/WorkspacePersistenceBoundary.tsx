"use client";

import { createJSONStorage } from "zustand/middleware";
import { useEffect, useState, type ReactNode } from "react";
import useStore from "@/store/useStore";
import {
  createExpiringSessionStorage,
  persistenceKeys,
} from "@/lib/workspace/persistencePolicy.mjs";

const LEGACY_SENSITIVE_KEYS = [
  persistenceKeys.legacyEditorLocal,
  persistenceKeys.legacyFsSnapshots,
  "ai_code_editor_project_snapshots_v1",
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
    let active = true;

    const prepare = async () => {
      for (const key of LEGACY_SENSITIVE_KEYS) {
        try {
          window.localStorage.removeItem(key);
        } catch {
          // A blocked legacy store must not prevent a clean private session.
        }
      }

      const stateStorage = createExpiringSessionStorage(
        window.sessionStorage,
        window.localStorage,
      );
      const storage = createJSONStorage<ReturnType<typeof useStore.getState>>(
        () => stateStorage,
      );

      if (storage) {
        useStore.persist.setOptions({
          name: persistenceKeys.editorSession,
          storage,
        });
        await useStore.persist.rehydrate();
      }

      if (active) setReady(true);
    };

    prepare().catch(() => {
      if (active) setReady(true);
    });

    return () => {
      active = false;
    };
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
