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

type BoundaryStatus = "preparing" | "ready" | "blocked";

export default function WorkspacePersistenceBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const [status, setStatus] = useState<BoundaryStatus>("preparing");

  useEffect(() => {
    let active = true;

    const purgeLegacy = () => {
      for (const key of LEGACY_SENSITIVE_KEYS) {
        try {
          window.localStorage.removeItem(key);
        } catch {
          // Continue clearing other legacy keys; setup still validates session storage below.
        }
      }
    };

    const prepare = async () => {
      purgeLegacy();
      const stateStorage = createExpiringSessionStorage(
        window.sessionStorage,
        window.localStorage,
      );
      const storage = createJSONStorage<ReturnType<typeof useStore.getState>>(
        () => stateStorage,
      );
      if (!storage) throw new Error("private session storage is unavailable");

      useStore.persist.setOptions({
        name: persistenceKeys.editorSession,
        storage,
      });
      await useStore.persist.rehydrate();

      if (active) setStatus("ready");
    };

    prepare().catch(() => {
      purgeLegacy();
      try {
        window.sessionStorage.removeItem(persistenceKeys.editorSession);
      } catch {
        // The editor remains blocked even when cleanup is unavailable.
      }
      if (active) setStatus("blocked");
    });

    return () => {
      active = false;
    };
  }, []);

  if (status === "blocked") {
    return (
      <div
        role="alert"
        className="grid min-h-screen place-items-center bg-[#1e1e1e] p-6 text-gray-100"
      >
        <div className="max-w-lg rounded border border-red-700 bg-red-950/30 p-5 text-center">
          <h1 className="text-base font-semibold">Private session storage is unavailable</h1>
          <p className="mt-2 text-sm text-gray-300">
            The editor was not opened because it could otherwise retain source code or prompts in an unintended durable store. Enable browser session storage, then reload.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-[#007acc] px-4 py-2 text-sm font-medium text-white"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (status !== "ready") {
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
