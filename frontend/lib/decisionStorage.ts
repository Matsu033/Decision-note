const LEGACY_RECORDS_KEY = "decision-note-records-v1";
const FOLDER_INDEX_KEY = "decision-note-folder-index-v2";
const RECORD_KEY_PREFIX = "decision-note-record-v2:";

export type StoredRecord = { id: string; category: string };
export type StoredFolder<T extends StoredRecord> = {
  id: string;
  name: string;
  records: T[];
};

type FolderIndex = {
  id: string;
  name: string;
  recordIds: string[];
};

function isFolderIndex(value: unknown): value is FolderIndex[] {
  return Array.isArray(value) && value.every((folder) =>
    folder && typeof folder.id === "string" &&
    typeof folder.name === "string" &&
    Array.isArray(folder.recordIds) &&
    folder.recordIds.every((id: unknown) => typeof id === "string")
  );
}

function isStoredFolder<T extends StoredRecord>(
  value: unknown,
): value is StoredFolder<T>[] {
  return Array.isArray(value) && value.every((folder) =>
    folder && typeof folder.id === "string" &&
    typeof folder.name === "string" &&
    Array.isArray(folder.records) &&
    folder.records.every((record: unknown) =>
      record && typeof (record as StoredRecord).id === "string")
  );
}

function indexOf<T extends StoredRecord>(
  folders: StoredFolder<T>[],
): FolderIndex[] {
  return folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    recordIds: folder.records.map((record) => record.id),
  }));
}

export function loadDecisionFolders<T extends StoredRecord>(
  storage: Storage,
  initialFolders: StoredFolder<T>[],
): { folders: StoredFolder<T>[]; savedIds: Set<string> } {
  const legacyJSON = storage.getItem(LEGACY_RECORDS_KEY);
  const legacy: unknown = legacyJSON ? JSON.parse(legacyJSON) : null;

  if (legacyJSON && !isStoredFolder<T>(legacy)) {
    throw new Error("保存済みデータの形式が正しくありません");
  }

  const baseline = legacyJSON
    ? legacy as StoredFolder<T>[]
    : initialFolders;

  const savedIds = new Set<string>(
    legacyJSON
      ? baseline.flatMap((folder) =>
          folder.records.map((record) => record.id))
      : [],
  );

  const indexJSON = storage.getItem(FOLDER_INDEX_KEY);
  const parsedIndex: unknown = indexJSON
    ? JSON.parse(indexJSON)
    : indexOf(baseline);

  if (!isFolderIndex(parsedIndex)) {
    throw new Error("フォルダー情報の形式が正しくありません");
  }

  const baselineRecords = new Map(
    baseline.flatMap((folder) =>
      folder.records.map((record) => [record.id, record] as const)),
  );

  const folders = parsedIndex.map((folder) => ({
    id: folder.id,
    name: folder.name,
    records: folder.recordIds.flatMap((id) => {
      const recordJSON = storage.getItem(`${RECORD_KEY_PREFIX}${id}`);
      const candidate: unknown = recordJSON
        ? JSON.parse(recordJSON)
        : baselineRecords.get(id);

      if (
        !candidate ||
        typeof candidate !== "object" ||
        (candidate as StoredRecord).id !== id
      ) {
        return [];
      }

      if (recordJSON) savedIds.add(id);
      return [{ ...(candidate as T), category: folder.name }];
    }),
  }));

  return { folders, savedIds };
}

export function saveFolderIndex<T extends StoredRecord>(
  storage: Storage,
  folders: StoredFolder<T>[],
): void {
  storage.setItem(FOLDER_INDEX_KEY, JSON.stringify(indexOf(folders)));
}

export function saveDecisionRecord<T extends StoredRecord>(
  storage: Storage,
  folders: StoredFolder<T>[],
  recordId: string,
): void {
  const record = folders
    .flatMap((folder) => folder.records)
    .find((item) => item.id === recordId);

  if (!record) throw new Error("判断記録が見つかりません");

  storage.setItem(
    `${RECORD_KEY_PREFIX}${recordId}`,
    JSON.stringify(record),
  );
  saveFolderIndex(storage, folders);
}