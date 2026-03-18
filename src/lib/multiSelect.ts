/* ─── Multi-Select Utilities ─── */

/**
 * Toggle an id in/out of a selection array.
 * If the id is already selected, remove it; otherwise add it.
 */
export function toggleSelection(selectedIds: string[], id: string): string[] {
  if (selectedIds.includes(id)) {
    return selectedIds.filter(s => s !== id);
  }
  return [...selectedIds, id];
}

/**
 * Select a contiguous range of objects between anchorId and targetId (inclusive).
 * Uses the ordering from allIds.
 */
export function rangeSelect(allIds: string[], anchorId: string, targetId: string): string[] {
  const anchorIndex = allIds.indexOf(anchorId);
  const targetIndex = allIds.indexOf(targetId);
  if (anchorIndex === -1 || targetIndex === -1) return [targetId];
  const start = Math.min(anchorIndex, targetIndex);
  const end = Math.max(anchorIndex, targetIndex);
  return allIds.slice(start, end + 1);
}

/**
 * Check if enough objects are selected to perform a boolean/CSG operation (needs 2+).
 */
export function canPerformBoolean(selectedIds: string[]): boolean {
  return selectedIds.length >= 2;
}

/**
 * Compute the average center position of a set of objects.
 */
export function getSelectionCenter(
  objects: { position: [number, number, number] }[]
): [number, number, number] {
  if (objects.length === 0) return [0, 0, 0];
  const sum: [number, number, number] = [0, 0, 0];
  for (const obj of objects) {
    sum[0] += obj.position[0];
    sum[1] += obj.position[1];
    sum[2] += obj.position[2];
  }
  return [
    sum[0] / objects.length,
    sum[1] / objects.length,
    sum[2] / objects.length,
  ];
}
