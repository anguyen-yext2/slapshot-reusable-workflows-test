const core = require('@actions/core');
const fs = require('fs');
const path = require('path');

const commitMsg = core.getInput('COMMIT_MSG');
const repoPath = core.getInput('REPO_PATH');

const pkgPath = path.resolve(repoPath, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
console.log('>>>GitHub repository:', process.env.GITHUB_REPOSITORY);
console.log('>>>pkg: ', pkg);
const { version: currentVersion, private: isPrivate } = pkg;

if (isPrivate) {
  core.setFailed('Package is private.');
}

const expectedCommitMsg = `release: v${currentVersion}`;
if (commitMsg !== expectedCommitMsg) {
  core.setFailed(`Invalid commit message. \nExpected: '${expectedCommitMsg}'.\nActual: '${commitMsg}'`);
}
console.log('>>>commitMsg: ', commitMsg);
console.log('>>>currentVersion: ', currentVersion);

const temp = currentVersion.includes('rc') 
  ? 'rc'
  : currentVersion.includes('beta')
    ? 'beta'
    : currentVersion.includes('alpha')
      ? 'alpha'
      : 'latest';
console.log('>>>temp: ', temp);

core.setOutput('npm_tag', currentVersion.includes('rc') 
  ? 'rc'
  : currentVersion.includes('beta')
    ? 'beta'
    : currentVersion.includes('alpha')
      ? 'alpha'
      : 'latest');