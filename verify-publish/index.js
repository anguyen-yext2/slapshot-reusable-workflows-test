const core = require('@actions/core');
const fs = require('fs');
const path = require('path');

const commitMsg = core.getInput('COMMIT_MSG');
const repoPath = core.getInput('REPO_PATH');

let pkgPath = path.join(repoPath, 'package.json');
let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

let { version: currentVersion, private: isPrivate } = pkg;

let expectedCommitMsg = `release: v${currentVersion}`;
// const expectedMonorepoCommitMsg = `release: ${pkg.name}@v${currentVersion}`;
if (commitMsg !== expectedCommitMsg) {//} && commitMsg !== expectedMonorepoCommitMsg) {
  try {
    // handle monorepo
    const githubTag = commitMsg.replace(/^release:\s*/, '').trim();
    const versionIndex = githubTag.lastIndexOf('@v');
    if (versionIndex === -1) {
      core.setFailed('Unexpected commit message format for a package contained in a monorepo');
    }
    const expectedPackageName = githubTag.slice(0, versionIndex);
    const expectedPackageVersion = githubTag.slice(versionIndex + 2);
    pkgPath = path.join(repoPath, `packages/${expectedPackageName}`, 'package.json');
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    expectedCommitMsg = `release: ${expectedPackageName}@v${currentVersion}`;
    ({ version: currentVersion, private: isPrivate } = pkg);
    if (currentVersion !== expectedPackageVersion) {
      core.setFailed(`Invalid commit message. \nExpected: '${expectedCommitMsg}'.\nActual: '${commitMsg}'`);
    } 
  } catch (err) {
    core.setFailed(`Invalid commit message. \nExpected: '${expectedCommitMsg}'.\nActual: '${commitMsg}'`);
    console.error('Error attempting to handle monorepo:\n', err);
    // core.setFailed(`Failed to parse ${packageJsonPath}:`, err);
  }
  // core.setFailed(`Invalid commit message.\nExpected: '${expectedCommitMsg}' or '${expectedMonorepoCommitMsg} if package lives under a monorepo'.\nActual: '${commitMsg}'`);
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

function getPackageVersionInMonorepo() {
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

  for (const folder of packageFolders) {
    const packageJsonPath = path.join(packagesDir, folder, 'package.json');
    if (!fs.existsSync(packageJsonPath)) continue;

    try {
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      pkg = JSON.parse(content);

      if (pkg.name === expectedPackageName && pkg.version === expectedVersion && !pkg.private) {
        return pkg.version
      }
    } catch (err) {
      core.setFailed(`Failed to parse ${packageJsonPath}:`, err);
    }
  }
  core.setFailed(`Could not find a public package with name '${expectedPackageName}' and '${expectedVersion}' under the github monorepo`);
}