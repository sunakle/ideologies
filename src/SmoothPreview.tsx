import { useEffect, useState, type ReactNode } from 'react';
import type { Ideology } from './types';

const TRANSITION_MS=120;

export function preparePreviewImage(item:Ideology){
 if(!item.image)return Promise.resolve();
 const image=new Image();
 image.fetchPriority='high';
 image.src=import.meta.env.BASE_URL+item.image.src;
 return image.decode().catch(()=>{});
}

type LayerProps={item:Ideology;reduced:boolean;children:(item:Ideology)=>ReactNode};

function Crossfade({item,reduced,children,className}:{className:string}&LayerProps){
 const [layers,setLayers]=useState<{current:Ideology;previous:Ideology|null}>({current:item,previous:null});
 // Switch immediately, including during another fade: clicks never queue up.
 if(item.id!==layers.current.id)setLayers({current:item,previous:reduced?null:layers.current});

 useEffect(()=>{
  if(!layers.previous)return;
  if(reduced){setLayers(value=>({...value,previous:null}));return}
  const timer=setTimeout(()=>setLayers(value=>({...value,previous:null})),TRANSITION_MS);
  return()=>clearTimeout(timer);
 },[layers.current,layers.previous,reduced]);

 return <div className={className}>
  {layers.previous&&<div className="preview-layer preview-outgoing" key={layers.previous.id} aria-hidden="true" inert>{children(layers.previous)}</div>}
  <div className={`preview-layer ${layers.previous?'preview-incoming':''}`} key={layers.current.id} data-preview-id={layers.current.id}>{children(layers.current)}</div>
 </div>;
}

function PreviewMedia({item,reduced,children}:LayerProps){
 const [ready,setReady]=useState(item);
 useEffect(()=>{
  let active=true;
  preparePreviewImage(item).then(()=>{if(active)setReady(item)});
  return()=>{active=false};
 },[item]);

 // Only the picture waits for decoding; the title and summary update at once.
 return <Crossfade className="preview-media" item={ready} reduced={reduced}>{children}</Crossfade>;
}

export default function SmoothPreview({item,reduced,header,media,children}:LayerProps&{header:ReactNode;media:(item:Ideology)=>ReactNode}){
 return <aside className="preview-card" aria-label="Краткое описание идеологии"><div className="preview-scroll">
  {header}
  <PreviewMedia item={item} reduced={reduced}>{media}</PreviewMedia>
  <Crossfade className="preview-details" item={item} reduced={reduced}>{children}</Crossfade>
 </div></aside>;
}
