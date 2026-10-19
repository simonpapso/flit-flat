import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { annualOverview, money, monthKey } from './data.js';
const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Máj', 'Jún', 'Júl', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
function Chart({ title, properties, payments, year, mode, portfolio }) {
  const allMonths = annualOverview(properties, payments, year, mode);
  const series = allMonths.filter(p => p.active);
  const [selected, setSelected] = useState(new Date().getMonth());
  const [table, setTable] = useState(false);
  const active = allMonths[selected]?.active ? allMonths[selected] : series[0];
  const activeIndex = active ? Number(active.month.slice(5)) - 1 : -1;
  const peak = Math.max(1, ...series.flatMap(p => [p.rent, p.costs]));
  const totalRent = series.reduce((s,p)=>s+p.rent,0);
  const totalCost = series.reduce((s,p)=>s+p.costs,0);
  return <article className={`finance-chart ${portfolio?'portfolio-chart':''}`} aria-label={`Graf: ${title}`}>
    <div className="chart-title"><h3>{title}</h3><span>{year}</span></div>
    <div className="chart-totals"><div><small>Nájomné / obdobie</small><strong>{money(totalRent)}</strong></div><div><small>{mode==='paid'?'Označené úhrady':'Náklady'} / obdobie</small><strong>{money(totalCost)}</strong></div><div className={totalRent-totalCost<0?'negative':''}><small>Rozdiel / obdobie</small><strong>{money(totalRent-totalCost)}</strong></div></div>
    {series.length ? <><div className="chart-plot"><div className="chart-scale"><span>{money(peak)}</span><span>0 €</span></div>
    <div className="bars-chart" style={{gridTemplateColumns:`repeat(${series.length}, minmax(0, 1fr))`}}>{series.map(p=>{const i=Number(p.month.slice(5))-1;return <button key={p.month} className={i===activeIndex?'month-bars picked':'month-bars'} onClick={()=>setSelected(i)} aria-pressed={i===activeIndex} aria-label={`${labels[i]} ${year}: nájomné ${money(p.rent)}, náklady ${money(p.costs)}, rozdiel ${money(p.balance)}`} title={`${labels[i]}: nájomné ${money(p.rent)} · náklady ${money(p.costs)}`}><span className="bar-pair"><i className="rent-bar" style={{height:`${p.rent/peak*100}%`}}/><i className="cost-bar" style={{height:`${p.costs/peak*100}%`}}/></span><span>{labels[i]}</span></button>;})}</div></div>
    <div className="chart-month-detail" aria-live="polite"><strong>{labels[activeIndex]} {year}</strong><span>Nájomné <b>{money(active.rent)}</b></span><span>Náklady <b>{money(active.costs)}</b></span><span className={active.balance<0?'negative':''}>Rozdiel <b>{money(active.balance)}</b></span></div>
    <button className="text-btn chart-table-toggle" onClick={()=>setTable(!table)} aria-expanded={table}>{table?'Skryť mesačné hodnoty':'Zobraziť mesačné hodnoty'}</button>
    {table&&<div className="table-scroll"><table className="chart-values"><caption>{title} — mesačné hodnoty {year}</caption><thead><tr><th>Mesiac</th><th>Nájomné</th><th>Náklady</th><th>Rozdiel</th></tr></thead><tbody>{series.map(p=><tr key={p.month}><td>{labels[Number(p.month.slice(5))-1]}</td><td>{money(p.rent)}</td><td>{money(p.costs)}</td><td>{money(p.balance)}</td></tr>)}</tbody></table></div>}</> : <p className="chart-explanation">Tento byt ešte v zvolenom roku nebol v evidencii.</p>}
  </article>;
}
export default function FinancialOverview({data}) {
  const [year,setYear]=useState(new Date().getFullYear());
  const [mode,setMode]=useState('due');
  if(!data.properties.length)return null;
  const firstMonth = data.properties.map(p => p.trackingStart || monthKey(new Date())).sort()[0];
  const firstYear = Number(firstMonth.slice(0,4));
  const shownYear = Math.max(year, firstYear);
  const startLabel = new Date(`${firstMonth}-01T12:00:00`).toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' });
  return <section className="financial-overview"><div className="section-heading"><div><h2><BarChart3 size={20}/>Nájomné a náklady v čase</h2><p>Celé portfólio aj každý byt samostatne. Kliknutím na mesiac zobrazíte presné sumy.</p></div><div className="month-picker"><button className="icon-btn" aria-label="Predchádzajúci rok grafov" disabled={shownYear<=firstYear} onClick={()=>setYear(shownYear-1)}><ChevronLeft size={17}/></button><span>{shownYear}</span><button className="icon-btn" aria-label="Nasledujúci rok grafov" disabled={shownYear>=9999} onClick={()=>setYear(shownYear+1)}><ChevronRight size={17}/></button></div></div>
    <p className="statistics-start">Začiatok štatistík: <strong>{startLabel}</strong> · podľa prvej nehnuteľnosti v evidencii</p>
    <div className="chart-options"><div className="chart-legend"><span><i/>Dohodnuté nájomné</span><span><i/>{mode==='paid'?'Označené úhrady':'Splatné náklady'}</span></div><label>Zobraziť náklady<select value={mode} onChange={e=>setMode(e.target.value)}><option value="due">Podľa splatnosti (plán)</option><option value="paid">Iba označené ako uhradené</option></select></label></div>
    <p className="chart-explanation">Každý byt sa započítava až od svojho začiatku evidencie; skoršie mesiace sa nezobrazujú. Prvý mesiac sa počíta celý. Nájomné aj opakované náklady vychádzajú z aktuálnych predpisov. Ročné a kvartálne platby sú v plnej výške v mesiaci splatnosti; jednorazové výdavky len v zadanom mesiaci a roku. Nájomné nie je potvrdený príjem. Úhrady sú priradené mesiacu splatnosti, nie dátumu bankového prevodu.</p>
    <Chart title="Celé portfólio" properties={data.properties} payments={data.payments} year={shownYear} mode={mode} portfolio/>
    <div className="property-chart-grid">{data.properties.map(p=><Chart key={p.id} title={p.name} properties={[p]} payments={data.payments} year={shownYear} mode={mode}/>)}</div>
  </section>;
}
