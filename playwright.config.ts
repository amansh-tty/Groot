import { defineConfig, devices } from '@playwright/test';
import { mkdtempSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Isolated from the user's database; deliberately never attach to an existing server.
const dataDir = mkdtempSync(join(tmpdir(), 'playground-e2e-'));
const workspaceRoot =
  process.env.PLAYGROUND_E2E_ROOT ?? mkdtempSync(join(tmpdir(), 'playground-v1-e2e-'));
if (!process.env.PLAYGROUND_E2E_ROOT) {
  for (const folder of ['demos', 'data', 'context', 'packages/design-system/src', '.console'])
    cpSync(join(process.cwd(), folder), join(workspaceRoot, folder), { recursive: true });
  process.env.PLAYGROUND_E2E_ROOT = workspaceRoot;
}
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4311',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node apps/server/dist/index.js',
    url: 'http://127.0.0.1:4311/api/health',
    reuseExistingServer: false,
    env: {
      PLAYGROUND_WORKSPACE_ROOT: workspaceRoot,
      PLAYGROUND_DATA_DIR: dataDir,
      PLAYGROUND_PORT: '4311',
      NODE_ENV: 'production',
    },
  },
});
