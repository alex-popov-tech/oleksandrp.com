import { rowHtml } from '../lib/diagram';
import { columnWidth } from '../lib/measure';
import type { Stream, StreamId } from '../lib/streams';

/** Nothing here moves faster than this, so redrawing more often buys only CPU. */
const FPS = 20;
/** Prose is hard-wrapped to this many columns — WRAP_COLUMNS in lib/text. */
const PROSE = 80;
/** Columns between the end of the prose column and the strip. */
const GAP = 2;
/** Rows above the strip: the winbar, the buffer's top padding, and the title line. */
const TOP_ROWS = 3;
/** Below this the strip is too short to read as a column at all. */
const MIN_ROWS = 8;

/** One chunk per engine: a page downloads its own renderer and no others. */
const LOADERS: Record<StreamId, () => Promise<Stream>> = {
  git: () => import('../lib/streams/rain').then((m) => m.git),
  interpreter: () => import('../lib/streams/rain').then((m) => m.interpreter),
  grep: () => import('../lib/streams/grep').then((m) => m.grep),
  http: () => import('../lib/streams/dialog').then((m) => m.http),
  redis: () => import('../lib/streams/dialog').then((m) => m.redis),
  dns: () => import('../lib/streams/dialog').then((m) => m.dns),
  bittorrent: () => import('../lib/streams/dialog').then((m) => m.bittorrent),
};

class MarginStream extends HTMLElement {
  private stream: Stream | undefined;
  private rows: HTMLElement[] = [];
  private timer: number | undefined;
  private ro: ResizeObserver | undefined;
  private started = 0;
  private onVis = () => this.sync();

  async connectedCallback() {
    const id = this.dataset.id as StreamId | undefined;
    if (!id || !LOADERS[id]) return;
    // reduced motion gets nothing at all: a frozen frame of falling hex is noise, not a picture
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.stream = await LOADERS[id]();
    const pane = this.parentElement;
    if (!this.isConnected || !pane) return;

    this.style.setProperty('--cols', String(this.stream.cols));
    this.started = performance.now();
    this.ro = new ResizeObserver(() => this.layout());
    this.ro.observe(pane);
    document.addEventListener('visibilitychange', this.onVis);
    this.layout();
  }

  disconnectedCallback() {
    clearTimeout(this.timer);
    this.ro?.disconnect();
    document.removeEventListener('visibilitychange', this.onVis);
    this.classList.remove('page-effect');
  }

  /**
   * Measure the pane and decide whether the strip belongs here at all. It shows only where
   * there is room for the whole prose column, a gap, and the strip; below that the text and
   * the animation would be fighting over the same columns, so nothing is drawn.
   */
  private layout() {
    const pane = this.parentElement;
    if (!pane || !this.stream) return;

    const ch = columnWidth(this);
    const lh = parseFloat(getComputedStyle(this).lineHeight) || 22;
    const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 4;
    const fits = pane.clientWidth / ch >= gutter + PROSE + GAP + this.stream.cols;
    const rows = Math.floor((pane.clientHeight - TOP_ROWS * lh) / lh);

    if (!fits || rows < MIN_ROWS) return this.stand();
    if (rows !== this.rows.length) this.build(rows);
    this.hidden = false;
    // the train is the fallback, and stays in the shed while the strip is running
    this.classList.add('page-effect');
    this.sync();
  }

  /** No room for it here: draw nothing, and hand the page back to the train. */
  private stand() {
    clearTimeout(this.timer);
    this.hidden = true;
    this.classList.remove('page-effect');
    this.replaceChildren();
    this.rows = [];
  }

  private build(rows: number) {
    this.rows = Array.from({ length: rows }, () => document.createElement('div'));
    this.replaceChildren(...this.rows);
  }

  /** Animate only in a foreground tab. Pinned to the pane, the strip is always on screen. */
  private sync() {
    clearTimeout(this.timer);
    if (!this.hidden && document.visibilityState !== 'hidden') this.tick();
  }

  private tick = () => {
    const grid = this.stream!.render((performance.now() - this.started) / 1000, this.rows.length);
    grid.forEach((row, i) => {
      const el = this.rows[i];
      if (!el) return;
      const html = rowHtml(row);
      if (el.innerHTML !== html) el.innerHTML = html;
    });
    this.timer = window.setTimeout(this.tick, 1000 / FPS);
  };
}

if (!customElements.get('margin-stream')) customElements.define('margin-stream', MarginStream);
