export const MIN_MAP_DISTANCE=5.5;
export const MAX_MAP_DISTANCE=140;

// A band of zoom levels replaces the former single-frame detail switch.
export function mapDetailTarget(distanceRatio:number){
 const t=Math.max(0,Math.min(1,(1.58-distanceRatio)/.42));
 return t*t*(3-2*t);
}

export function advanceMapDetail(current:number,target:number,deltaSeconds:number,reduced=false){
 if(reduced)return target;
 const value=current+(target-current)*(1-Math.exp(-Math.max(0,Math.min(.05,deltaSeconds))/.22));
 return Math.abs(value-target)<.0005?target:value;
}

export function nextZoomDistance(distance:number,deltaPixels:number){
 const delta=Math.max(-240,Math.min(240,deltaPixels));
 return Math.max(MIN_MAP_DISTANCE,Math.min(MAX_MAP_DISTANCE,distance*Math.exp(delta*.0018)));
}

export function placeHoverCard(x:number,y:number,width:number,height:number,bounds:{left:number;right:number;top:number;bottom:number}){
 const gap=18;
 const left=x+gap+width<=bounds.right?x+gap:x-gap-width;
 const top=y+gap+height<=bounds.bottom?y+gap:y-gap-height;
 return {x:Math.max(bounds.left,Math.min(left,bounds.right-width)),y:Math.max(bounds.top,Math.min(top,bounds.bottom-height))};
}
