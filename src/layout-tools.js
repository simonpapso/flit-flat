export const roomColors = ['#edf2e6', '#dbeafe', '#fce7f3', '#fef3c7', '#e0e7ff', '#ccfbf1', '#ffedd5', '#e9d5ff'];
export const itemFill = item => item.kind === 'room' ? `${/^#[0-9a-f]{6}$/i.test(item.color) ? item.color : roomColors[0]}cc` : '#bacbad';

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
  {name:'Okno',kind:'window',w:16,h:3},
];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const round=n=>Math.round(n*10)/10;
export function fitItem(item, patch = {}, grid = 0) {
  const next={...item,...patch};
  const align=n=>round(grid?Math.round(n/grid)*grid:n);
  next.w=clamp(align(Number(next.w)||1),1,patch.w !== undefined && patch.x === undefined ? 100-item.x : 100);
  next.h=clamp(align(Number(next.h)||1),1,patch.h !== undefined && patch.y === undefined ? 100-item.y : 100);
  next.x=clamp((patch.x === undefined ? round : align)(Number(next.x)||0),0,round(100-next.w));
  next.y=clamp((patch.y === undefined ? round : align)(Number(next.y)||0),0,round(100-next.h));
  return next;
}
export function makeItem(preset, id, count=0) {
  return fitItem({id,kind:preset.kind,name:preset.name,x:10+(count%5)*3,y:10+(count%5)*3,w:preset.w,h:preset.h,shape:['door','window'].includes(preset.kind)?'rect':preset.shape || 'rect',...(preset.kind==='door'?{doorHinge:'left',doorSwing:'in'}:{}),...(preset.kind==='room'?{color:roomColors[count%roomColors.length]}:{}),rotation:0,quantity:1,note:''});
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

// Use visual bounds for quarter-turned elements too.
function bounds(item) {
 const turned=item.rotation===90||item.rotation===270;
 const w=turned?item.h:item.w,h=turned?item.w:item.h;
 return {x:item.x+(item.w-w)/2,y:item.y+(item.h-h)/2,w,h};
}
export function snapItems(items, ids, dx, dy, {grid=0, objects=true, threshold=1, resize=false}={}) {
 const selected=items.filter(x=>ids.includes(x.id));
 if(!selected.length)return {items,guides:[]};
 const anchor=selected[0];
 const moved=resize ? items.map(x=>x.id===anchor.id?fitItem(x,{w:x.w+dx,h:x.h+dy},grid):x) : moveItems(items,ids,dx,dy,grid);
 if(!objects)return {items:moved,guides:[]};
 const moving=moved.filter(x=>ids.includes(x.id)).map(bounds);
 const left=Math.min(...moving.map(x=>x.x)),right=Math.max(...moving.map(x=>x.x+x.w));
 const top=Math.min(...moving.map(x=>x.y)),bottom=Math.max(...moving.map(x=>x.y+x.h));
 const others=items.filter(x=>!ids.includes(x.id)).map(bounds);
 const targets={x:[0,100,...others.flatMap(x=>[x.x,x.x+x.w/2,x.x+x.w])],y:[0,100,...others.flatMap(x=>[x.y,x.y+x.h/2,x.y+x.h])]};
 const edges={x:resize?[right]:[left,(left+right)/2,right],y:resize?[bottom]:[top,(top+bottom)/2,bottom]};
 const best=axis=>{let match=null;for(const target of targets[axis])for(const edge of edges[axis]){const delta=target-edge;if(Math.abs(delta)<=threshold&&(!match||Math.abs(delta)<Math.abs(match.delta)))match={delta,target};}return match;};
 const sx=best('x'),sy=best('y');
 const result=resize ? moved.map(x=>x.id===anchor.id?fitItem(x,{w:x.w+(sx?.delta||0),h:x.h+(sy?.delta||0)}):x) : moveItems(moved,ids,sx?.delta||0,sy?.delta||0);
 // Only show guides that were actually reached after boundary clamping.
 const actual=result.filter(x=>ids.includes(x.id)).map(bounds);
 const actualEdges={x:resize?[actual[0].x+actual[0].w]:[Math.min(...actual.map(x=>x.x)),(Math.min(...actual.map(x=>x.x))+Math.max(...actual.map(x=>x.x+x.w)))/2,Math.max(...actual.map(x=>x.x+x.w))],y:resize?[actual[0].y+actual[0].h]:[Math.min(...actual.map(x=>x.y)),(Math.min(...actual.map(x=>x.y))+Math.max(...actual.map(x=>x.y+x.h)))/2,Math.max(...actual.map(x=>x.y+x.h))]};
 return {items:result,guides:[['x',sx],['y',sy]].filter(([axis,m])=>m&&actualEdges[axis].some(v=>Math.abs(v-m.target)<0.06)).map(([axis,m])=>({axis,value:m.target}))};
}

export function drawItem(preset,id,start,end,count=0,grid=0) {
 const align=n=>clamp(grid?Math.round(n/grid)*grid:n,0,100);
 const x1=align(start.x),y1=align(start.y),x2=align(end.x),y2=align(end.y);
 return fitItem(makeItem(preset,id,count),{x:Math.min(x1,x2,99),y:Math.min(y1,y2,99),w:Math.max(1,Math.abs(x2-x1)),h:Math.max(1,Math.abs(y2-y1))});
}


export const itemKindLabel = kind => ({room:'Miestnosť',furniture:'Nábytok',door:'Dvere',window:'Okno'})[kind];
export const itemLayer = item => item.kind === 'room' ? 0 : item.kind === 'furniture' ? 1 : 2;

// Position the label in the solid part of a shape, then rotate its anchor only.
// Text itself stays horizontal in the editor and both saved previews.
export function labelGeometry(item) {
 const shape=item.shape || 'rect';
 const localX=50, localY=shape==='l'||shape==='u'?82:shape==='t'?20:50;
 const angle=(item.rotation||0)*Math.PI/180;
 const dx=(localX/100-0.5)*item.w,dy=(localY/100-0.5)*item.h;
 const turned=item.rotation===90||item.rotation===270;
 return {localX,localY,x:item.x+item.w/2+dx*Math.cos(angle)-dy*Math.sin(angle),y:item.y+item.h/2+dx*Math.sin(angle)+dy*Math.cos(angle),width:turned?item.h:item.w};
}
