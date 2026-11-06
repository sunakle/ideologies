export const MIN_MAP_DISTANCE=5.5;
export const MAX_MAP_DISTANCE=140;

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
