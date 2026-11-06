import fs from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname.replace(/^\/(.:)/,'$1'));
const catalogPath=path.join(root,'src/catalog.json');
const imageDir=path.join(root,'public','images');
const clean=s=>(s||'').replace(/<[^>]*>/g,' ').replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const crop=(s,n)=>s.length<=n?s:s.slice(0,n).replace(/\s+\S*$/,'')+'…';
async function json(url){const r=await fetch(url,{headers:{'User-Agent':'AtlasIdeologiy/2.2 educational project'}});if(!r.ok)throw new Error(String(r.status));return r.json()}
async function pageImage(name,english){for(const [host,term] of [['ru.wikipedia.org',name],['en.wikipedia.org',english]])try{const p=new URLSearchParams({action:'query',format:'json',origin:'*',generator:'search',gsrsearch:term,gsrlimit:'1',gsrnamespace:'0',prop:'pageimages',piprop:'name|thumbnail|original',pithumbsize:'800',redirects:'1'});const j=await json(`https://${host}/w/api.php?${p}`);const page=Object.values(j.query?.pages||{})[0];if(page?.pageimage)return page.pageimage}catch{}return null}
async function meta(file){if(!file)return null;for(const host of ['commons.wikimedia.org','en.wikipedia.org','ru.wikipedia.org'])try{const p=new URLSearchParams({action:'query',format:'json',origin:'*',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'800',titles:'File:'+file});const j=await json(`https://${host}/w/api.php?${p}`);const info=Object.values(j.query?.pages||{})[0]?.imageinfo?.[0],m=info?.extmetadata||{},license=clean(m.LicenseShortName?.value||m.UsageTerms?.value||'');if(!info||!/(public domain|cc |creative commons|gfdl|gnu|pd-)/i.test(license))continue;return{url:info.thumburl||info.url,source:info.descriptionurl,author:crop(clean(m.Artist?.value||m.Credit?.value||'Автор не указан'),260),license,licenseUrl:clean(m.LicenseUrl?.value||info.descriptionurl),caption:crop(clean(m.ImageDescription?.value||file),360)}}catch{}return null}
async function save(id,m){if(!m?.url)return null;const ext=/\.png(?:\?|$)/i.test(m.url)?'.png':'.jpg',filename=id+'-page'+ext;try{const r=await fetch(m.url,{headers:{'User-Agent':'AtlasIdeologiy/2.2'}});if(!r.ok)return null;const b=Buffer.from(await r.arrayBuffer());if(b.length<2500)return null;await fs.writeFile(path.join(imageDir,filename),b);return'images/'+filename}catch{return null}}

const data=JSON.parse(await fs.readFile(catalogPath,'utf8'));
const subjects={
 'national-bolshevism':['Эрнст Никиш','Ernst Niekisch'],fascism:['Бенито Муссолини','Benito Mussolini'],nazism:['Адольф Гитлер','Adolf Hitler'],baathism:['Мишель Афляк','Michel Aflaq'],
 'western-marxism':['Дьёрдь Лукач','György Lukács'],austromarxism:['Отто Бауэр','Otto Bauer'],titoism:['Иосип Броз Тито','Josip Broz Tito'],hoxhaism:['Энвер Ходжа','Enver Hoxha'],
 castroism:['Фидель Кастро','Fidel Castro'],guevarism:['Че Гевара','Che Guevara'],sankarism:['Тома Санкара','Thomas Sankara'],luxemburgism:['Роза Люксембург','Rosa Luxemburg'],
 kautskyism:['Карл Каутский','Karl Kautsky'],georgism:['Генри Джордж','Henry George'],gaullism:['Шарль де Голль','Charles de Gaulle'],nasserism:['Гамаль Абдель Насер','Gamal Abdel Nasser']
};
const queue=data.filter(d=>d.image?.contextual);let cursor=0,checked=0,replaced=0;
async function worker(){while(cursor<queue.length){const d=queue[cursor++],terms=subjects[d.id]||[d.name,d.english],file=await pageImage(terms[0],terms[1]),m=await meta(file),src=await save(d.id,m);if(src){d.image={src,caption:m.caption||`${d.name}: иллюстрация со страницы направления.`,author:m.author,license:m.license,licenseUrl:m.licenseUrl,source:m.source,changes:'Масштабирование и кадрирование для интерфейса.',verified:'2026-11-06'};replaced++}checked++;if(checked%20===0){await fs.writeFile(catalogPath,JSON.stringify(data,null,2));console.log(`checked ${checked}/${queue.length}; replaced ${replaced}`)}}}
await Promise.all(Array.from({length:6},worker));
await fs.writeFile(catalogPath,JSON.stringify(data,null,2));
const attrs={};for(const d of data)if(d.image)attrs[d.id]=d.image;await fs.writeFile(path.join(imageDir,'attribution.json'),JSON.stringify(attrs,null,2));
console.log(JSON.stringify({checked,replaced,contextualRemaining:data.filter(d=>d.image?.contextual).length},null,2));
