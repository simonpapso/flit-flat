// Separate platform selection from persistence so both paths can be tested.
export function createStorage(native, preferences, browserStorage) {
  return native ? {
    async getItem(key) { return (await preferences.get({ key })).value; },
    async setItem(key, value) { await preferences.set({ key, value }); },
  } : {
    async getItem(key) { return browserStorage.getItem(key); },
    async setItem(key, value) { browserStorage.setItem(key, value); },
  };
}
