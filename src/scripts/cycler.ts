import { HOLD_MS, lineStarts, nextDelay } from '../lib/typing';

interface Snippet {
  lang: string;
  label: string;
  href: string;
  projectName?: string;
  projectHref?: string;
  lines: string[];
}

interface TextRef {
  node: Text;
  full: string;
}

class CodeCycler extends HTMLElement {
  private snippets: Snippet[] = [];
  private index = 0;
  private timer: number | undefined;
  private paused = false;
  private visible = true;
  private refs: TextRef[] = [];
  private starts = new Set<number>();
  private total = 0;
  private n = 0;
  private caret = document.createElement('span');
  private io: IntersectionObserver | undefined;
  private onVis = () => this.setPaused(document.visibilityState === 'hidden' || !this.visible);

  connectedCallback() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.snippets = [...this.querySelectorAll<HTMLTemplateElement>('template[data-snippet]')].map((t) => ({
      lang: t.dataset.lang ?? '',
      label: t.dataset.label ?? '',
      href: t.dataset.href ?? '#',
      projectName: t.dataset.projectName,
      projectHref: t.dataset.projectHref,
      lines: [...t.content.children].map((c) => c.innerHTML),
    }));
    if (this.snippets.length === 0) return;
    this.caret.className = 'caret';
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.onVis();
    });
    this.io.observe(this);
    document.addEventListener('visibilitychange', this.onVis);
    this.load(0);
    this.n = 0;
    this.show(0);
    this.tick();
  }

  disconnectedCallback() {
    clearTimeout(this.timer);
    this.io?.disconnect();
    document.removeEventListener('visibilitychange', this.onVis);
  }

  private rows(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>('[data-live] .ln .tx')];
  }

  /** Put snippet `i` into the live rows (full text) and collect its text nodes. */
  private load(i: number) {
    this.index = i;
    const s = this.snippets[i];
    const rows = this.rows();
    rows.forEach((tx, k) => {
      tx.innerHTML = s.lines[k] ?? '';
    });
    const fence = this.querySelector('[data-fence]');
    if (fence) fence.textContent = '```' + s.lang;
    const src = this.querySelector<HTMLAnchorElement>('[data-src]');
    if (src) {
      src.textContent = s.label;
      src.href = s.href;
    }
    const proj = this.querySelector<HTMLAnchorElement>('[data-project]');
    if (proj && s.projectName && s.projectHref) {
      proj.textContent = s.projectName;
      proj.href = s.projectHref;
    }
    this.refs = [];
    const lengths: number[] = [];
    for (const tx of rows) {
      let len = 0;
      const walker = document.createTreeWalker(tx, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const t = node as Text;
        this.refs.push({ node: t, full: t.data });
        len += t.data.length;
      }
      lengths.push(len);
    }
    this.starts = lineStarts(lengths);
    this.total = lengths.reduce((a, b) => a + b, 0);
  }

  /** Reveal the first `n` characters across all text nodes and park the caret after the last one. */
  private show(n: number) {
    let left = n;
    let last: Text | null = null;
    for (const r of this.refs) {
      const take = Math.max(0, Math.min(r.full.length, left));
      r.node.data = r.full.slice(0, take);
      if (take > 0) last = r.node;
      left -= r.full.length;
    }
    this.caret.remove();
    if (last) last.after(this.caret);
    else this.rows()[0]?.prepend(this.caret);
  }

  private tick = () => {
    if (this.paused) return;
    if (this.n >= this.total) {
      this.timer = window.setTimeout(this.next, HOLD_MS);
      return;
    }
    this.n += 1;
    this.show(this.n);
    this.timer = window.setTimeout(this.tick, nextDelay(this.starts.has(this.n)));
  };

  private next = () => {
    this.load((this.index + 1) % this.snippets.length);
    this.n = 0;
    this.show(0);
    this.tick();
  };

  private setPaused(p: boolean) {
    if (p === this.paused) return;
    this.paused = p;
    if (p) clearTimeout(this.timer);
    else this.tick();
  }
}

if (!customElements.get('code-cycler')) customElements.define('code-cycler', CodeCycler);
