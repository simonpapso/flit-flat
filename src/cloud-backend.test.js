import test from 'node:test';import assert from 'node:assert/strict';
import { createCloudBackend } from './cloud-backend.js';
import { demoData, emptyData } from './data.js';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
function server(){return {rows:new Map(),objects:new Map(),failure:null};}
function client(db,id=A){return {
 auth:{getSession:async()=>({data:{session:{user:{id}}}})},
 from:()=>({select:()=>({eq:(_,owner)=>({maybeSingle:async()=>({data:owner===id?structuredClone(db.rows.get(id)||null):null,error:null})})})}),
 rpc:async(_,args)=>{
  if(db.failure){const error=db.failure;db.failure=null;return {data:null,error};}
  if(args.expected_user_id!==id)return{error:{code:'P0001',message:'ACCOUNT_CHANGED'}};
  const row=db.rows.get(id);if((row?.revision||0)!==args.expected_revision)return{error:{code:'P0001',message:'WORKSPACE_CONFLICT'}};
  const revision=(row?.revision||0)+1;db.rows.set(id,structuredClone({data:args.workspace_data,files:args.workspace_files,revision}));return{data:revision,error:null};
 },
 storage:{from:()=>({
  upload:async(path,blob)=>{if(!path.startsWith(id+'/'))return{error:{message:'denied'}};db.objects.set(path,blob);return{data:{path},error:null};},
  download:async path=>({data:db.objects.get(path),error:db.objects.has(path)?null:{message:'missing'}}),
  remove:async paths=>{paths.forEach(p=>{if(p.startsWith(id+'/'))db.objects.delete(p);});return{data:[],error:null};}
 })}
};}
test('cloud changes and files are visible on another device and isolated by account',async()=>{
 const db=server(),one=createCloudBackend(client(db),{id:A}),two=createCloudBackend(client(db),{id:A});await one.load();await one.write(demoData());await two.load();assert.deepEqual(two.data,one.data);
 const file={id:'file1',propertyId:'p1',kind:'document',name:'contract.pdf',size:8,type:'application/pdf',createdAt:'2026-10-20',blob:new Blob(['%PDF-1.4'])};
 await one.putFile(file);await two.load();assert.equal(await(await two.allFiles())[0].blob.text(),'%PDF-1.4');
 const other=createCloudBackend(client(db,B),{id:B});await other.load();assert.deepEqual(other.data,emptyData());assert.deepEqual(await other.allFiles(),[]);
 await one.removeFile('file1');assert.equal(db.objects.size,0);await two.load();assert.deepEqual(await two.allFiles(),[]);
});
test('stale devices cannot overwrite changes; failed file commits preserve old manifest',async()=>{
 const db=server(),one=createCloudBackend(client(db),{id:A}),stale=createCloudBackend(client(db),{id:A});await one.load();await stale.load();await one.write(demoData());await assert.rejects(stale.write(emptyData()),/inom zariadení/);assert.equal(db.rows.get(A).data.properties.length,2);
 await stale.load();await one.write({...one.data,properties:one.data.properties.map(p=>({...p,rent:p.rent+1}))});
 await assert.rejects(stale.putFile({id:'f',propertyId:'p1',name:'f.pdf',kind:'document',type:'application/pdf',size:8,blob:new Blob(['%PDF-1.4'])}),/inom zariadení/);
 assert.equal(db.objects.size,0);assert.equal(db.rows.get(A).files.length,0);
});
test('lost commit response does not trigger deletion of uploaded files',async()=>{
 const db=server(),one=createCloudBackend(client(db),{id:A});await one.load();await one.write(demoData());db.failure={message:'network failure'};
 await assert.rejects(one.putFile({id:'f',propertyId:'p1',name:'f.pdf',kind:'document',type:'application/pdf',size:8,blob:new Blob(['%PDF-1.4'])}),/nebola potvrdená/);
 assert.equal(db.objects.size,1,'retain object because server commit outcome is unknown');assert.equal(one.data.properties.length,2);
});

test('rent receipts and card preview survive cloud reload without changing files or other data',async()=>{
 const {toggleRentReceived}=await import('./data.js');
 const db=server(),one=createCloudBackend(client(db),{id:A}),two=createCloudBackend(client(db),{id:A});
 await one.load();const original=demoData();await one.write(original);
 const file={id:'photo1',propertyId:'p1',kind:'photo',name:'flat.png',size:5,type:'image/png',blob:new Blob(['image'])};
 await one.putFile(file);
 const next={...one.data,properties:one.data.properties.map(p=>p.id==='p1'?{...toggleRentReceived(p,'2026-10'),cardPreview:'photo:photo1'}:p)};
 await one.write(next);await two.load();
 assert.deepEqual(two.data,next);assert.deepEqual(two.data.payments,original.payments);
 assert.deepEqual(two.data.properties[1],original.properties[1]);
 assert.equal(await(await two.allFiles())[0].blob.text(),'image');
 await two.write({...two.data,properties:two.data.properties.map(p=>p.id==='p1'?toggleRentReceived(p,'2026-10'):p)});
 await one.load();assert.deepEqual(one.data.properties[0].rentReceivedMonths,[]);
 assert.equal(one.data.properties[0].cardPreview,'photo:photo1');
});

test('multiple tenants, adjustable L and doors survive cloud reload with account isolation',async()=>{
 const {withTenants}=await import('./tenants.js');const {makeItem,presets,setLSide}=await import('./layout-tools.js');
 const db=server(),one=createCloudBackend(client(db),{id:A}),two=createCloudBackend(client(db),{id:A});await one.load();
 const data=demoData();const room=setLSide(makeItem({...presets[0],shape:'l'},'room'),0,12);
 const door={...makeItem(presets.find(p=>p.kind==='door'),'door'),doorHinge:'right',doorSwing:'out'};
 data.properties[0]=withTenants({...data.properties[0],layout:{items:[room,door,{...makeItem(presets.find(p=>p.kind==='window'),'window'),rotation:90}]}},[{id:'a',name:'Anna',phone:'0900',email:'a@example.test',birthYear:1990,job:'Práca'},{id:'b',name:'Peter',phone:'0911',email:'p@example.test',birthYear:1988,job:'Technik'}]);
 await one.write(data);await two.load();assert.deepEqual(two.data,data);
 const other=createCloudBackend(client(db,B),{id:B});await other.load();assert.deepEqual(other.data,emptyData());
});
