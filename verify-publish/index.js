const core = require('@actions/core');
const fs = require('fs');
const path = require('path');

const commitMsg = process.env.COMMIT_MESSAGE;
const repoPath = process.env.GITHUB_WORKSPACE;
const githubTag = commitMsg.replace(/^release:\s*/, '').trim();

const pkgVersion = verifyPublish();

core.setOutput('npm_tag', pkgVersion.includes('rc') 
  ? 'rc'
  : currentVersion.includes('beta')
    ? 'beta'
    : currentVersion.includes('alpha')
      ? 'alpha'
      : 'latest');

// verifyPublish verifies that a package is public and its version match with the commit message.
// If succeeds, it returns the version to be published.
function verifyPublish() {
  const pkgPath = path.join(repoPath, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  const { version: currentVersion, private: isPrivate } = pkg;
  if (githubTag != `v${currentVersion}`) {
    // attempt to treat the current package as a monorepo that contains the target package to be published
    const packagesDir = path.resolve(repoPath, 'packages');
    if (fs.existsSync(packagesDir)) {
      return handleMonorepo(packagesDir);
    } else {
      core.setFailed(`Invalid commit message. \nExpected: '${expectedCommitMsg}'.\nActual: '${commitMsg}'`);
    }
  } else if (isPrivate) {
    core.setFailed('Package is private.');
  }
  return currentVersion;
}

// When a package lives under a monorepo, the commit message is expected to include the package name and version separated by "@v"
// E.g. "release: @yext/chat-headless-react@v1.2.3"
function handleMonorepo(packagesDir) {
  const versionIndex = githubTag.lastIndexOf('@v');
  if (versionIndex === -1) {
    core.setFailed('Unexpected commit message format for a package contained in a monorepo');
  }
  const pkgName = githubTag.slice(0, versionIndex);
  const pkgVersion = githubTag.slice(versionIndex + 2);

  // search for all packages that the monorepo contain
  const packageFolders = fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  // find the target package to be published
  for (const folder of packageFolders) {
    const pkgPath = path.join(packagesDir, folder, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name === pkgName && pkg.version === pkgVersion && !pkg.private) {
        core.setOutput('working_directory', path.join(packagesDir, folder));
        return pkg.version
      }
    } catch (err) {
      core.setFailed(`Failed to parse ${packageJsonPath}:`, err);
    }
  }
  core.setFailed(`Could not find a public package with name '${pkgName}' and version '${pkgVersion}' under the github monorepo`);
}