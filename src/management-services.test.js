import test from 'node:test';
import assert from 'node:assert/strict';
import {demoData, validData} from './data.js';

test('management services are optional for existing apartments and validate independently',()=>{
 const data=demoData();assert.ok(validData(data));
 const service={id:'cleaning',name:'Upratovanie',description:'Spoločné priestory\nKaždý pondelok'};
 data.properties[0].managementServices=[service];
 assert.ok(validData(JSON.parse(JSON.stringify(data))));
 assert.equal(data.properties[1].managementServices,undefined);
 for(const invalid of [null,{},[null],[{...service,name:' '}],[{...service,description:7}],[{...service,description:'x'.repeat(2001)}],[service,service]]){
  const copy=structuredClone(data);copy.properties[0].managementServices=invalid;
  assert.equal(validData(copy),false,JSON.stringify(invalid));
 }
 data.properties[0].managementServices=[];assert.ok(validData(data));
});
