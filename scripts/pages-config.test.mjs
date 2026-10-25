import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
test("copied templates deploy under the new repository name; account sites use root", () => {
  const script = fileURLToPath(new URL("./pages-config.mjs", import.meta.url));
  for (const [repository, expected] of [["student/my-portfolio", "/my-portfolio"], ["student/portfolio-template", "/portfolio-template"], ["student/student.github.io", ""], ["Student/STUDENT.github.io", ""]]) {
    const result = execFileSync(process.execPath, [script], { encoding: "utf8", env: { ...process.env, GITHUB_REPOSITORY: repository } });
    assert.equal(result.trim(), `base_path=${expected}`);
  }
});
