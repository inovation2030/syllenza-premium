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
"color:#f5e9c8;padding:6px 12px calc(6px + env(safe-area-inset-bottom,0px));",
"font-family:'Cinzel Decorative','Cinzel',serif;}",
".syl-player.on{display:block;}",
".syl-player-inner{max-width:860px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;}",
".syl-player .sp-voice{background:linear-gradient(135deg,#fca611,#fbc642);color:#1a0f00;",
"font-weight:700;font-size:11px;letter-spacing:.14em;padding:3px 8px;border-radius:999px;",
"box-shadow:0 0 12px rgba(252,166,17,.65);white-space:nowrap;}",
".syl-player .sp-title{flex:1 1 140px;min-width:120px;font-size:12px;color:#fcda59;",
"white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
".syl-player .sp-btn{background:#1c1033;color:#fcda59;border:1px solid #fca611;border-radius:50%;",
"width:34px;height:34px;font-size:15px;cursor:pointer;flex:0 0 auto;",
"box-shadow:0 0 10px rgba(252,166,17,.35);}",
".syl-player .sp-btn:hover{background:#2a1850;}",
".syl-player .sp-btn.sp-play{width:38px;height:38px;font-size:17px;",
"background:linear-gradient(135deg,#fca611,#fc830e);color:#1a0f00;border-color:#fce26f;}",
".syl-player .sp-progress{flex:1 1 160px;min-width:120px;display:flex;align-items:center;gap:8px;}",
".syl-player .sp-time{font-size:11px;color:#cbb98a;min-width:76px;text-align:center;}",
".syl-player input[type=range].sp-seek{flex:1;accent-color:#fca611;height:4px;cursor:pointer;}",
".syl-player .sp-vol{display:flex;align-items:center;gap:6px;}",
".syl-player input[type=range].sp-vol-r{width:70px;accent-color:#fca611;cursor:pointer;}",
".syl-player .sp-speed{background:#1c1033;color:#fcda59;border:1px solid #7c3aed;border-radius:999px;",
"padding:4px 8px;font-size:12px;cursor:pointer;font-family:inherit;}",
".syl-player .sp-close{background:transparent;color:#b3a687;border:1px solid #5b4a7a;border-radius:50%;",
"width:26px;height:26px;font-size:12px;cursor:pointer;flex:0 0 auto;}",
".syl-narr-btn,.syl-intro-btn,.syl-all-btn{display:inline-flex;align-items:center;gap:6px;",
"background:linear-gradient(135deg,#1c1033,#2a1850);color:#fcda59;",
"border:1px solid #fca611;border-radius:999px;padding:8px 14px;cursor:pointer;",
"font-family:'Cinzel Decorative','Cinzel',serif;font-size:13px;letter-spacing:.03em;",
"box-shadow:0 0 10px rgba(124,58,237,.35);margin:6px 4px 0;}",
".syl-narr-btn:hover,.syl-intro-btn:hover,.syl-all-btn:hover{background:linear-gradient(135deg,#2a1850,#3b2370);}",
".syl-all-btn:disabled{opacity:.45;cursor:default;}"
,
"/* Selector de voz ElevenLabs (2 hombres + 1 mujer) y tira del narrador */",
".syl-narr-strip{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;}",
    "#syl-narr-show{display:none;cursor:pointer;font-family:'Cinzel Decorative','Cinzel',serif;font-size:13px;font-weight:700;letter-spacing:.03em;color:#fcda59;background:#1c1033;border:1px solid #fca611;border-radius:999px;padding:8px 14px;margin:0 auto;}",
".syl-narr-strip .syl-intro-btn,.syl-narr-strip .syl-voice-select,.syl-narr-strip .im-btn,.syl-narr-strip .voice-pick{margin:0;}",
".syl-narr-strip .syl-voice-label{font-size:11px;letter-spacing:.14em;color:#cbb98a;white-space:nowrap;}",
".syl-voice-select{appearance:none;cursor:pointer;font-family:'Cinzel Decorative','Cinzel',serif;",
"font-size:11px;font-weight:700;letter-spacing:.03em;color:#fcda59;background:#1c1033;",
"border:1px solid #fca611;border-radius:999px;padding:5px 9px;min-height:30px;width:auto;flex:0 0 auto;max-width:100%;}",
".syl-voice-select:hover{border-color:#fce26f;}",
".syl-narr-strip.in-overlay{background:rgba(5,5,12,.92);border:1px solid #fca611;border-radius:16px;",
"padding:10px 12px;margin:8px auto;width:calc(100% - 8px);max-width:920px;",
"box-shadow:0 8px 30px rgba(0,0,0,.7),0 0 18px rgba(252,166,17,.25);}"
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

/* ---------- Selector de voz ElevenLabs (2 hombres + 1 mujer) ----------
   La elección se guarda en localStorage "syl-voice-elevenlabs".
   "" = automática: cada contenido usa su voz por defecto
   (intros y mayores = SYLLENZA, runas = LUNA) y suena el archivo base.
   Con una voz elegida, el MP3 se resuelve en el momento de reproducir:
   si la voz elegida es la voz por defecto del contenido, suena el archivo
   base; si es otra, suena base + "-" + voz + ".mp3"
   (p. ej. carta-el-sol-luna.mp3, runa-fehu-syllenza.mp3). */
var SYL_VOICE_KEY="syl-voice-elevenlabs";
var SYL_VOICE_DEFS={intro:"SYLLENZA",carta:"SYLLENZA",runa:"LUNA"};
function sylStoredVoice(){
  try{return localStorage.getItem(SYL_VOICE_KEY)||"";}catch(e){return "";}
}
function sylSelectedVoice(){return sylStoredVoice();}
function sylEffectiveVoice(defVoice){
  var s=sylStoredVoice();
  return s||"LUNA";
}
function sylResolveSrc(baseSrc,defVoice){
  if(!baseSrc)return baseSrc;
  var eff=sylEffectiveVoice(defVoice);
  var def=defVoice||"SYLLENZA";
  if(eff===def)return baseSrc;
  return String(baseSrc).replace(/\.mp3$/i,"-"+eff.toLowerCase()+".mp3");
}
function sylBuildVoiceSelect(){
  if($("syl-voice-select"))return $("syl-voice-select");
  var sel=document.createElement("select");
  sel.id="syl-voice-select";
  sel.className="syl-voice-select";
  sel.setAttribute("aria-label","Elegir voz de narración");
  var opts=[
    ["","✦ Voz automática"],
    ["SYLLENZA","SYLLENZA · hombre"],
    ["LUNA","LUNA · mujer"],
    ["ORACULO","ORÁCULO · hombre"]
  ];
  for(var i=0;i<opts.length;i++){
    var o=document.createElement("option");
    o.value=opts[i][0]; o.textContent=opts[i][1];
    sel.appendChild(o);
  }
  sel.value=sylStoredVoice();
  sel.addEventListener("change",function(){
    try{localStorage.setItem(SYL_VOICE_KEY,sel.value);}catch(e){}
    sylSyncVoiceLabels();
    setTimeout(sylHideStrip,900);
  });
  return sel;
}
function sylSetText(el,txt){
  if(el&&el.textContent!==txt)el.textContent=txt;
}
function sylSyncVoiceLabels(){
  var eff;
  var ib=$("syl-intro-btn");
  if(ib){eff=sylEffectiveVoice("SYLLENZA");sylSetText(ib,"✦ Escuchar introducción · "+eff);}
  var ab=$("syl-all-btn");
  if(ab){eff=sylEffectiveVoice("SYLLENZA");sylSetText(ab,"▶ Escuchar toda la lectura · "+eff);}
  var rb=$("syl-runa-btn");
  if(rb){eff=sylEffectiveVoice("LUNA");sylSetText(rb,"▶ Escuchar mi runa · "+eff);}
  var nb=document.querySelectorAll(".syl-narr-btn");
  for(var i=0;i<nb.length;i++){
    sylSetText(nb[i],"▶ Narración · "+sylEffectiveVoice("SYLLENZA"));
  }
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
/* ---------- Auto-narración del resultado · SOLO resultados ----------
   Cuando se abre el resultado de cualquier tirada, la narración humana
   (ElevenLabs) arranca sola, carta por carta, y sigue aunque el visitante
   deslice la página arriba y abajo: el audio es un elemento multimedia y
   el desplazamiento solo mueve el reproductor, no lo pausa. Solo para
   resultados (#view-result): no se auto-reproduce la introducción, la
   runa ni nada más. Una sola vez por resultado (la clave es el conjunto
   de audios); si el visitante cierra el reproductor, no se reinicia. */
var sylAutoKey="";
function sylAutoPlayResult(){
  var vr=$("view-result");
  if(!vr||vr.classList.contains("hidden"))return false;
  var btns=vr.querySelectorAll(".syl-narr-btn");
  if(!btns.length)return false;
  var key="",items=[],i;
  for(i=0;i<btns.length;i++){
    var base=btns[i].getAttribute("data-audio");
    if(!base)continue;
    var def=btns[i].getAttribute("data-voice")||"SYLLENZA";
    key+=base+"|";
    items.push({src:sylResolveSrc(base,def),
      title:btns[i].getAttribute("data-title")||"Narración",
      voice:sylEffectiveVoice(def)});
  }
  if(!items.length||key===sylAutoKey)return false;
  sylAutoKey=key;
  sylPlayQueue(items);
  return true;
}
window.sylAutoPlayResult=sylAutoPlayResult;
function sylPlayAudio(src,title,voice){
  if(!src)return;
  sylPlayQueue([{src:src,title:title||"Narración Syllenza",voice:voice||"SYLLENZA"}]);
}
function sylPlayCard(btn){
  if(!btn)return;
  var base=btn.getAttribute("data-audio");
  if(!base)return;
  var def=btn.getAttribute("data-voice")||"SYLLENZA";
  sylPlayAudio(sylResolveSrc(base,def),
    btn.getAttribute("data-title")||"Narración",
    sylEffectiveVoice(def));
}
window.sylResolveSrc=sylResolveSrc;
window.sylEffectiveVoice=sylEffectiveVoice;
window.sylStoredVoice=sylStoredVoice;
window.sylSyncVoiceLabels=sylSyncVoiceLabels;
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

/* ---------- Tira del narrador: siempre visible y clicable ----------
   En las vistas de pantalla completa (#view-pick con body.syl-fan-full y
   #view-result con body.syl-cruz-full) el contenido normal queda tapado
   por el overlay (z-index 300). Para que los controles del narrador
   (botón de voz, selector de voz del navegador, botón de introducción y
   selector de voz ElevenLabs) nunca queden cubiertos, se agrupan en una
   tira (#syl-narr-strip) que se MUEVE dentro del overlay activo y vuelve
   a la barra .immersive al salir de él. Los nodos se mueven, no se copian,
   así que sus listeners y su estado se conservan. */
var sylStrip=null, sylStripHome=null;
function sylBuildStrip(){
  if(sylStrip)return sylStrip;
  var im=document.querySelector(".immersive");
  var bm=$("btn-music");
  if(!im||!bm)return null;
  var strip=document.createElement("div");
  strip.id="syl-narr-strip";
  strip.className="syl-narr-strip";
  strip.setAttribute("role","group");
  strip.setAttribute("aria-label","Controles del narrador");
  var intro=$("syl-intro-btn"), vsel=$("syl-voice-select"), vp=$("voice-pick");
  var lbl=document.createElement("span");
  lbl.className="syl-voice-label";
  lbl.textContent=" Voz:";
  var order=[];
  if(intro)order.push(intro);
  if(vsel){order.push(lbl);order.push(vsel);}
  if(vp)order.push(vp);
  for(var i=0;i<order.length;i++)strip.appendChild(order[i]);
  var music=$("btn-music");
  if(music&&music.nextSibling){im.insertBefore(strip,music.nextSibling);}
  else{im.appendChild(strip);}
  var show=document.createElement("button");
  show.id="syl-narr-show";
  show.type="button";
  show.textContent="Voz · cambiar";
  show.addEventListener("click",function(){sylShowStrip();});
  if(strip.nextSibling){im.insertBefore(show,strip.nextSibling);}
  else{im.appendChild(show);}
  sylStripHome={parent:im, after:music||null};
  sylStrip=strip;
  return strip;
}
function sylHideStrip(){
  if(!sylStrip)return;
  sylStrip.style.display="none";
  var b=$("syl-narr-show");
  if(b){var v="SYLLENZA";try{if(window.sylEffectiveVoice)v=window.sylEffectiveVoice("SYLLENZA")||"SYLLENZA";}catch(e){}b.textContent="Voz · "+v+" · cambiar";b.style.display="inline-block";}
}
function sylShowStrip(){
  if(!sylStrip)return;
  sylStrip.style.display="";
  var b=$("syl-narr-show");
  if(b)b.style.display="none";
}
function sylNarrPlace(){
  if(!sylStrip)return;
  var body=document.body;
  var target=null, anchor=null;
  if(body.classList.contains("syl-fan-full")){
    var vpk=$("view-pick");
    if(vpk){
      target=vpk;
      var nav=vpk.querySelector(".fan-menu");
      anchor=nav?nav.nextSibling:vpk.firstChild;
    }
  }else if(body.classList.contains("syl-cruz-full")){
    var vr=$("view-result");
    if(vr){target=vr; anchor=vr.firstChild;}
  }
  if(target){
    if(sylStrip.parentNode!==target){
      if(anchor){target.insertBefore(sylStrip,anchor);}
      else{target.appendChild(sylStrip);}
    }
    sylStrip.classList.add("in-overlay");
  }else if(sylStripHome&&sylStripHome.parent){
    var ref=sylStripHome.after?sylStripHome.after.nextSibling:null;
    if(sylStrip.parentNode!==sylStripHome.parent){
      if(ref){sylStripHome.parent.insertBefore(sylStrip,ref);}
      else{sylStripHome.parent.appendChild(sylStrip);}
    }
    sylStrip.classList.remove("in-overlay");
  }
  var sb=$("syl-narr-show");
  if(sb&&sylStrip.parentNode){sylStrip.parentNode.insertBefore(sb,sylStrip.nextSibling);}
}
function sylWatchOverlay(){
  if(!document.body||!window.MutationObserver)return;
  if(document.body._sylNarrObs)return;
  document.body._sylNarrObs=true;
  var obs=new MutationObserver(function(){sylNarrPlace();});
  obs.observe(document.body,{attributes:true,attributeFilter:["class"]});
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
  var bm=$("btn-music");
  if(bm&&!isRuna){
    var key="";
    for(var k in INTRO_BY_PAGE){if(path.indexOf(k)>=0){key=k;break;}}
    if(key&&!$("syl-intro-btn")){
      var parts=INTRO_BY_PAGE[key].split("|");
      var b=document.createElement("button");
      b.type="button"; b.id="syl-intro-btn"; b.className="syl-intro-btn";
      b.setAttribute("data-audio","assets/audio/"+parts[0]);
      b.setAttribute("data-title",parts[1]);
      b.setAttribute("data-voice","SYLLENZA");
      b.textContent="✦ Escuchar introducción · "+sylEffectiveVoice("SYLLENZA");
      b.addEventListener("click",function(){sylPlayCard(b);});
      if(bm.parentNode){bm.parentNode.insertBefore(b,bm.nextSibling);}
    }
  }
  /* Selector de voz ElevenLabs junto a los controles del narrador
     (también en runa-celta: la runa respeta la voz elegida). */
  if(bm){
    var vsel=sylBuildVoiceSelect();
    if(vsel&&!vsel.parentNode&&bm.parentNode){
      bm.parentNode.appendChild(vsel);
    }
  }
  var vr=$("view-result");
  if(vr&&!isRuna&&!$("syl-all-btn")){
    var all=document.createElement("button");
    all.type="button"; all.id="syl-all-btn"; all.className="syl-all-btn";
    all.textContent="▶ Escuchar toda la lectura · "+sylEffectiveVoice("SYLLENZA");
    all.addEventListener("click",function(){
      var btns=vr.querySelectorAll(".syl-narr-btn");
      var items=[];
      for(var i=0;i<btns.length;i++){
        var base=btns[i].getAttribute("data-audio");
        if(!base)continue;
        var def=btns[i].getAttribute("data-voice")||"SYLLENZA";
        items.push({src:sylResolveSrc(base,def),
          title:btns[i].getAttribute("data-title")||"Narración",
          voice:sylEffectiveVoice(def)});
      }
      if(!items.length){
        all.textContent="Sin narración disponible aún";
        setTimeout(function(){sylSyncVoiceLabels();},1800);
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
      sylSyncVoiceLabels();
      try{sylAutoPlayResult();}catch(e){}
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
    rb.textContent="▶ Escuchar mi runa · "+sylEffectiveVoice("LUNA");
    rb.addEventListener("click",function(){
      var nm=$("runa-name");
      var name=nm?nm.textContent:"";
      if(!name)return;
      var base="assets/audio/runa-"+sylSlug(name)+".mp3";
      sylPlayAudio(sylResolveSrc(base,"LUNA"),
        "Runa "+name+" · "+sylEffectiveVoice("LUNA"),sylEffectiveVoice("LUNA"));
    });
    var cb=$("runa-cambiar");
    if(cb&&cb.parentNode){cb.parentNode.insertBefore(rb,cb.nextSibling);}
    else{rc.appendChild(rb);}
  }
  /* Pestaña nueva de Tirada Completa: no hay .immersive ni #btn-voice.
     El selector va junto al botón de voz del resultado y el botón de
     "toda la lectura" va antes de las cartas. */
  var bvr=$("btn-voice-result-r");
  if(bvr){
    if(!$("syl-voice-select")){
      var vsel2=sylBuildVoiceSelect();
      if(bvr.parentNode){bvr.parentNode.insertBefore(vsel2,bvr.nextSibling);}
    }
    var cardsBox=document.querySelector(".cards");
    if(cardsBox&&!$("syl-all-btn")){
      var all2=document.createElement("button");
      all2.type="button"; all2.id="syl-all-btn"; all2.className="syl-all-btn";
      all2.textContent="▶ Escuchar toda la lectura · "+sylEffectiveVoice("SYLLENZA");
      all2.addEventListener("click",function(){
        var btns=cardsBox.querySelectorAll(".syl-narr-btn");
        var items=[];
        for(var i=0;i<btns.length;i++){
          var base=btns[i].getAttribute("data-audio");
          if(!base)continue;
          var def=btns[i].getAttribute("data-voice")||"SYLLENZA";
          items.push({src:sylResolveSrc(base,def),
            title:btns[i].getAttribute("data-title")||"Narración",
            voice:sylEffectiveVoice(def)});
        }
        if(!items.length){
          all2.textContent="Sin narración disponible aún";
          setTimeout(function(){sylSyncVoiceLabels();},1800);
          return;
        }
        sylPlayQueue(items);
      });
      cardsBox.parentNode.insertBefore(all2,cardsBox);
      if(!cardsBox.querySelectorAll(".syl-narr-btn").length){all2.style.display="none";}
    }
  }
  /* Agrupar los controles del narrador en la tira y colocarla donde
     corresponda (barra normal o dentro del overlay activo). */
  try{
    if(sylBuildStrip()){
      sylNarrPlace();
      sylWatchOverlay();
      if(document&&!document.body._sylStripHide){
        document.body._sylStripHide=true;
        document.addEventListener("click",function(e){
          try{
            var t=e.target;
            if(!t||!t.closest)return;
            if(t.closest("#picker-confirm")){sylHideStrip();return;}
            var pk=t.closest("#view-pick");
            if(pk&&t.closest(".picker-track,#syl-carrusel,.fan-pick")){sylHideStrip();}
          }catch(err){}
        });
      }
    }
  }catch(e){}
  try{sylSyncVoiceLabels();}catch(e){}
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

/* ---------- Sesion gratis publica (v44) ---------- */
window.sylFreeSession=function(){
  try{
    var prev=null; try{prev=localStorage.getItem("syl-cuenta");}catch(e){}
    if(prev)try{localStorage.setItem("syl-cuenta-respaldo",prev);}catch(e){}
    var hoy=new Date().toISOString().slice(0,10);
    var guest={nombre:"Invitado",email:"",codigo:"GRATIS",creada:hoy,demo:true,referidos:[],
      solicitudGratis:{codigo:"GRATIS-INVITADO",fecha:hoy,entrega:"PDF"}};
    localStorage.setItem("syl-cuenta",JSON.stringify(guest));
    localStorage.setItem("syl-demo","1");
  }catch(e){}
  try{var bar=document.getElementById("syl-demo-bar"); if(bar)bar.classList.remove("hidden");}catch(e){}
  try{if(typeof renderCuenta==="function")renderCuenta();}catch(e){}
  try{if(typeof sylDemoPintar==="function")sylDemoPintar();}catch(e){}
  location.href="experiencias.html";
};
document.addEventListener("click",function(ev){
  try{
    var t=ev.target&&ev.target.closest?ev.target.closest("[data-syl-free]"):null;
    if(!t)return;
    ev.preventDefault();
    window.sylFreeSession();
  }catch(e){}
});

/* ---------- Sesion gratis SOLO por enlace privado del dueño ---------- */
/* Ya no hay boton publico. Solo entra quien abra el enlace especial
   con ?syl-leo=1 ; al cargar, activa la sesion gratis y va a Experiencias. */
(function(){
  try{
    var q=new URLSearchParams(location.search);
    if(q.get("syl-leo")==="1"){ window.sylFreeSession(); }
  }catch(e){}
})();
