import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, demoData, validData, validLayout } from './data.js';
import { putFile, allFiles, readSetting, writeSetting, restoreWebData, createAttachment } from './attachments.js';
import { makeBackup, parseBackup } from './backup.js';
import { zipSync, strToU8 } from 'fflate';
const key='flit-flat-v1';
test('cena a inventár sú voliteľné pre staré dáta, nové polia sú validované',()=>{
 const data=demoData();assert.equal(validData(data),true);
 data.properties[0].price=123456;assert.equal(validData(data),true);
 data.properties[0].price=-1;assert.equal(validData(data),false);
 const item={id:'bed',name:'Posteľ',kind:'furniture',x:10,y:10,w:20,h:15,rotation:90,quantity:1,note:'Dobrý stav'};
 assert.equal(validLayout({items:[item]}),true);
 assert.equal(validLayout({items:[{...item,w:200}]}),false);
 assert.equal(validLayout({items:[{...item,quantity:0}]}),false);
});
test('prílohy a kompletná ZIP záloha: obsah, obnova, starý JSON a odstránenie bytu',async()=>{
 const data=demoData();await restoreWebData(key,data,[]);
 const file=await createAttachment(new File(['%PDF-1.4\n test zmluva'], 'zmluva.pdf',{type:'application/pdf'}),'p1','document');
 await putFile(file);assert.equal((await allFiles()).length,1);
 const archive=await makeBackup(data);
 const parsed=await parseBackup(new File([archive],'backup.zip'));
 assert.equal(validData(parsed.data),true);assert.equal(parsed.files.length,1);
 assert.equal(await parsed.files[0].blob.text(),'%PDF-1.4\n test zmluva');
 await restoreWebData(key,emptyData(),[]);assert.equal((await allFiles()).length,0);
 await restoreWebData(key,parsed.data,parsed.files);
 assert.equal((await allFiles())[0].name,'zmluva.pdf');
 assert.equal(JSON.parse(await readSetting(key)).properties.length,2);
 const legacy=await parseBackup(new File([JSON.stringify(data)],'old.json'));
 assert.equal(validData(legacy.data),true);assert.deepEqual(legacy.files,[]);
 await assert.rejects(restoreWebData(key,emptyData(),[{name:'invalid-without-id'}]));
 assert.equal((await allFiles()).length,1,'failed restore leaves existing files untouched');
 assert.equal(JSON.parse(await readSetting(key)).properties.length,2,'failed restore leaves property data untouched');
 await writeSetting(key,JSON.stringify({...data,properties:data.properties.filter(p=>p.id!=='p1')}));
 assert.equal((await allFiles()).length,0,'orphaned documents are deleted with property');
});
test('nebezpečné typy a neplatné prílohy v zálohe sú odmietnuté',async()=>{
 await assert.rejects(createAttachment(new File(['<script>bad()</script>'],'test.html'),'p1','document'));
 await assert.rejects(createAttachment(new File(['not a PDF'],'test.pdf'),'p1','document'));
 await assert.rejects(createAttachment(new File(['%PDF-1.4'],'test.pdf'),'p1','photo'));
 const payload={...demoData(),attachments:[{id:'file1',propertyId:'missing',kind:'document',name:'test.pdf',path:'files/file1',size:8}]};
 const archive=zipSync({'backup.json':strToU8(JSON.stringify(payload)),'files/file1':strToU8('%PDF-1.4')});
 await assert.rejects(parseBackup(new File([archive],'invalid.zip')));
});

test('ZIP backup round trip preserves several tenants, L sides and door opening',async()=>{
 const {withTenants}=await import('./tenants.js');const {presets,makeItem,setLSide}=await import('./layout-tools.js');
 const data=demoData();
 data.properties[0]=withTenants({...data.properties[0],managementServices:[{id:'service',name:'Upratovanie',description:'Spoločné priestory, každý pondelok'}],layout:{items:[setLSide(makeItem({...presets[0],shape:'l'},'l'),2,20),{...makeItem(presets.find(x=>x.kind==='door'),'door'),doorHinge:'right',doorSwing:'out'},makeItem(presets.find(p=>p.kind==='window'),'window')]}},[{id:'one',name:'Anna',phone:'0900',email:'a@example.test',birthYear:1990,job:'Učiteľka'},{id:'two',name:'Peter',phone:'0911',email:'p@example.test',birthYear:null,job:''}]);
 await restoreWebData(key,data,[]);
 const archive=await makeBackup(data),parsed=await parseBackup(new File([archive],'backup.zip'));
 assert.deepEqual(parsed.data,data);assert.deepEqual(parsed.files,[]);
});
