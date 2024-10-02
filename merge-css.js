const fs = require('fs');
const path = require('path');

// Recursively get all directories
const getDirectories = (srcPath) =>
  fs.readdirSync(srcPath).filter((file) => fs.statSync(path.join(srcPath, file)).isDirectory());

// Merge files with the same base name pattern
const mergeFiles = (dirPath) => {
  const files = fs.readdirSync(dirPath);

  // Group files by their base name (before the numbering)
  const fileGroups = files.reduce((groups, file) => {
    const match = file.match(/^(.*?)(\.\d+)?\.css$/);
    if (match) {
      const baseName = match[1];
      if (!groups[baseName]) groups[baseName] = [];
      groups[baseName].push(file);
    }
    return groups;
  }, {});

  // For each group, merge the contents
  Object.keys(fileGroups).forEach((baseName) => {
    const groupFiles = fileGroups[baseName];
    const outputFile = path.join(dirPath, `${baseName}.css`);

    // Concatenate all files into one
    const mergedContent = groupFiles
      .map((file) => fs.readFileSync(path.join(dirPath, file), 'utf8'))
      .join('\n');

    // Write the merged content to the new file
    fs.writeFileSync(outputFile, mergedContent, 'utf8');
    console.log(`Merged files: ${groupFiles.join(', ')} into ${outputFile}`);

    // Optionally, you can delete the original numbered files if needed:
    groupFiles.forEach((file) => fs.unlinkSync(path.join(dirPath, file)));
  });
};

// Traverse through the directories inside dist/css and merge files
const traverseAndMerge = (startPath) => {
  mergeFiles(startPath);
  const directories = getDirectories(startPath);
  directories.forEach((dir) => {
    const fullDirPath = path.join(startPath, dir);
    traverseAndMerge(fullDirPath); // Recursively handle nested directories
  });
};

// Define the base path for the 'dist/css' directory
const distPath = path.join(__dirname, 'dist', 'css');
traverseAndMerge(distPath);