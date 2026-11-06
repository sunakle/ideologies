import { useEffect, useState, type ReactNode } from 'react';
import type { Ideology } from './types';

const TRANSITION_MS=280;

function prepareImage(item:Ideology){
 if(!item.image)return Promise.resolve();
 const image=new Image();
 image.src=import.meta.env.BASE_URL+item.image.src;
 // Keep the previous card on screen until the next image is ready to paint.
 return image.decode().catch(()=>{});
}

export default function SmoothPreview({item,reduced,children}:{item:Ideology;reduced:boolean;children:(item:Ideology)=>ReactNode}){
 const [ready,setReady]=useState(item);
 const [layers,setLayers]=useState<{current:Ideology;previous:Ideology|null}>({current:item,previous:null});

 useEffect(()=>{
  let active=true;
  prepareImage(item).then(()=>{if(active)setReady(item)});
  return()=>{active=false};
 },[item]);

 useEffect(()=>{
  if(layers.previous||ready.id!==item.id||ready.id===layers.current.id)return;
  setLayers({current:ready,previous:reduced?null:layers.current});
 },[ready,item,layers,reduced]);

 useEffect(()=>{
  if(!layers.previous)return;
  if(reduced){setLayers(value=>({...value,previous:null}));return}
  const timer=setTimeout(()=>setLayers(value=>({...value,previous:null})),TRANSITION_MS);
  return()=>clearTimeout(timer);
 },[layers.previous,reduced]);

 // At most two cards coexist. A rapid sequence waits for the current fade,
 // then displays only the latest requested entry, never a stale image load.
 return <aside className="preview-card" aria-label="Краткое описание идеологии" aria-busy={item.id!==layers.current.id}>
  {layers.previous&&<div className="preview-layer preview-outgoing" key={layers.previous.id} aria-hidden="true" inert>{children(layers.previous)}</div>}
  <div className={`preview-layer ${layers.previous?'preview-incoming':''}`} key={layers.current.id} data-preview-id={layers.current.id}>{children(layers.current)}</div>
 </aside>;
}
