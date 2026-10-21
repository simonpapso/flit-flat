export function tenantsOf(property) {
  if (Array.isArray(property.tenants)) return property.tenants;
  return property.tenant || property.phone || property.email ? [{ id:'legacy', name:property.tenant || '', phone:property.phone || '', email:property.email || '', birthYear:property.birthYear ?? null, job:property.job || '' }] : [];
}
export function ageThisYear(birthYear, year = new Date().getFullYear()) {
  return Number.isInteger(birthYear) && birthYear >= 1900 && birthYear <= year ? year - birthYear : null;
}
export function validTenants(tenants) {
  return Array.isArray(tenants) && tenants.length <= 50 && tenants.every(t=>t && typeof t==='object') && new Set(tenants.map(t=>t.id)).size === tenants.length
    && tenants.every(t=>t && typeof t.id==='string' && t.id.length>0 && ['name','phone','email','job'].every(k=>typeof t[k]==='string')
      && t.name.trim().length>0 && t.name.length<=100 && t.phone.length<=40 && t.email.length<=150 && t.job.length<=150
      && (t.birthYear===null || Number.isInteger(t.birthYear) && t.birthYear>=1900 && t.birthYear<=new Date().getFullYear()));
}
export function withTenants(property, tenants) {
  return {...property,tenants,tenant:tenants.map(t=>t.name).join(', '),phone:tenants[0]?.phone || '',email:tenants[0]?.email || ''};
}
