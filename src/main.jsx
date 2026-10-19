import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { House, LayoutDashboard, Building2, Wallet, Users, Settings, Plus, ChevronLeft, ChevronRight, ArrowUpRight, Check, X, ArrowDownToLine, Upload, Leaf, ArrowRight, CircleHelp, Pencil, Trash2, Zap, Flame, Droplets, Wifi, ShieldCheck, Layers, Circle, Search, Menu } from 'lucide-react';
import { categories, money, monthKey, dueDate, status, emptyData, demoData, validData, frequencies, frequencyOf, monthlyAmount, isDueInMonth, propertyFinance } from './data.js';
import '@fontsource/dm-sans/latin-ext-400.css';
import '@fontsource/dm-sans/latin-ext-500.css';
import '@fontsource/dm-sans/latin-ext-600.css';
import '@fontsource/dm-sans/latin-ext-700.css';
import '@fontsource/manrope/latin-ext-500.css';
import '@fontsource/manrope/latin-ext-700.css';
import '@fontsource/manrope/latin-ext-800.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import { storage, DATA_KEY, isNative, exportBackup } from './storage.js';
import './style.css';

const icons = { Elektrina: Zap, Plyn: Flame, Voda: Droplets, Internet: Wifi, Poistenie: ShieldCheck, 'Spoločné priestory': Layers, Iné: Circle };
const names = { overview: 'Prehľad', properties: 'Nehnuteľnosti', payments: 'Platby a energie', tenants: 'Nájomníci', settings: 'Nastavenia' };
const today = new Date();
function App({ initialData, initialLoadError }) {
  const [loadError, setLoadError] = useState(initialLoadError);
  const [saving, setSaving] = useState(false);
  const saveLock = useRef(false);
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState('overview');
  const [month, setMonth] = useState(monthKey(today));
  const [filter, setFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState('');
  const [menu, setMenu] = useState(false);
  const [saveError, setSaveError] = useState('');
  const file = useRef();
  const update = async next => {
    if (saveLock.current) return false;
    saveLock.current = true;
    setSaving(true);
    try {
      await storage.setItem(DATA_KEY, JSON.stringify(next));
      setData(next); setSaveError(''); setLoadError(false);
      return true;
    } catch {
      setSaveError('Údaje sa nepodarilo uložiť. Skontrolujte voľné miesto alebo povolenie úložiska zariadenia.');
      return false;
    } finally { saveLock.current = false; setSaving(false); }
  };
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(t); }, [notice]);
  const selected = data.payments.filter(p => (filter === 'all' || p.propertyId === filter) && isDueInMonth(p, month));
  const monthlyCosts = data.payments.reduce((sum, p) => sum + monthlyAmount(p), 0);
  const total = selected.reduce((s, p) => s + p.amount, 0);
  const paid = selected.filter(p => status(p, month) === 'paid');
  const late = selected.filter(p => status(p, month) === 'late');
  const paidTotal = paid.reduce((s, p) => s + p.amount, 0);
  const remaining = total - paidTotal;
  const rent = data.properties.reduce((s, p) => s + p.rent, 0);
  const currentDate = new Date(`${month}-01T12:00:00`);
  const monthLabel = currentDate.toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' });
  const moveMonth = delta => { const d = new Date(currentDate); d.setMonth(d.getMonth() + delta); setMonth(monthKey(d)); };
  const toggle = payment => update({ ...data, payments: data.payments.map(p => p.id === payment.id ? { ...p, paidMonths: p.paidMonths.includes(month) ? p.paidMonths.filter(m => m !== month) : [...p.paidMonths, month] } : p) });
  const navigate = p => { setPage(p); setMenu(false); setFilter('all'); setStateFilter('all'); };
  const exportData = async () => {
    try { await exportBackup(data, `flit-flat-${monthKey(new Date())}.json`); }
    catch { setNotice('Zálohu sa nepodarilo zdieľať alebo bolo zdieľanie zrušené. Vaše údaje zostávajú uložené.'); }
  };
  const importData = async event => {
    const f = event.target.files[0]; if (!f) return;
    try { if (f.size > 5000000) throw Error(); const parsed = JSON.parse(await f.text()); if (!validData(parsed)) throw Error(); setModal({ kind: 'import', data: parsed }); }
    catch { setNotice('Súbor nie je platná záloha Flit Flat (max. 5 MB).'); } event.target.value = '';
  };
  const saveForm = async event => {
    event.preventDefault(); const form = Object.fromEntries(new FormData(event.currentTarget));
    let saved;
    if (modal.kind === 'property') {
      const item = { ...form, rent: Number(form.rent), id: modal.item?.id || crypto.randomUUID() };
      saved = await update({ ...data, properties: modal.item ? data.properties.map(p => p.id === item.id ? item : p) : [...data.properties, item] });
    } else {
      const item = { ...form, amount: Number(form.amount), day: Number(form.day), anchorMonth: Number(form.anchorMonth || 1), id: modal.item?.id || crypto.randomUUID(), paidMonths: modal.item?.paidMonths || [] };
      saved = await update({ ...data, payments: modal.item ? data.payments.map(p => p.id === item.id ? item : p) : [...data.payments, item] });
    }
    if (saved) setModal(null);
  };
  const paymentRows = selected.filter(p => stateFilter === 'all' || status(p, month) === stateFilter).sort((a,b) => a.day - b.day);
  const showPayments = page === 'overview' || page === 'payments';
  return <div className={isNative ? "app native-app" : "app"} aria-busy={saving}>
    <aside className={menu ? 'sidebar open' : 'sidebar'}>
      <a className="brand" href="#" onClick={e => { e.preventDefault(); navigate('overview'); }}><span className="brand-icon"><House size={24}/></span>flit<span className="brand-light">flat</span><span className="brand-dot">.</span></a>
      <div className="workspace"><span className="avatar">M</span><div>Moje portfólio<small>Osobný priestor</small></div><span className="workspace-dot"/></div>
      <div className="nav-label">PRACOVNÝ PRIESTOR</div>
      <nav>{[["overview", LayoutDashboard], ["properties", Building2], ["payments", Wallet], ["tenants", Users]].map(([id, Icon]) => <button className={page === id ? 'nav-item active' : 'nav-item'} key={id} onClick={() => navigate(id)}><Icon size={19}/>{names[id]}{id === 'properties' && <span className="nav-count">{data.properties.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="calm-card"><Leaf size={22}/><strong>Menej starostí.<br/>Viac pokoja.</strong><p>Všetko o vašich bytoch<br/>na jednom mieste.</p></div><button className={page === 'settings' ? 'nav-item active' : 'nav-item'} onClick={() => navigate('settings')}><Settings size={19}/>Nastavenia</button><div className="local-label"><span/>Údaje uložené vo vašom zariadení</div></div>
    </aside>
    {menu && <button className="scrim" aria-label="Zavrieť menu" onClick={() => setMenu(false)}/>}
    <main>
      <header className="topbar"><div><button className="mobile-menu icon-btn" aria-label="Menu" onClick={() => setMenu(!menu)}><Menu size={20}/></button><span>Moje portfólio</span><ChevronRight size={14}/><strong>{names[page]}</strong></div><div className="top-right"><span className="today">{today.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })}</span><button className="help icon-btn" aria-label="Ako funguje aplikácia" onClick={() => setModal({ kind: 'help' })}><CircleHelp size={19}/></button><span className="avatar small">M</span></div></header>
      <div className="content">
        {(loadError || saveError) && <div className="warning">{saveError || 'Uložené údaje sa nepodarilo načítať. Pred ďalšími zmenami skúste obnoviť stránku alebo importujte zálohu.'}</div>}
        <div className="page-heading"><div><div className="eyebrow">VÁŠ DOMOV PRE SPRÁVU BYTOV</div><h1>{page === 'overview' ? 'Všetko pekne pod kontrolou.' : names[page]}</h1><p>{({ overview: 'Vaše nehnuteľnosti, nájomníci a platby. Konečne prehľadne.', properties: 'Každý byt má svoje miesto. Aj všetky jeho detaily.', payments: 'Mesačná kontrola energií a služieb bez tabuliek.', tenants: 'Vždy viete, kto býva v ktorom byte.', settings: 'Vaše údaje zostávajú vo vašich rukách.' })[page]}</p></div><button className="primary" onClick={() => setModal({ kind: 'property' })}><Plus size={18}/>Pridať nehnuteľnosť</button></div>
        {page === 'overview' && <>
          <div className="intro-banner"><div className="banner-icon"><House size={29}/></div><div><strong>Byty máte vy. Prehľad máte u nás.</strong><p>{data.properties.length ? `Spravujete ${data.properties.length} nehnuteľnosti. Pozrite sa, čo si tento mesiac vyžaduje pozornosť.` : 'Pridajte svoj prvý byt a majte nájomníkov aj pravidelné platby na jednom mieste.'}</p></div><span className="banner-art"><Building2 size={94} strokeWidth={0.8}/><Leaf size={48} strokeWidth={1}/></span></div>
          <div className="stats"><Stat label="Nehnuteľnosti" value={data.properties.length} detail={`${data.properties.filter(p => p.tenant.trim()).length} obsadené · ${data.properties.filter(p => !p.tenant.trim()).length} voľné`} icon={Building2}/><Stat label="Mesačné nájomné" value={money(rent)} detail="Dohodnuté nájomné · nie príjem na účte" icon={ArrowUpRight}/><Stat label="Pravidelné náklady" value={money(monthlyCosts)} detail="Mesačný priemer vrátane ročných platieb" icon={Wallet}/><Stat label="Zostáva uhradiť" value={money(remaining)} detail={`${selected.length - paid.length} platieb v zvolenom mesiaci`} icon={Circle} accent/></div>
        </>}
        {(page === 'overview' || page === 'properties') && <section className="property-section"><div className="section-heading"><h2>Vaše nehnuteľnosti <span className="count">{data.properties.length}</span></h2>{page === 'overview' && <button className="text-btn" onClick={() => navigate('properties')}>Všetky nehnuteľnosti<ArrowRight size={16}/></button>}</div>
          {data.properties.length ? <div className="property-grid">{data.properties.map((p, index) => { const finance = propertyFinance(p, data.payments); return <article className="property-card" key={p.id}><div className={`property-illustration variant-${index % 2}`}><div className="drawing-building"><div/><div/><div/><div/><div/><div/></div><span className="drawing-tree"/><span className="occupancy"><span className={p.tenant ? 'green-dot' : 'gray-dot'}/>{p.tenant ? 'Obsadené' : 'Voľné'}</span><span className="property-number">{String(index + 1).padStart(2, '0')}</span></div><div className="property-info"><div className="property-title"><h3>{p.name}</h3><button className="icon-btn" aria-label={`Upraviť ${p.name}`} onClick={() => setModal({ kind: 'property', item: p })}><Pencil size={15}/></button></div><p>{p.address || 'Adresa zatiaľ nie je vyplnená'}</p><div className="property-meta">{p.type || 'Byt'}{p.area && ` · ${p.area} m²`}</div><div className="property-footer"><div className="tenant-inline"><span className="tenant-avatar">{p.tenant ? p.tenant.split(' ').map(x => x[0]).slice(0, 2).join('') : '—'}</span><div><small>NÁJOMNÍK</small><strong>{p.tenant || 'Zatiaľ nepriradený'}</strong></div></div><div className="rent"><strong>{money(p.rent)}</strong><small>/ mesiac</small></div></div><div className="property-finance"><div><span>Náklady / mesiac</span><strong>{money(finance.cost)}</strong></div><div className={finance.profit < 0 ? 'profit negative' : 'profit'}><span>Plánovaný zisk / mesiac</span><strong>{money(finance.profit)}</strong></div><small>Nájomné mínus zadané náklady. Ročné a kvartálne platby sú rozpočítané na mesiac.</small></div>{page === 'properties' && <div className="property-actions"><button className="text-btn" onClick={() => { setPage('payments'); setFilter(p.id); }}>Zobraziť platby<ArrowRight size={14}/></button><button className="icon-btn danger" aria-label={`Odstrániť ${p.name}`} onClick={() => setModal({ kind: 'delete-property', item: p })}><Trash2 size={16}/></button></div>}</div></article>; })}</div> : <div className="empty"><Building2 size={32}/><h3>Začnime vaším prvým bytom</h3><p>Pridajte adresu, nájomníka a výšku nájmu. Ďalší byt pridáte kedykoľvek.</p><button className="primary" onClick={() => setModal({ kind: 'property' })}><Plus size={16}/>Pridať prvý byt</button><button className="text-btn" onClick={() => setModal({ kind: 'demo' })}>Najprv si pozrieť ukážku<ArrowRight size={15}/></button></div>}
        </section>}
        {showPayments && <section className="payments-section"><div className="section-heading"><div><h2>Platby pod drobnohľadom</h2><p>Malá mesačná kontrola, veľký pokoj v hlave.</p></div><div className="month-picker"><button className="icon-btn" aria-label="Predchádzajúci mesiac" onClick={() => moveMonth(-1)}><ChevronLeft size={17}/></button><span>{monthLabel}</span><button className="icon-btn" aria-label="Nasledujúci mesiac" onClick={() => moveMonth(1)}><ChevronRight size={17}/></button></div></div>
          <div className="payment-panel"><div className="payment-summary"><span className="summary-check"><Check size={20}/></span><div><strong>{paid.length} z {selected.length} platieb uhradených</strong><small>{late.length ? `${late.length} po splatnosti · zostáva ${money(remaining)}` : remaining ? `Zostáva uhradiť ${money(remaining)}` : selected.length ? 'Tento mesiac máte všetko vybavené.' : 'V tomto mesiaci nie sú žiadne splatné platby.'}</small></div><div className="progress-group"><span>{money(paidTotal)} <small>z {money(total)}</small></span><div className="progress"><i style={{ width: `${total ? paidTotal / total * 100 : 0}%` }}/></div></div></div>
          <div className="table-tools"><div className="tabs">{[['all', 'Všetky'], ['pending', 'Čakajúce'], ['late', 'Po splatnosti'], ['paid', 'Uhradené']].map(([s, title]) => <button key={s} onClick={() => setStateFilter(s)} className={stateFilter === s ? 'tab selected' : 'tab'}>{title}</button>)}</div><div className="table-actions"><select aria-label="Filtrovať podľa nehnuteľnosti" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Všetky nehnuteľnosti</option>{data.properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button className="text-btn" onClick={() => setModal({ kind: 'schedules' })}>Všetky predpisy</button><button className="secondary" disabled={!data.properties.length} onClick={() => setModal({ kind: 'payment' })}><Plus size={16}/>Pridať platbu</button></div></div>
          <div className="table-scroll"><table><thead><tr><th>PLATBA / DODÁVATEĽ</th><th>NEHNUTEĽNOSŤ</th><th>SPLATNOSŤ</th><th>SUMA</th><th>STAV</th><th aria-label="Akcie"/></tr></thead><tbody>{paymentRows.map(p => { const Icon = icons[p.category]; const s = status(p, month); return <tr key={p.id}><td><div className="payment-name"><span className={`category-icon cat-${categories.indexOf(p.category)}`}><Icon size={18}/></span><div><strong>{p.category}</strong><small>{p.supplier || 'Bez dodávateľa'} · {frequencies[frequencyOf(p)].label}</small></div></div></td><td>{data.properties.find(x => x.id === p.propertyId)?.name}</td><td>{dueDate(month, p.day).toLocaleDateString('sk-SK')}</td><td className="amount">{money(p.amount)}</td><td><button title={s === 'paid' ? 'Kliknutím zrušíte označenie úhrady' : 'Kliknutím označíte ako uhradené'} onClick={() => toggle(p)} className={`status ${s}`}>{s === 'paid' ? <Check size={13}/> : <span/>}{s === 'paid' ? 'Uhradené' : s === 'late' ? 'Po splatnosti' : 'Čaká na úhradu'}</button></td><td><button className="icon-btn" aria-label={`Upraviť platbu ${p.category}`} onClick={() => setModal({ kind: 'payment', item: p })}><Pencil size={15}/></button></td></tr>; })}</tbody></table></div>
          {!paymentRows.length && <div className="empty compact"><Wallet size={27}/><h3>{selected.length ? 'Žiadne platby v tomto filtri' : 'Žiadne splatné platby'}</h3><p>{data.properties.length ? 'Pridajte elektrinu, vodu, internet či ďalšie pravidelné náklady.' : 'Najprv pridajte nehnuteľnosť, ku ktorej priradíte platby.'}</p></div>}
          <div className="table-foot"><span><ShieldCheck size={14}/>Úhrady označujete ručne. Aplikácia nie je prepojená s bankou.</span><span>{paymentRows.length} položiek</span></div></div></section>}
        {page === 'tenants' && <div className="tenant-grid">{data.properties.filter(p => p.tenant.trim()).map(p => <article className="tenant-card" key={p.id}><span className="tenant-avatar large">{p.tenant.split(' ').map(x => x[0]).slice(0,2).join('')}</span><h2>{p.tenant}</h2><p>{p.name}</p><dl><dt>Nájomné</dt><dd>{money(p.rent)} / mesiac</dd><dt>Telefón</dt><dd>{p.phone || 'Nevyplnené'}</dd><dt>E-mail</dt><dd>{p.email || 'Nevyplnené'}</dd></dl>{p.note && <p className="note">{p.note}</p>}<button className="secondary" onClick={() => setModal({ kind: 'property', item: p })}><Pencil size={15}/>Upraviť údaje</button></article>)}{!data.properties.some(p => p.tenant.trim()) && <div className="empty"><Users size={32}/><h3>Zatiaľ tu nie sú nájomníci</h3><p>Nájomníka pridáte v detailoch svojej nehnuteľnosti.</p><button className="secondary" onClick={() => navigate('properties')}>Prejsť na nehnuteľnosti<ArrowRight size={15}/></button></div>}</div>}
        {page === 'settings' && <div className="settings-panel"><div className="settings-icon"><ShieldCheck size={28}/></div><h2>Vaše dáta, váš pokoj.</h2><p>{isNative ? 'Údaje sa ukladajú v úložisku tejto aplikácie na vašom iPhone.' : 'Údaje sa ukladajú len v tomto prehliadači.'} Neodosielajú sa na server a automaticky sa nesynchronizujú medzi zariadeniami. {isNative ? 'Odinštalovaním aplikácie sa odstránia aj jej údaje. Predtým si vytvorte zálohu.' : 'Vymazaním údajov prehliadača sa odstránia aj záznamy aplikácie.'}</p><h3>Zálohovanie</h3><p>Pravidelne si stiahnite zálohu. Obsahuje aj údaje nájomníkov, preto ju uložte na bezpečné miesto.</p><div className="settings-actions"><button className="primary" onClick={exportData}><ArrowDownToLine size={17}/>Stiahnuť zálohu</button><button className="secondary" onClick={() => file.current.click()}><Upload size={17}/>Obnoviť zo zálohy</button><input type="file" accept="application/json,.json" hidden ref={file} onChange={importData}/></div><div className="settings-divider"/><h3>Ako fungujú platby</h3><p>Platby sa môžu opakovať mesačne, kvartálne alebo ročne. V prehľade vidíte len platby splatné vo vybranom mesiaci. Stav úhrady je samostatný pre každý mesiac. Úprava sumy alebo splatnosti zmení predpis pre všetky mesiace. Táto verzia nesleduje históriu zmien súm, ročné vyúčtovania ani prijaté nájomné.</p><p>Plánovaný mesačný zisk je nájomné mínus všetky zadané náklady daného bytu. Kvartálne náklady sa delia tromi a ročné dvanástimi. Stav úhrady zisk nemení. Nejde o skutočný zostatok na účte ani zisk po daniach; nezadané náklady sa nezapočítajú.</p>{!data.properties.length && <button className="text-btn" onClick={() => setModal({ kind: 'demo' })}>Vyskúšať ukážkové portfólio<ArrowRight size={16}/></button>}</div>}
        <footer><span className="footer-brand">flitflat.</span><span>Priestor pre byty. Pokoj pre vás.</span><span>Vytvorené pre jednoduchšiu správu.</span></footer>
      </div>
    </main>
    {notice && <div className="toast" role="status">{notice}<button className="icon-btn" aria-label="Zavrieť oznámenie" onClick={() => setNotice('')}><X size={16}/></button></div>}
    {modal && <Modal close={() => setModal(null)} title={modal.kind === 'property' ? modal.item ? 'Upraviť nehnuteľnosť' : 'Nová nehnuteľnosť' : modal.kind === 'payment' ? modal.item ? 'Upraviť platbu' : 'Nová pravidelná platba' : modal.kind === 'schedules' ? 'Pravidelné predpisy' : modal.kind === 'help' ? 'Malý pomocník pre vaše byty' : modal.kind === 'demo' ? 'Pozrieť si ukážku?' : modal.kind === 'import' ? 'Obnoviť zálohu?' : modal.kind === 'delete-payment' ? 'Odstrániť pravidelnú platbu?' : 'Odstrániť nehnuteľnosť?'}>
      {(modal.kind === 'property' || modal.kind === 'payment') ? <form onSubmit={saveForm} key={modal.item?.id || modal.kind}>
        {modal.kind === 'property' ? <><Field label="Názov nehnuteľnosti" name="name" defaultValue={modal.item?.name} placeholder="Napr. Byt na Ružovej" required maxLength={100}/><Field label="Adresa" name="address" defaultValue={modal.item?.address} placeholder="Ulica, číslo, mesto" maxLength={200}/><div className="form-row"><Field label="Dispozícia" name="type" defaultValue={modal.item?.type} placeholder="2-izbový byt" maxLength={60}/><Field label="Výmera (m²)" name="area" type="number" min="0" step="0.1" defaultValue={modal.item?.area}/></div><h3 className="form-subtitle">Nájomník a nájomné</h3><Field label="Meno nájomníka" name="tenant" defaultValue={modal.item?.tenant} placeholder="Pri voľnom byte nechajte prázdne" maxLength={100}/><div className="form-row"><Field label="Telefón" name="phone" type="tel" defaultValue={modal.item?.phone} maxLength={40}/><Field label="E-mail" name="email" type="email" defaultValue={modal.item?.email} maxLength={150}/></div><Field label="Mesačné nájomné (€)" name="rent" type="number" min="0" step="0.01" required defaultValue={modal.item?.rent ?? 0}/><label>Poznámka<textarea name="note" defaultValue={modal.item?.note} maxLength={2000} placeholder="Dôležité informácie k bytu alebo nájomníkovi"/></label></> : <><label>Nehnuteľnosť<select name="propertyId" required defaultValue={modal.item?.propertyId || (filter !== 'all' ? filter : data.properties[0]?.id)}>{data.properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Kategória<select name="category" defaultValue={modal.item?.category || 'Elektrina'}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><Field label="Dodávateľ" name="supplier" defaultValue={modal.item?.supplier} placeholder="Napr. ZSE" maxLength={100}/><PaymentSchedule item={modal.item} month={month}/>{modal.item && <p className="form-hint">Zmena predpisu platí pre všetky mesiace. Už zaznamenané úhrady zostanú uložené.</p>}{modal.item && <button type="button" className="text-btn danger" onClick={() => setModal({ kind: 'delete-payment', item: modal.item })}><Trash2 size={15}/>Odstrániť platbu</button>}</>}
        <div className="modal-actions"><button type="button" className="secondary" onClick={() => setModal(null)}>Zrušiť</button><button className="primary" type="submit"><Check size={16}/>Uložiť</button></div>
      </form> : modal.kind === 'schedules' ? <div className="schedule-list"><p className="form-hint">Všetky predpisy pre zvolenú nehnuteľnosť vrátane tých, ktoré tento mesiac nie sú splatné.</p>{data.payments.filter(p => filter === 'all' || p.propertyId === filter).map(p => <div className="schedule-item" key={p.id}><div><strong>{p.category} · {money(p.amount)}</strong><small>{data.properties.find(x => x.id === p.propertyId)?.name} · {frequencies[frequencyOf(p)].label}</small><small>Splatnosť: {p.day}. deň{frequencyOf(p) !== 'monthly' && ` · ${monthNames.filter((_, i) => isDueInMonth(p, `2026-${String(i + 1).padStart(2, '0')}`)).join(', ')}`}</small></div><button className="secondary" onClick={() => setModal({ kind: 'payment', item: p })}><Pencil size={14}/>Upraviť</button></div>)}{!data.payments.some(p => filter === 'all' || p.propertyId === filter) && <p className="form-hint">Zatiaľ nemáte žiadne predpisy.</p>}</div> : modal.kind === 'help' ? <div className="help-content"><p>1. Pridajte svoje byty a vyplňte nájomníkov.</p><p>2. Ku každému bytu pridajte mesačné náklady na energie a služby.</p><p>3. Skontrolujte platbu vo svojej banke a kliknutím na stav ju označte ako uhradenú.</p><p>Šípkami pri mesiaci prejdete na ďalšie obdobie. V nastaveniach si pravidelne stiahnite zálohu údajov.</p><p className="form-hint">Aplikácia platby nevykonáva ani automaticky nekontroluje bankový účet.</p></div> : <><p className="confirm-text">{modal.kind === 'demo' ? 'Pridáme dva fiktívne byty, nájomníkov a mesačné platby. Sú to iba ukážkové údaje, ktoré môžete upraviť alebo odstrániť.' : modal.kind === 'import' ? 'Aktuálne údaje sa nahradia obsahom zálohy. Najprv si môžete stiahnuť zálohu súčasných dát.' : modal.kind === 'delete-property' ? `Odstráni sa „${modal.item.name}“, jeho nájomník aj všetky priradené platby a ich stavy úhrady. Tento krok sa nedá vrátiť.` : 'Odstráni sa tento pravidelný predpis aj jeho úhrady vo všetkých mesiacoch. Tento krok sa nedá vrátiť.'}</p>{modal.kind === 'import' && <button className="text-btn" onClick={exportData}><ArrowDownToLine size={16}/>Stiahnuť súčasné dáta</button>}<div className="modal-actions"><button className="secondary" onClick={() => setModal(null)}>Zrušiť</button><button className={modal.kind.startsWith('delete') ? 'primary destructive' : 'primary'} onClick={async () => { let saved; if (modal.kind === 'demo') saved = await update(demoData()); else if (modal.kind === 'import') saved = await update(modal.data); else if (modal.kind === 'delete-property') saved = await update({ ...data, properties: data.properties.filter(p => p.id !== modal.item.id), payments: data.payments.filter(p => p.propertyId !== modal.item.id) }); else saved = await update({ ...data, payments: data.payments.filter(p => p.id !== modal.item.id) }); if (saved) setModal(null); }}> {modal.kind === 'demo' ? 'Načítať ukážku' : modal.kind === 'import' ? 'Obnoviť údaje' : 'Odstrániť'}</button></div></>}
    </Modal>}
  </div>;
}
function Stat({ label, value, detail, icon: Icon, accent }) { return <div className={`stat ${accent ? 'accent-stat' : ''}`}><div className="stat-label">{label}<Icon size={18}/></div><div className="stat-value">{value}</div><p>{detail}</p></div>; }
const monthNames = Array.from({ length: 12 }, (_, i) => new Date(2026, i, 1).toLocaleDateString('sk-SK', { month: 'long' }));
function PaymentSchedule({ item, month }) {
  const [frequency, setFrequency] = useState(item ? frequencyOf(item) : 'monthly');
  const [anchor, setAnchor] = useState(item?.anchorMonth ?? Number(month.split('-')[1]));
  const cycle = monthNames.filter((_, i) => isDueInMonth({ frequency, anchorMonth: anchor }, `2026-${String(i + 1).padStart(2, '0')}`));
  return <>
    <label>Opakovanie<select name="frequency" value={frequency} onChange={e => setFrequency(e.target.value)}>{Object.entries(frequencies).map(([value, f]) => <option key={value} value={value}>{f.label}</option>)}</select></label>
    {frequency !== 'monthly' && <label>{frequency === 'yearly' ? 'Mesiac ročnej platby' : 'Jeden z mesiacov kvartálnej platby'}<select name="anchorMonth" value={anchor} onChange={e => setAnchor(Number(e.target.value))}>{monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>}
    <div className="form-row"><Field label={frequency === 'monthly' ? 'Mesačná suma (€)' : frequency === 'quarterly' ? 'Suma za kvartál (€)' : 'Ročná suma (€)'} name="amount" type="number" min="0.01" step="0.01" required defaultValue={item?.amount}/><Field label="Deň splatnosti v mesiaci" name="day" type="number" min="1" max="31" step="1" required defaultValue={item?.day || 15}/></div>
    <p className="form-hint">{frequency === 'monthly' ? 'Platba je splatná každý mesiac.' : `Mesiace splatnosti: ${cycle.join(', ')}. Suma je za ${frequency === 'yearly' ? 'celý rok' : 'celý kvartál'}, nie za mesiac.`} Úhradu označíte v príslušnom mesiaci. Opakovanie platí aj pre predchádzajúce roky.</p>
  </>;
}
function Field({ label, ...props }) { return <label>{label}<input {...props}/></label>; }
function Modal({ title, close, children }) {
  const ref = useRef();
  useEffect(() => { const el = ref.current; el.showModal(); const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = old; }; }, []);
  return <dialog ref={ref} onCancel={close} onClick={e => { if (e.target === ref.current) { const rect = ref.current.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) close(); } }}><div className="modal-head"><h2>{title}</h2><button className="icon-btn" aria-label="Zavrieť" onClick={close}><X size={21}/></button></div>{children}</dialog>;
}
async function start() {
  let initialData = emptyData();
  let initialLoadError = false;
  try {
    const raw = await storage.getItem(DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!validData(parsed)) throw new Error('Invalid stored data');
      initialData = parsed;
    }
  } catch { initialLoadError = true; }
  createRoot(document.getElementById('root')).render(<App initialData={initialData} initialLoadError={initialLoadError}/>);
}
start();
