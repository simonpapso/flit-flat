export const presets = [
  {name:'Obývačka',kind:'room',w:40,h:35},
  {name:'Spálňa',kind:'room',w:30,h:30},
  {name:'Kuchyňa',kind:'room',w:25,h:25},
  {name:'Kúpeľňa',kind:'room',w:20,h:20},
  {name:'Chodba',kind:'room',w:15,h:35},
  {name:'Sedačka',kind:'furniture',w:22,h:12},
  {name:'Posteľ',kind:'furniture',w:18,h:24},
  {name:'Stôl',kind:'furniture',w:15,h:12},
  {name:'Skriňa',kind:'furniture',w:18,h:8},
  {name:'Chladnička',kind:'furniture',w:8,h:8},
  {name:'Dvere',kind:'door',w:12,h:12},
];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const round=n=>Math.round(n*10)/10;
export function fitItem(item, patch = {}, grid = 0) {
  const next={...item,...patch};
  const align=n=>round(grid?Math.round(n/grid)*grid:n);
  next.w=clamp(align(Number(next.w)||5),5,patch.w !== undefined && patch.x === undefined ? 100-item.x : 100);
  next.h=clamp(align(Number(next.h)||5),5,patch.h !== undefined && patch.y === undefined ? 100-item.y : 100);
  next.x=clamp(align(Number(next.x)||0),0,round(100-next.w));
  next.y=clamp(align(Number(next.y)||0),0,round(100-next.h));
  return next;
}
export function makeItem(preset, id, count=0) {
  return fitItem({id,kind:preset.kind,name:preset.name,x:10+(count%5)*3,y:10+(count%5)*3,w:preset.w,h:preset.h,shape:preset.kind==='door'?'rect':preset.shape || 'rect',...(preset.kind==='door'?{doorHinge:'left',doorSwing:'in'}:{}),rotation:0,quantity:1,note:''});
}
export function duplicateItem(item,id) {
  return fitItem({...item,id,name:(item.name+' – kópia').slice(0,100)}, {x:item.x+3,y:item.y+3});
}

// Apply one shared delta, clamped against the whole selection to preserve spacing.
export function moveItems(items, ids, dx, dy, grid=0) {
 const selected=items.filter(x=>ids.includes(x.id));if(!selected.length)return items;
 if(grid){dx=Math.round(dx/grid)*grid;dy=Math.round(dy/grid)*grid;}
 const minX=Math.min(...selected.map(x=>x.x)),minY=Math.min(...selected.map(x=>x.y));
 const maxX=Math.max(...selected.map(x=>x.x+x.w)),maxY=Math.max(...selected.map(x=>x.y+x.h));
 dx=clamp(dx,-minX,100-maxX);dy=clamp(dy,-minY,100-maxY);
 return items.map(x=>ids.includes(x.id)?{...x,x:Math.round((x.x+dx)*1000)/1000,y:Math.round((x.y+dy)*1000)/1000}:x);
}
export function setLSide(item,side,value) {
 const next=fitItem(item);
 if(!Number.isFinite(value))return next;
 const ratio=(value,total)=>clamp(value/total*100,5,95);
 if(side===0)next.lWidth=ratio(value,next.w);
 if(side===1)next.lHeight=100-ratio(value,next.h);
 if(side===2)next.lWidth=100-ratio(value,next.w);
 if(side===3)next.lHeight=ratio(value,next.h);
 if(side===4)return fitItem(next,{w:value});
 if(side===5)return fitItem(next,{h:value});
 return next;
}
