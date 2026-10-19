import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { createStorage } from './storage-adapter.js';

export const isNative = Capacitor.isNativePlatform();
export const DATA_KEY = 'flit-flat-v1';

export const storage = createStorage(isNative, Preferences, {
  getItem: key => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
});

export async function exportBackup(data, filename) {
  const json = JSON.stringify(data, null, 2);
  if (isNative) {
    const { uri } = await Filesystem.writeFile({
      path: filename, data: json, directory: Directory.Cache, encoding: Encoding.UTF8,
    });
    await Share.share({ title: 'Záloha Flit Flat', files: [uri] });
    // Keep the file in cache: the share extension may still be reading it.
    return;
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
