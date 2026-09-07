/**
 * Width of one column of the buffer font, measured rather than assumed. A probe goes in
 * beside the node so it inherits the same font, is measured, and is taken straight back out.
 * Falls back to 9px, which is what the site's 15px JetBrains Mono actually measures.
 */
export function columnWidth(node: HTMLElement): number {
  const probe = document.createElement('span');
  probe.textContent = '0'.repeat(20);
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
  node.after(probe);
  const w = probe.getBoundingClientRect().width / 20;
  probe.remove();
  return w || 9;
}
