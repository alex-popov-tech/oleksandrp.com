import { TRAIN_COLS, TRAIN_FRAMES, TRAIN_ROWS } from '../lib/train';

const STEP_MS = 28;
/** columns travelled per wheel pattern; sl uses 3, and at our step that reads frantic */
const COLS_PER_FRAME = 4;
const FIRST_RUN_MS = 12_000;
const GAP_MIN_MS = 60_000;
const GAP_MAX_MS = 150_000;
/** how often we ask whether the slot is due. A single long setTimeout gets throttled or
    dropped in a background tab, which is how the train ended up departing exactly once. */
const CHECK_MS = 10_000;
/** the sprite is 63 columns wide; below this it would be wider than the screen */
const MIN_WIDTH = 900;
/** the next departure lives here so browsing between pages does not reset the wait */
const SLOT_KEY = 'sl:next-departure';

let timer: number | undefined;
let running = false;

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

function scheduleNext() {
  writeSlot(Date.now() + GAP_MIN_MS + Math.random() * (GAP_MAX_MS - GAP_MIN_MS));
}

/**
 * Is the train due? Runs on a slow interval rather than one long timer, so a slot that
 * fell into the past while the tab was hidden or throttled still departs on the next tick
 * instead of being lost.
 */
function tick() {
  if (running) return;
  // a hidden tab or a phone leaves the slot alone, so it departs once conditions allow
  if (document.visibilityState === 'hidden' || window.innerWidth < MIN_WIDTH) return;
  const due = readSlot();
  if (!due) return writeSlot(Date.now() + FIRST_RUN_MS);
  if (Date.now() >= due) run();
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

/**
 * Dims whatever the row covers instead of painting a colour: the sidebar and the buffer are
 * different shades, so a fixed fill showed as a lighter block over the tree. Set here rather
 * than in the stylesheet because the CSS minifier collapses the pair of prefixed and
 * unprefixed declarations down to the -webkit- one, which Chrome then ignores.
 */
const PLATE = 'brightness(0.32) blur(4px)';

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
  const style = `margin-left:${lead}ch;backdrop-filter:${PLATE};-webkit-backdrop-filter:${PLATE}`;
  return `<span style="${style}">${escape(trimmed.slice(lead))}</span>`;
}

function run() {
  const node = train();
  if (!node) return;
  running = true;

  const lh = parseFloat(getComputedStyle(document.body).lineHeight) || 22;
  const cw = columnWidth(node);
  // keep the whole train between the winbar and the statusline, on the text grid
  const room = Math.max(0, window.innerHeight - TRAIN_ROWS * lh - 3 * lh);
  node.style.top = `${lh + Math.floor((Math.random() * room) / lh) * lh}px`;

  let col = Math.ceil(window.innerWidth / cw);
  let travelled = 0;
  node.hidden = false;

  const step = () => {
    const frame = Math.floor(travelled / COLS_PER_FRAME) % TRAIN_FRAMES.length;
    node.innerHTML = TRAIN_FRAMES[frame].map(rowHtml).join('\n');
    node.style.left = `${Math.round(col * cw)}px`;
    col -= 1;
    travelled += 1;
    if (col < -TRAIN_COLS) {
      node.hidden = true;
      node.innerHTML = '';
      running = false;
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
  if (!readSlot()) writeSlot(Date.now() + FIRST_RUN_MS);
  window.setInterval(tick, CHECK_MS);
  document.addEventListener('visibilitychange', tick);
  tick();
}
