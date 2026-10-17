export type PlayerId = string & { readonly __brand: "PlayerId" };

export function asPlayerId(raw: string): PlayerId {
  return raw as PlayerId;
}
