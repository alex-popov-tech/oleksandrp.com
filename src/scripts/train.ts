import {
  frameFor,
  TRAIN_COLS,
  TRAIN_FRAMES,
  TRAIN_FRAMES_FLIPPED,
  TRAIN_ROWS,
} from "../lib/train";

const STEP_MS = 28;
/** columns travelled per wheel pattern. sl uses 3; 2 spins the drivers a touch livelier,
    and 1 (a new pattern every column) reads as a strobe. */
const COLS_PER_FRAME = 6;
const FIRST_RUN_MS = 12_000;
const GAP_MIN_MS = 60_000;
const GAP_MAX_MS = 150_000;
/** how often we ask whether the slot is due. A single long setTimeout gets throttled or
    dropped in a background tab, which is how the train ended up departing exactly once. */
const CHECK_MS = 10_000;
/** the sprite is 63 columns wide; below this it would be wider than the screen */
const MIN_WIDTH = 900;
/** the next departure lives here so browsing between pages does not reset the wait */
const SLOT_KEY = "sl:next-departure";
/** ?sl=loop keeps it running back to back, for looking at it without waiting */
const LOOP =
  typeof location !== "undefined" &&
  new URLSearchParams(location.search).has("sl");
const LOOP_GAP_MS = 1_200;

let timer: number | undefined;
let running = false;
/** alternate the direction each run, starting on a coin flip */
let eastbound = Math.random() < 0.5;

const train = () => document.getElementById("train");

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
  if (LOOP) return void window.setTimeout(run, LOOP_GAP_MS);
  writeSlot(
    Date.now() + GAP_MIN_MS + Math.random() * (GAP_MAX_MS - GAP_MIN_MS),
  );
}

/**
 * Is the train due? Runs on a slow interval rather than one long timer, so a slot that
 * fell into the past while the tab was hidden or throttled still departs on the next tick
 * instead of being lost.
 */
function tick() {
  if (running) return;
  // the train is the fallback: a page carrying its own effect keeps its slot for the next one
  if (document.querySelector(".page-effect")) return;
  // a hidden tab or a phone leaves the slot alone, so it departs once conditions allow
  if (document.visibilityState === "hidden" || window.innerWidth < MIN_WIDTH)
    return;
  const due = readSlot();
  if (!due) return writeSlot(Date.now() + FIRST_RUN_MS);
  if (Date.now() >= due) run();
}

/** Width of one column of the buffer font, measured rather than assumed. */
function columnWidth(node: HTMLElement): number {
  const probe = document.createElement("span");
  probe.textContent = "0".repeat(20);
  probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre";
  node.after(probe);
  const w = probe.getBoundingClientRect().width / 20;
  probe.remove();
  return w || 9;
}

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * One plate per row, hugging that row's ink from first to last character. Per-run plates
 * would follow the silhouette more closely but then page text shows through the gaps
 * between the engine and its wheels, which is the noise this is here to prevent.
 */
function rowHtml(row: string): string {
  const trimmed = row.replace(/\s+$/, "");
  if (trimmed.trim() === "") return "<span></span>";
  const lead = trimmed.length - trimmed.replace(/^ +/, "").length;
  return `<span style="margin-left:${lead}ch">${escape(trimmed.slice(lead))}</span>`;
}

function run() {
  const node = train();
  if (!node) return;
  running = true;

  const pane = node.parentElement!.getBoundingClientRect();
  const lh = parseFloat(getComputedStyle(document.body).lineHeight) || 22;
  const cw = columnWidth(node);
  // keep the whole train inside the pane, below the winbar, on the text grid
  // start below the winbar and the cursor line: that line is painted --cursor, and a --bg
  // plate crossing it shows as a faint band
  const top = 3 * lh;
  const room = Math.max(0, pane.height - TRAIN_ROWS * lh - top - lh);
  node.style.top = `${top + Math.floor((Math.random() * room) / lh) * lh}px`;

  // eastbound runs left to right and needs the mirrored consist, or it drives in reverse
  eastbound = !eastbound;
  const frames = eastbound ? TRAIN_FRAMES_FLIPPED : TRAIN_FRAMES;
  const lastCol = Math.ceil(pane.width / cw);
  let col = eastbound ? -TRAIN_COLS : lastCol;
  node.hidden = false;

  const step = () => {
    const frame = frameFor(col, eastbound, COLS_PER_FRAME, frames.length);
    node.innerHTML = frames[frame].map(rowHtml).join("\n");
    node.style.left = `${Math.round(col * cw)}px`;
    col += eastbound ? 1 : -1;
    if (eastbound ? col > lastCol : col < -TRAIN_COLS) {
      node.hidden = true;
      node.innerHTML = "";
      running = false;
      return scheduleNext();
    }
    timer = window.setTimeout(step, STEP_MS);
  };
  step();
}

declare global {
  interface Window {
    __trainBound?: boolean;
  }
}

if (
  !window.__trainBound &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  window.__trainBound = true;
  if (LOOP) {
    run();
  } else {
    if (!readSlot()) writeSlot(Date.now() + FIRST_RUN_MS);
    window.setInterval(tick, CHECK_MS);
    document.addEventListener("visibilitychange", tick);
    tick();
  }
}
