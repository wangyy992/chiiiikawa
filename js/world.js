/* Readable ground patterns, with generous reaction windows and image-based hazards. */
(function(g){
 const C=g.CFG,U=g.U;
 class World{
 constructor(){this.reset()}
 reset(){this.spans=[{type:'ground',x0:0,x1:1e12}];this.solids=[];this.hazards=[];this.coins=[];this.powerups=[];this.decor=[];this.genX=900;this.pattern=0;this.coinLine(410,C.GROUND_Y-80,5,42)}
 typeAt(){return 'ground'}
 surfacesAt(x){return [C.GROUND_Y,...this.solids.filter(p=>x>=p.x&&x<=p.x+p.w).map(p=>p.y)].sort((a,b)=>a-b)}
 update(cameraX,distance){
 while(this.genX<cameraX+C.SPAWN_AHEAD)this.generateNext(distance);
 const alive=e=>!e.dead&&e.x+(e.w||40)>cameraX-300;
 for(const key of ['solids','hazards','coins','powerups'])this[key]=this[key].filter(alive);
 }
 generateNext(distance){
 const x=this.genX,G=C.GROUND_Y,pattern=this.pattern++%5;
 if(pattern===2){
 this.solids.push({x,y:G-105,w:170,h:42});this.coinLine(x+24,G-147,4,36);
 }else{
 const kind=pattern===3?'mob':pattern===1?'rock':'bush';
 const w=kind==='mob'?76:kind==='rock'?68:62,h=kind==='mob'?68:kind==='rock'?74:55;
 this.hazards.push({kind,x,y:G-h,w,h,baseY:G-h,phase:0,hop:false});
 this.coinArc(x+w/2,G-h-55,4,30);
 }
 if(pattern===4)this.powerups.push({x:x+240,y:G-108,w:34,h:44});
 this.genX+=U.rand(470,590)+Math.min(distance*.015,70);
 }
 coinLine(x,y,n,step){for(let i=0;i<n;i++)this.coins.push({x:x+i*step,y,w:24,h:24,phase:i*.4})}
 coinArc(cx,cy,n,step){for(let i=0;i<n;i++){const t=i/(n-1)-.5;this.coins.push({x:cx+t*step*n,y:cy+t*t*70,w:24,h:24,phase:i*.4})}}
 }
 g.World=World;
})(window);
