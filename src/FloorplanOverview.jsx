import React from 'react';
import { Pencil, Upload, Plus } from 'lucide-react';
import FloorplanItems from './FloorplanItems.jsx';

export default function FloorplanOverview({items, floorUrl, hasFloor, ready, busy, editing, name, onEdit, onUpload, onCancel, error}) {
 const hasPlan=items.length>0 || hasFloor;
 return <section className="floorplan-overview" aria-label="Uložený pôdorys"><div className="section-heading"><h2>Pôdorys bytu</h2><span>{editing?'Prebiehajú úpravy':'Uložený náhľad'}</span></div>
   {hasPlan ? <div className="floorplan-saved-view"><svg viewBox="0 0 100 100" role="img" aria-label={`Uložený pôdorys ${name}`}><title>{`Pôdorys ${name}`}</title>{floorUrl&&<image href={floorUrl} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet"/>}<FloorplanItems items={items}/></svg>{hasFloor&&!floorUrl&&<p className="form-hint" role="status">Načítavam podklad pôdorysu…</p>}</div> : <div className="empty compact"><h3>{ready?'Zatiaľ nemáte pôdorys':'Načítavam pôdorys…'}</h3><p>Nakreslite rozloženie bytu alebo nahrajte hotový obrázok.</p></div>}
   <div className="floorplan-overview-actions">{!editing?<button className="primary" disabled={busy||!ready} onClick={onEdit}>{hasPlan?<Pencil size={16}/>:<Plus size={16}/>} {hasPlan?'Opraviť pôdorys':'Vytvoriť pôdorys'}</button>:<button className="secondary" disabled={busy} onClick={onCancel}>Zrušiť úpravy</button>}<button className="secondary" disabled={busy||!ready} onClick={onUpload}><Upload size={16}/>Nahrať pôdorys</button></div>
   {error&&<div className="warning" role="alert">{error}</div>}
 </section>;
}
