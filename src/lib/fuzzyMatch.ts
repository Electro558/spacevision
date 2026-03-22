import type { SceneObject } from './cadStore';

/**
 * Fuzzy-match an object by name.
 * 1. Exact match (case-insensitive)
 * 2. Includes match (name contains search term, case-insensitive)
 * Returns null if no match found.
 */
export function fuzzyFindObject(
  objects: SceneObject[],
  searchName: string
): SceneObject | null {
  const lower = searchName.toLowerCase();

  // 1. Exact match
  const exact = objects.find(o => o.name.toLowerCase() === lower);
  if (exact) return exact;

  // 2. Includes match
  const includes = objects.find(o => o.name.toLowerCase().includes(lower));
  if (includes) return includes;

  // 3. Reverse includes (search term contains object name)
  const reverse = objects.find(o => lower.includes(o.name.toLowerCase()));
  if (reverse) return reverse;

  return null;
}

/**
 * Fuzzy-match multiple objects by name array.
 * Returns matched objects and unmatched names.
 */
export function fuzzyFindObjects(
  objects: SceneObject[],
  searchNames: string[]
): { matched: SceneObject[]; unmatched: string[] } {
  const matched: SceneObject[] = [];
  const unmatched: string[] = [];

  for (const name of searchNames) {
    const found = fuzzyFindObject(objects, name);
    if (found && !matched.some(m => m.id === found.id)) {
      matched.push(found);
    } else if (!found) {
      unmatched.push(name);
    }
  }

  return { matched, unmatched };
}
