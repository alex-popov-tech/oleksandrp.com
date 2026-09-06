import { renderFrame, type Cell, type Role } from '../lib/flow';

/** The motion is 7 cells/s, so redrawing faster than this buys nothing but CPU. */
const FPS = 20;

function runs(row: Cell[]): { text: string; color: Role; op: number }[] {
  const out: { text: string; color: Role; op: number }[] = [];
  for (const cell of row) {
    const last = out[out.length - 1];
    if (last && last.color === cell.color && last.op === cell.op) last.text += cell.ch;
    else out.push({ text: cell.ch, color: cell.color, op: cell.op });
  }
  return out;
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

class AsciiFlow extends HTMLElement {
  private rows: HTMLElement[] = [];
  private timer: number | undefined;
  private started = 0;
  private visible = false;
  private io: IntersectionObserver | undefined;
  private onVis = () => this.sync();

  connectedCallback() {
    this.rows = [...this.querySelectorAll<HTMLElement>('.flow-row')];
    if (this.rows.length === 0) return;
    // reduced motion keeps the frame the server already rendered
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.started = performance.now();
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.sync();
    });
    this.io.observe(this);
    document.addEventListener('visibilitychange', this.onVis);
  }

  disconnectedCallback() {
    clearTimeout(this.timer);
    this.io?.disconnect();
    document.removeEventListener('visibilitychange', this.onVis);
  }

  /** Animate only while on screen and in a foreground tab. */
  private sync() {
    const run = this.visible && document.visibilityState !== 'hidden';
    clearTimeout(this.timer);
    if (run) this.tick();
  }

  private tick = () => {
    const { grid, bulbOn, flashing } = renderFrame((performance.now() - this.started) / 1000);
    this.toggleAttribute('data-on', bulbOn);
    this.toggleAttribute('data-flash', flashing);
    grid.forEach((row, i) => {
      const el = this.rows[i];
      if (!el) return;
      const html = runs(row)
        .map((r) => `<span class="c-${r.color}"${r.op === 1 ? '' : ` style="opacity:${r.op}"`}>${escape(r.text)}</span>`)
        .join('');
      if (el.innerHTML !== html) el.innerHTML = html;
    });
    this.timer = window.setTimeout(this.tick, 1000 / FPS);
  };
}

if (!customElements.get('ascii-flow')) customElements.define('ascii-flow', AsciiFlow);
