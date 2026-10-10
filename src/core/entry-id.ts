export type EntryId = string & { readonly __brand: "EntryId" };

export function asEntryId(raw: string): EntryId {
  return raw as EntryId;
}
