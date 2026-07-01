export type PromptRecipeCategory =
  | "build"
  | "fix"
  | "refactor"
  | "quality"
  | "docs";

export interface PromptRecipe {
  id: string;
  title: string;
  category: PromptRecipeCategory;
  prompt: string;
  description: string;
  risk: "low" | "medium" | "high";
}

export const promptRecipes: PromptRecipe[] = [
  {
    id: "build-landing-page",
    title: "Modern landing page",
    category: "build",
    risk: "low",
    description: "Create a polished responsive HTML/CSS/JS landing page.",
    prompt:
      "Create a modern responsive landing page with strong visual hierarchy, mobile-friendly layout, polished CSS, and a simple interactive call-to-action.",
  },
  {
    id: "build-dashboard",
    title: "SaaS dashboard",
    category: "build",
    risk: "medium",
    description: "Build a dense operator-style dashboard UI.",
    prompt:
      "Create a SaaS dashboard interface with summary metrics, recent activity, searchable table, and clean responsive layout. Keep it practical and production-looking.",
  },
  {
    id: "build-todo",
    title: "Todo app",
    category: "build",
    risk: "low",
    description: "Create a useful local todo app.",
    prompt:
      "Create a todo app with add, complete, delete, filter, empty state, and localStorage persistence where possible.",
  },
  {
    id: "fix-runtime-error",
    title: "Fix runtime error",
    category: "fix",
    risk: "medium",
    description: "Ask the agent to inspect and repair likely runtime bugs.",
    prompt:
      "Inspect the current project for likely runtime errors and fix them with minimal safe changes. Preserve existing behavior and explain changed files in the plan.",
  },
  {
    id: "fix-mobile-layout",
    title: "Fix mobile layout",
    category: "fix",
    risk: "low",
    description: "Improve responsiveness and overflow issues.",
    prompt:
      "Review the UI for mobile responsiveness, text overflow, and layout breakage. Apply small CSS/markup fixes so it works well on narrow screens.",
  },
  {
    id: "refactor-components",
    title: "Refactor components",
    category: "refactor",
    risk: "medium",
    description: "Split repeated UI into cleaner functions/components.",
    prompt:
      "Refactor duplicated or overly large UI sections into cleaner components/functions while keeping behavior the same. Avoid broad rewrites.",
  },
  {
    id: "quality-accessibility",
    title: "Accessibility pass",
    category: "quality",
    risk: "low",
    description: "Improve labels, focus states, and semantic HTML.",
    prompt:
      "Improve accessibility with semantic HTML, useful aria labels where needed, keyboard-friendly controls, visible focus states, and readable contrast.",
  },
  {
    id: "quality-performance",
    title: "Performance pass",
    category: "quality",
    risk: "medium",
    description: "Reduce avoidable expensive work and oversized UI updates.",
    prompt:
      "Review the project for obvious performance issues. Add memoization or smaller rendering boundaries where useful, without changing the user-visible behavior.",
  },
  {
    id: "docs-readme",
    title: "Update README",
    category: "docs",
    risk: "low",
    description: "Make project docs clearer and more complete.",
    prompt:
      "Update the README or in-project docs so setup, features, keyboard shortcuts, and known limitations are clear for a new developer.",
  },
];

export function searchPromptRecipes(query: string, category: PromptRecipeCategory | "all") {
  const normalizedQuery = query.trim().toLowerCase();

  return promptRecipes.filter((recipe) => {
    const categoryOk = category === "all" || recipe.category === category;
    const queryOk =
      !normalizedQuery ||
      [recipe.title, recipe.description, recipe.prompt, recipe.category]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    return categoryOk && queryOk;
  });
}
