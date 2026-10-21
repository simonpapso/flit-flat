import React, { useRef, useState } from 'react';
import { Plus, Save, Undo2, Redo2, Copy, RotateCw, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { presets, fitItem, makeItem, duplicateItem } from './layout-tools.js';
import { layoutShapes, shapeOf, shapeClip } from './layout-shapes.js';
import LayoutShape from './LayoutShape.jsx';

export default function LayoutEditor({items,onChange,onSave,dirty,busy,floorUrl}) {
  const stage=useRef(), gesture=useRef(null), past=useRef([]), future=useRef([]);
  const [selected,setSelected]=useState(null), [snap,setSnap]=useState(true), [grid,setGrid]=useState(true), [zoom,setZoom]=useState(1), [preset,setPreset]=useState(0), [shape,setShape]=useState('rect'), [history,setHistory]=useState(0);
  const active=items.find(x=>x.id===selected);
  const remember=()=>{past.current=[...past.current.slice(-49),items];future.current=[];setHistory(n=>n+1);};
  const commit=next=>{if(JSON.stringify(next)===JSON.stringify(items))return;remember();onChange(next);};
  const patch=(id,values)=>commit(items.map(x=>x.id===id?fitItem(x,values):x));
  const undo=()=>{if(!past.current.length||busy)return;future.current.push(items);onChange(past.current.pop());setHistory(n=>n+1);};
  const redo=()=>{if(!future.current.length||busy)return;past.current.push(items);onChange(future.current.pop());setHistory(n=>n+1);};
  const add=()=>{if(busy||items.length>=300)return;const next=makeItem({...presets[preset],shape},crypto.randomUUID(),items.length);commit([...items,next]);setSelected(next.id);};
  const duplicate=()=>{if(!active||busy||items.length>=300)return;const next=duplicateItem(active,crypto.randomUUID());commit([...items,next]);setSelected(next.id);};
  const erase=()=>{if(!active||busy)return;commit(items.filter(x=>x.id!==active.id));setSelected(null);};
  const down=(e,item,resize=false)=>{
    if(busy||e.button!==0)return;e.preventDefault();e.stopPropagation();setSelected(item.id);
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current={item,resize,x:e.clientX,y:e.clientY,rect:stage.current.getBoundingClientRect(),before:items,started:false};
  };
  const move=e=>{
    const d=gesture.current;if(!d||busy)return;
    const dx=(e.clientX-d.x)/d.rect.width*100,dy=(e.clientY-d.y)/d.rect.height*100;
    if(!d.started && Math.abs(dx)+Math.abs(dy)<0.3)return;
    if(!d.started){past.current=[...past.current.slice(-49),d.before];future.current=[];d.started=true;setHistory(n=>n+1);}
    const item=d.item;
    const values=d.resize?{w:Math.min(100-item.x,item.w+dx),h:Math.min(100-item.y,item.h+dy)}:{x:item.x+dx,y:item.y+dy};
    const next=fitItem(item,values,snap?2:0);
    onChange(d.before.map(x=>x.id===item.id?next:x));
  };
  const end=()=>{gesture.current=null;};
  const keys=(e,item)=>{
    const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
    if(!directions[e.key]||busy)return;e.preventDefault();
    const [dx,dy]=directions[e.key],step=e.shiftKey?5:1;
    patch(item.id,{x:item.x+dx*step,y:item.y+dy*step});
  };
  return <div className="floor-editor" data-history={history}>
    <div className="floor-editor-intro"><h3>Navrhnite si rozloženie bytu</h3><p>Vyberte miestnosť alebo nábytok, pridajte ho do plánu a presuňte na miesto. Vybraný prvok zväčšíte úchytom v rohu.</p></div>
    <div className="floor-toolbar"><label>Pridať do pôdorysu<select value={preset} disabled={busy} onChange={e=>setPreset(Number(e.target.value))}>{presets.map((p,i)=><option key={p.name} value={i}>{p.kind==='room'?'Miestnosť':'Nábytok'} · {p.name}</option>)}</select></label><label>Tvar<select aria-label="Tvar nového prvku" value={shape} disabled={busy} onChange={e=>setShape(e.target.value)}>{layoutShapes.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label><button className="secondary" disabled={busy||items.length>=300} onClick={add}><Plus size={16}/>Pridať</button><div className="floor-history"><button className="secondary" aria-label="Späť v pôdoryse" disabled={busy||!past.current.length} onClick={undo}><Undo2 size={16}/></button><button className="secondary" aria-label="Znova v pôdoryse" disabled={busy||!future.current.length} onClick={redo}><Redo2 size={16}/></button></div><button className="primary" disabled={!dirty||busy} onClick={onSave}><Save size={16}/>{busy?'Ukladám…':dirty?'Uložiť pôdorys':'Zmeny uložené'}</button></div>
    <div className="floor-view-tools"><label><input type="checkbox" checked={snap} onChange={e=>setSnap(e.target.checked)}/>Prichytiť na mriežku</label><label><input type="checkbox" checked={grid} onChange={e=>setGrid(e.target.checked)}/>Zobraziť mriežku</label><div><button className="icon-btn" aria-label="Oddialiť pôdorys" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z-0.25))}><ZoomOut size={18}/></button><span>{Math.round(zoom*100)} %</span><button className="icon-btn" aria-label="Priblížiť pôdorys" disabled={zoom>=2} onClick={()=>setZoom(z=>Math.min(2,z+0.25))}><ZoomIn size={18}/></button></div></div>
    <div className="floor-workspace"><div className="floor-scroll"><div className={`floor-stage ${grid?'with-grid':''}`} ref={stage} style={{width:`${zoom*100}%`,...(floorUrl?{backgroundImage:`url("${floorUrl}")`,backgroundSize:'contain',backgroundPosition:'center'}:{})}} aria-label="Editor pôdorysu" onPointerDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}>
      {[...items].sort((a,b)=>(a.kind==='room'?0:1)-(b.kind==='room'?0:1)).map(item=><div key={item.id} className={`floor-item ${item.kind} shape-${shapeOf(item)} ${selected===item.id?'chosen':''}`} style={{left:`${item.x}%`,top:`${item.y}%`,width:`${item.w}%`,height:`${item.h}%`,transform:`rotate(${item.rotation}deg)`}}><LayoutShape className="floor-shape" shape={shapeOf(item)} fill={item.kind==='room'?'#edf2e6dd':'#bacbad'} stroke={selected===item.id?'#294f3d':'#6b865b'}/><button className="floor-item-body" style={{clipPath:shapeClip(shapeOf(item))}} disabled={busy} onFocus={()=>setSelected(item.id)} onClick={()=>setSelected(item.id)} onKeyDown={e=>keys(e,item)} onPointerDown={e=>down(e,item)} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} aria-label={`Vybrať ${item.name}`} aria-pressed={selected===item.id}><strong>{item.name}</strong>{item.kind==='furniture'&&item.quantity>1&&<small>{item.quantity} ks</small>}</button>{selected===item.id&&item.rotation===0&&<button className="floor-resize" disabled={busy} aria-label={`Zmeniť veľkosť ${item.name}`} onPointerDown={e=>down(e,item,true)} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}/>}</div>)}
      {!items.length&&!floorUrl&&<div className="floor-empty"><strong>Váš nový pôdorys</strong><p>Začnite pridaním prvej miestnosti hore.</p></div>}
    </div></div><aside className="floor-inspector"><h3>{active?'Upraviť prvok':'Vyberte prvok'}</h3>{active?<fieldset disabled={busy}><label>Tvar prvku<select aria-label="Tvar vybraného prvku" value={shapeOf(active)} onChange={e=>patch(active.id,{shape:e.target.value})}>{layoutShapes.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label><label>Názov<input value={active.name} maxLength={100} onChange={e=>patch(active.id,{name:e.target.value})}/></label><div className="floor-number-grid">{[['x','Poloha X',0,100-active.w],['y','Poloha Y',0,100-active.h],['w','Šírka',5,100-active.x],['h','Výška',5,100-active.y]].map(([key,label,min,max])=><label key={key}>{label} (%)<input type="number" min={min} max={max} step="0.1" value={active[key]} onChange={e=>{if(e.target.value!=='')patch(active.id,{[key]:Number(e.target.value)});}}/></label>)}</div><div className="floor-selection-actions"><button className="secondary" onClick={()=>patch(active.id,{rotation:(active.rotation+90)%360})}><RotateCw size={15}/>Otočiť</button><button className="secondary" disabled={items.length>=300} onClick={duplicate}><Copy size={15}/>Kópia</button><button className="secondary danger" onClick={erase}><Trash2 size={15}/>Odstrániť</button></div>{active.rotation!==0&&<p className="form-hint">Veľkosť otočeného prvku upravte číselne.</p>}{active.kind==='furniture'&&<label>Počet kusov<input type="number" min="1" max="999" value={active.quantity} onChange={e=>patch(active.id,{quantity:Math.max(1,Math.min(999,Math.trunc(Number(e.target.value))||1))})}/></label>}<label>Poznámka / stav<textarea value={active.note} maxLength={2000} onChange={e=>patch(active.id,{note:e.target.value})}/></label></fieldset>:<p className="form-hint">Kliknite na prvok v pláne alebo v zozname. Šípkami na klávesnici ho posuniete; so Shiftom po väčších krokoch.</p>}<h3 className="floor-list-heading">Všetky prvky · {items.length}/300</h3><div className="floor-item-list">{items.map(item=><button key={item.id} className={selected===item.id?'selected':''} aria-pressed={selected===item.id} onClick={()=>setSelected(item.id)}><span>{item.name}</span><small>{item.kind==='room'?'Miestnosť':'Nábytok'}</small></button>)}</div></aside></div>
    <p className="form-hint">Orientačný nákres bez fyzickej mierky. Súradnice a rozmery sú v percentách plochy. Posledných 50 úprav možno vrátiť; zmeny potvrďte tlačidlom Uložiť pôdorys.</p>
    {dirty&&<p className="unsaved" role="status">Máte neuložené zmeny pôdorysu.</p>}
  </div>;
}
