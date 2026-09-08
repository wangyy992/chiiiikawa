/* Generated raster sprites only. Canvas is used to composite images, never draw characters. */
(function(g){
g.Characters=[
 {id:'chiikawa',name:'吉伊',en:'CHIIKAWA',line:'虽然会紧张，也想再努力一次。',ability:'勇气守护 · 撞到障碍时，怪物逼近得更少',color:'#e8b1b3'},
 {id:'hachiware',name:'小八',en:'HACHIWARE',line:'没关系，总会有办法的！',ability:'发现好物 · 金币吸附范围更大',color:'#a7c7dc'},
 {id:'usagi',name:'乌萨奇',en:'USAGI',line:'呀哈！今天也要大冒险！',ability:'呀哈弹跳 · 第二段跳得更高',color:'#e5ce8b'}
];
g.Save={get(k,f){try{return localStorage.getItem(k)||f}catch{return f}},set(k,v){try{localStorage.setItem(k,String(v))}catch{}}};
g.Art={};
g.Assets={images:{},async load(){
 const names=['meadow','ravine','chiikawa','hachiware','usagi','chiikawa-jump','hachiware-jump','usagi-jump','chimera','mushroom','weed','coin','guitar','platform'];
 await Promise.all(names.map(name=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{this.images[name]=img;resolve()};img.onerror=()=>reject(Error('图片加载失败：'+name));img.src='assets/'+name+'.png'})));
 },draw(ctx,name,x,y,w,h){const img=this.images[name];if(img)ctx.drawImage(img,x,y,w,h)}
};
})(window);
