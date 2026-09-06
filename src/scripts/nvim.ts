import { gutter } from '../lib/numbers';

type Pane = 'tree' | 'buffer';

const state = { pane: 'buffer' as Pane, tree: 0, buf: 0, pendingG: false };
let msgTimer: number | undefined;

const $ = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

/* ---------- panes ---------- */

function treeRows(): HTMLElement[] {
  return $$<HTMLElement>('#tree [data-row]').filter((r) => !r.closest('.children[hidden]'));
}

function bufLines(): HTMLElement[] {
  return $$<HTMLElement>('#buffer .ln');
}

function setBuf(i: number) {
  const lines = bufLines();
  if (lines.length === 0) return;
  state.buf = Math.min(Math.max(0, i), lines.length - 1);
  const labels = gutter(state.buf + 1, lines.length);
  lines.forEach((ln, k) => {
    ln.classList.toggle('cur', k === state.buf);
    const nr = ln.querySelector('.nr');
    if (nr) nr.textContent = labels[k];
  });
  lines[state.buf].scrollIntoView({ block: 'nearest' });
}

function setTree(i: number) {
  const rows = treeRows();
  if (rows.length === 0) return;
  state.tree = Math.min(Math.max(0, i), rows.length - 1);
  $$('#tree .tcur').forEach((r) => r.classList.remove('tcur'));
  rows[state.tree].classList.add('tcur');
  rows[state.tree].scrollIntoView({ block: 'nearest' });
}

function setPane(p: Pane) {
  state.pane = p;
  document.body.dataset.pane = p;
  if (p === 'tree') setTree(state.tree);
}

/* ---------- tree ---------- */

function toggleFold(row: HTMLElement, fold?: boolean) {
  const path = row.dataset.folder;
  if (!path) return;
  const kids = $<HTMLElement>(`#tree [data-children="${path}"]`);
  if (!kids) return;
  const willFold = fold ?? !kids.hidden;
  kids.hidden = willFold;
  row.toggleAttribute('data-folded', willFold);
  const chev = row.querySelector('.chev');
  if (chev) chev.textContent = willFold ? '▸' : '▾';
}

function openRow(row: HTMLElement) {
  if (row.dataset.folder) {
    toggleFold(row);
    return;
  }
  row.querySelector<HTMLAnchorElement>('a')?.click();
}

function parentRow(row: HTMLElement): HTMLElement | null {
  const kids = row.closest<HTMLElement>('.children');
  if (!kids) return null;
  return $<HTMLElement>(`#tree [data-folder="${kids.dataset.children}"]`);
}

function markCurrentFile() {
  const here = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '');
  $$('#tree .row.sel').forEach((r) => r.classList.remove('sel'));
  const row = $$<HTMLElement>('#tree .row.file').find((r) => r.querySelector('a')?.getAttribute('href') === here);
  if (!row) {
    state.tree = 0;
    return;
  }
  row.classList.add('sel');
  let kids = row.closest<HTMLElement>('.children');
  while (kids) {
    const folder = $<HTMLElement>(`#tree [data-folder="${kids.dataset.children}"]`);
    if (folder) toggleFold(folder, false);
    kids = folder?.closest<HTMLElement>('.children') ?? null;
  }
  state.tree = Math.max(0, treeRows().indexOf(row));
}

/* ---------- command line ---------- */

function cmdline(): HTMLElement {
  return $<HTMLElement>('#cmdline')!;
}

function resetCmdline() {
  const el = cmdline();
  el.classList.remove('err');
  el.textContent = el.dataset.hint ?? '';
}

function message(text: string, err = false) {
  const el = cmdline();
  el.classList.toggle('err', err);
  el.textContent = text;
  clearTimeout(msgTimer);
  msgTimer = window.setTimeout(resetCmdline, 2500);
}

function openCmdline() {
  const el = cmdline();
  clearTimeout(msgTimer);
  el.classList.remove('err');
  el.textContent = ':';
  const input = document.createElement('input');
  input.type = 'text';
  input.setAttribute('aria-label', 'command');
  el.append(input);
  input.focus();
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || (e.key === 'Backspace' && input.value === '')) {
      e.preventDefault();
      resetCmdline();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = input.value.trim();
      resetCmdline();
      runCommand(cmd);
    }
  });
}

function runCommand(cmd: string) {
  if (cmd === '') return;
  if (['q', 'q!', 'qa', 'qa!', 'wq', 'x'].includes(cmd)) return enterShell();
  if (cmd === 'h' || cmd === 'help') return openHelp();
  message(`E492: Not an editor command: ${cmd}`, true);
}

/* ---------- help ---------- */

function openHelp() {
  const help = $<HTMLDialogElement>('#help');
  if (help && !help.open) help.showModal();
}

/* ---------- shell ---------- */

function enterShell() {
  const shell = $<HTMLElement>('#shell');
  const app = $<HTMLElement>('#app');
  if (!shell || !app) return;
  app.hidden = true;
  shell.hidden = false;
  document.body.dataset.mode = 'shell';
  $<HTMLInputElement>('[data-shell-input]')?.focus();
}

function leaveShell() {
  const shell = $<HTMLElement>('#shell');
  const app = $<HTMLElement>('#app');
  if (!shell || !app) return;
  shell.hidden = true;
  app.hidden = false;
  delete document.body.dataset.mode;
  const input = $<HTMLInputElement>('[data-shell-input]');
  if (input) input.value = '';
  const log = $<HTMLElement>('[data-shell-log]');
  if (log) log.innerHTML = '';
}

function bindShell() {
  const shell = $<HTMLElement>('#shell');
  // note: dataset.bound = '' would be falsy, so the guard has to test the attribute
  if (!shell || shell.hasAttribute('data-bound')) return;
  shell.setAttribute('data-bound', '');
  shell.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('input')) return;
    leaveShell();
  });
  $<HTMLFormElement>('[data-shell-form]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $<HTMLInputElement>('[data-shell-input]')!;
    const v = input.value.trim();
    if (['nvim', 'vim', 'vi', 'nvim .'].includes(v)) return leaveShell();
    const log = $<HTMLElement>('[data-shell-log]')!;
    const echo = document.createElement('div');
    echo.textContent = `~/oleksandr $ ${v}`;
    log.append(echo);
    if (v !== '') {
      const err = document.createElement('div');
      err.textContent = `zsh: command not found: ${v.split(' ')[0]}`;
      log.append(err);
    }
    input.value = '';
  });
}

/* ---------- drawer (phone) ---------- */

function closeDrawer() {
  const sidebar = $<HTMLElement & { hidePopover?: () => void }>('#sidebar');
  try {
    if (sidebar?.matches(':popover-open')) sidebar.hidePopover?.();
  } catch {
    /* popover unsupported: nothing to close */
  }
}

/* ---------- keys ---------- */

function onKey(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const target = e.target as HTMLElement;
  if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (document.body.dataset.mode === 'shell') return;
  const help = $<HTMLDialogElement>('#help');
  if (help?.open) {
    if (e.key === 'q' || e.key === 'Escape') help.close();
    return;
  }
  const k = e.key;
  if (k === ':') {
    e.preventDefault();
    openCmdline();
    return;
  }
  if (k === '?') {
    e.preventDefault();
    openHelp();
    return;
  }
  if (k === 'g') {
    if (state.pendingG) {
      state.pendingG = false;
      e.preventDefault();
      state.pane === 'tree' ? setTree(0) : setBuf(0);
    } else {
      state.pendingG = true;
    }
    return;
  }
  state.pendingG = false;
  if (k === 'G') {
    e.preventDefault();
    state.pane === 'tree' ? setTree(Number.MAX_SAFE_INTEGER) : setBuf(Number.MAX_SAFE_INTEGER);
    return;
  }
  if (state.pane === 'tree') {
    const row = treeRows()[state.tree];
    switch (k) {
      case 'j': e.preventDefault(); setTree(state.tree + 1); break;
      case 'k': e.preventDefault(); setTree(state.tree - 1); break;
      case 'l':
        e.preventDefault();
        if (row?.dataset.folder) toggleFold(row, false);
        else if (row) openRow(row);
        break;
      case 'Enter': e.preventDefault(); if (row) openRow(row); break;
      case 'h': {
        e.preventDefault();
        if (row?.dataset.folder && !row.hasAttribute('data-folded')) {
          toggleFold(row, true);
        } else {
          const p = row && parentRow(row);
          if (p) setTree(treeRows().indexOf(p));
        }
        break;
      }
      case 'Escape': setPane('buffer'); break;
    }
  } else {
    switch (k) {
      case 'j': e.preventDefault(); setBuf(state.buf + 1); break;
      case 'k': e.preventDefault(); setBuf(state.buf - 1); break;
      case 'h': e.preventDefault(); setPane('tree'); break;
    }
  }
}

/* ---------- wiring ---------- */

function bindSidebar() {
  const sidebar = $<HTMLElement>('#sidebar');
  // the sidebar persists across view transitions, so this must bind exactly once;
  // dataset.bound = '' would be falsy and re-bind on every page load
  if (!sidebar || sidebar.hasAttribute('data-bound')) return;
  sidebar.setAttribute('data-bound', '');
  sidebar.addEventListener('click', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('.row');
    if (!row) return;
    if (row.dataset.folder) {
      toggleFold(row);
      return;
    }
    if (!(e.target as HTMLElement).closest('a')) row.querySelector<HTMLAnchorElement>('a')?.click();
  });
  sidebar.addEventListener('toggle', (e) => {
    if ((e as ToggleEvent).newState === 'open') $<HTMLElement>('#tree .row.sel')?.scrollIntoView({ block: 'center' });
  });
}

function initPage() {
  bindSidebar();
  bindShell();
  markCurrentFile();
  state.buf = 0;
  setBuf(0);
  setPane('buffer');
  closeDrawer();
}

declare global {
  interface Window { __nvimBound?: boolean }
}

if (!window.__nvimBound) {
  window.__nvimBound = true;
  document.addEventListener('keydown', onKey);
  document.addEventListener('astro:page-load', initPage);
  if (document.readyState !== 'loading') initPage();
  else document.addEventListener('DOMContentLoaded', initPage, { once: true });
}
