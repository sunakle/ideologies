import fs from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('..',import.meta.url).pathname.replace(/^\/(.:)/,'$1'));
const catalogPath=path.join(root,'src/catalog.json');
const imageDir=path.join(root,'public','images');
const clean=s=>(s||'').replace(/<[^>]*>/g,' ').replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const crop=(s,n)=>s.length<=n?s:s.slice(0,n).replace(/\s+\S*$/,'')+'…';
const licenseOk=s=>/(public domain|cc(?:0|\s|-)|creative commons|gfdl|gnu|pd-)/i.test(s||'');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function json(url){for(let attempt=0;attempt<5;attempt++){await delay(320);const r=await fetch(url,{headers:{'User-Agent':'AtlasIdeologiy/2.3 educational project (educational atlas; contact via github.com/sunakle/ideologies)'}});if(r.ok)return r.json();if(r.status===429||r.status===503){await delay((attempt+1)*4000);continue}throw new Error(`${r.status} ${url}`)}throw new Error(`rate limit ${url}`)}

async function wikiItem(name,english){for(const [host,term] of [['ru.wikipedia.org',name],['en.wikipedia.org',english]])try{const p=new URLSearchParams({action:'query',format:'json',origin:'*',generator:'search',gsrsearch:term,gsrlimit:'1',gsrnamespace:'0',prop:'pageprops',redirects:'1'});const j=await json(`https://${host}/w/api.php?${p}`),page=Object.values(j.query?.pages||{})[0];if(page?.pageprops?.wikibase_item)return page.pageprops.wikibase_item}catch{}return null}
async function commonsCategory(qid,english){
 if(qid)try{const j=await json(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`);const value=j.entities?.[qid]?.claims?.P373?.[0]?.mainsnak?.datavalue?.value;if(value)return value}catch{}
 try{const p=new URLSearchParams({action:'query',format:'json',origin:'*',generator:'search',gsrsearch:`intitle:"${english}"`,gsrnamespace:'14',gsrlimit:'5'}),j=await json(`https://commons.wikimedia.org/w/api.php?${p}`);const pages=Object.values(j.query?.pages||{}),target=english.toLowerCase().replace(/[^a-z0-9]+/g,' ');pages.sort((a,b)=>{const score=x=>{const t=x.title.toLowerCase().replace(/^category:/,'').replace(/[^a-z0-9]+/g,' ');return t===target?100:t.includes(target)?60:0};return score(b)-score(a)});return pages[0]?.title?.replace(/^Category:/,'')||null}catch{return null}
}
async function categoryFiles(category){if(!category)return[];try{const p=new URLSearchParams({action:'query',format:'json',origin:'*',list:'categorymembers',cmtitle:'Category:'+category,cmnamespace:'6',cmtype:'file',cmlimit:'100'}),j=await json(`https://commons.wikimedia.org/w/api.php?${p}`);return(j.query?.categorymembers||[]).map(x=>x.title)}catch{return[]}}
const manualFiles={
 'crypto-anarchism':'File:Crypto-Anarchist flag with symbol.png',
 'radical-feminism':'File:Radical feminism.svg',
 'anarcha-feminism':'File:Anarchist Feminism flag 3.2 ratio.svg',
 'egoist-anarchism':'File:Flag of Anarcho-egoism.svg',
 'agorism':'File:Agorism flag.svg'
};
function score(title,d){const t=title.toLowerCase(),tokens=d.english.toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>3);let s=tokens.filter(x=>t.includes(x)).length*25;if(/flag|symbol|emblem|logo|banner/.test(t))s+=34;if(/portrait|protest|rally|demonstration|congress|meeting/.test(t))s+=15;if(/map|locator|coat of arms|pdf|webm|ogv|audio|book cover/.test(t))s-=45;return s}
async function meta(title){try{const p=new URLSearchParams({action:'query',format:'json',origin:'*',prop:'imageinfo',iiprop:'url|mime|extmetadata',iiurlwidth:'960',titles:title}),j=await json(`https://commons.wikimedia.org/w/api.php?${p}`),info=Object.values(j.query?.pages||{})[0]?.imageinfo?.[0],m=info?.extmetadata||{},license=clean(m.LicenseShortName?.value||m.UsageTerms?.value||'');if(!info||!info.mime?.startsWith('image/')||!licenseOk(license))return null;return{url:info.thumburl||info.url,source:info.descriptionurl,author:crop(clean(m.Artist?.value||m.Credit?.value||'Автор не указан'),260),license,licenseUrl:clean(m.LicenseUrl?.value||info.descriptionurl),description:crop(clean(m.ImageDescription?.value||title.replace(/^File:/,'')),300),title}}catch{return null}}
async function save(id,m){if(!m?.url)return null;try{const r=await fetch(m.url,{headers:{'User-Agent':'AtlasIdeologiy/2.3'}});if(!r.ok)return null;const b=Buffer.from(await r.arrayBuffer());if(b.length<1200)return null;const type=r.headers.get('content-type')||'',ext=type.includes('png')?'.png':type.includes('webp')?'.webp':'.jpg',filename=id+'-commons'+ext;await fs.writeFile(path.join(imageDir,filename),b);return'images/'+filename}catch{return null}}

const data=JSON.parse(await fs.readFile(catalogPath,'utf8'));
const queue=data.filter(d=>d.image?.contextual);let cursor=0,checked=0,replaced=0;
async function worker(){while(cursor<queue.length){const d=queue[cursor++];let files=[];if(manualFiles[d.id])files=[manualFiles[d.id]];else{const qid=await wikiItem(d.name,d.english),category=await commonsCategory(qid,d.english);files=await categoryFiles(category)}files.sort((a,b)=>score(b,d)-score(a,d));let m=null;for(const title of files.slice(0,18)){m=await meta(title);if(m)break}const src=await save(d.id,m);if(src){d.image={src,caption:`${d.name}: тематическая иллюстрация из Wikimedia Commons. ${m.description}`,author:m.author,license:m.license,licenseUrl:m.licenseUrl,source:m.source,changes:'Масштабирование и кадрирование для интерфейса.',verified:'2026-11-06',representative:true};replaced++}checked++;if(checked%20===0){await fs.writeFile(catalogPath,JSON.stringify(data,null,2));console.log(`checked ${checked}/${queue.length}; replaced ${replaced}`)}}}
await worker();
await fs.writeFile(catalogPath,JSON.stringify(data,null,2));
const attrs={};for(const d of data)if(d.image)attrs[d.id]=d.image;await fs.writeFile(path.join(imageDir,'attribution.json'),JSON.stringify(attrs,null,2));
console.log(JSON.stringify({checked,replaced,contextualRemaining:data.filter(d=>d.image?.contextual).length,representative:data.filter(d=>d.image?.representative).length},null,2));
