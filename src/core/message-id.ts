export type MessageId = string & { readonly __brand: "MessageId" };

export function asMessageId(raw: string): MessageId {
  return raw as MessageId;
}
