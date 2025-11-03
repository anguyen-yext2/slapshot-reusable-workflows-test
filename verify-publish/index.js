const core = require('@actions/core');
const fs = require('fs');
const path = require('path');

const commitMsg = process.env.COMMIT_MESSAGE;
const repoPath = process.env.GITHUB_WORKSPACE;//core.getInput('REPO_PATH');
console.log('>>>repoPath: ', repoPath);
let pkgPath = path.join(repoPath, 'package.json');
let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

let { version: currentVersion, private: isPrivate } = pkg;

const expectedCommitMsg = `release: v${currentVersion}`;
if (commitMsg !== expectedCommitMsg) {
  // handle monorepo
  const packagesDir = path.resolve(repoPath, 'packages');
  if (fs.existsSync(packagesDir)) {
    currentVersion = getPackageVersionInMonorepo(packagesDir);
  } else {
    core.setFailed(`Invalid commit message. \nExpected: '${expectedCommitMsg}'.\nActual: '${commitMsg}'`);
  }
} else if (isPrivate) {
  core.setFailed('Package is private.');
}

core.setOutput('npm_tag', currentVersion.includes('rc') 
  ? 'rc'
  : currentVersion.includes('beta')
    ? 'beta'
    : currentVersion.includes('alpha')
      ? 'alpha'
      : 'latest');

function getPackageVersionInMonorepo(packagesDir) {
  const githubTag = commitMsg.replace(/^release:\s*/, '').trim();

  const versionIndex = githubTag.lastIndexOf('@v');
  if (versionIndex === -1) {
    core.setFailed('Unexpected commit message format for a package contained in a monorepo');
  }
  const expectedPackageName = githubTag.slice(0, versionIndex);
  const expectedVersion = githubTag.slice(versionIndex + 2);

  const packageFolders = fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
console.log('>>>packageFolders: ', packageFolders);
  for (const folder of packageFolders) {
    pkgPath = path.join(packagesDir, folder, 'package.json');
    console.log('>>>pkgPath: ', pkgPath);
    if (!fs.existsSync(pkgPath)) {
      console.log('>>>pkgPath DNE');
      continue
    };

    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
console.log('>>>pkg: ', pkg);

      if (pkg.name === expectedPackageName && pkg.version === expectedVersion && !pkg.private) {
        return pkg.version
      }
    } catch (err) {
      core.setFailed(`Failed to parse ${packageJsonPath}:`, err);
    }
  }
  core.setFailed(`Could not find a public package with name '${expectedPackageName}' and version '${expectedVersion}' under the github monorepo`);
}