export function getLanguageFromName(name: string) {
  const lowerName = name.toLowerCase();

  if (lowerName.endsWith(".html")) return "html";
  if (lowerName.endsWith(".css")) return "css";
  if (lowerName.endsWith(".js") || lowerName.endsWith(".jsx")) {
    return "javascript";
  }
  if (lowerName.endsWith(".ts") || lowerName.endsWith(".tsx")) {
    return "typescript";
  }
  if (lowerName.endsWith(".json")) return "json";
  if (lowerName.endsWith(".md")) return "markdown";
  if (lowerName.endsWith(".py")) return "python";
  if (lowerName.endsWith(".sql")) return "sql";
  if (lowerName.endsWith(".yml") || lowerName.endsWith(".yaml")) {
    return "yaml";
  }

  return "plaintext";
}
