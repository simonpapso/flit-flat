import React, { useEffect, useState } from 'react';

export default function PropertyPreview({ property, files, index }) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  const file = files.find(f => f.propertyId === property.id && (property.cardPreview === 'floorplan' ? f.kind === 'floorplan' : property.cardPreview === `photo:${f.id}` && f.kind === 'photo'));
  useEffect(() => {
    setFailed(false);
    if (!file?.blob) { setUrl(''); return; }
    const next = URL.createObjectURL(file.blob); setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file?.blob]);
  const items = property.cardPreview === 'floorplan' ? property.layout?.items || [] : [];
  return <div className={`property-illustration variant-${index % 2}`}>
    {url && !failed ? <img className={`card-image ${property.cardPreview === 'floorplan' ? 'floorplan' : ''}`} src={url} alt={property.cardPreview === 'floorplan' ? `Pôdorys ${property.name}` : `Fotografia ${property.name}`} onError={() => setFailed(true)}/> : items.length ? <svg className="card-layout" viewBox="0 0 100 100" role="img" aria-label={`Pôdorys ${property.name}`}>{[...items].sort((a,b)=>(a.kind==='room'?0:1)-(b.kind==='room'?0:1)).map(x=><g key={x.id} transform={`rotate(${x.rotation} ${x.x+x.w/2} ${x.y+x.h/2})`}><rect x={x.x} y={x.y} width={x.w} height={x.h} fill={x.kind==='room'?'#eef2e5':'#b9c9ab'} stroke="#56704a" strokeWidth="0.5"/><text x={x.x+1} y={x.y+4} fontSize="3">{x.name}</text></g>)}</svg> : <><div className="drawing-building"><div/><div/><div/><div/><div/><div/></div><span className="drawing-tree"/></>}
    <span className="occupancy"><span className={property.tenant ? 'green-dot' : 'gray-dot'}/>{property.tenant ? 'Obsadené' : 'Voľné'}</span><span className="property-number">{String(index+1).padStart(2,'0')}</span>
  </div>;
}
