import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { validData } from './data.js';
import { allFiles, MAX_BACKUP_SIZE, MAX_FILE_SIZE, fileKind, fileType } from './attachments.js';
export async function makeBackup(data) {
  const files = (await allFiles()).filter(f => data.properties.some(p => p.id === f.propertyId));
  if (files.reduce((s, f) => s + f.size, 0) > MAX_BACKUP_SIZE - 5 * 1024 * 1024) throw new Error('Záloha presahuje 150 MB. Časť súborov si stiahnite samostatne.');
  const entries = {};
  const attachments = [];
  for (const file of files) {
    const path = `files/${file.id}`;
    entries[path] = [new Uint8Array(await file.blob.arrayBuffer()), { level: 0 }];
    const { blob, ...meta } = file;
    attachments.push({ ...meta, path });
  }
  entries['backup.json'] = strToU8(JSON.stringify({ ...data, attachments }));
  return zipSync(entries);
}
export async function parseBackup(file) {
  if (file.size > MAX_BACKUP_SIZE) throw new Error('Maximálna veľkosť zálohy je 150 MB.');
  if (!file.name.toLowerCase().endsWith('.zip')) {
    if (file.size > 5 * 1024 * 1024) throw new Error('JSON záloha môže mať najviac 5 MB.');
    const data = JSON.parse(await file.text());
    if (!validData(data)) throw new Error('Neplatná záloha.');
    return { data, files: [] };
  }
  let expanded = 0; let tooLarge = false;
  const entries = unzipSync(new Uint8Array(await file.arrayBuffer()), { filter: entry => {
    expanded += entry.originalSize;
    if (entry.originalSize > MAX_FILE_SIZE || expanded > MAX_BACKUP_SIZE) tooLarge = true;
    return !tooLarge;
  }});
  if (tooLarge || !entries['backup.json']) throw new Error('Neplatná alebo príliš veľká ZIP záloha.');
  const { attachments, ...data } = JSON.parse(strFromU8(entries['backup.json']));
  if (!validData(data) || !Array.isArray(attachments) || new Set(attachments.map(f => f.id)).size !== attachments.length) throw new Error('Neplatná záloha.');
  const files = attachments.map(f => {
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(f.id) || f.path !== `files/${f.id}` || !data.properties.some(p => p.id === f.propertyId) || !['photo','floorplan','document'].includes(f.kind) || typeof f.name !== 'string' || !fileKind(f.name) || (f.kind !== 'document' && fileKind(f.name) !== 'image') || !entries[f.path] || entries[f.path].length !== f.size || f.size <= 0 || f.size > MAX_FILE_SIZE) throw new Error('Neplatná príloha v zálohe.');
    return { id:f.id, propertyId:f.propertyId, kind:f.kind, name:f.name, size:f.size, createdAt: typeof f.createdAt === 'string' ? f.createdAt : '', type:fileType(f.name), blob:new Blob([entries[f.path]], {type:fileType(f.name)}) };
  });
  return { data, files };
}
