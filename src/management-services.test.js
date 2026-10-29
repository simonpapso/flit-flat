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

test('manager links accept web addresses and reject executable or malformed links',async()=>{
 const {serviceUrl}=await import('./service-links.js');
 const data=demoData();
 const service={id:'manager',name:'Správca',description:'',url:'https://spravca.example/portal?byt=1'};
 data.properties[0].managementServices=[service];assert.ok(validData(data));
 assert.equal(serviceUrl(service.url),service.url);
 assert.equal(serviceUrl('http://spravca.example'),'http://spravca.example/');
 for(const url of ['javascript:alert(1)','data:text/html,test','ftp://example.org','https://','//example.org','https://user:password@example.org',123,'x'.repeat(2049)]){
  assert.equal(serviceUrl(url),'');
  data.properties[0].managementServices=[{...service,url}];assert.equal(validData(data),false);
 }
 data.properties[0].managementServices=[{...service,url:''}];assert.ok(validData(data));
});
