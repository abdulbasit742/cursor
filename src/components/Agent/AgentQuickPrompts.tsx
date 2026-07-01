"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  searchPromptRecipes,
  type PromptRecipeCategory,
} from "@/lib/agent/promptLibrary";

const CATEGORIES: Array<PromptRecipeCategory | "all"> = [
  "all",
  "build",
  "fix",
  "refactor",
  "quality",
  "docs",
];

function riskClassName(risk: "low" | "medium" | "high"): string {
  if (risk === "high") return "text-red-300";
  if (risk === "medium") return "text-yellow-300";
  return "text-green-300";
}

export default function AgentQuickPrompts({
  onSelect
}: {
  onSelect: (prompt: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PromptRecipeCategory | "all">("all");

  const recipes = useMemo(
    () => searchPromptRecipes(query, category).slice(0, 8),
    [category, query]
  );

  return (
    <div className="rounded-lg border app-border app-bg p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold">Agent prompt library</div>
          <p className="mt-1 text-[11px] app-muted">One-click tasks for free local or GPT mode</p>
        </div>
        <span className="rounded bg-[#1e1e1e] px-2 py-1 text-[11px] app-muted">
          {recipes.length}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded border app-border app-input px-2">
        <Search size={13} className="app-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search prompts..."
          className="h-8 min-w-0 flex-1 bg-transparent text-xs outline-none"
        />
      </div>

      <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`rounded px-2 py-1 text-[11px] capitalize ${
              category === item ? "bg-cyan-600 text-white" : "app-hover"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2">
        {recipes.map((recipe) => (
          <button
            key={recipe.id}
            onClick={() => onSelect(recipe.prompt)}
            className="rounded border app-border app-hover px-3 py-2 text-left"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium">{recipe.title}</span>
              <span className={`text-[10px] uppercase ${riskClassName(recipe.risk)}`}>
                {recipe.risk}
              </span>
            </div>
            <p className="mt-1 text-[11px] app-muted">{recipe.description}</p>
          </button>
        ))}

        {recipes.length === 0 && (
          <div className="rounded border border-dashed app-border px-3 py-6 text-center text-xs app-muted">
            No prompt recipes found.
          </div>
        )}
      </div>
    </div>
  );
}
