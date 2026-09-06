import { D51_FRAMES, TRAIN_COLS, TRAIN_ROWS } from '../lib/train';

const STEP_MS = 45;
const FIRST_RUN_MS = 12_000;
const GAP_MIN_MS = 60_000;
const GAP_MAX_MS = 150_000;
/** the sprite is 84 columns wide; below this it would be wider than the screen */
const MIN_WIDTH = 900;

let timer: number | undefined;

const train = () => document.getElementById('train');

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

function schedule(delay = GAP_MIN_MS + Math.random() * (GAP_MAX_MS - GAP_MIN_MS)) {
  clearTimeout(timer);
  timer = window.setTimeout(run, delay);
}

function run() {
  const node = train();
  if (!node) return;
  // nothing to see on a phone, and no point animating a background tab
  if (window.innerWidth < MIN_WIDTH || document.visibilityState === 'hidden') return schedule(GAP_MIN_MS);

  const lh = parseFloat(getComputedStyle(document.body).lineHeight) || 22;
  const cw = columnWidth(node);
  // keep the whole train between the winbar and the statusline
  const room = Math.max(0, window.innerHeight - TRAIN_ROWS * lh - 3 * lh);
  node.style.top = `${lh + Math.floor((Math.random() * room) / lh) * lh}px`;

  let col = Math.ceil(window.innerWidth / cw);
  let frame = 0;
  node.hidden = false;

  const step = () => {
    node.textContent = D51_FRAMES[frame].join('\n');
    node.style.transform = `translateX(${col * cw}px)`;
    col -= 1;
    frame = (frame + 1) % D51_FRAMES.length;
    if (col < -TRAIN_COLS) {
      node.hidden = true;
      node.textContent = '';
      return schedule();
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
  schedule(FIRST_RUN_MS);
}
