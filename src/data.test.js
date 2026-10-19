import test from 'node:test';
import assert from 'node:assert/strict';
import { dueDate, status, validData, demoData, emptyData, isDueInMonth, monthlyAmount, propertyFinance } from './data.js';
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
