import test from 'node:test';
import assert from 'node:assert/strict';
import {tenantsOf,withTenants,ageThisYear,validTenants} from './tenants.js';
import {demoData,validData} from './data.js';
const people=[{id:'one',name:'Anna',phone:'0900123456',email:'anna@example.test',birthYear:1990,job:'Učiteľka'},{id:'two',name:'Peter',phone:'0900654321',email:'peter@example.test',birthYear:1988,job:'Technik'}];
test('legacy tenant contact details remain intact until explicitly edited',()=>{
 const old={tenant:'Anna',phone:'0900',email:'a@example.test',note:'Pôvodná poznámka'};
 const before=structuredClone(old),tenants=tenantsOf(old);
 assert.equal(tenants.length,1);assert.equal(tenants[0].phone,'0900');assert.deepEqual(old,before);
 assert.deepEqual(tenantsOf({tenant:'',phone:'',email:''}),[]);
});
test('multiple tenants preserve independent contact data, age and other property fields',()=>{
 const data=demoData();const original=structuredClone(data);
 const home=withTenants({...data.properties[0],layout:{items:[]},rentReceivedMonths:['2026-10']},people);
 assert.equal(home.tenant,'Anna, Peter');assert.equal(home.phone,people[0].phone);
 assert.deepEqual(tenantsOf(home),people);assert.equal(ageThisYear(1990,2026),36);
 assert.equal(ageThisYear(null,2026),null);assert.equal(ageThisYear(2030,2026),null);
 assert.ok(validData({...data,properties:[home,data.properties[1]]}));assert.deepEqual(data,original);
 const removed=withTenants(home,[people[1]]);assert.equal(removed.tenant,'Peter');assert.equal(removed.phone,people[1].phone);
 assert.equal(withTenants(home,[]).tenant,'');assert.deepEqual(home.rentReceivedMonths,['2026-10']);
});
test('invalid years and malformed or duplicated tenant records are rejected',()=>{
 assert.ok(validTenants(people));assert.ok(!validTenants([people[0],people[0]]));
 for(const birthYear of [1899,20399,1990.5,'1990'])assert.ok(!validTenants([{...people[0],birthYear}]));
 assert.ok(!validTenants([{...people[0],name:''}]));
});
