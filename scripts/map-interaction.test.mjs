import test from 'node:test';
import assert from 'node:assert/strict';
import {nextZoomDistance,placeHoverCard,MIN_MAP_DISTANCE,MAX_MAP_DISTANCE} from '../src/mapInteraction.ts';

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
