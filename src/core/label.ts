import { apiFailure } from "./errors.js";
import type { Session } from "./session.js";

export type LabelId = string & { readonly __brand: "LabelId" };

export function asLabelId(raw: string): LabelId {
  return raw as LabelId;
}

export interface Label {
  id: LabelId;
  name: string;
  color: string;
}

export async function listLabels(session: Session): Promise<Label[]> {
  const { data, error, status } = await session.client
    .from("tags")
    .select("id, name, color")
    .eq("user_id", session.userId)
    .order("name")
    .overrideTypes<Label[], { merge: false }>();
  if (error) throw apiFailure("Reading your labels", status, error.message);
  return data;
}

export async function createLabel(
  session: Session,
  name: string,
  color?: string,
): Promise<Label> {
  const { data, error, status } = await session.client
    .from("tags")
    .insert({
      user_id: session.userId,
      name,
      ...(color === undefined ? {} : { color }),
    })
    .select("id, name, color")
    .single<Label>();
  if (error) {
    throw apiFailure(
      `Creating label ${JSON.stringify(name)}`,
      status,
      error.message,
    );
  }
  return data;
}

export interface LabelDeletion {
  id: LabelId;
}

export async function deleteLabel(
  session: Session,
  id: LabelId,
): Promise<LabelDeletion> {
  const { error, status } = await session.client.rpc("delete_tag", {
    p_tag_id: id,
  });
  if (error) throw apiFailure(`Deleting label ${id}`, status, error.message);
  return { id };
}
