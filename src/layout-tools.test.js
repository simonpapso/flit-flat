import test from 'node:test';
import assert from 'node:assert/strict';
import { fitItem,makeItem,duplicateItem,presets } from './layout-tools.js';
import { validLayout } from './data.js';
test('all presets and copies fit existing layout schema without mutating originals',()=>{
 for(const preset of presets){
  const item=makeItem(preset,'one',4), original=structuredClone(item);
  const copy=duplicateItem(item,'two');
  assert.ok(validLayout({items:[item,copy]}));
  assert.deepEqual(item,original);assert.notEqual(copy.id,item.id);
 }
});
test('movement snaps and remains within canvas at each edge',()=>{
 const item=makeItem(presets[0],'a');
 assert.equal(fitItem(item,{x:13.2,y:17.3},2).x,14);
 assert.equal(fitItem(item,{x:13.2,y:17.3},2).y,18);
 for(const patch of [{x:-50,y:-50},{x:200,y:200},{w:150,h:150},{w:-2,h:-8},{x:95.6,w:8.4},{x:NaN,y:Infinity}]){
  const next=fitItem(item,patch,2);assert.ok(validLayout({items:[next]}),JSON.stringify(next));
 }
});
test('resize and duplicate preserve inventory details and old layout fields',()=>{
 const item={...makeItem(presets[5],'a'),note:'Sériové číslo 123',quantity:3};
 const resized=fitItem(item,{w:35.5,h:22.2});
 assert.equal(resized.note,item.note);assert.equal(resized.quantity,3);
 assert.equal(duplicateItem(item,'b').note,item.note);
 assert.ok(validLayout({items:[resized]}));
 const edge=fitItem(item,{x:100,y:100});
 assert.ok(validLayout({items:[duplicateItem(edge,'c')]}));
});

test('resizing keeps the upper left corner fixed even when snapping against an edge',()=>{
 const item=fitItem(makeItem(presets[0],'a'),{x:57,y:61,w:20,h:20});
 const next=fitItem(item,{w:99,h:99},2);
 assert.equal(next.x,57);assert.equal(next.y,61);
 assert.equal(next.w,43);assert.equal(next.h,39);
 assert.ok(validLayout({items:[next]}));
});

test('non rectangular shapes survive edits, duplication and serialization with legacy compatibility', async()=>{
 const {layoutShapes,shapeOf,shapeClip}=await import('./layout-shapes.js');
 for(const shape of layoutShapes){
  const item=makeItem({...presets[0],shape:shape.id},'room');
  assert.equal(item.shape,shape.id);
  const edited=fitItem(item,{w:35,h:25,rotation:90});
  const copy=duplicateItem(edited,'copy');
  assert.equal(copy.shape,shape.id);
  assert.ok(validLayout(JSON.parse(JSON.stringify({items:[edited,copy]}))));
  if(shape.points)assert.ok(shapeClip(shape.id).startsWith('polygon('));
 }
 const old=makeItem(presets[0],'old');delete old.shape;
 assert.equal(shapeOf(old),'rect');assert.ok(validLayout({items:[old]}));
 assert.ok(!validLayout({items:[{...old,shape:'unsupported'}]}));
});

test('every L side is adjustable and produces a valid closed shape',async()=>{
 const {setLSide}=await import('./layout-tools.js');const {lSides,lPoints,shapeClip}=await import('./layout-shapes.js');
 const base=makeItem({...presets[0],shape:'l'},'l');
 for(let side=0;side<6;side++){
  const before=lSides(base),value=side>=4?before[side]+5:before[side]+2;
  const next=setLSide(base,side,value);
  assert.ok(validLayout({items:[next]}));assert.ok(Math.abs(lSides(next)[side]-value)<0.02);
  const lengths=lSides(next);assert.ok(Math.abs(lengths[0]+lengths[2]-lengths[4])<0.02);assert.ok(Math.abs(lengths[1]+lengths[3]-lengths[5])<0.02);
  assert.ok(lPoints(next).includes(','));assert.ok(shapeClip('l',next).startsWith('polygon('));
 }
 assert.equal(base.lWidth,undefined,'old L shape stays unchanged');
 assert.ok(!validLayout({items:[{...base,lWidth:0}]}));
});
test('group movement preserves relative positions and leaves non-selected items intact',async()=>{
 const {moveItems}=await import('./layout-tools.js');
 const items=[{...makeItem(presets[0],'a'),x:5,y:8,w:20,h:20},{...makeItem(presets[1],'b'),x:45,y:50,w:20,h:25},makeItem(presets[5],'other')];
 const original=structuredClone(items);
 for(const [dx,dy] of [[10,12],[-100,-100],[100,100],[1.3,2.7]]){
  const moved=moveItems(items,['a','b'],dx,dy,2);
  assert.equal(moved[1].x-moved[0].x,40);assert.equal(moved[1].y-moved[0].y,42);
  assert.deepEqual(moved[2],items[2]);assert.ok(validLayout({items:moved}));
 }
 assert.deepEqual(items,original);assert.deepEqual(moveItems(items,[],10,10),items);
});
test('doors preserve hinge, swing and rotation when copied and serialized',()=>{
 const door=makeItem(presets.find(p=>p.kind==='door'),'door');
 for(const doorHinge of ['left','right'])for(const doorSwing of ['in','out'])for(const rotation of [0,90,180,270]){
  const copy=duplicateItem({...door,doorHinge,doorSwing,rotation},'copy');
  assert.equal(copy.doorHinge,doorHinge);assert.equal(copy.doorSwing,doorSwing);assert.equal(copy.rotation,rotation);
  assert.ok(validLayout(JSON.parse(JSON.stringify({items:[copy]}))));
 }
 assert.ok(!validLayout({items:[{...door,doorHinge:'invalid'}]}));
});
