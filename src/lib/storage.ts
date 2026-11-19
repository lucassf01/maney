import { type FinanceData, validateData } from "./finance";
// Preserve the existing database identifier so the rebrand keeps local records.
const DB = "dimdim-local-v1";
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("workspace");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function loadData(): Promise<FinanceData | null> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const r = db
        .transaction("workspace")
        .objectStore("workspace")
        .get("current");
      r.onsuccess = () => {
        try {
          if (r.result) validateData(r.result);
          resolve(r.result ?? null);
        } catch (e) {
          reject(e);
        }
      };
      r.onerror = () => reject(r.error);
    });
  } finally {
    db.close();
  }
}
export async function saveData(data: FinanceData) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("workspace", "readwrite");
      const store = tx.objectStore("workspace");
      const read = store.get("current");
      read.onsuccess = () => {
        if (read.result) store.put(read.result, "previous");
        store.put(data, "current");
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export async function replaceData(data: FinanceData) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("workspace", "readwrite");
      const store = tx.objectStore("workspace");
      store.put(data, "current");
      store.delete("previous");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export async function previousBackup(): Promise<FinanceData | null> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const r = db
        .transaction("workspace")
        .objectStore("workspace")
        .get("previous");
      r.onsuccess = () => resolve(r.result ?? null);
      r.onerror = () => reject(r.error);
    });
  } finally {
    db.close();
  }
}
export function download(name: string, contents: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const backup = (data: FinanceData) =>
  download(
    `maney-backup-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(data, null, 2),
    "application/json",
  );
