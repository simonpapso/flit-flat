import { emptyData, validData } from './data.js';
const BUCKET = 'flit-private';
export function cloudError(error) {
  const message = error?.message || '';
  let text = 'Cloudová operácia nebola potvrdená. Skontrolujte internet a pred opakovaním načítajte aktuálne údaje z cloudu.';
  if (message.includes('WORKSPACE_CONFLICT')) text = 'Údaje sa zmenili na inom zariadení. Zrušte úpravu a načítajte aktuálne údaje z cloudu.';
  else if (message.includes('ACCOUNT_CHANGED') || message.includes('AUTH_REQUIRED')) text = 'Prihlásenie sa zmenilo. Obnovte stránku a prihláste sa znova.';
  else if (['42P01','PGRST202','PGRST205'].includes(error?.code)) text = 'Databáza ešte nie je pripravená. V Supabase SQL Editore spustite súbor supabase/setup.sql.';
  const result = new Error(text);
  // A lost response may follow a successful commit. Never delete newly uploaded
  // files unless the server explicitly confirmed that the transaction failed.
  result.safeToClean = ['P0001','23503','23505','23514','42501','42P01','PGRST202','PGRST205'].includes(error?.code);
  return result;
}

export function createCloudBackend(client, user) {
  let snapshot = { data: emptyData(), files: [], revision: 0 };
  let busy = false;
  const blobs = new Map();
  const check = result => { if (result.error) throw cloudError(result.error); return result.data; };
  const assertAccount = async () => {
    const { data, error } = await client.auth.getSession();
    if (error || data.session?.user.id !== user.id) throw new Error('Prihlásenie sa zmenilo. Obnovte stránku.');
  };
  const locked = async work => {
    if (busy) throw new Error('Práve prebieha ukladanie. Počkajte na jeho dokončenie.');
    busy = true;
    try { await assertAccount(); return await work(); } finally { busy = false; }
  };
  const commit = async (data, files) => {
    if (!validData(data)) throw new Error('Neplatné údaje; cloud nebol zmenený.');
    const revision = check(await client.rpc('flit_save_workspace', {
      expected_revision: snapshot.revision, workspace_data: data, workspace_files: files, expected_user_id: user.id,
    }));
    if (!Number.isSafeInteger(Number(revision)) || Number(revision) <= snapshot.revision) throw new Error('Server nepotvrdil uloženie. Načítajte aktuálne údaje.');
    snapshot = { data, files, revision: Number(revision) };
  };
  const clean = async files => {
    if (!files.length) return;
    // Failure here leaves only private, unreachable old objects; never undo a committed snapshot.
    try { await client.storage.from(BUCKET).remove(files.map(f => f.path)); } catch { /* May be cleaned up later. */ }
    files.forEach(f => blobs.delete(f.path));
  };
  const upload = async file => {
    if (!(file.blob instanceof Blob) || file.blob.size > 20*1024*1024 || !file.blob.size) throw new Error('Neplatný súbor alebo veľkosť nad 20 MB.');
    const path = `${user.id}/${crypto.randomUUID()}`;
    check(await client.storage.from(BUCKET).upload(path, file.blob, { contentType: file.type, upsert: false }));
    const { blob, ...meta } = file;
    return { ...meta, path };
  };
  return {
    user,
    get busy() { return busy; },
    get revision() { return snapshot.revision; },
    get data() { return snapshot.data; },
    async load() {
      return locked(async () => {
        const row = check(await client.from('flit_workspaces').select('data,files,revision').eq('user_id', user.id).maybeSingle());
        if (!row) { snapshot = {data: emptyData(), files: [], revision: 0}; return snapshot.data; }
        if (!validData(row.data) || !Array.isArray(row.files) || !Number.isSafeInteger(Number(row.revision))
          || row.files.some(f => typeof f.id !== 'string' || typeof f.path !== 'string' || !f.path.startsWith(`${user.id}/`) || !row.data.properties.some(p => p.id === f.propertyId))) throw new Error('Údaje v cloude nie sú platné. Obnovu riešte zo zálohy; neboli prepísané.');
        snapshot = { data: row.data, files: row.files, revision: Number(row.revision) };
        blobs.clear(); return snapshot.data;
      });
    },
    async write(data) {
      return locked(async () => {
        const files = snapshot.files.filter(f => data.properties.some(p => p.id === f.propertyId));
        const removed = snapshot.files.filter(f => !files.includes(f));
        await commit(data, files); await clean(removed);
      });
    },
    async allFiles() {
      await assertAccount();
      const files = [...snapshot.files];
      const result = [];
      for (const f of files) {
        if (!blobs.has(f.path)) blobs.set(f.path, check(await client.storage.from(BUCKET).download(f.path)));
        result.push({ ...f, blob: blobs.get(f.path) });
      }
      return result;
    },
    async putFile(file) {
      return locked(async () => {
        if (!snapshot.data.properties.some(p => p.id === file.propertyId)) throw new Error('Nehnuteľnosť už nie je v cloude. Načítajte aktuálne údaje.');
        const uploaded = await upload(file);
        const removed = snapshot.files.filter(f => f.id === file.id || file.kind === 'floorplan' && f.kind === 'floorplan' && f.propertyId === file.propertyId);
        try { await commit(snapshot.data, [...snapshot.files.filter(f => !removed.includes(f)), uploaded]); }
        catch (error) { if (error.safeToClean) await clean([uploaded]); throw error; }
        blobs.set(uploaded.path, file.blob); await clean(removed);
      });
    },
    async removeFile(id) {
      return locked(async () => {
        const removed = snapshot.files.filter(f => f.id === id);
        await commit(snapshot.data, snapshot.files.filter(f => f.id !== id)); await clean(removed);
      });
    },
    async restore(data, files) {
      return locked(async () => {
        const uploaded = []; let committing = false;
        try {
          for (const f of files) uploaded.push(await upload(f));
          const removed = snapshot.files;
          committing = true; await commit(data, uploaded);
          await clean(removed);
        } catch (error) { if (!committing || error.safeToClean) await clean(uploaded); throw error; }
      });
    },
  };
}
