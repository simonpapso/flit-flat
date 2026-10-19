import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorage } from './storage-adapter.js';

test('native storage uses Preferences, preserves JSON and awaits writes', async () => {
  let stored = null;
  const native = createStorage(true, {
    async get() { return { value: stored }; },
    async set({ key, value }) {
      assert.equal(key, 'flit-flat-v1');
      await Promise.resolve();
      stored = value;
    },
  }, null);
  assert.equal(await native.getItem('flit-flat-v1'), null);
  const json = JSON.stringify({ name: 'Byt na Ružovej', amount: 48.5 });
  await native.setItem('flit-flat-v1', json);
  assert.equal(await native.getItem('flit-flat-v1'), json);
});

test('browser retains the existing storage key and does not call native APIs', async () => {
  const values = new Map([['flit-flat-v1', 'existing data']]);
  const storage = createStorage(false, null, {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  });
  assert.equal(await storage.getItem('flit-flat-v1'), 'existing data');
  await storage.setItem('flit-flat-v1', 'updated data');
  assert.equal(await storage.getItem('flit-flat-v1'), 'updated data');
});

test('write failures propagate to the UI instead of reporting success', async () => {
  const storage = createStorage(true, {
    async set() { throw new Error('storage full'); },
  }, null);
  await assert.rejects(storage.setItem('flit-flat-v1', '{}'), /storage full/);
});
