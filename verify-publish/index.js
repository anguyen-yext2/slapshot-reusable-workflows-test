const core = require('@actions/core');
const fs = require('fs');
const path = require('path');

const commitMsg = core.getInput('COMMIT_MSG');
const repoPath = core.getInput('REPO_PATH');

const pkgPath = path.join(repoPath, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

let { version: currentVersion, private: isPrivate } = pkg;

const expectedCommitMsg = `release: v${currentVersion}`;
const expectedMonorepoCommitMsg = `release: ${pkg.name}@v${currentVersion}`;
if (commitMsg !== expectedCommitMsg && commitMsg !== expectedMonorepoCommitMsg) {
  core.setFailed(`Invalid commit message.\nExpected: '${expectedCommitMsg}' or '${expectedMonorepoCommitMsg} if package lives under a monorepo'.\nActual: '${commitMsg}'`);
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