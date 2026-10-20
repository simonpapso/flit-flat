import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const A='11111111-1111-4111-8111-111111111111';const B='22222222-2222-4222-8222-222222222222';
test('PostgreSQL: migration, private RLS, account binding and optimistic concurrency',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
   create table auth.users(id uuid primary key);insert into auth.users values('${A}'),('${B}');
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema public,auth,storage to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);
   create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
   alter table storage.objects enable row level security;
   grant select,insert,delete on storage.objects to authenticated;
   create function storage.foldername(text) returns text[] language sql immutable as $$select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1]$$;`);
  const sql=await readFile(new URL('../supabase/setup.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);
  const payload=JSON.stringify({version:1,properties:[],payments:[]});
  const save=(revision,user=A,files='[]')=>db.query('select public.flit_save_workspace($1,$2::jsonb,$3::jsonb,$4::uuid) as revision',[revision,payload,files,user]);
  await db.exec(`set role authenticated;set request.jwt.claim.sub='${A}';`);
  assert.equal((await save(0)).rows[0].revision,1);
  await assert.rejects(save(0),/WORKSPACE_CONFLICT/);
  await assert.rejects(save(1,B),/ACCOUNT_CHANGED/);
  await assert.rejects(save(1,A,JSON.stringify([{propertyId:'missing',path:`${B}/00000000-0000-4000-8000-000000000000`}])) ,/INVALID_FILES/);
  await assert.rejects(db.exec(`update public.flit_workspaces set data='{}';`),/permission denied/);
  await db.exec(`insert into storage.objects(bucket_id,name)values('flit-private','${A}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');`);
  assert.equal((await db.query('select * from public.flit_workspaces')).rows.length,1);
  await db.exec(`set request.jwt.claim.sub='${B}';`);
  assert.equal((await db.query('select * from public.flit_workspaces')).rows.length,0);
  assert.equal((await db.query('select * from storage.objects')).rows.length,0);
  await assert.rejects(db.exec(`insert into storage.objects(bucket_id,name)values('flit-private','${A}/bad');`),/row-level security/);
  await db.exec(`delete from storage.objects where name like '${A}/%';reset role;`);
  assert.equal((await db.query('select * from storage.objects')).rows.length,1);
  await db.exec('set role anon;');await assert.rejects(save(0),/permission denied/);
 } finally {await db.close();}
});
