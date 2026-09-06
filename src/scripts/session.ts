import { renderSession, rowHtml, type Command } from '../lib/session';
import { SCRIPT } from '../readme';

/** the typewriter is 13 characters a second, so this is already more than enough */
const FPS = 20;
/** replayed once per browser session, not once per navigation */
const SEEN_KEY = 'readme:played';

/** Storage is unavailable in some privacy modes; a session that always replays is no tragedy. */
function seen(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return false;
  }
}

function remember() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}

/**
 * Types README.sh back in. The build renders the finished session; this clears it on load and
 * replays it, unless the visitor has already watched it this session or asked for less motion.
 * Clicking the buffer replays it on demand.
 */
class ShellSession extends HTMLElement {
  private script: Command[] = SCRIPT;
  private started = 0;
  private timer: number | undefined;
  /** how many rows are already in the DOM, so a frame only appends what is new */
  private drawn = 0;
  private live: HTMLElement | undefined;
  private caret = document.createElement('span');

  connectedCallback() {
    this.caret.className = 'caret';
    this.addEventListener('click', this.replay);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || seen()) {
      this.settle();
      return;
    }
    this.play();
  }

  disconnectedCallback() {
    clearTimeout(this.timer);
    this.removeEventListener('click', this.replay);
  }

  private replay = (event: MouseEvent) => {
    // a click on a link is a click on a link, not a request to replay
    if ((event.target as HTMLElement).closest('a')) return;
    this.play();
  };

  private play() {
    clearTimeout(this.timer);
    this.classList.add('page-effect');
    this.replaceChildren();
    this.drawn = 0;
    this.live = undefined;
    this.started = performance.now();
    this.tick();
  }

  /** Nothing on this page is animating any more, so the train may cross it again. */
  private settle() {
    this.classList.remove('page-effect');
  }

  /** The row being typed, or the idle prompt once the session is over. */
  private liveRow(): HTMLElement {
    if (!this.live) {
      const ln = document.createElement('div');
      ln.className = 'ln';
      const tx = document.createElement('div');
      tx.className = 'tx';
      ln.append(tx);
      this.append(ln);
      this.live = tx;
    }
    return this.live;
  }

  private tick = () => {
    const t = (performance.now() - this.started) / 1000;
    const { rows, typing, done } = renderSession(this.script, t);

    for (const row of rows.slice(this.drawn)) {
      const ln = document.createElement('div');
      ln.className = 'ln';
      const tx = document.createElement('div');
      tx.className = ['tx', row.indent && 'out', row.wrap && 'wrap'].filter(Boolean).join(' ');
      tx.innerHTML = rowHtml(row.spans);
      ln.append(tx);
      // new rows go above the line still being typed
      this.insertBefore(ln, this.live?.parentElement ?? null);
    }
    this.drawn = rows.length;

    const tx = this.liveRow();
    const html = rowHtml([{ text: '❯ ', color: 'green' }, { text: typing ?? '', color: 'fg' }]);
    if (tx.dataset.line !== html) {
      tx.innerHTML = html;
      tx.dataset.line = html;
      // the caret is moved, never recreated: recreating it restarts the blink every frame
      tx.append(this.caret);
    }

    if (done) {
      remember();
      this.settle();
      return;
    }
    this.timer = window.setTimeout(this.tick, 1000 / FPS);
  };
}

if (!customElements.get('shell-session')) customElements.define('shell-session', ShellSession);
