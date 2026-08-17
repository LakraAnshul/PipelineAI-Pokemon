/**
 * Joins class names, dropping anything falsy.
 *
 * Deliberately not `clsx` — the only thing this codebase needs from a class
 * utility is conditional joining, and one line of it is not worth a dependency.
 */
export function cn(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(' ')
}
