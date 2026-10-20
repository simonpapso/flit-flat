import { getCloudBackend } from './cloud-runtime.js';
const DB_NAME = 'flit-flat-files-v1';
let connection;
export function openDatabase() {
  if (!connection) connection = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('files', { keyPath: 'id' });
      request.result.createObjectStore('settings');
    };
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); connection = null; }; resolve(request.result); };
    request.onerror = () => { connection = null; reject(request.error); };
    request.onblocked = () => { connection = null; reject(new Error('Zatvorte ostatné karty aplikácie a skúste znova.')); };
  });
  return connection;
}
export async function readSetting(key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction('settings').objectStore('settings').get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function transaction(stores, work) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, 'readwrite');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Ukladanie bolo prerušené.'));
    try { work(tx); } catch (error) { tx.abort(); reject(error); }
  });
}
export const writeSetting = (key, value) => transaction(['settings', 'files'], tx => {
  tx.objectStore('settings').put(value, key);
  const ids = new Set(JSON.parse(value).properties.map(p => p.id));
  const cursor = tx.objectStore('files').openCursor();
  cursor.onsuccess = () => { const row = cursor.result; if (row) { if (!ids.has(row.value.propertyId)) row.delete(); row.continue(); } };
});
export async function localAllFiles() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction('files').objectStore('files').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
const putLocalFile = file => transaction(['files'], tx => {
  const store = tx.objectStore('files');
  if (file.kind === 'floorplan') {
    const cursor = store.openCursor();
    cursor.onsuccess = () => { const row = cursor.result; if (row) { if (row.value.propertyId === file.propertyId && row.value.kind === 'floorplan' && row.value.id !== file.id) row.delete(); row.continue(); } };
  }
  store.put(file);
});
const removeLocalFile = id => transaction(['files'], tx => tx.objectStore('files').delete(id));
export async function restoreWebData(key, data, files) {
  await transaction(['settings', 'files'], tx => {
    tx.objectStore('settings').put(JSON.stringify(data), key);
    const store = tx.objectStore('files'); store.clear();
    files.forEach(file => store.put(file));
  });
}
export async function replaceFiles(files) {
  await transaction(['files'], tx => { const store = tx.objectStore('files'); store.clear(); files.forEach(f => store.put(f)); });
}
export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const MAX_BACKUP_SIZE = 150 * 1024 * 1024;
export function fileKind(name) {
  const ext = name.split('.').pop().toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? 'image' : ext === 'pdf' ? 'pdf' : ['doc', 'docx', 'xls', 'xlsx', 'txt'].includes(ext) ? 'document' : null;
}
export function fileType(name) {
  return ({ jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', webp:'image/webp', pdf:'application/pdf', txt:'text/plain', doc:'application/msword', docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls:'application/vnd.ms-excel', xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })[name.split('.').pop().toLowerCase()];
}
export async function createAttachment(file, propertyId, kind) {
  const format = fileKind(file.name);
  if (!format || (kind !== 'document' && format !== 'image')) throw new Error('Použite PDF, DOC/DOCX, XLS/XLSX, TXT alebo obrázok JPG, PNG či WebP. Fotky a pôdorys musia byť obrázky.');
  if (!file.size || file.size > MAX_FILE_SIZE) throw new Error('Súbor musí mať viac než 0 bajtov a najviac 20 MB.');
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const valid = format === 'pdf' ? new TextDecoder().decode(bytes).startsWith('%PDF-') : format !== 'image' || (
    fileType(file.name) === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 :
    fileType(file.name) === 'image/png' ? bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 :
    new TextDecoder().decode(bytes.slice(0,4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8,12)) === 'WEBP');
  if (!valid) throw new Error('Obsah súboru nezodpovedá jeho prípone.');
  return { id: crypto.randomUUID(), propertyId, kind, name: file.name, type: fileType(file.name), size: file.size, createdAt: new Date().toISOString(), blob: new Blob([file], { type: fileType(file.name) }) };
}

export const allFiles = () => getCloudBackend() ? getCloudBackend().allFiles() : localAllFiles();
export const putFile = file => getCloudBackend() ? getCloudBackend().putFile(file) : putLocalFile(file);
export const removeFile = id => getCloudBackend() ? getCloudBackend().removeFile(id) : removeLocalFile(id);
