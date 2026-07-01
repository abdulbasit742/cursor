import { repairAgentPlan } from "./repairLoop";
import { planTask } from "./taskPlanner";
import { reviewAgentPlan } from "./codeReview";
import { scoreAgentConfidence } from "./confidenceScorer";
import { suggestTestCommands } from "./testCommandSuggester";
import type { AgentFileChange, AgentPlan, AgentRunInput, AgentRunResult } from "./types";

function matches(task: string, words: string[]) {
  const lower = task.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function pathFor(name: string, files: AgentRunInput["files"]) {
  return files.find((file) => file.name === name || file.path.endsWith(`/${name}`))?.path || name;
}

function actionFor(path: string, files: AgentRunInput["files"]) {
  return files.some((file) => file.path === path) ? "update" : "create";
}

function makeChange({
  path,
  files,
  language,
  title,
  summary,
  content
}: {
  path: string;
  files: AgentRunInput["files"];
  language: string;
  title: string;
  summary: string;
  content: string;
}): AgentFileChange {
  const action = actionFor(path, files);

  return {
    id: `${action}:${path}`,
    action,
    path,
    language,
    title,
    summary,
    content
  };
}

function landingProject(task: string, files: AgentRunInput["files"]) {
  const indexPath = pathFor("index.html", files);
  const stylePath = pathFor("style.css", files);
  const scriptPath = pathFor("script.js", files);

  return [
    makeChange({
      path: indexPath,
      files,
      language: "html",
      title: "Build landing page markup",
      summary: "Creates a polished responsive landing page.",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Launch Studio</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <nav class="nav">
    <strong>Launch Studio</strong>
    <div>
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
      <button onclick="scrollToSignup()">Start</button>
    </div>
  </nav>

  <main class="hero">
    <p class="badge">Built by your free local coding agent</p>
    <h1>${task.replace(/[<>]/g, "").slice(0, 72) || "Ship better ideas faster."}</h1>
    <p class="subtitle">A clean, responsive starter generated without paid API calls. Edit it, preview it, and keep building.</p>
    <button onclick="scrollToSignup()">Get started</button>
  </main>

  <section id="features" class="grid">
    <article><h2>Fast</h2><p>Simple structure, responsive layout, and readable code.</p></article>
    <article><h2>Editable</h2><p>Every section is plain HTML, CSS, and JavaScript.</p></article>
    <article><h2>Ready</h2><p>Use the preview panel to inspect every change instantly.</p></article>
  </section>

  <section id="pricing" class="pricing">
    <h2>Free builder workflow</h2>
    <p>No API key needed for this local template generation mode.</p>
  </section>

  <form id="signup" class="signup" onsubmit="handleSignup(event)">
    <h2>Join the launch list</h2>
    <input id="email" type="email" placeholder="you@example.com" required />
    <button type="submit">Notify me</button>
    <p id="message"></p>
  </form>

  <script src="script.js"></script>
</body>
</html>`
    }),
    makeChange({
      path: stylePath,
      files,
      language: "css",
      title: "Style landing page",
      summary: "Adds responsive layout, cards, and accessible contrast.",
      content: `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Inter, Arial, sans-serif;
  background: #0b1020;
  color: #f8fafc;
}

.nav {
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 7vw;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(11, 16, 32, 0.92);
  position: sticky;
  top: 0;
}

.nav div {
  display: flex;
  align-items: center;
  gap: 16px;
}

a {
  color: #cbd5e1;
  text-decoration: none;
}

button {
  border: 0;
  border-radius: 10px;
  padding: 11px 16px;
  background: #38bdf8;
  color: #082f49;
  font-weight: 800;
  cursor: pointer;
}

.hero {
  min-height: 62vh;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 70px 7vw 50px;
}

.badge {
  color: #67e8f9;
  background: rgba(103, 232, 249, 0.1);
  border: 1px solid rgba(103, 232, 249, 0.2);
  padding: 8px 12px;
  border-radius: 999px;
}

h1 {
  max-width: 920px;
  font-size: clamp(2.8rem, 8vw, 6.4rem);
  line-height: 0.95;
  margin: 18px auto;
}

.subtitle {
  max-width: 650px;
  color: #cbd5e1;
  font-size: 1.18rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  padding: 30px 7vw 70px;
}

article,
.pricing,
.signup {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 18px;
  padding: 24px;
}

.pricing,
.signup {
  margin: 0 7vw 28px;
}

input {
  width: min(420px, 100%);
  margin-right: 8px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: #111827;
  color: white;
}

#message {
  color: #86efac;
}

@media (max-width: 760px) {
  .nav {
    padding: 0 18px;
  }

  .nav a {
    display: none;
  }

  .grid {
    grid-template-columns: 1fr;
    padding-inline: 18px;
  }

  .pricing,
  .signup {
    margin-inline: 18px;
  }
}`
    }),
    makeChange({
      path: scriptPath,
      files,
      language: "javascript",
      title: "Add landing interactions",
      summary: "Adds smooth scroll and signup feedback.",
      content: `function scrollToSignup() {
  document.getElementById("signup").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function handleSignup(event) {
  event.preventDefault();

  const email = document.getElementById("email").value;
  document.getElementById("message").textContent =
    "Thanks! " + email + " is on the list.";
}`
    })
  ];
}

function todoProject(files: AgentRunInput["files"]) {
  const indexPath = pathFor("index.html", files);
  const stylePath = pathFor("style.css", files);
  const scriptPath = pathFor("script.js", files);

  return [
    makeChange({
      path: indexPath,
      files,
      language: "html",
      title: "Build todo app markup",
      summary: "Creates a focused todo app shell.",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Focus Todo</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main class="app">
    <header>
      <p>Focus Todo</p>
      <h1>Plan today clearly.</h1>
    </header>

    <form id="todoForm">
      <input id="todoInput" placeholder="Add a task..." autocomplete="off" />
      <button>Add</button>
    </form>

    <ul id="todoList"></ul>
  </main>

  <script src="script.js"></script>
</body>
</html>`
    }),
    makeChange({
      path: stylePath,
      files,
      language: "css",
      title: "Style todo app",
      summary: "Adds compact responsive styling.",
      content: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #101827;
  color: white;
  font-family: Arial, sans-serif;
}

.app {
  width: min(92vw, 480px);
  padding: 28px;
  border-radius: 22px;
  background: #172033;
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.28);
}

header p {
  color: #38bdf8;
  font-weight: 700;
}

h1 {
  margin-top: 0;
}

form {
  display: flex;
  gap: 10px;
}

input {
  flex: 1;
  padding: 13px;
  border: 1px solid #334155;
  border-radius: 12px;
  background: #0f172a;
  color: white;
}

button {
  border: 0;
  border-radius: 12px;
  padding: 13px 16px;
  background: #22c55e;
  color: white;
  font-weight: 700;
}

li {
  list-style: none;
  margin-top: 10px;
  padding: 13px;
  border-radius: 12px;
  background: #0f172a;
  cursor: pointer;
}

ul {
  padding: 0;
}`
    }),
    makeChange({
      path: scriptPath,
      files,
      language: "javascript",
      title: "Add todo behavior",
      summary: "Adds create, render, delete, and localStorage persistence.",
      content: `const form = document.getElementById("todoForm");
const input = document.getElementById("todoInput");
const list = document.getElementById("todoList");

let todos = JSON.parse(localStorage.getItem("focus-todos") || "[]");

function saveTodos() {
  localStorage.setItem("focus-todos", JSON.stringify(todos));
}

function renderTodos() {
  list.innerHTML = "";

  todos.forEach((todo, index) => {
    const item = document.createElement("li");
    item.textContent = todo;
    item.title = "Click to remove";
    item.onclick = () => {
      todos.splice(index, 1);
      saveTodos();
      renderTodos();
    };
    list.appendChild(item);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const value = input.value.trim();
  if (!value) return;

  todos.unshift(value);
  input.value = "";
  saveTodos();
  renderTodos();
});

renderTodos();`
    })
  ];
}

function calculatorProject(files: AgentRunInput["files"]) {
  const indexPath = pathFor("index.html", files);
  const stylePath = pathFor("style.css", files);
  const scriptPath = pathFor("script.js", files);

  return [
    makeChange({
      path: indexPath,
      files,
      language: "html",
      title: "Build calculator markup",
      summary: "Creates a clean calculator interface.",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Calculator</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <main class="calculator">
    <input id="display" readonly aria-label="Calculator display" />
    <div class="keys">
      <button onclick="clearDisplay()">C</button>
      <button onclick="appendValue('/')">/</button>
      <button onclick="appendValue('*')">*</button>
      <button onclick="backspace()">DEL</button>
      <button onclick="appendValue('7')">7</button>
      <button onclick="appendValue('8')">8</button>
      <button onclick="appendValue('9')">9</button>
      <button onclick="appendValue('-')">-</button>
      <button onclick="appendValue('4')">4</button>
      <button onclick="appendValue('5')">5</button>
      <button onclick="appendValue('6')">6</button>
      <button onclick="appendValue('+')">+</button>
      <button onclick="appendValue('1')">1</button>
      <button onclick="appendValue('2')">2</button>
      <button onclick="appendValue('3')">3</button>
      <button onclick="calculate()">=</button>
      <button onclick="appendValue('0')" class="zero">0</button>
      <button onclick="appendValue('.')">.</button>
    </div>
  </main>
  <script src="script.js"></script>
</body>
</html>`
    }),
    makeChange({
      path: stylePath,
      files,
      language: "css",
      title: "Style calculator",
      summary: "Adds calculator layout and button states.",
      content: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #111827;
  font-family: Arial, sans-serif;
}

.calculator {
  width: min(92vw, 360px);
  padding: 22px;
  border-radius: 24px;
  background: #020617;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

#display {
  width: 100%;
  height: 70px;
  margin-bottom: 14px;
  border: 0;
  border-radius: 16px;
  background: #1e293b;
  color: white;
  font-size: 2rem;
  text-align: right;
  padding: 0 16px;
}

.keys {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

button {
  height: 58px;
  border: 0;
  border-radius: 15px;
  background: #334155;
  color: white;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}

button:hover {
  background: #475569;
}

.zero {
  grid-column: span 2;
}`
    }),
    makeChange({
      path: scriptPath,
      files,
      language: "javascript",
      title: "Add calculator logic",
      summary: "Adds safe arithmetic input behavior.",
      content: `const display = document.getElementById("display");

function appendValue(value) {
  display.value += value;
}

function clearDisplay() {
  display.value = "";
}

function backspace() {
  display.value = display.value.slice(0, -1);
}

function calculate() {
  const allowedInput = new RegExp("^[0-9+\\\\-*/. ()]+$");

  if (!allowedInput.test(display.value)) {
    display.value = "Error";
    return;
  }

  try {
    display.value = Function('"use strict"; return (' + display.value + ')')();
  } catch {
    display.value = "Error";
  }
}`
    })
  ];
}

function genericPatch(task: string, input: AgentRunInput) {
  const activePath = input.activeFilePath || input.files[0]?.path || "index.html";
  const activeFile = input.files.find((file) => file.path === activePath);
  const currentContent = activeFile?.content || "";
  const language = activeFile?.language || "plaintext";
  const content = appendAgentNote(currentContent, language, task);

  return [
    makeChange({
      path: activePath,
      files: input.files,
      language,
      title: "Update active file",
      summary: "Adds a local-agent note because this free mode cannot deeply infer every custom task yet.",
      content
    })
  ];
}

function buildLocalChanges(input: AgentRunInput) {
  const task = input.task;

  if (matches(task, ["todo", "task list", "tasks"])) {
    return todoProject(input.files);
  }

  if (matches(task, ["calculator", "calc"])) {
    return calculatorProject(input.files);
  }

  if (
    matches(task, [
      "landing",
      "portfolio",
      "pricing",
      "website",
      "homepage",
      "home page",
      "saas",
      "app"
    ])
  ) {
    return landingProject(task, input.files);
  }

  return genericPatch(task, input);
}

function commentForLanguage(language: string, text: string) {
  const safeText = text.replace(/\*\//g, "* /").replace(/-->/g, "-- >").slice(0, 400);

  if (language === "html" || language === "markdown") {
    return `<!--
Local free agent note:
${safeText}
-->`;
  }

  if (language === "javascript" || language === "typescript") {
    return `/*
Local free agent note:
${safeText}
*/`;
  }

  return `/*
Local free agent note:
${safeText}
*/`;
}

function appendAgentNote(content: string, language: string, task: string) {
  const note = commentForLanguage(language, task);

  return content.trim().length > 0 ? `${content}\n\n${note}` : note;
}

export async function runMockAgent(input: AgentRunInput): Promise<AgentRunResult> {
  const taskPlan = planTask({
    task: input.task,
    files: input.files,
    activeFilePath: input.activeFilePath
  });
  const changes = buildLocalChanges(input);
  const plan: AgentPlan = {
    title: "Free local agent plan",
    summary:
      "Generated by the built-in free agent. It works without OPENAI_API_KEY and is best for common browser projects/templates.",
    steps: [
      "Inspect task and current project files.",
      "Choose a local template or safe active-file update.",
      "Generate full file contents.",
      "Validate changes before preview."
    ],
    changes,
    risks: [
      "Local free mode is template/heuristic based, not as smart as GPT-backed mode."
    ],
    commands: suggestTestCommands(changes)
  };
  const repaired = repairAgentPlan({
    plan,
    projectFiles: input.files
  });
  const review = reviewAgentPlan(repaired.plan.changes);
  const confidence = scoreAgentConfidence({
    changes: repaired.plan.changes,
    validationIssues: repaired.validation.issues,
    reviewFindings: review
  });

  return {
    provider: "local",
    plan: repaired.plan,
    taskPlan,
    validation: repaired.validation,
    review,
    confidence,
    notes: [
      "Free local mode active.",
      "Add OPENAI_API_KEY later for smarter project-wide coding."
    ]
  };
}
