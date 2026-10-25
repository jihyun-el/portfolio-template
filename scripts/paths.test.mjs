import assert from "node:assert/strict";
import test from "node:test";
import { normalizeBasePath, withBasePath } from "./paths.mjs";

test("root and project Pages URLs keep deep links inside the deployed site", () => {
  assert.equal(withBasePath("", "/projects/engine/"), "/projects/engine/");
  assert.equal(withBasePath("/portfolio/", "/projects/engine/"), "/portfolio/projects/engine/");
  assert.equal(normalizeBasePath("/"), "");
});

test("rejects paths that could escape the Pages repository", () => {
  for (const value of ["https://other.example", "/../private", "//other", "/..", "/."]) {
    assert.throws(() => normalizeBasePath(value));
  }
  assert.throws(() => withBasePath("", "//other.example"));
});
