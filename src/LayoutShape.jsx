import React from 'react';
import { layoutShapes } from './layout-shapes.js';

export default function LayoutShape({shape='rect',fill,stroke='#56704a',...props}) {
  const points=layoutShapes.find(x=>x.id===shape)?.points;
  const style={fill,stroke,strokeWidth:2,vectorEffect:'non-scaling-stroke'};
  return <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" {...props}>
    {shape==='ellipse'?<ellipse cx="50" cy="50" rx="49" ry="49" {...style}/>:points?<polygon points={points} {...style}/>:<rect x="0.5" y="0.5" width="99" height="99" {...style}/>}
  </svg>;
}
