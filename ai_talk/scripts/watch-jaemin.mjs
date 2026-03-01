import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const target = resolve(root, 'ai_talk', 'CODE_TRIGGER.md');
const intervalMs = 3000;

let lastMtime = 0;
let running = false;

const readMtime = () => {
  try {
    return statSync(target).mtimeMs;
  } catch {
    return 0;
  }
};

const runReview = () => {
  if (running) return;
  running = true;
  const child = spawn('node', ['ai_talk/scripts/review-once.mjs'], {
    cwd: root,
    stdio: 'inherit'
  });
  child.on('exit', () => {
    running = false;
  });
};

lastMtime = readMtime();
console.log(`[watch-jaemin] watching ${target}`);

setInterval(() => {
  const nowMtime = readMtime();
  if (nowMtime > lastMtime) {
    lastMtime = nowMtime;
    console.log('[watch-jaemin] change detected -> running auto review');
    runReview();
  }
}, intervalMs);
