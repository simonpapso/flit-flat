import React from 'react';
import LayoutShape from './LayoutShape.jsx';
import { itemFill, itemLayer, labelGeometry } from './layout-tools.js';
import { shapeOf } from './layout-shapes.js';

export default function FloorplanItems({items}) {
  return <>
    {[...items].sort((a,b)=>itemLayer(a)-itemLayer(b)).map(item=><g key={item.id} transform={`rotate(${item.rotation} ${item.x+item.w/2} ${item.y+item.h/2})`}>
      <title>{item.name}</title>
      <LayoutShape item={item} shape={shapeOf(item)} x={item.x} y={item.y} width={item.w} height={item.h} fill={itemFill(item)} stroke="#56704a"/>
    </g>)}
    {items.filter(item=>item.kind==='room'||item.kind==='furniture').map(item=>{
      const label=labelGeometry(item);
      return <text key={item.id} x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fontSize="2.4" fill="#294f3d" stroke="#ffffffe6" strokeWidth="0.5" paintOrder="stroke">{item.name}</text>;
    })}
  </>;
}
