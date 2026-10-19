import test from 'node:test';
import assert from 'node:assert/strict';
import { dueDate, status, validData, demoData, emptyData } from './data.js';
test('splatnosť rešpektuje kratšie mesiace a priestupný rok', () => {
  assert.equal(dueDate('2026-02', 31).getDate(), 28);
  assert.equal(dueDate('2028-02', 31).getDate(), 29);
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
