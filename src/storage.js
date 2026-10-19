import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { createStorage } from './storage-adapter.js';
import { readSetting, writeSetting, restoreWebData, allFiles, replaceFiles } from './attachments.js';
import { makeBackup } from './backup.js';

export const isNative = Capacitor.isNativePlatform();
export const DATA_KEY = 'flit-flat-v1';

export const storage = createStorage(isNative, Preferences, {
  getItem: async key => (await readSetting(key)) ?? localStorage.getItem(key),
  setItem: async (key, value) => {
    await writeSetting(key, value);
    try { localStorage.removeItem(key); } catch { /* Database is already committed. */ }
  },
});

export async function exportBackup(data, filename) {
  const bytes = await makeBackup(data);
  filename = filename.replace(/\.json$/, '.zip');
  if (isNative) {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(new Blob([bytes]));
    });
    const { uri } = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
    await Share.share({ title: 'Záloha Flit Flat', files: [uri] });
    return;
  }
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/zip' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function restoreBackupData(data, files) {
  if (!isNative) {
    await restoreWebData(DATA_KEY, data, files);
    try { localStorage.removeItem(DATA_KEY); } catch { /* Database is already committed. */ }
    return;
  }
  const oldFiles = await allFiles();
  try { await replaceFiles(files); await storage.setItem(DATA_KEY, JSON.stringify(data)); }
  catch (error) { await replaceFiles(oldFiles); throw error; }
}
