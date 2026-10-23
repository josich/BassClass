// The shared picker (user, 2026-10-23: every library must take more content without the room growing): a
// block names its current choice and opens this to change it. Its groups come from the data (chips that
// scroll sideways, with ★ Favourites and Recent first once they hold something), a search finds an item by
// its name, group or tags, and a tap on a card picks it and closes. It opens over the screen it came from;
// Escape, ✕, a tap outside or Back close it (it has its own history entry, so Back stays on the screen).
import { h, icon, sideScroll } from './dom.js';

let opened = 0;   // pickers open now
// Forward after Back would land on a picker's entry with no picker: it steps back over it
addEventListener('popstate', () => { if (history.state?.picker && !opened) history.back(); });

/**
 * Opens a picker. `o`: { title, groups: [{ key, name }], items: [{ key, name, sub, group, tags }], current,
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
  let query = '';
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const search = h('input', { type: 'search', class: 'picker-search', placeholder: 'Search', 'aria-label': `Search ${o.title.toLowerCase()}` });
  const chips = h('div', { class: 'picker-chips' });
  const grid = h('div', { class: 'picker-grid' });
  const closeBtn = h('button', { class: 'icon-btn picker-close', type: 'button', 'aria-label': 'Close', html: icon('close') });
  const panel = h('div', { class: 'picker', role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title, tabindex: '-1' },
    h('div', { class: 'picker-head' }, h('h2', {}, o.title), h('span', { class: 'picker-count' }, `${o.items.length}`), h('div', { class: 'grow' }), closeBtn),
    search, chips, grid);
  const backdrop = h('div', { class: 'picker-backdrop' }, panel);

  /** The items shown: the search's matches (every word, anywhere), or the open chip's. */
  const listed = () => {
    if (query) {
      const words = norm(query).split(/\s+/).filter(Boolean);
      return o.items.filter((it) => {
        const text = norm(`${it.name} ${it.sub || ''} ${groupName.get(it.group) || ''} ${it.tags || ''}`);
        return words.every((w) => text.includes(w));
      });
    }
    if (open === '*fav') return o.items.filter((it) => favs.has(it.key));
    if (open === '*recent') return recent.map((k) => byKey.get(k));
    return o.items.filter((it) => it.group === open);
  };
  const card = (it) => {
    const fav = favs.has(it.key);
    // (searching, or in Favourites and Recent, a card also names its group)
    const where = query || open.startsWith('*') ? `${groupName.get(it.group) || ''} · ` : '';
    return h('div', { class: `picker-card${it.key === o.current ? ' on' : ''}` },
      h('button', { class: 'picker-pick', type: 'button', onClick: () => { if (fresh()) return; close(); o.onPick(it.key); } },
        h('b', {}, it.name), h('small', {}, `${where}${it.sub || ''}`)),
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
      class: !query && g.key === open ? 'on' : '', type: 'button',
      onClick: () => {
        open = g.key;
        query = '';
        search.value = '';
        if (!g.key.startsWith('*')) o.onGroup?.(g.key);
        draw();
        grid.scrollTop = 0;
      },
    }, g.name)))));
    const items = listed();
    grid.replaceChildren(...(items.length ? items.map(card) : [h('p', { class: 'muted small picker-none' }, 'Nothing matches that search')]));
  };

  // (the second tap of a double tap on Change would land on a card: picks wait a moment after opening)
  const openedAt = performance.now();
  const fresh = () => performance.now() - openedAt < 400;
  search.addEventListener('input', () => { query = search.value.trim(); draw(); grid.scrollTop = 0; });
  closeBtn.addEventListener('click', () => close());
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
  document.addEventListener('keydown', onKey, true);
  // Back (Android's, or the browser's) closes the picker and stays on the screen
  history.pushState({ ...(history.state || {}), picker: true }, '');
  const onPop = () => close('back');
  addEventListener('popstate', onPop);
  let closed = false;
  const opener = document.activeElement;
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
  // the keys move into the picker (Enter cannot open a second one behind it); the search waits for a tap,
  // so a phone's keyboard does not open by itself
  panel.focus({ preventScroll: true });
  return close;
}
