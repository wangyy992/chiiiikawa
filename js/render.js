/* All world artwork is image compositing. Semantic HUD and hazard labels are DOM. */
(function(g){
const C=g.CFG,A=g.Assets,U=g.U;
const P=g.Game.prototype;
P.render=function(){
 const c=this.ctx,t=this.t,p=this.p;
 c.save();c.clearRect(0,0,C.W,C.H);
 // Tiny camera drift on a soft, distant painting, never foreground collision geometry.
 const inRavine=this.world.typeAt(this.worldX)==='sky';
 const bg=A.images[inRavine?'ravine':'meadow']; if(bg)c.drawImage(bg,-22-Math.sin(this.camX/5500)*18,-58,1004,670);
 const sx=this.shake>0?Math.sin(t*91)*this.shake*.22:0;c.translate(sx,0);
 const tile=A.images.platform;
 if(tile){
   for(const span of this.world.spans){
     if(span.type!=='ground')continue;
     const left=span.x0-this.camX,right=span.x1-this.camX;
     if(right<0||left>C.W)continue;
     const start=left-Math.abs(left%240);
     for(let x=start;x<right;x+=240){
       const drawLeft=Math.max(x,left),drawRight=Math.min(x+242,right);
       if(drawRight>drawLeft)c.drawImage(tile,tile.width*.15+(drawLeft-x)/242*tile.width*.7,0,(drawRight-drawLeft)/242*tile.width*.7,tile.height,drawLeft,C.GROUND_Y,drawRight-drawLeft,100);
     }
   }
 }
 for(const platform of this.world.solids){const x=platform.x-this.camX;A.draw(c,'platform',x,platform.y,platform.w,platform.h)}
 for(const h of this.world.hazards){if(h.dead)continue;const x=h.x-this.camX;if(x<-150||x>C.W+150)continue;
 const key=h.kind==='rock'?'mushroom':(h.kind==='mob'||h.kind==='flyer')?'chimera':'weed';
 A.draw(c,key,x,h.y,h.w,h.h);
 }
 for(const q of this.world.coins){if(!q.dead){const w=22*(.65+.35*Math.abs(Math.cos(t*4+q.phase)));A.draw(c,'coin',q.x-this.camX-w/2,q.y-11,w,22)}}
 for(const q of this.world.powerups)if(!q.dead)A.draw(c,'guitar',q.x-this.camX-17,q.y-25+Math.sin(t*3)*5,34,50);
 for(let i=2;i>=0;i--){const x=p.px-this.lead-i*46;A.draw(c,'chimera',x-40,this.chaserY-70-Math.abs(Math.sin(t*9+i))*4,80,70)}
 const air=p.state==='FLY'||!p.onGround;
 const character=this.character||'chiikawa';
 const h=character==='usagi'?98:78,w=character==='usagi'?60:65;
 const bob=!air?Math.abs(Math.sin(t*14))*3:0;
 c.save();c.translate(p.px,p.y-bob);c.rotate(air?-.07:Math.sin(t*14)*.045);
 if(p.invuln>0&&Math.floor(t*15)%2===0)c.globalAlpha=.4;
 if(p.flyReason==='item')c.filter='drop-shadow(0 0 9px #ffe492)';
 A.draw(c,character+(air?'-jump':''),-w/2,-h,w,h);
 c.restore();
 for(const q of this.particles){c.save();c.globalAlpha=U.clamp(q.life*2,0,1);A.draw(c,'coin',q.x-this.camX-4,q.y-4,8,8);c.restore()}
 c.restore();
 this.updateHud();
};
P.updateHud=function(){
 const set=(id,v)=>{const el=document.getElementById(id);if(el&&el.textContent!==String(v))el.textContent=v};
 set('hud-coins',this.coins);set('hud-distance',Math.floor(this.distance));set('hud-level',['备考','五级','四级','三级','二级','一级'][Math.min(5,this.certLevel)]);
 document.getElementById('cert-progress').style.width=(this.certLevel===5?100:(this.distance%C.CERT_STEP)/C.CERT_STEP*100)+'%';
 document.getElementById('lead-progress').style.width=(U.clamp(this.lead/C.LEAD_MAX,0,1)*100)+'%';
 document.getElementById('chase').classList.toggle('danger',this.lead<85);
 set('hud-flight',this.p.flyReason==='item'?'金色应援飞行 · 伤害全免 '+Math.max(0,this.p.flyTimer).toFixed(1)+'s':this.p.flyReason==='zone'?'裂谷气流 · 会受到伤害':'');
 const combo=document.getElementById('combo');set('combo-count',this.combo);combo.hidden=this.combo<2;
 set('banner',this.banner?.text||'');document.getElementById('banner').hidden=!this.banner;
 const markerRoot=document.getElementById('hazard-markers');
 const visible=this.world.hazards.filter(h=>!h.dead&&h.x-this.camX>-80&&h.x-this.camX<C.W+80);
 while(markerRoot.children.length<visible.length){const e=document.createElement('span');e.className='hazard-marker';e.textContent='!';markerRoot.appendChild(e)}
 [...markerRoot.children].forEach((e,i)=>{const h=visible[i];e.hidden=!h;if(h){e.style.left=((h.x-this.camX+h.w/2)/C.W*100)+'%';e.style.top=((h.y-17)/C.H*100)+'%'}});
 document.getElementById('pause-screen').hidden=this.phase!=='paused';
};
})(window);
