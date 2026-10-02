const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const electronBinary = require('electron');
const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openscriv-electron-test-'));
const child = spawn(
  electronBinary,
  ['--in-process-gpu', path.join(projectRoot, 'test_electron_runtime.cjs')],
  {
    cwd: projectRoot,
    env: { ...process.env, OPENSCRIV_TEST_DATA_DIR: testDataDir },
    stdio: 'inherit',
  }
);

child.on('error', (error) => {
  console.error('[TEST ERROR]', error);
  fs.rmSync(testDataDir, { recursive: true, force: true });
  process.exitCode = 1;
});

child.on('close', (code) => {
  fs.rmSync(testDataDir, { recursive: true, force: true });
  process.exitCode = code ?? 1;
});
