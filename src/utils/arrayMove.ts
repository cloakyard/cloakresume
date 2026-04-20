/**
 * Immutable array reordering helper used by the editor's up/down
 * controls. Returns the original reference when the move is a no-op so
 * React can short-circuit renders.
 */
export function moveItem<T>(arr: readonly T[], from: number, to: number): T[] | readonly T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
