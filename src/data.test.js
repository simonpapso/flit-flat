import test from 'node:test';
import assert from 'node:assert/strict';
import { dueDate, status, validData, demoData, emptyData, isDueInMonth, monthlyAmount, propertyFinance, annualOverview, withTrackingStart, demoProperties, withoutDemo } from './data.js';
test('splatnosť rešpektuje kratšie mesiace a priestupný rok', () => {
  assert.equal(dueDate('2026-02', 31).getDate(), 28);
  assert.equal(dueDate('2028-02', 31).getDate(), 29);
});
test('mesačný zisk z príkladu je 440 eur a nezávisí od označenia úhrady', () => {
  const property = { id: 'home', rent: 620 };
  const payments = [{ propertyId: 'home', amount: 180, paidMonths: [] }, { propertyId: 'other', amount: 500 }];
  assert.deepEqual(propertyFinance(property, payments), { cost: 180, profit: 440 });
  payments[0].paidMonths.push('2026-10');
  assert.equal(propertyFinance(property, payments).profit, 440);
  property.rent = 100;
  assert.equal(propertyFinance(property, payments).profit, -80);
});
test('ročné a kvartálne náklady sa pomerne započítajú aj mimo mesiaca splatnosti', () => {
  const yearly = { propertyId: 'a', frequency: 'yearly', amount: 120, anchorMonth: 2 };
  const quarterly = { propertyId: 'a', frequency: 'quarterly', amount: 90, anchorMonth: 11 };
  assert.equal(monthlyAmount(yearly), 10);
  assert.equal(monthlyAmount(quarterly), 30);
  assert.deepEqual(propertyFinance({ id: 'a', rent: 620 }, [yearly, quarterly]), { cost: 40, profit: 580 });
});
test('ročná platba sa zobrazí len vo svojom mesiaci každý rok', () => {
  const p = { frequency: 'yearly', anchorMonth: 2 };
  assert.equal(isDueInMonth(p, '2026-02'), true);
  assert.equal(isDueInMonth(p, '2027-02'), true);
  assert.equal(isDueInMonth(p, '2026-03'), false);
  assert.equal(isDueInMonth(p, '2026-01'), false);
});
test('kvartálny cyklus funguje aj cez koniec roka a pred zvoleným mesiacom', () => {
  const p = { frequency: 'quarterly', anchorMonth: 11 };
  const due = Array.from({ length: 12 }, (_, i) => i + 1).filter(m => isDueInMonth(p, `2026-${String(m).padStart(2, '0')}`));
  assert.deepEqual(due, [2, 5, 8, 11]);
  assert.equal(isDueInMonth(p, '2027-02'), true);
  assert.equal(dueDate('2027-02', 31).getDate(), 28);
});
test('staré zálohy ostávajú mesačné a nové zálohy validujú opakovanie', () => {
  const data = demoData();
  assert.equal(validData(data), true);
  assert.equal(monthlyAmount(data.payments[0]), 48);
  assert.equal(isDueInMonth(data.payments[0], '2027-03'), true);
  data.payments[0].frequency = 'yearly';
  assert.equal(validData(data), false);
  data.payments[0].anchorMonth = 2;
  assert.equal(validData(data), true);
  data.payments[0].anchorMonth = 13;
  assert.equal(validData(data), false);
  data.payments[0].anchorMonth = 1;
  data.payments[0].frequency = 'weekly';
  assert.equal(validData(data), false);
});
test('stav platby je oddelený pre každý mesiac a celý deň splatnosti', () => {
  const payment = { day: 15, paidMonths: ['2026-09'] };
  assert.equal(status(payment, '2026-09', new Date(2026, 9, 16)), 'paid');
  assert.equal(status(payment, '2026-10', new Date(2026, 9, 15, 18)), 'pending');
  assert.equal(status(payment, '2026-10', new Date(2026, 9, 16)), 'late');
});
test('import prijíma platné dáta a odmieta chybné sumy aj neexistujúce byty', () => {
  assert.equal(validData(emptyData()), true);
  const data = demoData();
  assert.equal(validData(data), true);
  data.payments[0].amount = -1;
  assert.equal(validData(data), false);
  data.payments[0].amount = 10;
  data.payments[0].propertyId = 'missing';
  assert.equal(validData(data), false);
});

test('jednorazové výdavky patria len jednému mesiacu a nevstupujú do pravidelného priemeru', () => {
 const p={frequency:'once',scheduledMonth:'2026-10',amount:800};
 assert.equal(isDueInMonth(p,'2026-10'),true);
 assert.equal(isDueInMonth(p,'2027-10'),false);
 assert.equal(isDueInMonth(p,'2026-11'),false);
 assert.equal(monthlyAmount(p),0);
 const data=demoData();data.payments[0]={...data.payments[0],...p,category:'Nové spotrebiče'};
 assert.equal(validData(data),true);delete data.payments[0].scheduledMonth;assert.equal(validData(data),false);
});
test('ročný graf rozlišuje splatnosť, úhrady a nehnuteľnosti a zahŕňa jednorazové náklady', async () => {
 const {annualOverview}=await import('./data.js');
 const properties=[{id:'a',rent:620},{id:'b',rent:800}];
 const payments=[
  {propertyId:'a',amount:180,paidMonths:['2026-01']},
  {propertyId:'a',amount:120,frequency:'yearly',anchorMonth:2,paidMonths:[]},
  {propertyId:'a',amount:90,frequency:'quarterly',anchorMonth:2,paidMonths:[]},
  {propertyId:'a',amount:800,frequency:'once',scheduledMonth:'2026-10',paidMonths:['2026-10']},
  {propertyId:'b',amount:100,paidMonths:[]}
 ];
 const all=annualOverview(properties,payments,2026);
 assert.equal(all.length,12);assert.equal(all[0].rent,1420);assert.equal(all[1].costs,490);assert.equal(all[9].costs,1080);
 const home=annualOverview([properties[0]],payments,2026);assert.equal(home[9].balance,-360);
 assert.equal(annualOverview([properties[0]],payments,2027)[9].costs,180);
 const paid=annualOverview(properties,payments,2026,'paid');assert.equal(paid[0].costs,180);assert.equal(paid[1].costs,0);assert.equal(paid[9].costs,800);
 for(let i=0;i<12;i++)assert.equal(all[i].costs,home[i].costs+annualOverview([properties[1]],payments,2026)[i].costs);
});

test('štatistiky započítajú každý byt a jeho platby až od jeho začiatku evidencie',()=>{
 const homes=[{id:'a',rent:620,trackingStart:'2026-10'},{id:'b',rent:800,trackingStart:'2026-12'}];
 const payments=[{propertyId:'a',amount:180,paidMonths:['2026-01','2026-10']},{propertyId:'b',amount:100,paidMonths:[]},{propertyId:'a',amount:900,frequency:'once',scheduledMonth:'2026-09',paidMonths:[]}];
 const year=annualOverview(homes,payments,2026);
 assert.equal(year[8].active,false);assert.equal(year[8].rent,0);assert.equal(year[8].costs,0);
 assert.equal(year[9].rent,620);assert.equal(year[9].costs,180);
 assert.equal(year[11].rent,1420);assert.equal(year[11].costs,280);
 assert.equal(year.reduce((s,p)=>s+p.rent,0),2660);
 assert.equal(annualOverview(homes,payments,2026,'paid')[0].costs,0);
 assert.equal(annualOverview(homes,payments,2026,'paid')[9].costs,180);
 assert.equal(annualOverview(homes,payments,2025).some(p=>p.active),false);
});
test('staré dáta dostanú začiatok evidencie iba raz a platné dátumy sa nemenia',()=>{
 const data=demoData();data.properties[1].trackingStart='2025-03';
 const migrated=withTrackingStart(data,'2026-10');
 assert.equal(migrated.properties[0].trackingStart,'2026-10');assert.equal(migrated.properties[1].trackingStart,'2025-03');
 assert.equal(withTrackingStart(migrated,'2027-01'),migrated);
 assert.deepEqual(migrated.payments,data.payments);assert.equal(validData(migrated),true);
 migrated.properties[0].trackingStart='2026-13';assert.equal(validData(migrated),false);
});

test('ukončenie ukážky zachová skutočné byty aj ich platby a rozpozná starú ukážku',()=>{
 const data=demoData();delete data.properties[0].demo;delete data.properties[1].demo;
 const real={...data.properties[0],id:'real',name:'Môj byt'};
 data.properties.push(real);data.payments.push({...data.payments[0],id:'real-payment',propertyId:'real'});
 assert.equal(demoProperties(data).length,2);
 const next=withoutDemo(data);assert.deepEqual(next.properties,[real]);assert.equal(next.payments.length,1);assert.equal(next.payments[0].propertyId,'real');assert.equal(validData(next),true);
 assert.equal(data.properties.length,3);
});

test('rent receipt is independent by property and month and preserves legacy records', async () => {
 const { toggleRentReceived, demoData, validData } = await import('./data.js');
 const data = demoData(), original = structuredClone(data);
 const first = toggleRentReceived(data.properties[0], '2026-10');
 const second = toggleRentReceived(first, '2026-11');
 assert.deepEqual(second.rentReceivedMonths, ['2026-10','2026-11']);
 assert.deepEqual(toggleRentReceived(second,'2026-10').rentReceivedMonths,['2026-11']);
 assert.deepEqual(data,original);
 assert.ok(validData({...data,properties:[{...second,cardPreview:'photo:sample'},data.properties[1]]}));
 assert.ok(!validData({...data,properties:[{...first,rentReceivedMonths:['2026-13']}]}));
 assert.ok(!validData({...data,properties:[{...first,cardPreview:'bad'}]}));
 assert.throws(()=>toggleRentReceived(first,'2026-00'));
});
