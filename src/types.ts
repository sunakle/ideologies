export type Family = 'liberal'|'socialist'|'anarchist'|'conservative'|'national'|'religious'|'ecological'|'regional';
export interface Source {title:string;url:string}
export interface HistoricalImage {src:string;caption:string;author:string;license:string;licenseUrl?:string;changes?:string;source:string;url?:string;contextual?:boolean;representative?:boolean}
export interface Ideology {id:string;name:string;english:string;aliases:string[];family:Family;kind:string;year:number;era:string;regions:string[];summary:string;ideas:string[];history:string;critique:string;people:string[];variants:string[];related:string[];coords:[number,number,number]|null;uncertainty:number;placement:string;sources:Source[];checked:string;image?:HistoricalImage}
export const families:Record<Family,{name:string;color:string;short:string}> = {
 liberal:{name:'Либеральные',short:'Либерализм',color:'#dfc86d'},
 socialist:{name:'Социалистические',short:'Социализм',color:'#e58b91'},
 anarchist:{name:'Анархистские',short:'Анархизм',color:'#b999e3'},
 conservative:{name:'Консервативные',short:'Консерватизм',color:'#83ace0'},
 national:{name:'Национальные',short:'Национализм',color:'#e4a06c'},
 religious:{name:'Религиозно-политические',short:'Религия и политика',color:'#bcb48e'},
 ecological:{name:'Экологические',short:'Экологизм',color:'#90c69e'},
 regional:{name:'Региональные и освободительные',short:'Регионы и освобождение',color:'#74c7c2'}
};
