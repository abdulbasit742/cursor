export interface BuiltinCommandContext {
  cwd: string;
  files?: Record<string, string>;
}

export interface BuiltinCommandResult {
  output: string;
  success: boolean;
}

export type BuiltinCommandHandler = (
  args: string[],
  context: BuiltinCommandContext
) => Promise<BuiltinCommandResult>;

export interface BuiltinCommand {
  name: string;
  description: string;
  usage: string;
  handler: BuiltinCommandHandler;
}

const commands = new Map<string, BuiltinCommand>();

function register(command: BuiltinCommand): void {
  commands.set(command.name, command);
}

function parseCommand(input: string): string[] {
  return input.match(/"[^"]+"|'[^']+'|\S+/g)?.map((part) => part.replace(/^["']|["']$/g, "")) ?? [];
}

register({
  name: "help",
  description: "List available commands",
  usage: "help",
  async handler() {
    const output = Array.from(commands.values())
      .map((command) => `${command.name} - ${command.description}`)
      .join("\n");

    return { output, success: true };
  },
});

register({
  name: "pwd",
  description: "Print current directory",
  usage: "pwd",
  async handler(_, context) {
    return { output: context.cwd, success: true };
  },
});

register({
  name: "echo",
  description: "Print text",
  usage: "echo <text>",
  async handler(args) {
    return { output: args.join(" "), success: true };
  },
});

register({
  name: "clear",
  description: "Clear terminal output",
  usage: "clear",
  async handler() {
    return { output: "__CLEAR__", success: true };
  },
});

register({
  name: "ls",
  description: "List project files",
  usage: "ls",
  async handler(_, context) {
    const files = Object.keys(context.files ?? {});

    return {
      output: files.length > 0 ? files.join("\n") : "src  package.json  README.md",
      success: true,
    };
  },
});

register({
  name: "cat",
  description: "Read file content",
  usage: "cat <file>",
  async handler(args, context) {
    const target = args[0];

    if (!target) {
      return { output: "Missing file path", success: false };
    }

    const content = context.files?.[target];

    if (typeof content !== "string") {
      return { output: `File not found: ${target}`, success: false };
    }

    return { output: content, success: true };
  },
});

register({
  name: "npm",
  description: "Mock common npm commands for browser MVP",
  usage: "npm run dev",
  async handler(args) {
    const command = args.join(" ");

    if (command === "run dev") {
      return {
        output: "Starting development server... Ready on http://localhost:3000",
        success: true,
      };
    }

    if (command === "run build") {
      return {
        output: "Build command queued. Desktop mode will run real processes later.",
        success: true,
      };
    }

    return {
      output: `Unsupported npm command in browser terminal: npm ${command}`,
      success: false,
    };
  },
});

export function getBuiltinCommands(): BuiltinCommand[] {
  return Array.from(commands.values());
}

export function getBuiltinCommand(name: string): BuiltinCommand | null {
  return commands.get(name) ?? null;
}

export async function executeBuiltinCommand(
  input: string,
  context: BuiltinCommandContext
): Promise<BuiltinCommandResult> {
  const parts = parseCommand(input.trim());
  const commandName = parts[0];
  const args = parts.slice(1);

  if (!commandName) return { output: "", success: true };

  const command = getBuiltinCommand(commandName);

  if (!command) {
    return {
      output: `Unknown command: ${commandName}`,
      success: false,
    };
  }

  return command.handler(args, context);
}
