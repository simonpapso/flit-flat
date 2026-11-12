import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { isDueInMonth, money, validData } from '../src/data.js';
import { SUPABASE_URL } from '../src/supabase-config.js';

export const recipients = ['simonpapso@gmail.com', 'janahorkova39@gmail.com'];
const energyCategories = new Set(['Elektrina', 'Plyn', 'Voda', 'Spoločné priestory', 'Internet']);
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));

export function reportMonth(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now).map(p => [p.type, p.value]));
  return { month: `${parts.year}-${parts.month}`, day: Number(parts.day) };
}

export function buildReport(data, month, now = new Date()) {
  if (!validData(data) || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Neplatné údaje reportu.');
  const homes = data.properties.filter(p => (p.trackingStart ?? '0000-01') <= month && !p.demo);
  let rentTotal = 0, energyTotal = 0;
  const sections = homes.map(home => {
    const received = (home.rentReceivedMonths || []).includes(month);
    if (received) rentTotal += home.rent;
    const payments = data.payments.filter(p => p.propertyId === home.id && energyCategories.has(p.category) && isDueInMonth(p, month));
    const rows = payments.map(p => {
      const paid = p.paidMonths.includes(month);
      if (paid) energyTotal += p.amount;
      return `<tr><td>${escapeHtml(p.category)} · ${escapeHtml(p.supplier)}</td><td>${money(p.amount)}</td><td>${paid ? 'Uhradené' : 'Úhrada neevidovaná'}</td></tr>`;
    }).join('');
    return `<h2>${escapeHtml(home.name)}</h2><p>Prijaté nájomné: <strong>${received ? money(home.rent) : 'Prijatie neevidované'}</strong></p><table border="1" cellpadding="8" cellspacing="0"><tr><th>Energia / služba</th><th>Suma</th><th>Stav</th></tr>${rows || '<tr><td colspan="3">Žiadne predpisy energií na tento mesiac.</td></tr>'}</table>`;
  }).join('');
  const asOf = new Intl.DateTimeFormat('sk-SK', {timeZone:'Europe/Berlin', dateStyle:'medium', timeStyle:'short'}).format(now);
  return {
    subject: `Flit Flat · nájomné a energie · ${month}`,
    html: `<html lang="sk"><body><h1>Nájomné a energie · ${month}</h1><p>Stav ručnej evidencie vo Flit Flat k ${asOf} (Europe/Berlin).</p><p>Prijaté nájomné spolu: <strong>${money(rentTotal)}</strong><br>Uhradené energie a služby spolu: <strong>${money(energyTotal)}</strong></p>${sections || '<p>V tomto mesiaci nie sú evidované nehnuteľnosti.</p>'}<p>Zahrnuté energie a služby: elektrina, plyn, voda, spoločné priestory a internet. Ostatné náklady nie sú zahrnuté. Sumy a označenia úhrad patria k mesiacu evidencie, nie k dátumu bankového prevodu. Neevidovaná úhrada neznamená potvrdený nedoplatok. Report zachytáva stav v čase odoslania; neskoršie úpravy v ňom nie sú.</p></body></html>`,
  };
}

export async function sendReport({env = process.env, now = new Date(), fetchImpl = fetch, client} = {}) {
  const {month, day} = reportMonth(now);
  // Also guard manual dispatches: this report is only sent on the requested day.
  if (day !== 20) return { skipped: true };
  for (const name of ['SUPABASE_SERVICE_ROLE_KEY', 'REPORT_USER_ID', 'RESEND_API_KEY', 'REPORT_FROM']) {
    if (!env[name]?.trim()) throw new Error(`Chýba GitHub Secret ${name}.`);
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(env.REPORT_USER_ID)) throw new Error('REPORT_USER_ID musí byť UUID vlastníka údajov.');
  const db = client ?? createClient(SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false, autoRefreshToken:false}});
  const {data: row, error} = await db.from('flit_workspaces').select('data').eq('user_id', env.REPORT_USER_ID).single();
  if (error || !row) throw new Error('Nepodarilo sa načítať cloudový účet reportu. E-mail nebol odoslaný.');
  const report = buildReport(row.data, month, now);
  const response = await fetchImpl('https://api.resend.com/emails', {
    method:'POST', signal:AbortSignal.timeout(30000),
    headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`, 'Content-Type':'application/json', 'Idempotency-Key':`flit-flat/${env.REPORT_USER_ID}/${month}`},
    body:JSON.stringify({from:env.REPORT_FROM, to:recipients, ...report}),
  });
  // Never print provider bodies or financial data into public workflow logs.
  if (!response.ok) throw new Error(`E-mailová služba odmietla report (HTTP ${response.status}).`);
  const result = await response.json();
  if (!result.id) throw new Error('E-mailová služba nepotvrdila prijatie reportu.');
  return {sent:true, month};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  sendReport().then(result => console.log(result.skipped ? 'Dnes nie je 20. deň; report preskočený.' : `Report ${result.month} prijala e-mailová služba.`))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
