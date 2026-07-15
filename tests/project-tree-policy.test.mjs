import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalizeProjectTree,
  ProjectTreePolicyError,
} from "../src/lib/api/projectTreePolicy.mjs";

const validTree = () => [{
  id: "src",
  name: "src",
  type: "folder",
  content: "",
  children: [{
    id: "index",
    name: "index.ts",
    type: "file",
    language: "typescript",
    content: "export const ok = true;",
  }],
}];

test("returns one canonical tree and validates the active file", () => {
  const result = canonicalizeProjectTree(validTree(), "index");
  assert.equal(result.nodeCount, 2);
  assert.equal(result.fileCount, 1);
  assert.equal(result.activeFileId, "index");
  assert.equal(result.files[0].children[0].content, "export const ok = true;");
});

test("rejects duplicate node IDs across different folders", () => {
  const tree = [
    { id: "a", name: "a", type: "folder", children: [{ id: "shared", name: "one.ts", type: "file" }] },
    { id: "b", name: "b", type: "folder", children: [{ id: "shared", name: "two.ts", type: "file" }] },
  ];
  assert.throws(
    () => canonicalizeProjectTree(tree),
    (error) => error instanceof ProjectTreePolicyError && error.code === "duplicate_node_id",
  );
});

test("rejects case-colliding sibling paths", () => {
  const tree = [{ id: "src", name: "src", type: "folder", children: [
    { id: "a", name: "Index.ts", type: "file" },
    { id: "b", name: "index.ts", type: "file" },
  ] }];
  assert.throws(
    () => canonicalizeProjectTree(tree),
    (error) => error instanceof ProjectTreePolicyError && error.code === "path_collision",
  );
});

test("allows the same filename in different folders", () => {
  const tree = [
    { id: "a", name: "a", type: "folder", children: [{ id: "a-index", name: "index.ts", type: "file" }] },
    { id: "b", name: "b", type: "folder", children: [{ id: "b-index", name: "index.ts", type: "file" }] },
  ];
  assert.equal(canonicalizeProjectTree(tree).fileCount, 2);
});

test("rejects files with children", () => {
  assert.throws(
    () => canonicalizeProjectTree([{ id: "a", name: "a.ts", type: "file", children: [{ id: "b", name: "b.ts", type: "file" }] }]),
    (error) => error instanceof ProjectTreePolicyError && error.code === "invalid_node_shape",
  );
});

test("rejects folders with file content", () => {
  assert.throws(
    () => canonicalizeProjectTree([{ id: "src", name: "src", type: "folder", content: "hidden source" }]),
    (error) => error instanceof ProjectTreePolicyError && error.code === "invalid_node_shape",
  );
});

test("rejects dot segments and path separators", () => {
  for (const name of [".", "..", "a/b", "a\\b"]) {
    assert.throws(() => canonicalizeProjectTree([{ id: name, name, type: "file" }]), /unsafe file name/);
  }
});

test("rejects active IDs that are missing or point to folders", () => {
  assert.throws(
    () => canonicalizeProjectTree(validTree(), "missing"),
    (error) => error instanceof ProjectTreePolicyError && error.code === "invalid_active_file",
  );
  assert.throws(
    () => canonicalizeProjectTree(validTree(), "src"),
    (error) => error instanceof ProjectTreePolicyError && error.code === "invalid_active_file",
  );
});

test("normalizes folder shape and strips folder metadata content", () => {
  const result = canonicalizeProjectTree([{ id: " src ", name: " src ", type: "folder", language: "javascript", children: [] }]);
  assert.deepEqual(result.files[0], {
    id: "src",
    name: "src",
    language: "plaintext",
    content: "",
    type: "folder",
    children: [],
    isOpen: false,
  });
});
