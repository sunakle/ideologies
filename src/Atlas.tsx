import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { families, type Ideology, type Family } from './types';
import { Plus, Minus, RotateCcw, Maximize2, Compass, Layers3, Info } from 'lucide-react';

type Props={items:Ideology[];selected?:Ideology;onSelect:(id:string)=>void;onCatalog:()=>void;mode:'3d'|'2d';setMode:(s:'3d'|'2d')=>void;reduced:boolean};
export default function Atlas({items,selected,onSelect,onCatalog,mode,setMode,reduced}:Props){
 const host=useRef<HTMLDivElement>(null);
 const labels=useRef<HTMLDivElement>(null);
 const api=useRef<{zoom:(n:number)=>void;reset:()=>void;front:()=>void;focus:(d:Ideology)=>void}|null>(null);
 const [failed,setFailed]=useState(false);
 const [clustered,setClustered]=useState(false);
 const [help,setHelp]=useState(false);
 const [hover,setHover]=useState<Ideology|null>(null);
 const selectedRef=useRef(selected);selectedRef.current=selected;
 const lastSelected=useRef(selected?.id);
 const selectRef=useRef(onSelect);selectRef.current=onSelect;
 useEffect(()=>{
  if(!host.current||!labels.current)return;
  const container=host.current, labelRoot=labels.current;
  let renderer:THREE.WebGLRenderer;
  try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{setFailed(true);return;}
  setFailed(false);renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setClearColor(0x101510,0);container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','Трёхмерная карта политических идеологий. Для навигации с клавиатуры используйте список направлений.');
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(43,1,0.1,200);
  camera.position.set(...(mode==='2d'?[0,0,39]:[25,19,29]) as [number,number,number]);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=!reduced;controls.dampingFactor=0.09;controls.minDistance=9;controls.maxDistance=140;controls.enableRotate=mode==='3d';
  controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};
  const geometries:THREE.BufferGeometry[]=[];const materials:THREE.Material[]=[];
  const plane=(color:number,rotation:[number,number,number])=>{
   const g=new THREE.PlaneGeometry(20,20);geometries.push(g);
   const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.055,side:THREE.DoubleSide,depthWrite:false});materials.push(m);
   const mesh=new THREE.Mesh(g,m);mesh.rotation.set(...rotation);scene.add(mesh);
   const points:THREE.Vector3[]=[];
   for(let i=-10;i<=10;i+=2){points.push(new THREE.Vector3(i,-10,0),new THREE.Vector3(i,10,0),new THREE.Vector3(-10,i,0),new THREE.Vector3(10,i,0));}
   const gridG=new THREE.BufferGeometry().setFromPoints(points);geometries.push(gridG);
   const gridM=new THREE.LineBasicMaterial({color,transparent:true,opacity:0.22,depthWrite:false});materials.push(gridM);
   const grid=new THREE.LineSegments(gridG,gridM);grid.rotation.copy(mesh.rotation);scene.add(grid);
  };
  plane(0xa5bb8b,[0,0,0]);if(mode==='3d'){plane(0x8da8d8,[Math.PI/2,0,0]);plane(0xbd96b9,[0,Math.PI/2,0]);}
  const axisLabels:{el:HTMLDivElement;position:THREE.Vector3}[]=[];
  const axis=(end:[number,number,number],color:number,text:string)=>{
   const dir=new THREE.Vector3(...end);const length=dir.length();dir.normalize();
   const arrow=new THREE.ArrowHelper(dir,new THREE.Vector3(),length,color,0.35,0.15);scene.add(arrow);
   const el=document.createElement('div');el.className='axis-label';el.textContent=text;el.style.color='#'+color.toString(16).padStart(6,'0');labelRoot.appendChild(el);
   axisLabels.push({el,position:new THREE.Vector3(...end).multiplyScalar(1.13)});
  };
  axis([11.3,0,0],0xc8c189,'РЫНОК');axis([-11.3,0,0],0xc8c189,'ОБЩЕСТВ. СОБСТВЕННОСТЬ');
  axis([0,11.3,0],0x9cadce,'АВТОРИТАРИЗМ');axis([0,-11.3,0],0x9cadce,'СВОБОДА');
  if(mode==='3d'){axis([0,0,11.3],0xb49db7,'ПРОГРЕСС');axis([0,0,-11.3],0xb49db7,'ТРАДИЦИЯ');}
  const texCanvas=document.createElement('canvas');texCanvas.width=64;texCanvas.height=64;
  const ctx=texCanvas.getContext('2d')!;const gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(255,255,255,1)');gradient.addColorStop(.15,'rgba(255,255,255,1)');gradient.addColorStop(.3,'rgba(255,255,255,.45)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const texture=new THREE.CanvasTexture(texCanvas);
  const nodes:{sprite:THREE.Sprite;el:HTMLButtonElement;data?:Ideology;family?:Family}[]=[];
  const createNode=(position:THREE.Vector3,color:string,text:string,data?:Ideology,family?:Family)=>{
   const material=new THREE.SpriteMaterial({map:texture,color,transparent:true,depthWrite:false});materials.push(material);
   const sprite=new THREE.Sprite(material);sprite.position.copy(position);sprite.scale.setScalar(data?0.85:1.4);sprite.userData={id:data?.id,family};scene.add(sprite);
   const el=document.createElement('button');el.className='map-label';el.textContent=text;el.style.setProperty('--dot',color);el.tabIndex=-1;
   el.onclick=()=>{if(data)selectRef.current(data.id);else zoomTo(position,29)};
   labelRoot.appendChild(el);nodes.push({sprite,el,data,family});
  };
  const mapped=items.filter(d=>d.coords);
  mapped.forEach(d=>createNode(new THREE.Vector3(d.coords![0],d.coords![1],mode==='2d'?0:d.coords![2]),families[d.family].color,d.name,d));
  (Object.keys(families) as Family[]).forEach(f=>{
   const group=mapped.filter(d=>d.family===f);if(!group.length)return;
   const center=group.reduce((v,d)=>v.add(new THREE.Vector3(d.coords![0],d.coords![1],mode==='2d'?0:d.coords![2])),new THREE.Vector3()).divideScalar(group.length);
   createNode(center,families[f].color,`${families[f].short} · ${group.length}`,undefined,f);
  });
  const ringG=new THREE.RingGeometry(.38,.43,48);geometries.push(ringG);const ringM=new THREE.MeshBasicMaterial({color:0xf1f4dd,side:THREE.DoubleSide,transparent:true,opacity:0.9,depthTest:false});materials.push(ringM);const ring=new THREE.Mesh(ringG,ringM);scene.add(ring);
  let frame=0,alive=true,width=1,height=1,lastCluster=false,baseDistance=46,firstSize=true;
  let desiredTarget:THREE.Vector3|null=null,desiredPosition:THREE.Vector3|null=null;
  function zoomTo(target:THREE.Vector3,distance:number){
   const direction=camera.position.clone().sub(controls.target).normalize();desiredTarget=target.clone();desiredPosition=target.clone().add(direction.multiplyScalar(distance));
  }
  api.current={zoom(n){zoomTo(controls.target,THREE.MathUtils.clamp(camera.position.distanceTo(controls.target)*n,9,140))},reset(){desiredTarget=new THREE.Vector3();desiredPosition=(mode==='2d'?new THREE.Vector3(0,0,1):new THREE.Vector3(25,19,29).normalize()).multiplyScalar(baseDistance)},front(){desiredTarget=new THREE.Vector3();desiredPosition=new THREE.Vector3(0,0,baseDistance)},focus(d){if(d.coords)zoomTo(new THREE.Vector3(d.coords[0]*.25,d.coords[1]*.25,mode==='2d'?0:d.coords[2]*.25),baseDistance*.87)}};
  controls.addEventListener('start',()=>{desiredTarget=null;desiredPosition=null});
  const resize=new ResizeObserver(()=>{width=container.clientWidth;height=container.clientHeight;renderer.setSize(width,height);camera.aspect=width/Math.max(1,height);baseDistance=Math.max(43,34/camera.aspect);if(firstSize){camera.position.normalize().multiplyScalar(baseDistance);firstSize=false}camera.updateProjectionMatrix()});resize.observe(container);
  const ray=new THREE.Raycaster();const pointer=new THREE.Vector2();let start=[0,0];
  const pick=(e:PointerEvent)=>{
   const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/width*2-1,-(e.clientY-rect.top)/height*2+1);ray.setFromCamera(pointer,camera);
   return ray.intersectObjects(nodes.filter(n=>n.sprite.visible).map(n=>n.sprite))[0]?.object;
  };
  const down=(e:PointerEvent)=>{start=[e.clientX,e.clientY]};
  const up=(e:PointerEvent)=>{if(Math.hypot(start[0]-e.clientX,start[1]-e.clientY)>5)return;const hit=pick(e);if(hit?.userData.id)selectRef.current(hit.userData.id);else if(hit?.userData.family)zoomTo(hit.position,29)};
  const move=(e:PointerEvent)=>{const hit=pick(e);renderer.domElement.style.cursor=hit?'pointer':'grab';setHover(hit?.userData.id?items.find(d=>d.id===hit.userData.id)??null:null)};
  const leave=()=>setHover(null);
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerleave',leave);
  const position=(v:THREE.Vector3)=>{const p=v.clone().project(camera);return {x:(p.x+1)/2*width,y:(1-p.y)/2*height,z:p.z}};
  function render(){
   if(!alive)return;
   if(desiredTarget&&desiredPosition){const speed=reduced?1:.09;controls.target.lerp(desiredTarget,speed);camera.position.lerp(desiredPosition,speed);if(camera.position.distanceTo(desiredPosition)<.025){desiredPosition=null;desiredTarget=null}}
   controls.update();
   const distance=camera.position.distanceTo(controls.target);const clustered=distance>baseDistance*1.33;
   if(clustered!==lastCluster){lastCluster=clustered;setClustered(clustered)}
   const occupied:{x:number;y:number;w:number}[]=[];
   const selectedId=selectedRef.current?.id;
   const sorted=[...nodes].sort((a,b)=>Number(b.data?.id===selectedId)-Number(a.data?.id===selectedId));
   let count=0;const limit=distance<baseDistance*.65?24:14;
   sorted.forEach(n=>{
    const active=clustered?!!n.family:!!n.data;n.sprite.visible=active;
    const p=position(n.sprite.position);const isSelected=n.data?.id===selectedId;
    n.sprite.scale.setScalar(n.family?1.6:isSelected?1.15:.75);
    const w=Math.min(190,n.el.textContent!.length*6.3+18);
    const inView=p.z<1&&p.z>-1&&p.x>12&&p.x<width-w-12&&p.y>25&&p.y<height-40;
    const clear=!occupied.some(r=>Math.abs(r.y-p.y)<26&&p.x<r.x+r.w+12&&p.x+w>r.x-12);
    const visible=active&&inView&&(isSelected||clear)&&(count<limit||isSelected||clustered);
    n.el.style.display=visible?'block':'none';n.el.classList.toggle('selected',isSelected);
    if(visible){n.el.style.transform=`translate(${p.x+9}px,${p.y-11}px)`;occupied.push({x:p.x,y:p.y,w});count++}
   });
   axisLabels.forEach(a=>{const p=position(a.position);a.el.style.display=p.z<1&&p.x>5&&p.x<width-5&&p.y>15&&p.y<height-15?'block':'none';a.el.style.transform=`translate(${p.x}px,${p.y}px) translate(-50%,-50%)`});
   const sel=nodes.find(n=>n.data?.id===selectedId);ring.visible=!!sel&&!clustered;if(sel){ring.position.copy(sel.sprite.position);ring.quaternion.copy(camera.quaternion)}
   renderer.render(scene,camera);frame=requestAnimationFrame(render);
  }render();
  const lost=(e:Event)=>{e.preventDefault();setFailed(true)};renderer.domElement.addEventListener('webglcontextlost',lost);
  return()=>{alive=false;cancelAnimationFrame(frame);resize.disconnect();controls.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());texture.dispose();scene.traverse(o=>{if(o instanceof THREE.ArrowHelper){o.line.geometry.dispose();o.cone.geometry.dispose()}});renderer.dispose();renderer.domElement.remove();labelRoot.replaceChildren();api.current=null};
 },[items,mode,reduced]);
 useEffect(()=>{if(selected&&lastSelected.current!==selected.id)api.current?.focus(selected);lastSelected.current=selected?.id},[selected?.id]);
 return <div className="atlas-stage">
  <div className="stage-top"><span><span className="live-dot"/> {clustered?'СЕМЕЙСТВА ИДЕОЛОГИЙ':'ПРОСТРАНСТВО ИДЕЙ'}</span><div className="segmented"><button aria-pressed={mode==='3d'} onClick={()=>setMode('3d')}><Layers3 size={13}/>3D</button><button aria-pressed={mode==='2d'} onClick={()=>setMode('2d')}>2D</button></div></div>
  <div className="canvas-host" ref={host}/><div className="map-labels" ref={labels}/>
  {failed&&<div className="map-fallback"><Compass size={38}/><h3>Карта недоступна на этом устройстве</h3><p>Все статьи, поиск и сравнение работают в каталоге.</p><button className="primary" onClick={onCatalog}>Открыть каталог</button></div>}
  {!failed&&items.filter(d=>d.coords).length===0&&<div className="map-fallback"><h3>Нет точек для этих фильтров</h3><p>Направления без однозначных координат доступны в каталоге.</p><button onClick={onCatalog}>Открыть каталог</button></div>}
  {hover&&<div className="map-tooltip"><strong>{hover.name}</strong><p>{hover.summary.slice(0,170)}…</p><small>Нажмите на точку, чтобы исследовать</small></div>}
  <div className="map-tools"><button title="Приблизить" aria-label="Приблизить" onClick={()=>api.current?.zoom(.8)}><Plus size={17}/></button><button title="Отдалить" aria-label="Отдалить" onClick={()=>api.current?.zoom(1.25)}><Minus size={17}/></button><span/><button title="Сбросить камеру" aria-label="Сбросить камеру" onClick={()=>api.current?.reset()}><RotateCcw size={16}/></button><button title="Вид спереди" aria-label="Вид спереди" onClick={()=>api.current?.front()}><Maximize2 size={16}/></button><button title="Как управлять картой" aria-label="Как управлять картой" aria-expanded={help} onClick={()=>setHelp(!help)}><Info size={16}/></button></div>
  {help&&<div className="map-help"><strong>Исследуйте пространство</strong><p>Потяните — вращение. Колесо — масштаб. Правая кнопка или два пальца — перемещение. Нажмите на точку — откроется карточка.</p><p>На дальнем масштабе точки объединяются в семейства. Режим 2D показывает экономику и власть; культурная ось скрыта.</p><button onClick={()=>setHelp(false)}>Понятно</button></div>}
  <div className="stage-bottom"><span className="orientation">↗ <b>Y</b> <span>X</span> <i>Z</i></span><span>{mode==='3d'?'Вращайте · приближайте · исследуйте':'Экономика × политическая власть'}</span><span className="map-count">{items.filter(d=>d.coords).length} точек</span></div>
 </div>;
}
