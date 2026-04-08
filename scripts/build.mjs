import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

copyFile("index.html");
copyFile("auth.html");
copyFile("dashboard.html");
copyFile("manifest.webmanifest");
copyFile("service-worker.js");
copyDir("src", "src");
copyDir(join("public", "icons"), "icons");

function copyFile(relativePath) {
  const source = join(root, relativePath);
  const target = join(dist, relativePath);
  ensureParentDir(target);
  cpSync(source, target, { force: true });
}

function copyDir(sourceRelative, targetRelative) {
  const source = join(root, sourceRelative);
  const target = join(dist, targetRelative);
  if (!existsSync(source)) return;
  ensureDir(target);
  cpSync(source, target, { recursive: true, force: true });
}

function ensureParentDir(filePath) {
  ensureDir(dirname(filePath));
}

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}
