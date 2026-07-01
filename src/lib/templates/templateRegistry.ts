export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  category?: string;
  thumbnail?: string;
  files: Record<string, string>;
  createdAt?: string;
}

const registry = new Map<string, ProjectTemplate>();

export function registerTemplate(template: ProjectTemplate): void {
  registry.set(template.id, template);
}

export function unregisterTemplate(id: string): boolean {
  return registry.delete(id);
}

export function getTemplate(id: string): ProjectTemplate | null {
  return registry.get(id) ?? null;
}

export function listTemplates(): ProjectTemplate[] {
  return Array.from(registry.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function searchTemplates(query: string): ProjectTemplate[] {
  const q = query.trim().toLowerCase();
  if (!q) return listTemplates();

  return listTemplates().filter((template) =>
    [template.name, template.description, template.category ?? "", ...template.tags]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );
}

export function getTemplatesByCategory(category: string): ProjectTemplate[] {
  return listTemplates().filter(
    (template) => template.category?.toLowerCase() === category.toLowerCase()
  );
}

export function templateExists(id: string): boolean {
  return registry.has(id);
}

export function clearTemplateRegistry(): void {
  registry.clear();
}

export function countTemplates(): number {
  return registry.size;
}

export function importTemplates(templates: ProjectTemplate[]): void {
  templates.forEach((template) => registerTemplate(template));
}

export function exportTemplates(): ProjectTemplate[] {
  return listTemplates();
}

export function cloneTemplate(id: string, newId: string, newName: string): ProjectTemplate | null {
  const original = getTemplate(id);
  if (!original) return null;

  const cloned: ProjectTemplate = {
    ...original,
    id: newId,
    name: newName,
    createdAt: new Date().toISOString(),
  };

  registerTemplate(cloned);
  return cloned;
}
