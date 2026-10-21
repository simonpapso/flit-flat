export const layoutShapes = [
  {id:'rect',label:'Štvorec / obdĺžnik'},
  {id:'l',label:'Tvar L',points:'0,0 45,0 45,55 100,55 100,100 0,100'},
  {id:'t',label:'Tvar T',points:'0,0 100,0 100,35 65,35 65,100 35,100 35,35 0,35'},
  {id:'u',label:'Tvar U',points:'0,0 30,0 30,65 70,65 70,0 100,0 100,100 0,100'},
  {id:'ellipse',label:'Kruh / ovál'},
];
export const shapeOf = item => item.shape || 'rect';
export function shapeClip(shape) {
  if(shape==='ellipse')return 'ellipse(50% 50% at 50% 50%)';
  const points=layoutShapes.find(x=>x.id===shape)?.points;
  return points?'polygon('+points.split(' ').map(p=>p.split(',').map(n=>n+'%').join(' ')).join(',')+')':undefined;
}
