import React from 'react';
import {tenantsOf,ageThisYear} from './tenants.js';
export default function TenantSummary({property}) {
 const tenants=tenantsOf(property);
 return <section className="tenant-summary"><h3>Nájomcovia · {tenants.length}</h3>{tenants.length?tenants.map(t=><article key={t.id}><strong>{t.name || 'Meno nevyplnené'}</strong><dl><dt>Telefón</dt><dd>{t.phone || 'Nevyplnený'}</dd><dt>E-mail</dt><dd>{t.email || 'Nevyplnený'}</dd><dt>Rok narodenia</dt><dd>{t.birthYear ?? 'Nevyplnený'}</dd><dt>Vek v tomto roku</dt><dd>{ageThisYear(t.birthYear) ?? 'Nevyplnený'}</dd><dt>Práca</dt><dd>{t.job || 'Nevyplnená'}</dd></dl></article>):<p className="form-hint">Nájomcov pridáte cez Upraviť údaje bytu.</p>}</section>;
}
