import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const outputFile = "project-export.txt";

const ignoredFolders = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".vscode"
];

const ignoredFiles = [
  outputFile,
  "package-lock.json"
];

let output = "";

function readDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const relativePath = path.relative(projectRoot, fullPath);

    const stat = fs.statSync(fullPath);

    // Skip ignored folders
    if (stat.isDirectory() && ignoredFolders.includes(file)) {
      return;
    }

    // Skip ignored files
    if (stat.isFile() && ignoredFiles.includes(file)) {
      return;
    }

    if (stat.isDirectory()) {
      readDirectory(fullPath);
    } else {
      try {
        const content = fs.readFileSync(fullPath, "utf8");

        output += `
================================================================================
FILE: ${relativePath}
================================================================================

${content}

`;
      } catch (err) {
        console.log(`Skipped: ${relativePath}`);
      }
    }
  });
}

readDirectory(projectRoot);

fs.writeFileSync(outputFile, output);

console.log(`✅ Project exported successfully to ${outputFile}`);