import React, { useEffect, useRef, useState } from 'react';
import { Cloud, LogIn, LogOut, RefreshCw, ShieldCheck, ArrowRight, Upload, House } from 'lucide-react';
import { supabase, initialRecovery } from './supabase.js';
import { createCloudBackend } from './cloud-backend.js';
import { setCloudBackend, getCloudBackend } from './cloud-runtime.js';
import { storage, DATA_KEY } from './storage.js';
import { localAllFiles } from './attachments.js';
import { emptyData, validData, withTrackingStart } from './data.js';
const LOCAL_FLAG='flit-local-mode';
export default function CloudGate({children}) {
  const [view,setView]=useState('loading');const [user,setUser]=useState(null);const [localData,setLocalData]=useState(emptyData());const [cloudData,setCloudData]=useState(emptyData());const [error,setError]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [authMode,setAuthMode]=useState('login');
  const backend=useRef(null);const generation=useRef(0);const recovering=useRef(initialRecovery);const authForm=useRef();
  const loadLocal=async()=>{const raw=await storage.getItem(DATA_KEY);if(!raw)return emptyData();const data=JSON.parse(raw);if(!validData(data))throw new Error('Lokálne údaje sa nepodarilo načítať. Pôvodné úložisko nebolo zmenené.');return withTrackingStart(data);};
  const useLocal=()=>{generation.current++;backend.current=null;setCloudBackend(null);sessionStorage.setItem(LOCAL_FLAG,'1');setView('local');setError('');};
  const openSession=async session=>{
    const token=++generation.current;setCloudBackend(null);backend.current=null;setUser(session?.user || null);setError('');
    try{
      if(!session){const local=await loadLocal();if(token!==generation.current)return;setLocalData(local);setView('auth');return;}
      setView('loading');const cloud=createCloudBackend(supabase,session.user);await cloud.load();
      let local=emptyData();try{local=await loadLocal();}catch(e){setError(e.message);}if(token!==generation.current)return;
      const prepared=withTrackingStart(cloud.data);if(prepared!==cloud.data)await cloud.write(prepared);if(token!==generation.current)return;
      backend.current=cloud;setLocalData(local);setCloudData(prepared);
      if(cloud.revision===0 && local.properties.length){setView('migrate');return;}
      setCloudBackend(cloud);setView('cloud');
    }catch(e){if(token===generation.current){setError(e.message);setView('error');}}
  };
  useEffect(()=>{
    let live=true;
    supabase.auth.getSession().then(({data,error})=>{
      if(!live)return;
      if(sessionStorage.getItem(LOCAL_FLAG)==='1'){useLocal();return;}
      if(recovering.current && data.session){setUser(data.session.user);setView('reset');return;}
      if(error){setError('Prihlásenie sa nepodarilo overiť. Skúste znova.');setView('error');return;}
      openSession(data.session);
    }).catch(()=>{if(live){setError('Pripojenie k prihlasovaniu zlyhalo.');setView('error');}});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      if(event==='PASSWORD_RECOVERY'){recovering.current=true;generation.current++;setCloudBackend(null);setUser(session?.user);setView('reset');return;}
      if(event==='SIGNED_OUT'){generation.current++;setCloudBackend(null);backend.current=null;setUser(null);setCloudData(emptyData());if(!sessionStorage.getItem(LOCAL_FLAG))setView('auth');}
      if(event==='SIGNED_IN' && !sessionStorage.getItem(LOCAL_FLAG) && backend.current?.user.id!==session?.user.id){setTimeout(()=>{if(live && !recovering.current)openSession(session);},0);}
    });
    return()=>{live=false;generation.current++;subscription.unsubscribe();setCloudBackend(null);};
  },[]);
  const authenticate=async e=>{
    e.preventDefault();setError('');setMessage('');setBusy(true);
    const form=new FormData(e.currentTarget);const email=String(form.get('email')).trim();const password=String(form.get('password'));
    try{
      const result=authMode==='signup'?await supabase.auth.signUp({email,password,options:{emailRedirectTo:`${window.location.origin}${window.location.pathname}`}}):await supabase.auth.signInWithPassword({email,password});
      if(result.error)throw result.error;
      if(!result.data.session){setMessage('Otvorte potvrdzovací e-mail zo Supabase a potvrďte adresu. Potom sa sem vráťte a prihláste.');setAuthMode('login');}
      else await openSession(result.data.session);
    }catch(e){setError(e.message?.includes('Invalid login')?'E-mail alebo heslo nie je správne.':e.message?.includes('Email not confirmed')?'Najprv potvrďte svoju e-mailovú adresu.':'Prihlásenie alebo registrácia zlyhala. Skontrolujte údaje, pripojenie a nastavenie Supabase.');}finally{setBusy(false);}
  };
  const forgot=async()=>{
    const input=authForm.current?.elements.email;if(!input?.reportValidity())return;
    setBusy(true);setError('');setMessage('');
    const {error}=await supabase.auth.resetPasswordForEmail(input.value.trim(),{redirectTo:`${window.location.origin}${window.location.pathname}`});
    setBusy(false);if(error)setError('Žiadosť sa nepodarilo odoslať. Skúste neskôr alebo skontrolujte nastavenie e-mailov Supabase.');
    else setMessage('Ak účet existuje, príde vám e-mail s odkazom na nastavenie nového hesla.');
  };
  const resetPassword=async e=>{
    e.preventDefault();const form=new FormData(e.currentTarget);
    if(form.get('password')!==form.get('confirm')){setError('Heslá sa nezhodujú.');return;}
    setBusy(true);setError('');
    try{const {error}=await supabase.auth.updateUser({password:String(form.get('password'))});if(error)throw error;recovering.current=false;const {data}=await supabase.auth.getSession();await openSession(data.session);}
    catch{setError('Heslo sa nepodarilo zmeniť. Odkaz mohol vypršať; požiadajte o nový.');}finally{setBusy(false);}
  };
  const migrate=async()=>{
    if(!window.confirm(`Preniesť ${localData.properties.length} nehnuteľnosti a všetky ich lokálne prílohy do účtu ${user.email}? Lokálna kópia zostane zachovaná.`))return;
    setBusy(true);setError('');
    try{const files=(await localAllFiles()).filter(f=>localData.properties.some(p=>p.id===f.propertyId));await backend.current.restore(localData,files);setCloudData(localData);setCloudBackend(backend.current);setView('cloud');}catch(e){setError(e.message);}finally{setBusy(false);}
  };
  const signOut=async()=>{
    if(getCloudBackend()?.busy)return;
    if(!window.confirm('Odhlásiť sa? Neuložené zmeny formulárov sa stratia.'))return;
    setBusy(true);const {error}=await supabase.auth.signOut({scope:'local'});setBusy(false);
    if(error)setError('Odhlásenie zlyhalo. Skúste znova.');else{setCloudBackend(null);backend.current=null;setUser(null);setCloudData(emptyData());setView('auth');}
  };
  if(view==='cloud'||view==='local')return <><div className="connection-bar"><span>{view==='cloud'?<Cloud size={15}/>:<House size={15}/>}<strong className="connection-mode">{view==='cloud'?'Súkromný cloud':'Iba toto zariadenie'}</strong><span className="connection-account" title={view==='cloud'?user?.email:'Údaje sa nesynchronizujú'}>{view==='cloud'?user?.email:'Údaje sa nesynchronizujú'}</span></span><div>{view==='cloud'?<><button disabled={busy} aria-label="Načítať aktuálne údaje" title="Načítať aktuálne údaje" onClick={()=>window.location.reload()}><RefreshCw size={16}/><span className="connection-action-label">Načítať aktuálne údaje</span></button><button disabled={busy} aria-label="Odhlásiť" title="Odhlásiť" onClick={signOut}><LogOut size={16}/><span className="connection-action-label">Odhlásiť</span></button></>:<button aria-label="Prihlásiť a synchronizovať" title="Prihlásiť a synchronizovať" onClick={()=>{sessionStorage.removeItem(LOCAL_FLAG);window.location.reload();}}><LogIn size={16}/><span className="connection-action-label">Prihlásiť a synchronizovať</span></button>}</div></div>{error&&<div className="connection-error" role="alert">{error}</div>}{children({mode:view,initialData:view==='cloud'?cloudData:null})}</>;
  return <main className="auth-screen"><div className="auth-brand"><House size={26}/>flitflat.</div><section className="auth-card"><span className="auth-symbol"><ShieldCheck size={28}/></span><h1>{view==='loading'?'Načítavam bezpečné pripojenie…':view==='migrate'?'Prenesme vaše byty do cloudu':view==='error'?'Cloud zatiaľ nie je dostupný':view==='reset'?'Nastavte si nové heslo':'Vaše byty. Na každom zariadení.'}</h1>
    {view==='loading'?<p>Overujem prihlásenie a načítavam vaše údaje.</p>:<>
    {error&&<div className="warning" role="alert">{error}</div>}{message&&<div className="auth-message" role="status">{message}</div>}
    {view==='auth'&&<><p>Prihláste sa rovnakým účtom doma, v práci aj v telefóne. Údaje a súbory budú patriť len vám.</p><div className="auth-mode"><button className={authMode==='login'?'selected':''} onClick={()=>setAuthMode('login')}>Prihlásenie</button><button className={authMode==='signup'?'selected':''} onClick={()=>setAuthMode('signup')}>Vytvoriť účet v aplikácii</button></div><form ref={authForm} onSubmit={authenticate}><label>E-mail<input name="email" type="email" autoComplete="username" required maxLength={254}/></label><label>Heslo<input name="password" type="password" autoComplete={authMode==='signup'?'new-password':'current-password'} minLength={8} maxLength={128} required/></label><button className="primary" disabled={busy}>{busy?'Pripájam…':authMode==='signup'?'Vytvoriť účet':'Prihlásiť sa'}<ArrowRight size={16}/></button></form>{authMode==='login' && <button className="text-btn" disabled={busy} onClick={forgot}>Zabudli ste heslo?</button>}<p className="auth-note">Ide o účet vo Flit Flat, nie o prihlasovacie údaje do administrácie Supabase.</p></>}
    {view==='reset'&&<form onSubmit={resetPassword}><label>Nové heslo<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required/></label><label>Zopakujte nové heslo<input name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128} required/></label><button className="primary" disabled={busy}>Uložiť nové heslo</button></form>}
    {view==='migrate'&&<><p>Na tomto zariadení sú {localData.properties.length} nehnuteľnosti. Cloudový účet <strong>{user?.email}</strong> je zatiaľ prázdny. Prenos zahrnie platby, dokumenty, fotky aj pôdorysy a miestnu kópiu nevymaže.</p><button className="primary" disabled={busy} onClick={migrate}><Upload size={16}/>{busy?'Prenášam údaje a súbory…':'Preniesť údaje z tohto zariadenia'}</button><button className="secondary" disabled={busy} onClick={()=>{setCloudBackend(backend.current);setView('cloud');}}>Začať s prázdnym cloudom</button></>}
    {view==='migrate'&&error&&<button className="secondary" onClick={()=>window.location.reload()}>Načítať aktuálny stav</button>}
    {view==='error'&&<><p>Nezadávajte údaje do nového prázdneho portfólia, ak očakávate existujúce záznamy. Najprv obnovte pripojenie.</p><button className="primary" onClick={()=>window.location.reload()}><RefreshCw size={16}/>Skúsiť znova</button></>}
    <button className="text-btn auth-local" disabled={busy} onClick={useLocal}>Pokračovať iba s údajmi v tomto zariadení</button>
    </>}
  </section></main>;
}
