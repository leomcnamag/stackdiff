import fs from "fs";
import path from "path";
import { TagMap } from "./env-tag";

export function loadTagMap(filePath: string): TagMap {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);
  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Tag file must be a JSON object mapping keys to tag arrays");
  }
  for (const [key, value] of Object.entries(parsed)) {
    if (
      !Array.isArray(value) ||
      !(value as unknown[]).every((v) => typeof v === "string")
    ) {
      throw new Error(`Invalid tags for key "${key}": expected string array`);
    }
  }
  return parsed as TagMap;
}

export function saveTagMap(filePath: string, tagMap: TagMap): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(tagMap, null, 2), "utf-8");
}

export function mergeTagMaps(...maps: TagMap[]): TagMap {
  const merged: TagMap = {};
  for (const map of maps) {
    for (const [key, tags] of Object.entries(map)) {
      if (!merged[key]) merged[key] = [];
      for (const tag of tags) {
        if (!merged[key].includes(tag)) merged[key].push(tag);
      }
    }
  }
  return merged;
}
