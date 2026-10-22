import {validTenants} from './tenants.js';
import { layoutShapes } from './layout-shapes.js';
export const categories = ['Elektrina', 'Plyn', 'Voda', 'Spoločné priestory', 'Internet', 'Poistenie', 'Údržba', 'Oprava', 'Nové spotrebiče', 'Hypotéka', 'Iné'];
export const money = value => new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);
export const monthKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
export const frequencies = { monthly: { label: 'Mesačne', months: 1 }, quarterly: { label: 'Kvartálne', months: 3 }, yearly: { label: 'Ročne', months: 12 }, once: { label: 'Jednorazovo', months: null } };
export const frequencyOf = payment => payment.frequency ?? 'monthly';
export const monthlyAmount = payment => frequencyOf(payment) === 'once' ? 0 : payment.amount / frequencies[frequencyOf(payment)].months;
export function isDueInMonth(payment, month) {
  if (frequencyOf(payment) === 'once') return payment.scheduledMonth === month;
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
    { demo: true, id: 'p1', name: 'Byt na Ružovej', address: 'Ružová 12, Bratislava', type: '2-izbový byt', area: '54', tenant: 'Martin Novák', email: '', phone: '', rent: 690, note: '' },
    { demo: true, id: 'p2', name: 'Byt pri parku', address: 'Parková 8, Bratislava', type: '3-izbový byt', area: '72', tenant: 'Lucia Kováčová', email: '', phone: '', rent: 850, note: '' }
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
export function demoProperties(data) {
  const samples = demoData().properties;
  return data.properties.filter(p => p.demo === true || samples.some(d => ['id','name','address','tenant'].every(k => p[k] === d[k])));
}
export function withoutDemo(data) {
  const ids = new Set(demoProperties(data).map(p => p.id));
  return { ...data, properties: data.properties.filter(p => !ids.has(p.id)), payments: data.payments.filter(p => !ids.has(p.propertyId)) };
}
export function validData(data) {
  return data?.version === 1 && Array.isArray(data.properties) && Array.isArray(data.payments)
    && new Set(data.properties.map(p => p.id)).size === data.properties.length
    && new Set(data.payments.map(p => p.id)).size === data.payments.length
    && data.properties.every(p => typeof p.id === 'string' && typeof p.name === 'string' && p.name.trim() && ['address', 'type', 'area', 'tenant', 'email', 'phone', 'note'].every(k => typeof p[k] === 'string') && Number.isFinite(p.rent) && p.rent >= 0
      && (p.tenants === undefined || validTenants(p.tenants))
      && (p.trackingStart === undefined || typeof p.trackingStart === 'string' && /^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/.test(p.trackingStart))
      && (p.cardPreview === undefined || p.cardPreview === 'illustration' || p.cardPreview === 'floorplan' || typeof p.cardPreview === 'string' && /^photo:.+/.test(p.cardPreview))
      && (p.rentReceivedMonths === undefined || Array.isArray(p.rentReceivedMonths) && p.rentReceivedMonths.every(m => typeof m === 'string' && /^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/.test(m)))
      && (p.price == null || Number.isFinite(p.price) && p.price >= 0)
      && (p.layout === undefined || validLayout(p.layout)))
    && data.payments.every(p => typeof p.id === 'string' && data.properties.some(x => x.id === p.propertyId) && categories.includes(p.category) && typeof p.supplier === 'string' && Number.isFinite(p.amount) && p.amount > 0 && Number.isInteger(p.day) && p.day >= 1 && p.day <= 31
      && Object.hasOwn(frequencies, frequencyOf(p))
      && (frequencyOf(p) !== 'once' || typeof p.scheduledMonth === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(p.scheduledMonth))
      && (p.note === undefined || typeof p.note === 'string' && p.note.length <= 2000)
      && (p.anchorMonth === undefined ? ['monthly','once'].includes(frequencyOf(p)) : Number.isInteger(p.anchorMonth) && p.anchorMonth >= 1 && p.anchorMonth <= 12)
      && Array.isArray(p.paidMonths) && p.paidMonths.every(m => /^\d{4}-(0[1-9]|1[0-2])$/.test(m)));
}
export function validLayout(layout) {
  return layout && Array.isArray(layout.items) && layout.items.length <= 300
    && new Set(layout.items.map(x => x.id)).size === layout.items.length
    && layout.items.every(x => typeof x.id === 'string' && ['room','furniture','door','window'].includes(x.kind)
      && (x.color === undefined || typeof x.color === 'string' && /^#[0-9a-f]{6}$/i.test(x.color))
      && (x.shape === undefined || layoutShapes.some(s => s.id === x.shape))
      && (x.lWidth === undefined || Number.isFinite(x.lWidth) && x.lWidth>=5 && x.lWidth<=95)
      && (x.lHeight === undefined || Number.isFinite(x.lHeight) && x.lHeight>=5 && x.lHeight<=95)
      && (x.doorHinge === undefined || ['left','right'].includes(x.doorHinge))
      && (x.doorSwing === undefined || ['in','out'].includes(x.doorSwing))
      && typeof x.name === 'string' && x.name.length <= 100 && typeof x.note === 'string' && x.note.length <= 2000
      && ['x','y','w','h','rotation'].every(k => Number.isFinite(x[k]))
      && x.x >= 0 && x.y >= 0 && x.w >= 1 && x.h >= 1 && x.x+x.w <= 100.001 && x.y+x.h <= 100.001
      && [0,90,180,270].includes(x.rotation) && Number.isInteger(x.quantity) && x.quantity >= 1 && x.quantity <= 999);
}

export function annualOverview(properties, payments, year, mode = 'due') {
  return Array.from({ length: 12 }, (_, i) => {
    const month = `${year}-${String(i + 1).padStart(2, '0')}`;
    const activeProperties = properties.filter(p => (p.trackingStart ?? '0000-01') <= month);
    const ids = new Set(activeProperties.map(p => p.id));
    const costs = payments.filter(p => ids.has(p.propertyId) && isDueInMonth(p, month) && (mode !== 'paid' || p.paidMonths.includes(month))).reduce((sum, p) => sum + p.amount, 0);
    const rent = activeProperties.filter(p => mode !== 'paid' || (p.rentReceivedMonths || []).includes(month)).reduce((sum, p) => sum + p.rent, 0);
    return { month, rent, costs, balance: rent - costs, active: activeProperties.length > 0 };
  });
}

export function withTrackingStart(data, month = monthKey(new Date())) {
  if (data.properties.every(p => p.trackingStart !== undefined)) return data;
  return { ...data, properties: data.properties.map(p => p.trackingStart === undefined ? { ...p, trackingStart: month } : p) };
}

export function toggleRentReceived(property, month) {
  if (!/^(19|[2-9]\d)\d{2}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Neplatný mesiac');
  const months = property.rentReceivedMonths || [];
  return { ...property, rentReceivedMonths: months.includes(month) ? months.filter(m => m !== month) : [...months, month] };
}
