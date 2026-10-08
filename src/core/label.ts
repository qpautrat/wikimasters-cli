import { WikiMastersError, apiFailure, isUniqueViolation } from "./errors.js";
import type { Session } from "./session.js";

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface LabelCreation {
  name: string;
  color: string;
  created: boolean;
}

export async function readLabels(session: Session): Promise<Label[]> {
  const { data, error, status } = await session.client
    .from("tags")
    .select("id, name, color")
    .eq("user_id", session.userId)
    .order("name")
    .overrideTypes<Label[], { merge: false }>();
  if (error) throw apiFailure("Reading your labels", status, error.message);
  return data;
}

async function findExistingLabel(
  session: Session,
  name: string,
): Promise<Label> {
  const label = (await readLabels(session)).find(
    (row) => row.name.toLowerCase() === name.toLowerCase(),
  );
  if (!label) {
    throw new WikiMastersError(
      `The game refused label ${JSON.stringify(name)} as a duplicate, yet none of your labels has that name regardless of case; nothing was created`,
    );
  }
  return label;
}

export async function createLabel(
  session: Session,
  name: string,
  color?: string,
): Promise<LabelCreation> {
  const { data, error, status } = await session.client
    .from("tags")
    .insert({
      user_id: session.userId,
      name,
      ...(color === undefined ? {} : { color }),
    })
    .select("name, color")
    .single<Pick<Label, "name" | "color">>();
  if (isUniqueViolation(error)) {
    const existing = await findExistingLabel(session, name);
    return { name: existing.name, color: existing.color, created: false };
  }
  if (error) {
    throw apiFailure(
      `Creating label ${JSON.stringify(name)}`,
      status,
      error.message,
    );
  }
  return { ...data, created: true };
}

export interface LabelDeletion {
  name: string;
  deleted: boolean;
}

export async function deleteLabel(
  session: Session,
  name: string,
): Promise<LabelDeletion> {
  const label = JSON.stringify(name);
  const { data, error, status } = await session.client
    .from("tags")
    .select("id")
    .eq("user_id", session.userId)
    .eq("name", name)
    .maybeSingle<Pick<Label, "id">>();
  if (error) throw apiFailure(`Reading label ${label}`, status, error.message);
  if (!data) return { name, deleted: false };
  const deletion = await session.client.rpc("delete_tag", {
    p_tag_id: data.id,
  });
  if (deletion.error) {
    throw apiFailure(
      `Deleting label ${label}`,
      deletion.status,
      deletion.error.message,
    );
  }
  return { name, deleted: true };
}
