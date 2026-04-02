import { execSync } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

export default function globalTeardown() {
  // Don't tear down if targeting a deployed instance
  if (process.env.PULSE_URL) return;

  const dir = dirname(fileURLToPath(import.meta.url));
  try {
    execSync('bash stop-agent.sh', { cwd: dir, stdio: 'inherit' });
  } catch {
    // Best effort — don't fail tests if cleanup fails
  }
}
