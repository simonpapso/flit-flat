import test from 'node:test';
import assert from 'node:assert/strict';
import { demoData } from '../src/data.js';
import { buildReport, reportMonth, sendReport, recipients } from './monthly-report.js';

function fixture() {
  const data = demoData();
  data.properties = [{...data.properties[0], demo:false, name:'Byt <A>', rent:700, trackingStart:'2026-01', rentReceivedMonths:['2026-11']}];
  const base = {...data.payments[0], propertyId:'p1', paidMonths:['2026-11']};
  data.payments = [
    {...base, id:'electric', amount:50, supplier:'A & B'},
    {...base, id:'unpaid', category:'Plyn', amount:40, paidMonths:['2026-10']},
    {...base, id:'annual', amount:120, frequency:'yearly', anchorMonth:12},
    {...base, id:'once', amount:30, frequency:'once', scheduledMonth:'2026-11'},
    {...base, id:'repair', category:'Oprava', amount:999},
  ];
  return data;
}

test('report uses monthly receipt flags, due periods, energy categories and escaped names', () => {
  const report = buildReport(fixture(),'2026-11',new Date('2026-11-20T08:17:00Z'));
  assert.match(report.html,/700,00/);
  assert.match(report.html,/80,00/);
  assert.match(report.html,/Úhrada neevidovaná/);
  assert.match(report.html,/Byt &lt;A&gt;/);
  assert.match(report.html,/A &amp; B/);
  assert.doesNotMatch(report.html,/999,00|120,00/);
  assert.throws(() => buildReport({},'2026-11'));
});

test('local month and day are resolved in Europe/Berlin including summer', () => {
  assert.deepEqual(reportMonth(new Date('2026-11-19T23:30:00Z')), {month:'2026-11',day:20});
  assert.deepEqual(reportMonth(new Date('2026-06-30T22:30:00Z')), {month:'2026-07',day:1});
});

const env = {SUPABASE_SERVICE_ROLE_KEY:'secret', REPORT_USER_ID:'00000000-0000-4000-8000-000000000001', RESEND_API_KEY:'secret', REPORT_FROM:'Flit Flat <report@example.test>'};
const now = new Date('2026-11-20T08:17:00Z');
function client(result) {
  return {from(table) {assert.equal(table,'flit_workspaces');return {select(fields) {
    assert.equal(fields,'data');return {eq(key,value) {assert.equal(key,'user_id');assert.equal(value,env.REPORT_USER_ID);return {single:async()=>result};}};
  }}}};
}

test('sends only the explicitly selected workspace to both requested recipients', async () => {
  let calls = 0;
  const result = await sendReport({env,now,client:client({data:{data:fixture()}}),fetchImpl:async(url,options) => {
    calls++;
    assert.equal(url,'https://api.resend.com/emails');
    assert.deepEqual(JSON.parse(options.body).to,recipients);
    assert.match(options.headers['Idempotency-Key'],/2026-11$/);
    return {ok:true,json:async()=>({id:'accepted'})};
  }});
  assert.equal(result.sent,true);assert.equal(calls,1);
});

test('no email on other days, missing configuration, missing workspace or invalid data', async () => {
  const neverSend = async () => assert.fail('must not send');
  assert.deepEqual(await sendReport({env:{},now:new Date('2026-11-19T12:00:00Z'),fetchImpl:neverSend}),{skipped:true});
  await assert.rejects(sendReport({env:{},now,fetchImpl:neverSend}),/Chýba/);
  await assert.rejects(sendReport({env,now,client:client({error:{}}),fetchImpl:neverSend}),/načítať/);
  await assert.rejects(sendReport({env,now,client:client({data:{data:{}}}),fetchImpl:neverSend}),/Neplatné/);
});

test('provider rejection is a failed run rather than reported success', async () => {
  await assert.rejects(sendReport({env,now,client:client({data:{data:fixture()}}),fetchImpl:async()=>({ok:false,status:403})}),/HTTP 403/);
});
