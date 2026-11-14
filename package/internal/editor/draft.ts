import type { ColumnProp, DataType } from '@revolist/revogrid';
/** Drafts are immutable shallow records; application metadata is opaque to the editor. */
export function sameEditorDraft(left: DataType, right: DataType | null): boolean {
  return (
    !!right &&
    Object.keys(left).length === Object.keys(right).length &&
    Object.keys(left).every((key) => Object.hasOwn(right, key) && Object.is(left[key], right[key]))
  );
}
/** Preserve concurrent host updates to fields the editor did not change. */
export function createEditorPatch<T extends DataType>(
  draft: T,
  original: T | null,
  idField: ColumnProp,
  orderField: ColumnProp,
): Partial<T> {
  const protectedFields = new Set([String(idField), String(orderField)]);
  return Object.fromEntries(
    Object.entries(draft).filter(
      ([key, value]) => !protectedFields.has(key) && (!original || !Object.is(value, original[key])),
    ),
  ) as Partial<T>;
}
