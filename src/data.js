export const categories = ['Elektrina', 'Plyn', 'Voda', 'Spoločné priestory', 'Internet', 'Poistenie', 'Iné'];
export const money = value => new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);
export const monthKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
export const frequencies = { monthly: { label: 'Mesačne', months: 1 }, quarterly: { label: 'Kvartálne', months: 3 }, yearly: { label: 'Ročne', months: 12 } };
export const frequencyOf = payment => payment.frequency ?? 'monthly';
export const monthlyAmount = payment => payment.amount / frequencies[frequencyOf(payment)].months;
export function isDueInMonth(payment, month) {
  const interval = frequencies[frequencyOf(payment)].months;
  const m = Number(month.split('-')[1]);
  return ((m - (payment.anchorMonth ?? 1)) % interval + interval) % interval === 0;
}
export function propertyFinance(property, payments) {
  const cost = payments.filter(p => p.propertyId === property.id).reduce((sum, p) => sum + monthlyAmount(p), 0);
  return { cost, profit: property.rent - cost };
}
export function dueDate(month, day) {
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m - 1, Math.min(day, new Date(year, m, 0).getDate()));
}
export function status(payment, month, today = new Date()) {
  if (payment.paidMonths.includes(month)) return 'paid';
  const end = dueDate(month, payment.day);
  end.setHours(23, 59, 59, 999);
  return end < today ? 'late' : 'pending';
}
export const emptyData = () => ({ version: 1, properties: [], payments: [] });
export function demoData() {
  const month = monthKey(new Date());
  return { version: 1, properties: [
    { id: 'p1', name: 'Byt na Ružovej', address: 'Ružová 12, Bratislava', type: '2-izbový byt', area: '54', tenant: 'Martin Novák', email: '', phone: '', rent: 690, note: '' },
    { id: 'p2', name: 'Byt pri parku', address: 'Parková 8, Bratislava', type: '3-izbový byt', area: '72', tenant: 'Lucia Kováčová', email: '', phone: '', rent: 850, note: '' }
  ], payments: [
    { id: 'a', propertyId: 'p1', category: 'Elektrina', supplier: 'ZSE', amount: 48, day: 15, paidMonths: [month] },
    { id: 'b', propertyId: 'p1', category: 'Plyn', supplier: 'SPP', amount: 35, day: 20, paidMonths: [] },
    { id: 'c', propertyId: 'p1', category: 'Voda', supplier: 'Správca domu', amount: 24, day: 15, paidMonths: [month] },
    { id: 'd', propertyId: 'p1', category: 'Internet', supplier: 'Orange', amount: 20, day: 25, paidMonths: [] },
    { id: 'e', propertyId: 'p2', category: 'Elektrina', supplier: 'ZSE', amount: 62, day: 15, paidMonths: [month] },
    { id: 'f', propertyId: 'p2', category: 'Spoločné priestory', supplier: 'Správca domu', amount: 95, day: 10, paidMonths: [] },
    { id: 'g', propertyId: 'p2', category: 'Poistenie', supplier: 'Allianz', amount: 18, day: 28, paidMonths: [] }
  ] };
}
export function validData(data) {
  return data?.version === 1 && Array.isArray(data.properties) && Array.isArray(data.payments)
    && new Set(data.properties.map(p => p.id)).size === data.properties.length
    && new Set(data.payments.map(p => p.id)).size === data.payments.length
    && data.properties.every(p => typeof p.id === 'string' && typeof p.name === 'string' && p.name.trim() && ['address', 'type', 'area', 'tenant', 'email', 'phone', 'note'].every(k => typeof p[k] === 'string') && Number.isFinite(p.rent) && p.rent >= 0)
    && data.payments.every(p => typeof p.id === 'string' && data.properties.some(x => x.id === p.propertyId) && categories.includes(p.category) && typeof p.supplier === 'string' && Number.isFinite(p.amount) && p.amount > 0 && Number.isInteger(p.day) && p.day >= 1 && p.day <= 31
      && Object.hasOwn(frequencies, frequencyOf(p))
      && (p.anchorMonth === undefined ? frequencyOf(p) === 'monthly' : Number.isInteger(p.anchorMonth) && p.anchorMonth >= 1 && p.anchorMonth <= 12)
      && Array.isArray(p.paidMonths) && p.paidMonths.every(m => /^\d{4}-(0[1-9]|1[0-2])$/.test(m)));
}
