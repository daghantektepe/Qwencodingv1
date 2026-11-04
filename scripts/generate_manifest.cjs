/**
 * OpenScriv Build & Distribution Manifest Generator (Faz 6)
 * Generates release-builds/manifest.json containing commit SHA, build timestamp,
 * semantic version, and cryptographic SHA-256 hashes of packaged Windows executables.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

function getGitCommitSha() {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA;
  }
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown-dev-commit';
  }
}

function getGitBranch() {
  if (process.env.GITHUB_REF_NAME) {
    return process.env.GITHUB_REF_NAME;
  }
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown-branch';
  }
}

function computeSha256(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function generateManifest() {
  const rootDir = path.resolve(__dirname, '..');
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const releaseBuildsDir = path.join(rootDir, 'release-builds');

  if (!fs.existsSync(releaseBuildsDir)) {
    fs.mkdirSync(releaseBuildsDir, { recursive: true });
  }

  const commitSha = getGitCommitSha();
  const branch = getGitBranch();
  const buildTime = new Date().toISOString();

  const artifacts = [];
  if (fs.existsSync(releaseBuildsDir)) {
    const files = fs.readdirSync(releaseBuildsDir);
    for (const file of files) {
      if (file.endsWith('.exe')) {
        const fullPath = path.join(releaseBuildsDir, file);
        const stats = fs.statSync(fullPath);
        const sha256 = computeSha256(fullPath);
        artifacts.push({
          filename: file,
          sizeBytes: stats.size,
          sizeMb: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
          sha256,
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString(),
        });
      }
    }
  }

  const manifest = {
    appName: packageData.name,
    version: packageData.version,
    commitSha,
    branch,
    buildTime,
    electronVersion: packageData.devDependencies?.electron || 'unknown',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    artifacts,
  };

  const manifestPath = path.join(releaseBuildsDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log('✅ OpenScriv Build Manifest created at:', manifestPath);
  console.log(JSON.stringify(manifest, null, 2));
  return manifest;
}

if (require.main === module) {
  generateManifest();
}

module.exports = { generateManifest };
