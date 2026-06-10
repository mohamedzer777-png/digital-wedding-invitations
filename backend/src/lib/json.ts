/**
 * JSON-as-text helpers. On SQL Server the Prisma connector has no `Json` type, so
 * JSON documents (designs, metadata, feature lists) are stored as NVARCHAR(MAX)
 * strings and (de)serialized here at the service boundary.
 */

/** Parse a stored JSON string; returns `fallback` if null/empty/invalid. */
export function parseJson<T = unknown>(text: string | null | undefined, fallback: T): T {
  if (text == null || text === '') return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

/** Serialize a value for storage in an NVARCHAR(MAX) column. */
export function toJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}
