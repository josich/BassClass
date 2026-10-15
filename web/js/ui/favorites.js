// Favorites: the star button on exercise cards and in the exercise header, and drag-to-reorder
// for the favorites list on Home.
import { h, icon, toast } from './dom.js';
import { isFavorite, toggleFavorite, setFavoritesOrder } from '../store.js';

/** ☆/★ toggle for one exercise. `onChange(on)` runs after each toggle. */
export function starButton(id, { cls = '', onChange } = {}) {
  const b = h('button', { class: `fav-btn ${cls}`, onClick: (e) => {
    e.stopPropagation();
    const on = toggleFavorite(id);
    paint(on);
    toast(on ? 'Added to your favourites on Home' : 'Removed from favourites');
    onChange?.(on);
  } });
  const paint = (on) => {
    b.classList.toggle('on', on);
    b.innerHTML = icon(on ? 'star' : 'starO');
    b.title = on ? 'Remove from favourites' : 'Add to favourites';
    b.setAttribute('aria-label', b.title);
    b.setAttribute('aria-pressed', String(on));
  };
  paint(isFavorite(id));
  return b;
}

const saveOrder = (list) => setFavoritesOrder([...list.children].map((x) => x.dataset.id));

/**
 * Drag a row of a list by its handle to reorder it (pointer events, so it works with touch
 * and mouse). The row follows the finger; the new order is saved when it is released.
 * A cancelled drag (back gesture, incoming call) puts the list back as it was.
 * The handle also works from the keyboard: arrow up / down move the row.
 */
export function dragToReorder(handle, row) {
  handle.addEventListener('click', (e) => e.stopPropagation());
  handle.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const list = row.parentElement;
    if (e.key === 'ArrowUp' && row.previousElementSibling) list.insertBefore(row, row.previousElementSibling);
    else if (e.key === 'ArrowDown' && row.nextElementSibling) list.insertBefore(row.nextElementSibling, row);
    else return;
    handle.focus();
    saveOrder(list);
  });
  handle.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    const list = row.parentElement;
    const original = [...list.children];
    const scroller = row.closest('.main');
    const grab = e.clientY - row.getBoundingClientRect().top;
    try { handle.setPointerCapture(e.pointerId); } catch { /* the window listeners below still follow it */ }
    row.classList.add('dragging');
    const id = e.pointerId;
    const move = (ev) => {
      if (ev.pointerId !== id) return;
      if (!list.isConnected) { stop(); return; } // the screen was left mid-drag
      if (scroller) {
        const r = scroller.getBoundingClientRect();
        if (ev.clientY < r.top + 36) scroller.scrollTop -= 10;
        else if (ev.clientY > r.bottom - 36) scroller.scrollTop += 10;
      }
      const top = ev.clientY - grab; // where the row's top should be on screen
      const mid = top + row.offsetHeight / 2;
      const next = [...list.children].find((s) => s !== row && mid < s.getBoundingClientRect().top + s.offsetHeight / 2) || null;
      if (next !== row.nextElementSibling) list.insertBefore(row, next);
      row.style.transform = '';
      row.style.transform = `translateY(${top - row.getBoundingClientRect().top}px)`;
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      row.classList.remove('dragging');
      row.style.transform = '';
    };
    const end = (ev) => {
      if (ev.pointerId !== id) return;
      stop();
      if (!list.isConnected) return;
      if (ev.type === 'pointercancel') { list.replaceChildren(...original); return; }
      saveOrder(list);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  });
}
