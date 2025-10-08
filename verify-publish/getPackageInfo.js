const path = require('path');
const fs = require('fs').promises;
const { fileURLToPath } = require('url');

async function getPackageInfo() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const pkgDir = path.resolve(__dirname, '..');
  const pkgPath = path.resolve(pkgDir, 'package.json');

  const pkgRaw = await fs.readFile(pkgPath, 'utf-8');
  const pkg = JSON.parse(pkgRaw);
  const currentVersion = pkg.version;

  if (pkg.private) {
    console.error(`Package ${pkg.name} is private`);
    process.exit(1);
  }

  return {
    pkg,
    pkgDir,
    pkgPath,
    currentVersion,
  };
}

module.exports = {
  getPackageInfo,
};
