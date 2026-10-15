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
    toast(on ? 'Added to your favorites on Home' : 'Removed from favorites');
    onChange?.(on);
  } });
  const paint = (on) => {
    b.classList.toggle('on', on);
    b.innerHTML = icon(on ? 'star' : 'starO');
    b.title = on ? 'Remove from favorites' : 'Add to favorites';
    b.setAttribute('aria-label', b.title);
    b.setAttribute('aria-pressed', String(on));
  };
  paint(isFavorite(id));
  return b;
}

/**
 * Drag a row of a list by its handle to reorder it (pointer events, so it works with touch
 * and mouse). The row follows the finger; the new order is saved when it is released.
 */
export function dragToReorder(handle, row) {
  handle.addEventListener('click', (e) => e.stopPropagation());
  handle.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    const list = row.parentElement;
    const scroller = row.closest('.main');
    const grab = e.clientY - row.getBoundingClientRect().top;
    try { handle.setPointerCapture(e.pointerId); } catch { /* the window listeners below still follow it */ }
    row.classList.add('dragging');
    const id = e.pointerId;
    const move = (ev) => {
      if (ev.pointerId !== id) return;
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
    const end = (ev) => {
      if (ev.pointerId !== id) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      row.classList.remove('dragging');
      row.style.transform = '';
      setFavoritesOrder([...list.children].map((x) => x.dataset.id));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  });
}
