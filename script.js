import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const outputFile = "project-export.txt";

// Folders to ignore
const ignoreFolders = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
];

// File extensions to ignore
const ignoreExtensions = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".mp4",
  ".mp3",
  ".zip",
  ".pdf",
];

// Clear old export file
fs.writeFileSync(outputFile, "", "utf-8");

function readDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const relativePath = path.relative(projectRoot, fullPath);

    const stat = fs.statSync(fullPath);

    // Skip ignored folders
    if (stat.isDirectory()) {
      if (!ignoreFolders.includes(file)) {
        readDirectory(fullPath);
      }
      return;
    }

    // Skip ignored file types
    const ext = path.extname(file).toLowerCase();
    if (ignoreExtensions.includes(ext)) {
      return;
    }

    try {
      const content = fs.readFileSync(fullPath, "utf-8");

      const separator = `
==================================================
FILE: ${relativePath}
==================================================

`;

      fs.appendFileSync(outputFile, separator);
      fs.appendFileSync(outputFile, content + "\n\n");
    } catch (err) {
      console.log(`Skipped: ${relativePath}`);
    }
  });
}

readDirectory(projectRoot);

console.log(`✅ Project exported successfully to ${outputFile}`);