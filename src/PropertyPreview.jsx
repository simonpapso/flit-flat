import React, { useEffect, useState } from 'react';
import FloorplanItems from './FloorplanItems.jsx';

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
    {url && !failed ? <img className={`card-image ${property.cardPreview === 'floorplan' ? 'floorplan' : ''}`} src={url} alt={property.cardPreview === 'floorplan' ? `Pôdorys ${property.name}` : `Fotografia ${property.name}`} onError={() => setFailed(true)}/> : items.length ? <svg className="card-layout" viewBox="0 0 100 100" role="img" aria-label={`Pôdorys ${property.name}`}><FloorplanItems items={items}/></svg> : <><div className="drawing-building"><div/><div/><div/><div/><div/><div/></div><span className="drawing-tree"/></>}
    <span className="occupancy"><span className={property.tenant ? 'green-dot' : 'gray-dot'}/>{property.tenant ? 'Obsadené' : 'Voľné'}</span><span className="property-number">{String(index+1).padStart(2,'0')}</span>
  </div>;
}
