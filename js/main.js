(function(g){
const C=g.CFG,S=g.Sfx,$=id=>document.getElementById(id),cv=$('game'),game=new g.Game(cv);g.__g=game;
const saved=Number(g.Save.get('chii_cert',0));game.certBest=Number.isFinite(saved)?Math.min(5,Math.max(0,Math.floor(saved))):0;
game.character=g.Save.get('chii_character','chiikawa');if(!g.Characters.some(h=>h.id===game.character))game.character='chiikawa';
let loaded=false;
const labels=['备考中','五级','四级','三级','二级','一级'];
function select(id){game.character=id;g.Save.set('chii_character',id);document.querySelectorAll('.character').forEach(b=>{const yes=b.dataset.character===id;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',yes)});const h=g.Characters.find(h=>h.id===id);$('character-line').innerHTML='<span>'+h.line+'</span><b>'+h.ability+'</b>'}
for(const h of g.Characters){const b=document.createElement('button');b.className='character';b.dataset.character=h.id;b.innerHTML='<span class="portrait"><img src="assets/'+h.id+'.png" alt="'+h.name+'"></span><b>'+h.name+'</b><small>'+h.en+'</small>';b.onclick=()=>select(h.id);$('characters').appendChild(b)}select(game.character);
function license(){const h=g.Characters.find(h=>h.id===game.character);return '<div class="license"><div class="license-header">草むしり検定 · 除草合格证</div><div class="license-body"><img class="license-photo" src="assets/'+h.id+'.png" alt="'+h.name+'"><div class="license-info"><b>'+h.name+'</b><br>检定资格　'+labels[game.certBest]+'<br>最远记录　'+game.best+' m</div></div><span class="license-stamp">'+(game.certBest?'合 格':'备 考')+'</span><small>MEADOW CERTIFICATE · 努力的每一天，都值得收藏</small></div>'}
$('btn-collection').onclick=()=>{$('collection-certificate').innerHTML=license();$('collection').showModal()};
$('close-collection').onclick=()=>$('collection').close();
function resetInput(){game.keys.clear();game.pointer.down=false;game.releaseJump()}
function start(){if(!loaded)return;resetInput();$('lobby').hidden=true;$('play').hidden=false;$('gameover').hidden=true;game.start();fit();game.render()}
function home(){resetInput();game.phase='ready';$('play').hidden=true;$('lobby').hidden=false;$('gameover').hidden=true}
$('btn-start').onclick=start;$('btn-retry').onclick=start;$('btn-characters').onclick=home;$('btn-home').onclick=home;
function pause(){if(game.phase==='playing'){resetInput();game.phase='paused'}else if(game.phase==='paused')game.phase='playing'}
$('btn-pause').onclick=pause;$('btn-resume').onclick=pause;
function mute(){S.muted=!S.muted;$('btn-mute').textContent=S.muted?'音效：关':'音效：开'}$('btn-mute').onclick=mute;
game.onGameOver=r=>{$('go-title').textContent=r.reason==='caught'?'被追上了，明天再努力！':'今天也很努力了！';$('go-dist').textContent=r.distance;$('go-coins').textContent=r.coins;$('go-best').textContent=r.best;$('go-combo').textContent='最高连续报酬 × '+game.bestCombo;$('go-cert').textContent='本次检定 · '+labels[Math.min(5,r.cert)];$('result-certificate').innerHTML=license();$('gameover').hidden=false};
const jumps=new Set(['Space','ArrowUp','KeyW']);
addEventListener('keydown',e=>{if(e.target.closest?.('button,dialog,input'))return;if(e.code==='KeyM'&&!e.repeat){mute();return}if(e.code==='KeyP'&&!e.repeat){pause();return}if(!['playing','paused'].includes(game.phase))return;if(jumps.has(e.code)||e.code.startsWith('Arrow'))e.preventDefault();game.keys.add(e.code);if(!e.repeat&&jumps.has(e.code)&&game.p.state==='RUN')game.pressJump()});
addEventListener('keyup',e=>{game.keys.delete(e.code);if(jumps.has(e.code))game.releaseJump()});
function point(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*C.W,y:(e.clientY-r.top)/r.height*C.H}}
cv.onpointerdown=e=>{if(game.phase!=='playing')return;cv.setPointerCapture(e.pointerId);game.pointer={down:true,...point(e)};if(game.p.state==='RUN')game.pressJump()};
cv.onpointermove=e=>{if(game.pointer.down)Object.assign(game.pointer,point(e))};
cv.onpointerup=cv.onpointercancel=()=>{game.pointer.down=false;game.releaseJump()};
$('btn-jump').onpointerdown=e=>{e.preventDefault();$('btn-jump').setPointerCapture(e.pointerId);game.pressJump()};$('btn-jump').onpointerup=$('btn-jump').onpointercancel=()=>game.releaseJump();
function blur(){resetInput();if(game.phase==='playing')game.phase='paused'}addEventListener('blur',blur);document.addEventListener('visibilitychange',()=>{if(document.hidden)blur()});
function fit(){const d=Math.min(devicePixelRatio||1,2);cv.width=C.W*d;cv.height=C.H*d;cv.getContext('2d').setTransform(d,0,0,d,0,0)}addEventListener('resize',fit);fit();
let last=performance.now(),acc=0;const step=1/120;
function frame(now){const dt=Math.min((now-last)/1000,.08);last=now;if(loaded&&!$('play').hidden){acc+=dt;let guard=0;while(acc>=step&&guard++<10){game.update(step);acc-=step}if(guard>=10)acc=0;game.render()}else acc=0;requestAnimationFrame(frame)}
requestAnimationFrame(frame);
g.Assets.load().then(()=>{loaded=true;$('btn-start').disabled=false;$('btn-start').textContent='带上小伙伴，出发 →';$('load-message').textContent='空格 / 点击跳跃 · 支持二段跳'}).catch(e=>{$('load-message').textContent=e.message+'，请刷新重试';$('btn-start').textContent='素材未加载完成'});
})(window);
