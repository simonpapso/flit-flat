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
  return fitItem({id,kind:preset.kind,name:preset.name,x:10+(count%5)*3,y:10+(count%5)*3,w:preset.w,h:preset.h,shape:preset.shape || 'rect',rotation:0,quantity:1,note:''});
}
export function duplicateItem(item,id) {
  return fitItem({...item,id,name:(item.name+' – kópia').slice(0,100)}, {x:item.x+3,y:item.y+3});
}
