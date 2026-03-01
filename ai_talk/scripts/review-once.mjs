import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const aiTalkDir = resolve(root, 'ai_talk');
const tasksPath = resolve(aiTalkDir, 'CODE_TRIGGER.md');
const resultPath = resolve(aiTalkDir, 'REVIEW_RESULT.md');

const now = new Date();
const stamp = now.toISOString();

const runCmd = (cmd, args) => {
  const out = spawnSync(cmd, args, { cwd: root, encoding: 'utf8' });
  const stdout = out.stdout || '';
  const stderr = out.stderr || '';
  const ok = out.status === 0;
  return { ok, stdout, stderr, status: out.status ?? 1 };
};

const testRun = runCmd('pnpm', ['test']);
const buildRun = runCmd('pnpm', ['build']);

const parseTestCount = (text) => {
  const m = text.match(/Tests\s+(\d+)\s+passed\s*\((\d+)\)/);
  if (m) return Number(m[1]);
  const m2 = text.match(/(\d+)\s+passed\s*\((\d+)\)/);
  if (m2) return Number(m2[1]);
  return null;
};

const testCount = parseTestCount(testRun.stdout + '\n' + testRun.stderr);
const overallOk = testRun.ok && buildRun.ok;

const tasks = existsSync(tasksPath) ? readFileSync(tasksPath, 'utf8') : '';

const tail = (text, n = 40) => {
  const lines = text.trim().split('\n');
  return lines.slice(Math.max(0, lines.length - n)).join('\n');
};

const result = `# REVIEW_RESULT\n\n- generated_at: ${stamp}\n- overall: ${overallOk ? 'PASS' : 'FAIL'}\n- test: ${testRun.ok ? 'PASS' : 'FAIL'}${testCount == null ? '' : ` (${testCount} PASS)`}\n- build: ${buildRun.ok ? 'PASS' : 'FAIL'}\n\n## Commands\n- pnpm test\n- pnpm build\n\n## Notes\n- CODE_TRIGGER.md exists: ${tasks.length > 0 ? 'yes' : 'no'}\n- review-only mode: writes REVIEW_RESULT.md only\n\n## Test Tail\n\`\`\`\n${tail(testRun.stdout + '\n' + testRun.stderr)}\n\`\`\`\n\n## Build Tail\n\`\`\`\n${tail(buildRun.stdout + '\n' + buildRun.stderr)}\n\`\`\`\n`;

writeFileSync(resultPath, result, 'utf8');

if (!overallOk) {
  process.exit(1);
}
