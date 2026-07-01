export type TerminalOutputType = "stdout" | "stderr" | "system" | "success" | "warning";

export interface TerminalOutputLine {
  id: string;
  type: TerminalOutputType;
  text: string;
  createdAt: string;
}

function createId(): string {
  return `out_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createOutputLine(
  text: string,
  type: TerminalOutputType = "stdout"
): TerminalOutputLine {
  return {
    id: createId(),
    type,
    text,
    createdAt: new Date().toISOString(),
  };
}

export function formatCommandEcho(command: string): TerminalOutputLine {
  return createOutputLine(`$ ${command}`, "system");
}

export function formatErrorOutput(error: unknown): TerminalOutputLine {
  const message = error instanceof Error ? error.message : String(error);
  return createOutputLine(message, "stderr");
}

export function formatSuccessOutput(message: string): TerminalOutputLine {
  return createOutputLine(message, "success");
}

export function formatWarningOutput(message: string): TerminalOutputLine {
  return createOutputLine(message, "warning");
}

export function splitOutputLines(
  output: string,
  type: TerminalOutputType = "stdout"
): TerminalOutputLine[] {
  return output
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line) => createOutputLine(line, type));
}

export function mergeOutputText(lines: TerminalOutputLine[]): string {
  return lines.map((line) => line.text).join("\n");
}
