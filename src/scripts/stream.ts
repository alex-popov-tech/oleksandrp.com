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
   * Where the strip starts: the row after the title, measured rather than counted. The title
   * is one row on a wide pane and two once the layout drops its [github] link onto its own
   * line, and the strip must never begin beside it — the page is a title across the top, then
   * text and animation side by side underneath.
   */
  private topOffset(pane: Element, lh: number): number {
    const title = pane.querySelector('#buffer .tx.title')?.closest('.ln');
    if (!title) return lh;
    const bottom = title.getBoundingClientRect().bottom - pane.getBoundingClientRect().top;
    // land on a row boundary so the strip stays on the buffer's grid
    return Math.ceil(bottom / lh) * lh;
  }

  /**
   * How many columns of prose survive once the strip's are reserved.
   *
   * Reserve them first and measure a real line, rather than deriving the number from the
   * pane's width: the line box already knows about the gutter and about its own right inset,
   * and that inset is 2ch on a wide pane and 1ch in the drawer layout. Subtracting a guess
   * for those was off by two columns, which showed up as a paragraph soft-wrapping on a pane
   * the strip had just declared roomy enough.
   */
  private proseColumns(pane: HTMLElement, ch: number): number {
    pane.style.setProperty('--strip', `${this.stream!.cols + GAP}ch`);
    const tx = pane.querySelector('#buffer .ln .tx:not(.title)');
    if (!tx) return 0;
    const cs = getComputedStyle(tx);
    const inner = tx.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    return inner / ch;
  }

  /**
   * Measure the pane and decide whether the strip belongs here.
   *
   * The buffer reserves the strip's columns rather than the strip stealing them, so text
   * cannot land under it however narrow things get. The only question is whether reserving
   * them would squeeze the text below the measure the prose is wrapped to — a question about
   * the space actually left over, which is why there is no width threshold here: a tablet
   * with a roomy pane gets a strip, and a phone fails this test on its own.
   */
  private layout() {
    const pane = this.parentElement;
    if (!pane || !this.stream) return;

    const ch = columnWidth(this);
    const lh = parseFloat(getComputedStyle(this).lineHeight) || 22;
    const fits = this.proseColumns(pane, ch) >= WRAP_COLUMNS;
    // the title spans the full pane, so the strip begins on the row after it
    const top = this.topOffset(pane, lh);
    const rows = Math.floor((pane.clientHeight - top) / lh);

    if (!fits || rows < MIN_ROWS) return this.stand();
    this.style.top = `${top}px`;
    if (rows !== this.rows.length) this.build(rows);
    this.hidden = false;
    this.sync();
  }

  /** No room for it here: draw nothing, and give the reserved columns back to the text. */
  private stand() {
    clearTimeout(this.timer);
    this.parentElement?.style.removeProperty('--strip');
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
