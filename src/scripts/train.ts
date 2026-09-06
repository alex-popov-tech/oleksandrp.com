import { TRAIN_COLS, TRAIN_FRAMES, TRAIN_ROWS } from '../lib/train';

const STEP_MS = 28;
const FIRST_RUN_MS = 12_000;
const GAP_MIN_MS = 60_000;
const GAP_MAX_MS = 150_000;
/** never depart the instant a page loads, even if the stored slot is long past */
const MIN_ARM_MS = 3_000;
/** the sprite is 63 columns wide; below this it would be wider than the screen */
const MIN_WIDTH = 900;
/** the next departure lives here so browsing between pages does not reset the wait */
const SLOT_KEY = 'sl:next-departure';

let timer: number | undefined;

const train = () => document.getElementById('train');

function readSlot(): number {
  try {
    return Number(localStorage.getItem(SLOT_KEY)) || 0;
  } catch {
    return 0; // private mode, or storage blocked
  }
}

function writeSlot(at: number) {
  try {
    localStorage.setItem(SLOT_KEY, String(at));
  } catch {
    /* nothing to do: the train falls back to per-page timing */
  }
}

function armFor(delay: number) {
  clearTimeout(timer);
  timer = window.setTimeout(run, delay);
}

function scheduleNext() {
  const delay = GAP_MIN_MS + Math.random() * (GAP_MAX_MS - GAP_MIN_MS);
  writeSlot(Date.now() + delay);
  armFor(delay);
}

/** Width of one column of the buffer font, measured rather than assumed. */
function columnWidth(node: HTMLElement): number {
  const probe = document.createElement('span');
  probe.textContent = '0'.repeat(20);
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
  node.after(probe);
  const w = probe.getBoundingClientRect().width / 20;
  probe.remove();
  return w || 9;
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * One plate per row, hugging that row's ink from first to last character. Per-run plates
 * would follow the silhouette more closely but then page text shows through the gaps
 * between the engine and its wheels, which is the noise this is here to prevent.
 */
function rowHtml(row: string): string {
  const trimmed = row.replace(/\s+$/, '');
  if (trimmed.trim() === '') return '<span></span>';
  const lead = trimmed.length - trimmed.replace(/^ +/, '').length;
  return `<span style="margin-left:${lead}ch">${escape(trimmed.slice(lead))}</span>`;
}

function run() {
  const node = train();
  if (!node) return;
  // nothing to see on a phone, and no point animating a background tab
  if (window.innerWidth < MIN_WIDTH || document.visibilityState === 'hidden') return scheduleNext();

  const lh = parseFloat(getComputedStyle(document.body).lineHeight) || 22;
  const cw = columnWidth(node);
  // keep the whole train between the winbar and the statusline, on the text grid
  const room = Math.max(0, window.innerHeight - TRAIN_ROWS * lh - 3 * lh);
  node.style.top = `${lh + Math.floor((Math.random() * room) / lh) * lh}px`;

  let col = Math.ceil(window.innerWidth / cw);
  let frame = 0;
  node.hidden = false;

  const step = () => {
    node.innerHTML = TRAIN_FRAMES[frame].map(rowHtml).join('\n');
    node.style.transform = `translateX(${col * cw}px)`;
    col -= 1;
    frame = (frame + 1) % TRAIN_FRAMES.length;
    if (col < -TRAIN_COLS) {
      node.hidden = true;
      node.innerHTML = '';
      return scheduleNext();
    }
    timer = window.setTimeout(step, STEP_MS);
  };
  step();
}

declare global {
  interface Window { __trainBound?: boolean }
}

if (!window.__trainBound && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.__trainBound = true;
  const due = readSlot();
  if (due) {
    armFor(Math.max(MIN_ARM_MS, due - Date.now()));
  } else {
    writeSlot(Date.now() + FIRST_RUN_MS);
    armFor(FIRST_RUN_MS);
  }
}
