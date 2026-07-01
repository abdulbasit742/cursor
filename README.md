# AI Code Editor

A Cursor-like AI coding workspace starter built with Next.js, Monaco Editor, Zustand, Tailwind CSS, and an OpenAI-compatible API route.

## Features

- Monaco code editor
- File explorer with folders
- Editor tabs
- Live HTML/CSS/JS preview
- AI chat panel
- Coding Agent panel with plan, multi-file diff preview, and apply flow
- Agent run history with planned/applied/failed audit trail
- Automatic project snapshot before applying agent changes
- Project context builder with repo map, file ranking, and token budget trimming
- Safe change validation, lightweight code review, repair filtering, confidence scoring
- Free local coding agent mode that works without an OpenAI API key
- Agent prompt library with build, fix, refactor, quality, and docs recipes
- Template gallery with local starters for CRM, finance, healthcare, learning, travel, restaurant, logistics, real estate, and more
- Import ZIP projects back into the editor
- Local project snapshots and restore history
- Project-wide search and quick-open panel
- Local source-control checkpoint and change summary panel
- Problems/diagnostics panel for missing assets, TODO markers, risky JavaScript, empty files, and basic bracket checks
- Project stats panel with file, folder, language, size, and diagnostics summaries
- Project readiness self-test panel
- Launch checklist with release score and actionable fixes
- Persistent Monaco editor settings
- AI Context Pack panel that copies a prompt-ready trimmed project bundle for other coding agents
- Apply AI code to the active file
- Create new files from AI code blocks
- Mock terminal
- Local persistence
- Download project as ZIP

## Setup

Fast start:

```txt
Read START_HERE.md
```

No-install fallback:

```txt
Open FREE_LOCAL_EDITOR.html directly in your browser.
```

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Environment

```txt
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
AGENT_PROVIDER=auto
```

If `OPENAI_API_KEY` is missing, the Coding Agent automatically falls back to free local mode. The normal AI Chat still needs an API key for GPT responses.
