const MAX_DEPTH = 20;
const MAX_NAME_CHARS = 180;
const MAX_ID_CHARS = 180;

export class ProjectTreePolicyError extends Error {
  constructor(message, code = "invalid_project_tree") {
    super(message);
    this.name = "ProjectTreePolicyError";
    this.code = code;
  }
}

function clean(value, maxLength) {
  return String(value ?? "").normalize("NFKC").trim().slice(0, maxLength);
}

function validateName(value) {
  const name = clean(value, MAX_NAME_CHARS + 1);
  if (!name || name.length > MAX_NAME_CHARS || name === "." || name === ".." || /[\\/\0]/.test(name)) {
    throw new ProjectTreePolicyError("Project contains an unsafe file name");
  }
  return name;
}

function validateId(value, state) {
  const id = clean(value, MAX_ID_CHARS + 1);
  if (!id || id.length > MAX_ID_CHARS || /[\0\r\n]/.test(id)) {
    throw new ProjectTreePolicyError("Project contains an unsafe node ID");
  }
  if (state.ids.has(id)) {
    throw new ProjectTreePolicyError(`Project contains duplicate node ID: ${id}`, "duplicate_node_id");
  }
  state.ids.add(id);
  return id;
}

function canonicalizeNode(node, state, parentPath, siblingNames, depth) {
  if (!node || typeof node !== "object" || Array.isArray(node) || depth > MAX_DEPTH) {
    throw new ProjectTreePolicyError("Project file tree is invalid");
  }

  const name = validateName(node.name);
  const collisionKey = name.normalize("NFKC").toLocaleLowerCase("en-US");
  if (siblingNames.has(collisionKey)) {
    throw new ProjectTreePolicyError(
      `Project contains a case-colliding sibling name at ${parentPath || "/"}: ${name}`,
      "path_collision",
    );
  }
  siblingNames.add(collisionKey);

  const id = validateId(node.id, state);
  const type = node.type;
  if (type !== "file" && type !== "folder") {
    throw new ProjectTreePolicyError("Project node type is invalid");
  }

  const path = parentPath ? `${parentPath}/${name}` : name;
  const content = String(node.content ?? "");
  const children = node.children;

  if (type === "file") {
    if (children !== undefined && (!Array.isArray(children) || children.length > 0)) {
      throw new ProjectTreePolicyError(`File nodes cannot contain children: ${path}`, "invalid_node_shape");
    }
    state.fileIds.add(id);
    return {
      id,
      name,
      language: clean(node.language, 80) || "plaintext",
      content,
      type: "file",
      children: undefined,
      isOpen: Boolean(node.isOpen),
    };
  }

  if (content.trim()) {
    throw new ProjectTreePolicyError(`Folder nodes cannot contain file content: ${path}`, "invalid_node_shape");
  }
  if (children !== undefined && !Array.isArray(children)) {
    throw new ProjectTreePolicyError(`Folder children must be an array: ${path}`, "invalid_node_shape");
  }

  const childNames = new Set();
  const canonicalChildren = (children || []).map((child) =>
    canonicalizeNode(child, state, path, childNames, depth + 1),
  );
  return {
    id,
    name,
    language: "plaintext",
    content: "",
    type: "folder",
    children: canonicalChildren,
    isOpen: Boolean(node.isOpen),
  };
}

export function canonicalizeProjectTree(nodes, activeFileId = null) {
  if (!Array.isArray(nodes)) {
    throw new ProjectTreePolicyError("Project files must be an array");
  }

  const state = { ids: new Set(), fileIds: new Set() };
  const rootNames = new Set();
  const files = nodes.map((node) => canonicalizeNode(node, state, "", rootNames, 0));
  const normalizedActiveId = activeFileId == null ? null : clean(activeFileId, MAX_ID_CHARS + 1);

  if (normalizedActiveId && !state.fileIds.has(normalizedActiveId)) {
    throw new ProjectTreePolicyError(
      "Active file ID must reference a canonical file node",
      "invalid_active_file",
    );
  }

  return {
    files,
    activeFileId: normalizedActiveId || null,
    nodeCount: state.ids.size,
    fileCount: state.fileIds.size,
  };
}

export const projectTreePolicy = Object.freeze({
  MAX_DEPTH,
  MAX_NAME_CHARS,
  MAX_ID_CHARS,
});
