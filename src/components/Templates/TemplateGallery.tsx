"use client";

import { useMemo, useState } from "react";
import { registerBusinessTemplates } from "@/lib/templates/businessTemplates";
import { registerFreeTemplates } from "@/lib/templates/freeTemplates";
import { searchTemplates, type ProjectTemplate } from "@/lib/templates/templateRegistry";

interface TemplateGalleryProps {
  onSelect?: (template: ProjectTemplate) => void;
}

export function TemplateGallery({ onSelect }: TemplateGalleryProps) {
  const [query, setQuery] = useState("");

  useMemo(() => {
    registerFreeTemplates();
    registerBusinessTemplates();
  }, []);

  const templates = searchTemplates(query);

  return (
    <section className="flex h-full flex-col border border-[#3e3e3e] bg-[#252526] text-gray-100">
      <div className="border-b border-[#3e3e3e] p-3">
        <h2 className="text-sm font-semibold">Template Gallery</h2>
        <p className="text-xs text-gray-400">Start projects from free local templates.</p>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search templates..."
          className="mt-3 w-full rounded border border-[#3e3e3e] bg-[#1e1e1e] px-3 py-2 text-sm outline-none focus:border-[#007acc]"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {templates.length === 0 ? (
          <div className="rounded border border-dashed border-[#3e3e3e] p-8 text-center text-sm text-gray-400">
            No templates found.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <article key={template.id} className="rounded border border-[#3e3e3e] bg-[#1e1e1e] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="mt-2 text-sm text-gray-400">{template.description}</p>
                  </div>

                  {template.category && (
                    <span className="rounded bg-[#37373d] px-2 py-1 text-xs">
                      {template.category}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <span key={tag} className="rounded bg-[#37373d] px-2 py-1 text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>

                <p className="mt-3 rounded border border-[#3e3e3e] bg-[#252526] p-2 text-xs text-gray-400">
                  {Object.keys(template.files).length} files included
                </p>

                <button
                  onClick={() => onSelect?.(template)}
                  className="mt-3 w-full rounded bg-[#007acc] px-4 py-2 text-sm font-medium text-white"
                >
                  Use Template
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default TemplateGallery;
