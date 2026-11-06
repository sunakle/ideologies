import Fuse from 'fuse.js';
import type { Ideology } from './types';
export const normalize = (s:string) => s.toLocaleLowerCase('ru').replaceAll('ё','е').replace(/[^\p{L}\p{N}\s-]/gu,' ').replace(/\s+/g,' ').trim();
// A conservative suffix fold for common Russian inflections; fuzzy matching handles typos.
export const stems = (s:string) => normalize(s).split(' ').filter(Boolean).map(w=> w.length>5 ? w.replace(/(иями|ами|ями|ого|ему|ому|ыми|ими|ая|яя|ое|ее|ые|ие|ий|ый|ой|ов|ев|ам|ям|ах|ях|ом|ем|а|я|ы|и|у|ю|е)$/u,'') : w);
export function makeSearch(data:Ideology[]){
 const fuse = new Fuse(data,{keys:[{name:'name',weight:4},{name:'english',weight:3},{name:'aliases',weight:3},'summary','ideas','history','critique','people','variants'],threshold:0.32,ignoreLocation:true,minMatchCharLength:3});
 const corpus = new Map(data.map(d=>[d.id,normalize([d.name,d.english,...d.aliases,d.summary,...d.ideas,d.history,d.critique,...d.people,...d.variants].join(' '))]));
 return (query:string):Ideology[] => {
  if(!query.trim())return data;
  const exact = [...query.matchAll(/["«]([^"»]+)["»]/g)].map(m=>normalize(m[1]));
  const rest=query.replace(/["«][^"»]+["»]/g,'').trim();
  const tokens=stems(rest);
  const literal=data.filter(d=>exact.every(p=>corpus.get(d.id)!.includes(p))&&tokens.every(t=>corpus.get(d.id)!.includes(t)));
  if(exact.length)return literal;
  const fuzzy=fuse.search(query).map(r=>r.item);
  return [...new Map([...literal,...fuzzy].map(d=>[d.id,d])).values()];
 };
}
