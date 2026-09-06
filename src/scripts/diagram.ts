import { rowHtml, type Diagram } from '../lib/diagram';
import type { DiagramId } from '../lib/diagrams';

/** Nothing here moves faster than this, so redrawing more often buys only CPU. */
const FPS = 20;

/** One chunk per diagram: a project page downloads its own renderer and no others. */
const LOADERS: Record<DiagramId, () => Promise<{ diagram: Diagram }>> = {
  'acapulko-flow': () => import('../lib/diagrams/acapulko'),
  'dtek-schedule': () => import('../lib/diagrams/schedule'),
  'rio-hooks': () => import('../lib/diagrams/rio'),
  'store-browse': () => import('../lib/diagrams/store'),
};

class AsciiDiagram extends HTMLElement {
  private rows: HTMLElement[] = [];
  private diagram: Diagram | undefined;
  private timer: number | undefined;
  private started = 0;
  private visible = false;
  private io: IntersectionObserver | undefined;
  /** the data-* flags currently on the host, seeded from what the server rendered */
  private flags = new Set<string>();
  private onVis = () => this.sync();

  async connectedCallback() {
    this.rows = [...this.querySelectorAll<HTMLElement>('.diagram-row')];
    const id = this.dataset.id as DiagramId | undefined;
    if (this.rows.length === 0 || !id || !LOADERS[id]) return;
    // reduced motion keeps the frame the server already rendered
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    for (const attr of [...this.attributes]) {
      if (attr.name.startsWith('data-') && attr.name !== 'data-id') this.flags.add(attr.name.slice(5));
    }
    this.diagram = (await LOADERS[id]()).diagram;
    if (!this.isConnected) return;

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
    const { grid, flags } = this.diagram!.render((performance.now() - this.started) / 1000);
    const next = new Set(flags ?? []);
    for (const flag of this.flags) if (!next.has(flag)) this.removeAttribute(`data-${flag}`);
    for (const flag of next) this.setAttribute(`data-${flag}`, '');
    this.flags = next;

    grid.forEach((row, i) => {
      const el = this.rows[i];
      if (!el) return;
      const html = rowHtml(row);
      if (el.innerHTML !== html) el.innerHTML = html;
    });
    this.timer = window.setTimeout(this.tick, 1000 / FPS);
  };
}

if (!customElements.get('ascii-diagram')) customElements.define('ascii-diagram', AsciiDiagram);
