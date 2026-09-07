import { rowHtml } from '../lib/diagram';
import { columnWidth } from '../lib/measure';
import { WRAP_COLUMNS } from '../lib/text';
import type { Stream, StreamId } from '../lib/streams';

/** Nothing here moves faster than this, so redrawing more often buys only CPU. */
const FPS = 20;

/** Columns the strip costs the buffer beyond its own width: its left margin. */
const GAP = 2;
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
  }

  /**
   * Measure the pane and decide whether the strip belongs here.
   *
   * The strip is a flex column beside the buffer, not an overlay, so it cannot land on the
   * text however narrow things get — the only question is whether taking its width would
   * squeeze the buffer below the measure the prose is wrapped to. That is a question about
   * the space actually left over, which is why there is no width threshold here: a tablet
   * with a roomy pane gets a strip, and a phone fails this test on its own.
   */
  private layout() {
    const pane = this.parentElement;
    if (!pane || !this.stream) return;

    const ch = columnWidth(this);
    const lh = parseFloat(getComputedStyle(this).lineHeight) || 22;
    const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 4;
    // the pane's width does not change when the strip appears — it is the flex container
    const left = pane.clientWidth / ch - (this.stream.cols + GAP);
    const fits = left >= gutter + WRAP_COLUMNS;
    // one row of the buffer's top padding sits above the strip's first line
    const rows = Math.floor((pane.clientHeight - lh) / lh);

    if (!fits || rows < MIN_ROWS) return this.stand();
    if (rows !== this.rows.length) this.build(rows);
    this.hidden = false;
    this.sync();
  }

  /** No room for it here: draw nothing, and hand the page back to the train. */
  private stand() {
    clearTimeout(this.timer);
    this.hidden = true;
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
