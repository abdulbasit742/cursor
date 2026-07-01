import type { AgentFileChange } from "./types";

export function suggestTestCommands(changes: AgentFileChange[]) {
  const paths = changes.map((change) => change.path);
  const commands = new Set<string>();

  if (paths.some((path) => path.endsWith(".ts") || path.endsWith(".tsx"))) {
    commands.add("npm run typecheck");
  }

  if (
    paths.some((path) =>
      [".ts", ".tsx", ".js", ".jsx"].some((extension) => path.endsWith(extension))
    )
  ) {
    commands.add("npm run lint");
  }

  if (paths.some((path) => path.startsWith("src/app") || path.startsWith("src/components"))) {
    commands.add("npm run build");
  }

  return Array.from(commands);
}
