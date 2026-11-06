import test from 'node:test';
import assert from 'node:assert/strict';
import {nextZoomDistance,placeHoverCard,MIN_MAP_DISTANCE,MAX_MAP_DISTANCE,mapDetailTarget,advanceMapDetail} from '../src/mapInteraction.ts';

test('hover card appears next to the cursor in available space',()=>{
 assert.deepEqual(placeHoverCard(100,100,260,180,{left:12,right:788,top:12,bottom:588}),{x:118,y:118});
});
test('hover card flips at bottom and right edges and stays on screen',()=>{
 assert.deepEqual(placeHoverCard(780,570,260,180,{left:12,right:788,top:12,bottom:588}),{x:502,y:372});
 const p=placeHoverCard(10,15,260,180,{left:12,right:288,top:12,bottom:218});
 assert(p.x>=12&&p.x+260<=288&&p.y>=12&&p.y+180<=218);
});
test('partly scrolled map keeps the tooltip inside the visible viewport',()=>{
 const p=placeHoverCard(300,470,260,180,{left:12,right:600,top:360,bottom:590});
 assert(p.y>=360&&p.y+180<=590);
});
test('wheel input is proportional and accumulates before animation ends',()=>{
 const start=46,one=nextZoomDistance(start,-100),two=nextZoomDistance(one,-100);
 assert(one<start&&two<one);
 assert(Math.abs(two-nextZoomDistance(start,-200))<1e-9);
 assert(Math.abs(nextZoomDistance(one,100)-start)<1e-9);
 assert(nextZoomDistance(start,-2)>one);
});
test('zoom remains within the allowed camera distances',()=>{
 assert.equal(nextZoomDistance(MIN_MAP_DISTANCE,-200),MIN_MAP_DISTANCE);
 assert.equal(nextZoomDistance(MAX_MAP_DISTANCE,200),MAX_MAP_DISTANCE);
 assert.equal(nextZoomDistance(40,0),40);
 assert(Number.isFinite(nextZoomDistance(46,100000)));
});

test('families and individual nodes blend across a continuous zoom range',()=>{
 assert.equal(mapDetailTarget(1.1),1);
 assert.equal(mapDetailTarget(1.7),0);
 const samples=[1.2,1.3,1.4,1.5].map(mapDetailTarget);
 assert(samples.every(n=>n>0&&n<1));
 assert(samples.every((n,i)=>i===0||n<samples[i-1]));
 assert(Math.abs(mapDetailTarget(1.3301)-mapDetailTarget(1.3299))<.002);
});

test('a sudden zoom change cannot expand all ideologies in one frame',()=>{
 let level=advanceMapDetail(0,1,1/60);
 assert(level>0&&level<.1);
 for(let i=0;i<60;i++){const next=advanceMapDetail(level,1,1/60);assert(next>=level&&next<=1);level=next}
 assert(level>.98);
 assert.equal(advanceMapDetail(0,1,1/60,true),1);
});

test('detail animation is consistent at different frame rates and reverses smoothly',()=>{
 let sixty=0,oneTwenty=0;
 for(let i=0;i<30;i++)sixty=advanceMapDetail(sixty,1,1/60);
 for(let i=0;i<60;i++)oneTwenty=advanceMapDetail(oneTwenty,1,1/120);
 assert(Math.abs(sixty-oneTwenty)<1e-9);
 const reversed=advanceMapDetail(sixty,0,1/60);
 assert(reversed<sixty&&reversed>sixty-.1);
});
