"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";
import type { EditorSettings } from "@/store/useStore";

interface EditorSettingsPanelProps {
  settings: EditorSettings;
  onChange: (patch: Partial<EditorSettings>) => void;
  onReset: () => void;
}

export function EditorSettingsPanel({ settings, onChange, onReset }: EditorSettingsPanelProps) {
  return (
    <section className="flex h-full flex-col border border-[#3e3e3e] bg-[#252526] text-gray-100">
      <div className="border-b border-[#3e3e3e] p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-[#4fc1ff]" />
            <h2 className="text-sm font-semibold">Editor Settings</h2>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 rounded bg-[#37373d] px-3 py-1 text-xs"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">Persistent local Monaco editor preferences</p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <label className="block">
          <div className="flex items-center justify-between text-sm">
            <span>Font size</span>
            <span className="rounded bg-[#1e1e1e] px-2 py-1 text-xs">{settings.fontSize}px</span>
          </div>
          <input
            type="range"
            min={11}
            max={24}
            value={settings.fontSize}
            onChange={(event) => onChange({ fontSize: Number(event.target.value) })}
            className="mt-3 w-full accent-[#007acc]"
          />
        </label>

        <label className="block">
          <div className="flex items-center justify-between text-sm">
            <span>Tab size</span>
            <span className="rounded bg-[#1e1e1e] px-2 py-1 text-xs">{settings.tabSize}</span>
          </div>
          <input
            type="range"
            min={2}
            max={8}
            step={2}
            value={settings.tabSize}
            onChange={(event) => onChange({ tabSize: Number(event.target.value) })}
            className="mt-3 w-full accent-[#007acc]"
          />
        </label>

        <div className="grid gap-3">
          <label className="flex items-center justify-between rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3 text-sm">
            <span>Word wrap</span>
            <input
              type="checkbox"
              checked={settings.wordWrap === "on"}
              onChange={(event) => onChange({ wordWrap: event.target.checked ? "on" : "off" })}
              className="h-4 w-4 accent-[#007acc]"
            />
          </label>

          <label className="flex items-center justify-between rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3 text-sm">
            <span>Minimap</span>
            <input
              type="checkbox"
              checked={settings.minimap}
              onChange={(event) => onChange({ minimap: event.target.checked })}
              className="h-4 w-4 accent-[#007acc]"
            />
          </label>

          <label className="flex items-center justify-between rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3 text-sm">
            <span>Line numbers</span>
            <input
              type="checkbox"
              checked={settings.lineNumbers === "on"}
              onChange={(event) => onChange({ lineNumbers: event.target.checked ? "on" : "off" })}
              className="h-4 w-4 accent-[#007acc]"
            />
          </label>

          <label className="flex items-center justify-between rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3 text-sm">
            <span>Smooth scrolling</span>
            <input
              type="checkbox"
              checked={settings.smoothScrolling}
              onChange={(event) => onChange({ smoothScrolling: event.target.checked })}
              className="h-4 w-4 accent-[#007acc]"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span>Whitespace rendering</span>
          <select
            value={settings.renderWhitespace}
            onChange={(event) =>
              onChange({
                renderWhitespace: event.target.value as EditorSettings["renderWhitespace"],
              })
            }
            className="mt-2 w-full rounded border border-[#3e3e3e] bg-[#1e1e1e] px-3 py-2 outline-none focus:border-[#007acc]"
          >
            <option value="none">None</option>
            <option value="boundary">Boundary</option>
            <option value="all">All</option>
          </select>
        </label>
      </div>
    </section>
  );
}

export default EditorSettingsPanel;
