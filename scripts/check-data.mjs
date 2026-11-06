import fs from 'node:fs';
import assert from 'node:assert/strict';
const data=JSON.parse(fs.readFileSync(new URL('../src/catalog.json',import.meta.url),'utf8'));
assert(data.length>0,'Catalog must not be empty');
const ids=new Set(data.map(d=>d.id));assert.equal(ids.size,data.length,'Duplicate IDs');
const families=['liberal','socialist','anarchist','conservative','national','religious','ecological','regional'];
for(const d of data){
 assert(/^[a-z0-9-]+$/.test(d.id),d.id+' invalid slug');
 for(const key of ['name','english','summary','history','critique','placement','kind','era','checked'])assert(typeof d[key]==='string'&&d[key].length>0,`${d.id}: missing ${key}`);
 for(const key of ['ideas','people','variants','regions','sources'])assert(Array.isArray(d[key])&&d[key].length>0,`${d.id}: empty ${key}`);
 assert(d.summary.length>100&&d.history.length>180&&d.critique.length>120,`${d.id}: article too thin`);
 assert(families.includes(d.family),`${d.id}: invalid family`);
 assert(Number.isFinite(d.year),`${d.id}: invalid date`);
 assert(d.coords===null||(d.coords.length===3&&d.coords.every(n=>Number.isFinite(n)&&n>=-10&&n<=10)),`${d.id}: invalid coordinates`);
 assert(d.uncertainty>=0&&d.uncertainty<=10,`${d.id}: invalid range`);
 d.related.forEach(id=>assert(ids.has(id),`${d.id}: broken related ${id}`));
 d.sources.forEach(s=>{assert(s.title.length>3);assert(new URL(s.url).protocol==='https:',`${d.id}: non-HTTPS source`)});
 if(d.image){assert(fs.existsSync(new URL('../public/'+d.image.src,import.meta.url)),`${d.id}: missing image`);assert(d.image.caption&&d.image.author&&d.image.license&&d.image.source,`${d.id}: incomplete attribution`)}
}
console.log(`PASS: ${data.length} articles, ${data.filter(d=>d.coords).length} mapped, ${data.filter(d=>d.image).length} illustrated; schemas, links, coordinates and local assets valid.`);
