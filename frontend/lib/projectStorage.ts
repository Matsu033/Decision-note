import {
  loadDecisionFolders,
  saveDecisionRecord,
  saveFolderIndex,
  type StoredFolder,
  type StoredRecord,
} from "./decisionStorage";

export const DEFAULT_PROJECT_ID = "default";
export const DEFAULT_PROJECT_NAME = "Decision Note";
const PROJECTS_KEY = "decision-note-projects-v1";
const ACTIVE_PROJECT_KEY = "decision-note-active-project-v1";
const PROJECT_PREFIX = "decision-note-project-v1:";

export type ProjectInfo = { id: string; name: string };

function projectKey(projectId: string) {
  return `${PROJECT_PREFIX}${projectId}`;
}

export function loadProjects(storage: Storage): ProjectInfo[] {
  const json = storage.getItem(PROJECTS_KEY);
  if (!json) return [{ id: DEFAULT_PROJECT_ID, name: DEFAULT_PROJECT_NAME }];
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed) || !parsed.every((item) =>
    item && typeof item.id === "string" && typeof item.name === "string")) {
    throw new Error("プロジェクト一覧の形式が正しくありません");
  }
  return [
    { id: DEFAULT_PROJECT_ID, name: DEFAULT_PROJECT_NAME },
    ...parsed.filter((item: ProjectInfo) => item.id !== DEFAULT_PROJECT_ID),
  ];
}

export function loadActiveProjectId(storage: Storage): string {
  return storage.getItem(ACTIVE_PROJECT_KEY) ?? DEFAULT_PROJECT_ID;
}

export function setActiveProjectId(storage: Storage, id: string): void {
  storage.setItem(ACTIVE_PROJECT_KEY, id);
}

export function createLocalProject<T extends StoredRecord>(
  storage: Storage, name: string, initialFolders: StoredFolder<T>[],
): ProjectInfo {
  const projects = loadProjects(storage);
  const project = { id: crypto.randomUUID(), name: name.trim() };
  if (!project.name) throw new Error("プロジェクト名を入力してください");
  storage.setItem(projectKey(project.id), JSON.stringify(initialFolders));
  storage.setItem(PROJECTS_KEY, JSON.stringify([...projects, project]));
  return project;
}

export function loadProjectFolders<T extends StoredRecord>(
  storage: Storage,
  projectId: string,
  initialFolders: StoredFolder<T>[],
): { folders: StoredFolder<T>[]; savedIds: Set<string> } {
  if (projectId === DEFAULT_PROJECT_ID) {
    return loadDecisionFolders(storage, initialFolders);
  }
  const json = storage.getItem(projectKey(projectId));
  if (!json) throw new Error("プロジェクトが見つかりません");
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed) || !parsed.every((folder) =>
    folder && typeof folder.id === "string" &&
    typeof folder.name === "string" && Array.isArray(folder.records) &&
    folder.records.every((record: StoredRecord) => record && typeof record.id === "string"))) {
    throw new Error("プロジェクトのデータ形式が正しくありません");
  }
  const folders = parsed as StoredFolder<T>[];
  return {
    folders,
    savedIds: new Set(folders.flatMap((folder) => folder.records.map((record) => record.id))),
  };
}

export function saveProjectRecord<T extends StoredRecord>(
  storage: Storage, projectId: string, folders: StoredFolder<T>[], recordId: string,
): void {
  if (projectId === DEFAULT_PROJECT_ID) {
    saveDecisionRecord(storage, folders, recordId);
    return;
  }
  const record = folders.flatMap((folder) => folder.records).find((item) => item.id === recordId);
  if (!record) throw new Error("判断記録が見つかりません");
  const saved = loadProjectFolders<T>(storage, projectId, []).folders;
  const updated = saved.map((folder) => ({
    ...folder,
    records: folder.records.map((item) => item.id === recordId ? record : item),
  }));
  // The folder index may have changed since the last save.
  const byId = new Map(updated.flatMap((folder) => folder.records.map((item) => [item.id, item] as const)));
  byId.set(recordId, record);
  storage.setItem(projectKey(projectId), JSON.stringify(folders.map((folder) => ({
    ...folder,
    records: folder.records.map((item) => byId.get(item.id) ?? item),
  }))));
}

export function saveProjectFolderIndex<T extends StoredRecord>(
  storage: Storage, projectId: string, folders: StoredFolder<T>[],
): void {
  if (projectId === DEFAULT_PROJECT_ID) {
    saveFolderIndex(storage, folders);
    return;
  }
  const saved = loadProjectFolders<T>(storage, projectId, []).folders;
  const records = new Map(saved.flatMap((folder) => folder.records.map((record) => [record.id, record] as const)));
  storage.setItem(projectKey(projectId), JSON.stringify(folders.map((folder) => ({
    ...folder,
    records: folder.records.map((record) => ({ ...(records.get(record.id) ?? record), category: folder.name })),
  }))));
}

export function saveAllProjectRecords<T extends StoredRecord>(
  storage: Storage, projectId: string, folders: StoredFolder<T>[], ids: ReadonlySet<string>,
): void {
  if (projectId === DEFAULT_PROJECT_ID) {
    for (const id of ids) saveDecisionRecord(storage, folders, id);
    return;
  }
  const saved = loadProjectFolders<T>(storage, projectId, []).folders;
  const records = new Map(saved.flatMap((folder) => folder.records.map((record) => [record.id, record] as const)));
  for (const record of folders.flatMap((folder) => folder.records)) {
    if (ids.has(record.id)) records.set(record.id, record);
  }
  storage.setItem(projectKey(projectId), JSON.stringify(folders.map((folder) => ({
    ...folder,
    records: folder.records.map((record) => records.get(record.id) ?? record),
  }))));
}
