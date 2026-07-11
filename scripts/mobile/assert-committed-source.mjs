import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PROTECTED_ROOTS = [
  "apps/mobile/",
  "packages/contracts/",
  "scripts/mobile/",
];

export function findSourceViolations(statusEntries) {
  return statusEntries.filter(isSourceViolation);
}

function isSourceViolation(entry) {
  if (!entry.startsWith("?? ")) {
    return true;
  }
  const path = entry.slice(3);
  return PROTECTED_ROOTS.some((root) => path.startsWith(root));
}

function git(root, ...args) {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
  }).trim();
}

function repositoryRoot() {
  return git(process.cwd(), "rev-parse", "--show-toplevel");
}

function sourceStatus(root) {
  const output = git(root, "status", "--porcelain=v1", "--untracked-files=all");
  return output ? output.split("\n") : [];
}

function assertPushedBranch(root) {
  const branch = git(root, "symbolic-ref", "--quiet", "--short", "HEAD");
  const upstream = git(root, "rev-parse", "--abbrev-ref", "@{upstream}");
  const head = git(root, "rev-parse", "HEAD");
  const upstreamHead = git(root, "rev-parse", "@{upstream}");
  if (head !== upstreamHead) {
    throw new Error(`HEAD ${head} does not match ${upstream} ${upstreamHead}`);
  }
  return { branch, commit: head, upstream };
}

export function assertCommittedSource(root = repositoryRoot()) {
  const violations = findSourceViolations(sourceStatus(root));
  if (violations.length > 0) {
    throw new Error(`Uncommitted source:\n${violations.join("\n")}`);
  }
  return assertPushedBranch(root);
}

function isMainModule() {
  return process.argv[1] === fileURLToPath(import.meta.url);
}

if (isMainModule()) {
  try {
    const source = assertCommittedSource();
    process.stdout.write(
      `Committed source verified: ${source.branch} ${source.commit}\n`,
    );
  } catch (error) {
    process.stderr.write(`Release source check failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
