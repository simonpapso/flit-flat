import React from 'react';
import { Pencil, Upload, Plus } from 'lucide-react';
import { itemFill } from './layout-tools.js';
import LayoutShape from './LayoutShape.jsx';
import { shapeOf } from './layout-shapes.js';

export default function FloorplanOverview({items, floorUrl, hasFloor, ready, busy, editing, name, onEdit, onUpload, onCancel, error}) {
 const hasPlan=items.length>0 || hasFloor;
 return <section className="floorplan-overview" aria-label="Uložený pôdorys"><div className="section-heading"><h2>Pôdorys bytu</h2><span>{editing?'Prebiehajú úpravy':'Uložený náhľad'}</span></div>
   {hasPlan ? <div className="floorplan-saved-view"><svg viewBox="0 0 100 100" role="img" aria-label={`Uložený pôdorys ${name}`}><title>{`Pôdorys ${name}`}</title>{floorUrl&&<image href={floorUrl} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet"/>}{[...items].sort((a,b)=>(a.kind==='room'?0:a.kind==='door'?2:1)-(b.kind==='room'?0:b.kind==='door'?2:1)).map(item=><g key={item.id} transform={`rotate(${item.rotation} ${item.x+item.w/2} ${item.y+item.h/2})`}><title>{item.name}</title><LayoutShape item={item} shape={shapeOf(item)} x={item.x} y={item.y} width={item.w} height={item.h} fill={itemFill(item)} stroke="#56704a"/>{item.kind!=='door'&&<text x={item.x+item.w/2} y={item.y+(shapeOf(item)==='l'||shapeOf(item)==='u'?item.h*0.82:shapeOf(item)==='t'?item.h*0.2:item.h/2)} textAnchor="middle" dominantBaseline="middle" fontSize="2.4" fill="#294f3d" stroke="#ffffffbb" strokeWidth="0.3" paintOrder="stroke">{item.name}</text>}</g>)}</svg>{hasFloor&&!floorUrl&&<p className="form-hint" role="status">Načítavam podklad pôdorysu…</p>}</div> : <div className="empty compact"><h3>{ready?'Zatiaľ nemáte pôdorys':'Načítavam pôdorys…'}</h3><p>Nakreslite rozloženie bytu alebo nahrajte hotový obrázok.</p></div>}
   <div className="floorplan-overview-actions">{!editing?<button className="primary" disabled={busy||!ready} onClick={onEdit}>{hasPlan?<Pencil size={16}/>:<Plus size={16}/>} {hasPlan?'Opraviť pôdorys':'Vytvoriť pôdorys'}</button>:<button className="secondary" disabled={busy} onClick={onCancel}>Zrušiť úpravy</button>}<button className="secondary" disabled={busy||!ready} onClick={onUpload}><Upload size={16}/>Nahrať pôdorys</button></div>
   {error&&<div className="warning" role="alert">{error}</div>}
 </section>;
}
