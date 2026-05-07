// Tag env keys with metadata labels (e.g. "secret", "infra", "app")

export type TagMap = Record<string, string[]>;

export interface TagResult {
  key: string;
  tags: string[];
}

export interface TagSummary {
  tagged: TagResult[];
  untagged: string[];
  tagIndex: Record<string, string[]>; // tag -> keys
}

export function tagEnvMap(
  env: Record<string, string>,
  tagMap: TagMap
): TagSummary {
  const tagged: TagResult[] = [];
  const untagged: string[] = [];
  const tagIndex: Record<string, string[]> = {};

  for (const key of Object.keys(env)) {
    const tags = tagMap[key] ?? [];
    if (tags.length > 0) {
      tagged.push({ key, tags });
      for (const tag of tags) {
        if (!tagIndex[tag]) tagIndex[tag] = [];
        tagIndex[tag].push(key);
      }
    } else {
      untagged.push(key);
    }
  }

  return { tagged, untagged, tagIndex };
}

export function filterByTag(
  env: Record<string, string>,
  tagMap: TagMap,
  tag: string
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if ((tagMap[key] ?? []).includes(tag)) {
      result[key] = value;
    }
  }
  return result;
}

export function formatTagSummary(summary: TagSummary): string {
  const lines: string[] = [];
  lines.push(`Tagged keys: ${summary.tagged.length}`);
  for (const { key, tags } of summary.tagged) {
    lines.push(`  ${key}: [${tags.join(", ")}]`);
  }
  if (summary.untagged.length > 0) {
    lines.push(`Untagged keys: ${summary.untagged.join(", ")}`);
  }
  lines.push("Tag index:");
  for (const [tag, keys] of Object.entries(summary.tagIndex)) {
    lines.push(`  ${tag}: ${keys.join(", ")}`);
  }
  return lines.join("\n");
}
