import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const aiTalkDir = resolve(root, 'ai_talk');
const triggerPath = resolve(aiTalkDir, 'CODE_TRIGGER.md');
const ordersPath = resolve(aiTalkDir, 'CODE_ALL_ORDER.md');
const orderPath = resolve(aiTalkDir, 'CODE_ORDER.md');
const reviewResultPath = resolve(aiTalkDir, 'REVIEW_RESULT.md');
const jaeminTasksPath = resolve(aiTalkDir, 'JAEMIN_TASKS.md');
const pollMs = Number(process.env.AUTO_ORCH_POLL_MS || 3000);

const getMtime = (path) => {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return 0;
  }
};

const parseTestLabelFromResult = () => {
  if (!existsSync(reviewResultPath)) return 'unknown';
  const text = readFileSync(reviewResultPath, 'utf8');
  const m = text.match(/- test:\s+PASS\s+\(([^)]+)\)/);
  if (m) return m[1];
  return text.includes('- test: PASS') ? 'PASS' : 'unknown';
};

const findFirst = (src, re) => {
  const m = src.match(re);
  if (!m) return null;
  return {
    full: m[0],
    title: (m[2] || '').trim(),
  };
};

const replaceFirstStatus = (src, fromStatus, toStatus) => {
  const re = new RegExp(`^(\\s*\\d+\\.\\s+)\\[${fromStatus}\\]\\s+(.+)$`, 'm');
  const m = src.match(re);
  if (!m) return { next: src, title: null };
  const nextLine = `${m[1]}[${toStatus}] ${m[2]}`;
  return {
    next: src.replace(re, nextLine),
    title: m[2].trim(),
  };
};

const getCurrentDoingTitle = (orders) => {
  const item = findFirst(orders, /^(\s*\d+\.\s+)\[DOING\]\s+(.+)$/m);
  return item ? item.title : null;
};

const getCurrentOrderTitle = () => {
  if (!existsSync(orderPath)) return null;
  const text = readFileSync(orderPath, 'utf8');
  const m = text.match(/^- 작업:\s+\*\*(.+?)\*\*/m);
  return m ? m[1].trim() : null;
};

const updateJaeminTasks = (reason) => {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const orderTitle = getCurrentOrderTitle() ?? '현재 진행 오더 없음';
  const lines = [
    '# JAEMIN_TASKS',
    '',
    `- updated_at: ${now}`,
    `- reason: ${reason}`,
    `- current_order: ${orderTitle}`,
    '',
    '## 실행 지시',
    '- `ai_talk/CODE_ORDER.md`의 현재 오더만 수행',
    '- 완료 후 `ai_talk/CODE_TRIGGER.md`를 업데이트하고 저장',
    '- 저장 자체가 자동 검토 트리거',
    '',
  ];
  writeFileSync(jaeminTasksPath, lines.join('\n'), 'utf8');
};

const writeCurrentOrder = ({ doingTitle, testLabel, buildOk, reviewedAt }) => {
  const hasDoing = Boolean(doingTitle);
  const statusLabel = hasDoing ? '(진행중)' : '';
  const lines = [
    '# CODE_ORDER',
    '',
    '## 실행 전',
    '- 재민: 별도 터미널에서 `pnpm run ai:watch-jaemin` 실행',
    '',
    '## 현재 오더',
    '',
    hasDoing ? `- 작업: **${doingTitle}** ${statusLabel}` : '- 작업: **현재 진행 오더 없음**',
    `- 최근 자동검토: **${testLabel} / Build ${buildOk ? 'SUCCESS' : 'FAIL'}** (${reviewedAt})`,
    '',
    '## 다음 오더 대기 중',
    '',
    '- 보드 원본(`CODE_ALL_ORDER.md`)의 다음 항목 확인 필요',
    '',
  ];
  writeFileSync(orderPath, lines.join('\n'), 'utf8');
};

const runReviewOnce = () => {
  const out = spawnSync('node', ['ai_talk/scripts/review-once.mjs'], {
    cwd: root,
    encoding: 'utf8',
  });
  return {
    ok: out.status === 0,
    stdout: out.stdout || '',
    stderr: out.stderr || '',
  };
};

const advanceBoard = ({ reviewOk, reviewedAt, testLabel, buildOk }) => {
  if (!existsSync(ordersPath)) return;
  const raw = readFileSync(ordersPath, 'utf8');
  let next = raw;

  const doingTitle = getCurrentDoingTitle(next);
  if (doingTitle) {
    const moved = replaceFirstStatus(next, 'DOING', reviewOk ? 'DONE' : 'BLOCKED');
    next = moved.next;
  }

  // Always fill the next executable item when there is no active DOING item.
  const stillDoing = getCurrentDoingTitle(next);
  let nextDoingTitle = stillDoing;
  if (!stillDoing) {
    const promoted = replaceFirstStatus(next, 'OPEN', 'DOING');
    next = promoted.next;
    nextDoingTitle = promoted.title;
  }

  if (next !== raw) {
    writeFileSync(ordersPath, next, 'utf8');
  }

  writeCurrentOrder({
    doingTitle: nextDoingTitle,
    testLabel,
    buildOk,
    reviewedAt,
  });
};

let running = false;
let lastMtime = getMtime(triggerPath);
let lastOrderMtime = getMtime(orderPath);
let lastKnownOrderTitle = getCurrentOrderTitle();

console.log(`[auto-orchestrator] watching ${triggerPath}`);
updateJaeminTasks('orchestrator-start');

const tick = () => {
  const orderMtime = getMtime(orderPath);
  if (orderMtime > lastOrderMtime) {
    lastOrderMtime = orderMtime;
    const nextTitle = getCurrentOrderTitle();
    if (nextTitle && nextTitle !== lastKnownOrderTitle) {
      lastKnownOrderTitle = nextTitle;
      console.log(`[auto-orchestrator] order updated -> ${nextTitle}`);
      updateJaeminTasks('order-updated');
    }
  }

  const mtime = getMtime(triggerPath);
  if (mtime <= lastMtime || running) return;
  lastMtime = mtime;
  running = true;
  const reviewedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

  console.log('[auto-orchestrator] change detected -> running review loop');
  const review = runReviewOnce();
  const testLabel = parseTestLabelFromResult();
  // review-once runs build too; infer from exit code.
  const buildOk = review.ok;

  advanceBoard({
    reviewOk: review.ok,
    reviewedAt,
    testLabel,
    buildOk,
  });
  lastOrderMtime = getMtime(orderPath);
  lastKnownOrderTitle = getCurrentOrderTitle();
  updateJaeminTasks('review-loop-finished');

  console.log(
    `[auto-orchestrator] loop done: ${review.ok ? 'PASS' : 'FAIL'} | ${testLabel} | build ${
      buildOk ? 'SUCCESS' : 'FAIL'
    }`,
  );
  running = false;
};

setInterval(tick, pollMs);
