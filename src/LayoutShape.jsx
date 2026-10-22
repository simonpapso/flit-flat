import React from 'react';
import { layoutShapes, lPoints } from './layout-shapes.js';

export default function LayoutShape({shape='rect',item={},showSides=false,fill,stroke='#56704a',...props}) {
  const points=shape==='l'?lPoints(item):layoutShapes.find(x=>x.id===shape)?.points;
  const style={fill,stroke,strokeWidth:2,vectorEffect:'non-scaling-stroke'};
  return <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" {...props}>
    {item.kind==='window'?<g><rect x="2" y="12" width="96" height="76" fill="#e0f2fe" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke"/><path d="M 3 50 H 97 M 50 13 V 87" fill="none" stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke"/></g>:item.kind==='door'?<g transform={`${item.doorHinge==='right'?'translate(100 0) scale(-1 1)':''} ${item.doorSwing==='out'?'translate(0 100) scale(1 -1)':''}`}><path d="M 5 95 L 95 95 M 5 95 L 5 5" fill="none" stroke={stroke} strokeWidth="3" vectorEffect="non-scaling-stroke"/><path d="M 5 5 A 90 90 0 0 1 95 95" fill="none" stroke={stroke} strokeWidth="1" strokeDasharray="4 3" vectorEffect="non-scaling-stroke"/><circle cx="5" cy="95" r="3" fill={stroke}/></g>:shape==='ellipse'?<ellipse cx="50" cy="50" rx="49" ry="49" {...style}/>:points?<polygon points={points} {...style}/>:<rect x="0.5" y="0.5" width="99" height="99" {...style}/>}
    {showSides && shape==='l' && points.split(' ').map((point,i,all)=>{const a=point.split(',').map(Number),b=all[(i+1)%all.length].split(',').map(Number);return <text key={i} x={(a[0]+b[0])/2} y={(a[1]+b[1])/2} dy="3" textAnchor="middle" fontSize="9" fill="#294f3d" stroke="white" strokeWidth="0.8" paintOrder="stroke">{String.fromCharCode(65+i)}</text>;})}
  </svg>;
}
