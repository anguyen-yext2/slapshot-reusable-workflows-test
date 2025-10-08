const core = require('@actions/core');
const { getPackageInfo } = require('./getPackageInfo');

async function run() {
  try {
    const tag = core.getInput('git-tag');
    if (!tag) {
      core.setFailed('No tag specified');
      return;
    }

    const versionIndex = tag.lastIndexOf('@');
    const pkgName = tag.slice(0, versionIndex);
    const version = tag.slice(versionIndex + 1);
    const { pkg, currentVersion } = await getPackageInfo();
    const packageName = pkg.name;

    if (pkgName !== packageName) {
      core.setFailed(
        `Package name from tag '${pkgName}' mismatches with package '${packageName}'`
      );
      return;
    }

    if (currentVersion !== version) {
      core.setFailed(
        `Package version from tag '${version}' mismatches with current version '${currentVersion}'`
      );
      return;
    }

    const releaseTag = version.includes('rc')
      ? 'rc'
      : version.includes('beta')
      ? 'beta'
      : version.includes('alpha')
      ? 'alpha'
      : 'latest';

    core.setOutput('npm-tag', releaseTag);
  } catch (error) {
    core.setFailed(error.message || 'Unknown error');
  }
}

run();
