import React from 'react';
import { Check } from 'lucide-react';
import { money } from './data.js';

export default function RentPayments({ properties, month, onMonthChange, onToggle, saving }) {
  const label = new Date(`${month}-01T12:00:00`).toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' });
  return <section className="rent-payments"><div className="section-heading"><div><h2>Prijaté nájomné</h2><p>Označenie platí iba pre vybraný mesiac. Opätovným kliknutím ho zrušíte.</p></div><label>Mesiac nájomného<input aria-label="Mesiac prijatého nájomného" type="month" min="1900-01" max="9999-12" value={month} onChange={e => { if (/^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/.test(e.target.value)) onMonthChange(e.target.value); }}/></label></div><div className="energy-grid">{properties.map(p => {
    const received = (p.rentReceivedMonths || []).includes(month);
    return <article className="energy-card" key={p.id}><h3>{p.name}</h3><p>{p.tenant || 'Bez nájomníka'} · {label}</p><strong>{money(p.rent)}</strong><button className={`status ${received ? 'paid' : 'pending'}`} disabled={saving} aria-pressed={received} onClick={() => onToggle(p)}><Check size={15}/>{received ? 'Nájomné prijaté · zrušiť' : 'Označiť prijaté nájomné'}</button></article>;
  })}</div></section>;
}
