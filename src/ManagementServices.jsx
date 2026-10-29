import React, {useState} from 'react';
import {Plus, Pencil, Trash2, ExternalLink} from 'lucide-react';
import {serviceUrl} from './service-links.js';

export function ManagementServicesFields({property}) {
  const [services,setServices]=useState(()=>property?.managementServices || []);
  const patch=(id,values)=>setServices(list=>list.map(service=>service.id===id?{...service,...values}:service));
  return <section className="management-services-fields">
    <h3 className="form-subtitle">Správcovské služby bytového domu</h3>
    <input type="hidden" name="managementServicesJson" value={JSON.stringify(services)}/>
    {services.map((service,i)=><fieldset className="tenant-fields-person" key={service.id}>
      <legend>Služba {i+1}</legend>
      <label>Názov správcu / služby<input required maxLength={100} value={service.name} placeholder="Napr. správca bytového domu" onChange={e=>patch(service.id,{name:e.target.value})}/></label>
      <label>Webová stránka správcu<input type="url" inputMode="url" pattern="https?://.+" title="Adresa začínajúca na https:// alebo http://" maxLength={2048} value={service.url || ''} placeholder="https://www.vas-spravca.sk" onChange={e=>{e.target.setCustomValidity('');patch(service.id,{url:e.target.value});}} onBlur={e=>{const value=e.target.value.trim();e.target.setCustomValidity(value&&!serviceUrl(value)?'Zadajte platnú adresu začínajúcu na https:// alebo http://.':'');}}/></label>
      <label>Poznámka (voliteľné)<textarea maxLength={2000} value={service.description} placeholder="Rozsah služby, správca, kontakt alebo termíny" onChange={e=>patch(service.id,{description:e.target.value})}/></label>
      <button type="button" className="text-btn danger" onClick={()=>setServices(list=>list.filter(x=>x.id!==service.id))}><Trash2 size={14}/>Odobrať službu</button>
    </fieldset>)}
    <button type="button" className="secondary" disabled={services.length>=50} onClick={()=>setServices(list=>[...list,{id:crypto.randomUUID(),name:'',description:'',url:''}])}><Plus size={15}/>Pridať správcovskú službu</button>
  </section>;
}

export default function ManagementServices({property,onEdit,busy}) {
  const services=property.managementServices || [];
  return <section className="management-services" aria-label="Správcovské služby bytového domu">
    <div className="section-heading"><h3>Správcovské služby bytového domu</h3><button className="secondary" onClick={onEdit} disabled={busy}>{services.length?<Pencil size={15}/>:<Plus size={15}/>} {services.length?'Upraviť služby':'Pridať službu'}</button></div>
    {services.length?services.map(service=><article key={service.id}>{serviceUrl(service.url)?<a className="management-service-link" href={serviceUrl(service.url)} target="_blank" rel="noopener noreferrer"><strong>{service.name}</strong><span>Otvoriť stránku správcu <ExternalLink size={16}/></span></a>:<><strong>{service.name}</strong>{service.description&&<p>{service.description}</p>}<button className="text-btn" onClick={onEdit} disabled={busy}>Doplniť odkaz na správcu</button></>}</article>):<p className="form-hint">K tomuto bytu zatiaľ nie sú uvedené správcovské služby.</p>}
  </section>;
}
