# AI Code Editor - Start Here

This project is ready for browser-based free coding agent use.

## Instant no-install mode

If Node/npm is not installed yet, open this file directly in your browser:

```txt
FREE_LOCAL_EDITOR.html
```

It includes a simple free local coding agent for:

```txt
landing page
todo app
calculator
active-file improvement notes
```

## 1. Install Node.js

If `npm` is not recognized, install Node.js LTS from:

```txt
https://nodejs.org
```

After install, close and reopen PowerShell, then check:

```bash
node --version
npm --version
```

## 2. Install dependencies

```bash
npm install
```

On this Windows workspace, the bundled portable Node runtime is already available. If normal `npm`
is blocked, use:

```bash
.tools\node-v22.11.0-win-x64\npm.cmd install --ignore-scripts
```

## 3. Start the app

```bash
npm run dev
```

Or double click:

```txt
START_NEXT_EDITOR.bat
```

Open:

```txt
http://localhost:3000
```

## 4. Free coding mode

Open the Agent panel and choose:

```txt
Free local
```

Try prompts:

```txt
create a modern landing page
create a todo app
create a calculator
improve the active file layout
```

You can also use the Agent prompt library inside the panel. It includes build, fix, refactor, quality, and docs recipes.

The agent will show:

```txt
Plan -> Validation -> Confidence -> Diff Preview -> Apply
```

When you apply agent changes, the app saves a local snapshot first and records the run in Agent History.

## 5. Template mode

Open the `Templates` panel from the top bar to create starter apps instantly.

Included local templates:

```txt
Next.js starter, Zustand editor shell, AI chat panel, CRM, finance, healthcare,
learning, recruitment, travel, automotive, fitness, restaurant, events,
logistics, real estate, hospitality
```

## 6. Import and history

Use `Download` to export a ZIP project.

Use `Import` to load a ZIP project back into the editor.

Use `History` to restore local snapshots created before template, import, reset, and restore actions.

## 7. Search mode

Use `Search` from the top bar to find files and code content across the project.

Keyboard shortcuts:

```txt
Ctrl+P
Ctrl+Shift+F
```

## 8. Source control mode

Use `Source` from the top bar to create a local checkpoint and review changes after editing or applying agent output.

It shows:

```txt
added files
modified files
deleted files
line change counts
copyable change summary
```

## 9. Problems mode

Use `Problems` from the top bar to scan the current project.

It checks:

```txt
missing linked CSS/JS from HTML
empty files
TODO/FIXME/HACK markers
risky eval/new Function/innerHTML patterns
large files
basic bracket mismatch
duplicate file paths
```

## 10. Stats, settings, and context pack

Use `Stats` to inspect project size, languages, largest files, and diagnostic counts.

Use `Ready` to run a project readiness self-test.

Use `Launch` to see a release score with actionable fixes before exporting or sharing the project.

Use `Settings` to tune Monaco font size, tab size, word wrap, minimap, line numbers, whitespace rendering, and smooth scrolling.

Use `Context` to copy a clean AI-ready project pack with:

```txt
project tree
stats
diagnostics
trimmed important files
```

Useful shortcuts:

```txt
Ctrl+B          toggle sidebar
Ctrl+`          toggle terminal
Ctrl+Shift+M    toggle problems
Ctrl+Shift+G    toggle source control
Ctrl+,          toggle settings
Ctrl+Alt+C      toggle context pack
Ctrl+Alt+R      toggle readiness
Ctrl+Alt+L      toggle launch checklist
Ctrl+Shift+P    command palette
```

## 11. Optional GPT mode

Create `.env.local`:

```txt
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
AGENT_PROVIDER=auto
```

Without `OPENAI_API_KEY`, the Coding Agent still works in free local mode.
