/* ===== SYL_PLAYER · Reproductor de narración humana (ElevenLabs) =====
   Audios MP3 pregenerados en assets/audio/ con las voces oficiales:
   SYLLENZA (Miguel), LUNA (Norah), ORÁCULO (Alberto Rodríguez).
   NO usa voces del navegador, NO usa audios de demostración y NO expone
   ninguna clave en el frontend. El botón "Voz del narrador" (voz sintética
   del navegador) es otra función y sigue como está.
   Se carga con <script src="assets/syl-player.js"></script> en las páginas
   de lectura y en runa-celta.html, y también en la pestaña nueva de la
   Tirada Completa (resultDoc). El reproductor se fija abajo del viewport
   con position:absolute + top por JS (el body tiene transform por page-enter
   y eso rompe position:fixed, igual que el zoom de cartas). */
(function(){
"use strict";
/* ---------- CSS (negro + violeta cósmico + dorado brillante) ---------- */
var SYL_PLAYER_CSS=[
".syl-player{position:absolute;left:0;right:0;z-index:9999;display:none;",
"background:linear-gradient(180deg,#0b0618 0%,#120a2e 55%,#0a0518 100%);",
"border-top:2px solid #fca611;",
"box-shadow:0 -8px 40px rgba(124,58,237,.45),0 -2px 18px rgba(252,166,17,.35);",
"color:#f5e9c8;padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));",
"font-family:'Cinzel Decorative','Cinzel',serif;}",
".syl-player.on{display:block;}",
".syl-player-inner{max-width:860px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;}",
".syl-player .sp-voice{background:linear-gradient(135deg,#fca611,#fbc642);color:#1a0f00;",
"font-weight:700;font-size:11px;letter-spacing:.14em;padding:4px 10px;border-radius:999px;",
"box-shadow:0 0 12px rgba(252,166,17,.65);white-space:nowrap;}",
".syl-player .sp-title{flex:1 1 140px;min-width:120px;font-size:13px;color:#fcda59;",
"white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
".syl-player .sp-btn{background:#1c1033;color:#fcda59;border:1px solid #fca611;border-radius:50%;",
"width:38px;height:38px;font-size:16px;cursor:pointer;flex:0 0 auto;",
"box-shadow:0 0 10px rgba(252,166,17,.35);}",
".syl-player .sp-btn:hover{background:#2a1850;}",
".syl-player .sp-btn.sp-play{width:44px;height:44px;font-size:19px;",
"background:linear-gradient(135deg,#fca611,#fc830e);color:#1a0f00;border-color:#fce26f;}",
".syl-player .sp-progress{flex:1 1 100%;display:flex;align-items:center;gap:8px;}",
".syl-player .sp-time{font-size:11px;color:#cbb98a;min-width:76px;text-align:center;}",
".syl-player input[type=range].sp-seek{flex:1;accent-color:#fca611;height:4px;cursor:pointer;}",
".syl-player .sp-vol{display:flex;align-items:center;gap:6px;}",
".syl-player input[type=range].sp-vol-r{width:70px;accent-color:#fca611;cursor:pointer;}",
".syl-player .sp-speed{background:#1c1033;color:#fcda59;border:1px solid #7c3aed;border-radius:999px;",
"padding:5px 10px;font-size:12px;cursor:pointer;font-family:inherit;}",
".syl-player .sp-close{background:transparent;color:#b3a687;border:1px solid #5b4a7a;border-radius:50%;",
"width:30px;height:30px;font-size:13px;cursor:pointer;flex:0 0 auto;}",
".syl-narr-btn,.syl-intro-btn,.syl-all-btn{display:inline-flex;align-items:center;gap:6px;",
"background:linear-gradient(135deg,#1c1033,#2a1850);color:#fcda59;",
"border:1px solid #fca611;border-radius:999px;padding:8px 14px;cursor:pointer;",
"font-family:'Cinzel Decorative','Cinzel',serif;font-size:13px;letter-spacing:.03em;",
"box-shadow:0 0 10px rgba(124,58,237,.35);margin:6px 4px 0;}",
".syl-narr-btn:hover,.syl-intro-btn:hover,.syl-all-btn:hover{background:linear-gradient(135deg,#2a1850,#3b2370);}",
".syl-all-btn:disabled{opacity:.45;cursor:default;}"
].join("\n");

/* ---------- Utilidades ---------- */
function sylSlug(s){
  return String(s||"").toLowerCase()
    .replace(/[áàä]/g,"a").replace(/[éèë]/g,"e").replace(/[íìï]/g,"i")
    .replace(/[óòö]/g,"o").replace(/[úùü]/g,"u").replace(/ñ/g,"n")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}
function $(id){return document.getElementById(id);}
function fmt(t){
  if(!isFinite(t)||t==null)t=0;
  var m=Math.floor(t/60),s=Math.floor(t%60);
  return (m<10?"0"+m:m)+":"+(s<10?"0"+s:s);
}

/* ---------- Estado ---------- */
var audio=null, queue=[], qix=0, speeds=[0.75,1,1.25,1.5], speedIx=1;
var elPlayer=null, elPlay=null, elSeek=null, elTime=null, elVol=null,
    elSpeed=null, elTitle=null, elVoice=null;

/* ---------- Posición: abajo del viewport (absolute + JS) ---------- */
function sylPlayerPos(){
  if(!elPlayer||elPlayer.style.display==="none")return;
  var h=elPlayer.offsetHeight||84;
  elPlayer.style.top=(window.scrollY+window.innerHeight-h)+"px";
}
function sylPlayerShow(){
  if(!elPlayer)return;
  elPlayer.style.display="block";
  elPlayer.classList.add("on");
  sylPlayerPos();
}
function sylPlayerHide(){
  if(!elPlayer)return;
  elPlayer.style.display="none";
  elPlayer.classList.remove("on");
}

/* ---------- Núcleo: reproducir ---------- */
function sylSetTrack(it){
  if(!it)return;
  elTitle.textContent=it.title||"Narración Syllenza";
  elVoice.textContent="✦ "+(it.voice||"SYLLENZA");
  elSeek.value=0; elSeek.max=0;
  elTime.textContent="00:00 / 00:00";
  sylPlayerShow();
}
function sylPlayIx(i){
  if(i<0||i>=queue.length)return;
  qix=i;
  var it=queue[i];
  sylSetTrack(it);
  audio.src=it.src;
  audio.playbackRate=speeds[speedIx];
  var p=audio.play();
  if(p&&p.catch)p.catch(function(){});
  elPlay.textContent="⏸";
}
function sylPlayQueue(items){
  if(!items||!items.length)return;
  queue=items.slice(0);
  sylPlayIx(0);
}
function sylPlayAudio(src,title,voice){
  if(!src)return;
  sylPlayQueue([{src:src,title:title||"Narración Syllenza",voice:voice||"SYLLENZA"}]);
}
function sylPlayCard(btn){
  if(!btn)return;
  var src=btn.getAttribute("data-audio");
  if(!src)return;
  sylPlayAudio(src,btn.getAttribute("data-title")||"Narración",
    btn.getAttribute("data-voice")||"SYLLENZA");
}
window.sylPlayAudio=sylPlayAudio;
window.sylPlayQueue=sylPlayQueue;
window.sylPlayCard=sylPlayCard;
window.sylAudioSlug=sylSlug;

/* ---------- Construir el reproductor ---------- */
function sylBuild(){
  if($("syl-player"))return;
  var st=document.createElement("style");
  st.setAttribute("data-syl-player","1");
  st.textContent=SYL_PLAYER_CSS;
  document.head.appendChild(st);
  var d=document.createElement("div");
  d.id="syl-player";
  d.className="syl-player";
  d.setAttribute("role","group");
  d.setAttribute("aria-label","Reproductor de narración Syllenza");
  d.innerHTML=
    '<div class="syl-player-inner">'+
    '<button type="button" class="sp-btn sp-play" id="syl-sp-play" aria-label="Reproducir o pausar">▶</button>'+
    '<span class="sp-voice" id="syl-sp-voice">✦ SYLLENZA</span>'+
    '<span class="sp-title" id="syl-sp-title">Narración Syllenza</span>'+
    '<button type="button" class="sp-speed" id="syl-sp-speed" aria-label="Velocidad">1×</button>'+
    '<span class="sp-vol">🔊<input type="range" class="sp-vol-r" id="syl-sp-vol" min="0" max="100" value="100" aria-label="Volumen"></span>'+
    '<button type="button" class="sp-close" id="syl-sp-close" aria-label="Cerrar reproductor">✕</button>'+
    '<div class="sp-progress"><span class="sp-time" id="syl-sp-time">00:00 / 00:00</span>'+
    '<input type="range" class="sp-seek" id="syl-sp-seek" min="0" max="0" step="0.1" value="0" aria-label="Progreso">'+
    '</div></div>';
  document.body.appendChild(d);
  elPlayer=d;
  elPlay=$("syl-sp-play"); elSeek=$("syl-sp-seek"); elTime=$("syl-sp-time");
  elVol=$("syl-sp-vol"); elSpeed=$("syl-sp-speed");
  elTitle=$("syl-sp-title"); elVoice=$("syl-sp-voice");
  audio=new Audio();
  audio.preload="metadata";
  window.sylPlayerAudio=audio;
  try{
    var v=localStorage.getItem("syl-player-vol");
    if(v!==null){audio.volume=Math.max(0,Math.min(1,parseFloat(v)||0));elVol.value=Math.round(audio.volume*100);}
  }catch(e){}
  audio.addEventListener("timeupdate",function(){
    if(audio.duration&&isFinite(audio.duration)){
      elSeek.max=audio.duration;
      elSeek.value=audio.currentTime;
      elTime.textContent=fmt(audio.currentTime)+" / "+fmt(audio.duration);
    }
  });
  audio.addEventListener("loadedmetadata",function(){
    if(audio.duration&&isFinite(audio.duration)){
      elSeek.max=audio.duration;
      elTime.textContent=fmt(audio.currentTime)+" / "+fmt(audio.duration);
    }
  });
  audio.addEventListener("play",function(){elPlay.textContent="⏸";});
  audio.addEventListener("pause",function(){elPlay.textContent="▶";});
  audio.addEventListener("ended",function(){
    if(qix+1<queue.length){sylPlayIx(qix+1);}
    else{elPlay.textContent="▶";}
  });
  audio.addEventListener("error",function(){
    if(qix+1<queue.length){sylPlayIx(qix+1);}
    else{elTitle.textContent="Audio no disponible por ahora";elPlay.textContent="▶";}
  });
  elPlay.addEventListener("click",function(){
    if(!audio.src)return;
    if(audio.paused){var p=audio.play();if(p&&p.catch)p.catch(function(){});}
    else{audio.pause();}
  });
  elSeek.addEventListener("input",function(){
    if(audio.duration&&isFinite(audio.duration)){
      audio.currentTime=parseFloat(elSeek.value)||0;
    }
  });
  elVol.addEventListener("input",function(){
    audio.volume=Math.max(0,Math.min(1,(parseFloat(elVol.value)||0)/100));
    try{localStorage.setItem("syl-player-vol",String(audio.volume));}catch(e){}
  });
  elSpeed.addEventListener("click",function(){
    speedIx=(speedIx+1)%speeds.length;
    audio.playbackRate=speeds[speedIx];
    elSpeed.textContent=(speeds[speedIx]===1?"1":String(speeds[speedIx]))+"×";
  });
  $("syl-sp-close").addEventListener("click",function(){
    try{audio.pause();}catch(e){}
    queue=[];qix=0;
    sylPlayerHide();
  });
  window.addEventListener("scroll",function(){
    if(window.requestAnimationFrame){requestAnimationFrame(sylPlayerPos);}
    else{sylPlayerPos();}
  },{passive:true});
  window.addEventListener("resize",sylPlayerPos);
}

/* ---------- Inyectar botones según la página ---------- */
var INTRO_BY_PAGE={
  "carta-del-dia":"intro-carta-dia.mp3|Introducción · Carta del Día",
  "pasado-presente-futuro":"intro-3-cartas.mp3|Introducción · 3 Cartas",
  "tirada-completa":"intro-tirada-completa.mp3|Introducción · Tirada Completa",
  "cruz-celta":"intro-cruz-celta.mp3|Introducción · Cruz Celta",
  "index":"intro-inicio.mp3|Bienvenida · Syllenza"
};
function sylInject(){
  var path="";
  try{path=String(location.pathname||"");}catch(e){}
  var isRuna=path.indexOf("runa-celta")>=0;
  var bv=$("btn-voice");
  if(bv&&!isRuna){
    var key="";
    for(var k in INTRO_BY_PAGE){if(path.indexOf(k)>=0){key=k;break;}}
    if(key&&!$("syl-intro-btn")){
      var parts=INTRO_BY_PAGE[key].split("|");
      var b=document.createElement("button");
      b.type="button"; b.id="syl-intro-btn"; b.className="syl-intro-btn";
      b.setAttribute("data-audio","assets/audio/"+parts[0]);
      b.setAttribute("data-title",parts[1]);
      b.setAttribute("data-voice","SYLLENZA");
      b.textContent="✦ Escuchar introducción · SYLLENZA";
      b.addEventListener("click",function(){sylPlayCard(b);});
      if(bv.parentNode){bv.parentNode.insertBefore(b,bv.nextSibling);}
    }
  }
  var vr=$("view-result");
  if(vr&&!isRuna&&!$("syl-all-btn")){
    var all=document.createElement("button");
    all.type="button"; all.id="syl-all-btn"; all.className="syl-all-btn";
    all.textContent="▶ Escuchar toda la lectura · SYLLENZA";
    all.addEventListener("click",function(){
      var btns=vr.querySelectorAll(".syl-narr-btn");
      var items=[];
      for(var i=0;i<btns.length;i++){
        var src=btns[i].getAttribute("data-audio");
        if(src)items.push({src:src,
          title:btns[i].getAttribute("data-title")||"Narración",
          voice:btns[i].getAttribute("data-voice")||"SYLLENZA"});
      }
      if(!items.length){
        var old=all.textContent;
        all.textContent="Sin narración disponible aún";
        setTimeout(function(){all.textContent=old;},1800);
        return;
      }
      sylPlayQueue(items);
    });
    var rt=$("result-title");
    if(rt&&rt.parentNode){rt.parentNode.insertBefore(all,rt.nextSibling);}
    else{vr.insertBefore(all,vr.firstChild);}
  }
  /* El botón de "toda la lectura" solo se muestra cuando el resultado
     tiene al menos una narración (arcano mayor). Si todas las cartas son
     menores no hay nada que escuchar y el botón se oculta. */
  if(vr&&!isRuna){
    var _allBtn=$("syl-all-btn");
    var _toggleAll=function(){
      if(!_allBtn) return;
      _allBtn.style.display=vr.querySelectorAll(".syl-narr-btn").length?"":"none";
    };
    _toggleAll();
    if(!vr._sylAllObs){
      vr._sylAllObs=true;
      new MutationObserver(_toggleAll).observe(vr,{childList:true,subtree:true});
    }
  }
  var rc=$("runa-card");
  if(rc&&!$("syl-runa-btn")){
    var rb=document.createElement("button");
    rb.type="button"; rb.id="syl-runa-btn"; rb.className="syl-intro-btn";
    rb.textContent="▶ Escuchar mi runa · LUNA";
    rb.addEventListener("click",function(){
      var nm=$("runa-name");
      var name=nm?nm.textContent:"";
      if(!name)return;
      sylPlayAudio("assets/audio/runa-"+sylSlug(name)+".mp3",
        "Runa "+name+" · LUNA","LUNA");
    });
    var cb=$("runa-cambiar");
    if(cb&&cb.parentNode){cb.parentNode.insertBefore(rb,cb.nextSibling);}
    else{rc.appendChild(rb);}
  }
}

/* ---------- Arranque ---------- */
function sylInit(){
  try{sylBuild();}catch(e){}
  try{sylInject();}catch(e){}
}
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",sylInit);
}else{
  sylInit();
}
})();
