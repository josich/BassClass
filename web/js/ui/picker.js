// The shared picker (user, 2026-10-23: every library must take more content without the room growing): a
// block names its current choice and opens this to change it. Its groups come from the data (chips that
// scroll sideways, with ★ Favourites and Recent first once they hold something; no search: user, 2026-10-27,
// it was not much use), and a tap on a card picks it and closes. It opens over the screen it came from;
// Escape, ✕, a tap outside or Back close it (it has its own history entry, so Back stays on the screen).
import { h, icon, sideScroll } from './dom.js';

let opened = 0;   // pickers open now
// Forward after Back would land on a picker's entry with no picker: it steps back over it
addEventListener('popstate', () => { if (history.state?.picker && !opened) history.back(); });

/**
 * Opens a picker. `o`: { title, groups: [{ key, name }], items: [{ key, name, sub, group, lock, fresh }], current,
 * open (the group shown first; else the current item's), favs, recent (item keys), onPick(key),
 * onFav(key, on), onGroup(key) (a group opened), host (where it goes; document.body by default) }.
 * Returns close(how): 'route' closes it without going back in the history (the screen is leaving).
 */
export function openPicker(o) {
  const byKey = new Map(o.items.map((it) => [it.key, it]));
  const groupName = new Map(o.groups.map((g) => [g.key, g.name]));
  const favs = new Set((o.favs || []).filter((k) => byKey.has(k)));
  const recent = (o.recent || []).filter((k) => byKey.has(k));
  let open = o.open ?? byKey.get(o.current)?.group ?? o.groups[0]?.key;

  const chips = h('div', { class: 'picker-chips' });
  const grid = h('div', { class: 'picker-grid' });
  const closeBtn = h('button', { class: 'icon-btn picker-close', type: 'button', 'aria-label': 'Close', html: icon('close') });
  const panel = h('div', { class: 'picker', role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title, tabindex: '-1' },
    h('div', { class: 'picker-head' }, h('h2', {}, o.title), h('span', { class: 'picker-count' }, `${o.items.length}`), h('div', { class: 'grow' }), closeBtn),
    chips, grid);
  const backdrop = h('div', { class: 'picker-backdrop' }, panel);

  /** The items shown: the open chip's. */
  const listed = () => {
    if (open === '*fav') return o.items.filter((it) => favs.has(it.key));
    if (open === '*recent') return recent.map((k) => byKey.get(k));
    return o.items.filter((it) => it.group === open);
  };
  const card = (it) => {
    const fav = favs.has(it.key);
    // (in Favourites and Recent a card also names its group)
    const where = open.startsWith('*') ? `${groupName.get(it.group) || ''} · ` : '';
    // (an item that is Pro, `lock` its reason: a "Pro" chip, and a tap opens the Pro sheet: `onLocked`)
    return h('div', { class: `picker-card${it.key === o.current ? ' on' : ''}${it.lock ? ' locked' : ''}` },
      h('button', { class: 'picker-pick', type: 'button', onClick: () => {
        if (fresh()) return;
        if (it.lock) {
          // (the Pro sheet opens once the picker's own history entry is gone, or Back would close it at once)
          const why = it.lock;
          let done = false;
          const show = () => { if (!done) { done = true; o.onLocked?.(why, it.key); } };
          if (history.state?.picker) { addEventListener('popstate', () => setTimeout(show, 0), { once: true }); setTimeout(show, 400); }
          close();
          if (!history.state?.picker) show();
          return;
        }
        close();
        o.onPick(it.key);
        refocus();
      } },
        // (the Pro chip on the small line, so a long name keeps its room: QA round 19)
        h('b', {}, it.name), h('small', {}, it.fresh ? h('span', { class: 'chip new' }, 'New') : null, it.lock ? h('span', { class: 'chip pro' }, 'Pro') : null, `${where}${it.sub || ''}`)),
      h('button', {
        class: `picker-star${fav ? ' on' : ''}`, type: 'button', html: icon(fav ? 'star' : 'starO'),
        'aria-label': fav ? `Remove ${it.name} from favourites` : `Add ${it.name} to favourites`,
        onClick: () => {
          if (fav) favs.delete(it.key); else favs.add(it.key);
          o.onFav?.(it.key, !fav);
          // (the last favourite gone, the Favourites chip goes too)
          if (open === '*fav' && !favs.size) open = byKey.get(o.current)?.group ?? o.groups[0]?.key;
          draw();
        },
      }));
  };
  const draw = () => {
    const list = [
      ...(favs.size ? [{ key: '*fav', name: '★ Favourites' }] : []),
      ...(recent.length ? [{ key: '*recent', name: '🕘 Recent' }] : []),
      ...o.groups,
    ];
    chips.replaceChildren(sideScroll(h('div', { class: 'picker-chip-row' }, list.map((g) => h('button', {
      // (a group holding new cards carries a dot)
      class: `${g.key === open ? 'on' : ''}${o.items.some((it) => it.fresh && it.group === g.key) ? ' has-new' : ''}`, type: 'button',
      onClick: () => {
        open = g.key;
        if (!g.key.startsWith('*')) o.onGroup?.(g.key);
        draw();
        grid.scrollTop = 0;
      },
    }, g.name)))));
    const items = listed();
    grid.replaceChildren(...items.map(card));
  };

  // (the second tap of a double tap on Change would land on a card: picks wait a moment after opening)
  const openedAt = performance.now();
  const fresh = () => performance.now() - openedAt < 400;
  closeBtn.addEventListener('click', () => close());
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    // (Tab and Shift+Tab go round inside the picker, never to the screen behind it)
    if (e.key === 'Tab') {
      const f = [...panel.querySelectorAll('button, input')].filter((x) => !x.disabled && x.offsetParent !== null);
      const i = f.indexOf(document.activeElement);
      if (f.length && (e.shiftKey ? i <= 0 : i < 0 || i === f.length - 1)) { e.preventDefault(); (e.shiftKey ? f.at(-1) : f[0]).focus(); }
    }
  };
  document.addEventListener('keydown', onKey, true);
  // Back (Android's, or the browser's) closes the picker and stays on the screen
  history.pushState({ ...(history.state || {}), picker: true }, '');
  const onPop = () => close('back');
  addEventListener('popstate', onPop);
  let closed = false;
  const opener = document.activeElement;
  // (a pick redraws the screen and its Change: the keys go to the new one, in the same block)
  const openerHome = opener?.closest?.('section');
  const openerSel = opener?.classList?.length ? `.${[...opener.classList].join('.')}` : null;
  const refocus = () => {
    if (!opener || opener.isConnected || !openerHome?.isConnected || !openerSel) return;
    openerHome.querySelector(openerSel)?.focus({ preventScroll: true });
  };
  opened++;
  function close(how) {
    if (closed) return;
    closed = true;
    opened--;
    backdrop.remove();
    // (the keys go back where they were: Change)
    if (how !== 'route') opener?.focus?.({ preventScroll: true });
    document.removeEventListener('keydown', onKey, true);
    removeEventListener('popstate', onPop);
    // (closed by hand: its history entry goes too; by Back or a screen leaving: nothing more to undo)
    if (!how && history.state?.picker) history.back();
  }
  (o.host || document.body).append(backdrop);
  draw();
  // the keys move into the picker (Enter cannot open a second one behind it)
  panel.focus({ preventScroll: true });
  return close;
}
