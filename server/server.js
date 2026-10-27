// Eco das Cavernas — servidor do jogo (Node.js, sem dependências)
'use strict';
const http=require('http'),crypto=require('crypto'),zlib=require('zlib'),fs=require('fs'),path=require('path');
const {IT,isStack,SPELLS,NOME,ZONES,CHESTS,VOC,expFor,FLOOR,STACK}=require('./rules');
const PORT=process.env.PORT||8080,NOAUTH=process.env.NOAUTH==='1';
const FB={apiKey:process.env.FB_API_KEY||'AIzaSyALIiTIYhNiCWpqxV6tXAqlyGF-ePYaE8o',db:process.env.FB_DB||'https://eco-das-cavernas-default-rtdb.firebaseio.com'};
const GOD_EMAILS=(process.env.GOD_EMAILS||'gabrielcullendk6@gmail.com').split(',').map(x=>x.trim().toLowerCase());const BANS=new Map();
const now=()=>Date.now()/1000,rnd=(a,b)=>a+Math.random()*(b-a),cheb=(a,b,c,d)=>Math.max(Math.abs(a-c),Math.abs(b-d));
// ---------------- mapas ----------------
const RAW=JSON.parse(fs.readFileSync(path.join(__dirname,'maps.json'),'utf8'));const W={};
for(const [n,m] of Object.entries(RAW)){const walk=new Uint8Array(zlib.inflateSync(Buffer.from(m.walk,'base64'))),safe=new Uint8Array(zlib.inflateSync(Buffer.from(m.safe,'base64')));
  const tp=new Map();for(const [x,y,t] of m.tp)tp.set(y*m.w+x,t);W[n]={name:n,w:m.w,h:m.h,ox:m.ox,oy:m.oy,walk,safe,tp,sz:m.sz,mobs:new Map(),occ:new Map(),players:new Set(),npcs:[]}}
const inb=(M,x,y)=>x>=0&&y>=0&&x<M.w&&y<M.h;
const walkable=(M,x,y)=>inb(M,x,y)&&M.walk[y*M.w+x]===1;
function nearestFree(M,x,y,avoidTp=true){for(let r=0;r<20;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const X=x+dx,Y=y+dy;if(!walkable(M,X,Y))continue;const i=Y*M.w+X;if(M.occ.has(i))continue;if(avoidTp&&M.tp.has(i))continue;return[X,Y]}return[x,y]}
function arrive(M,lx,ly){for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const X=lx+dx,Y=ly+dy;if(walkable(M,X,Y)&&!M.tp.has(Y*M.w+X)&&!M.occ.has(Y*M.w+X))return[X,Y]}return nearestFree(M,lx,ly)}
function spawnPoint(M){let best=null;for(const s of M.sz)if(!best||s[2]*s[3]>best[2]*best[3])best=s;if(best){const c=[Math.floor(best[0]+best[2]/2),Math.floor(best[1]+best[3]/2)];return nearestFree(M,c[0],c[1])}
  let sx=0,sy=0,n=0;for(let i=0;i<M.w*M.h;i++)if(M.walk[i]){sx+=i%M.w;sy+=(i/M.w)|0;n++}return nearestFree(M,Math.round(sx/n),Math.round(sy/n))}
// NPCs (mesmo algoritmo do cliente)
const NPCS=[{id:'king',n:'King Valoria'},{id:'bless',n:'Protector Daniel'},{id:'pots',n:'Frello'},{id:'arms',n:'Oddy'},{id:'bank',n:'Zorak'},{id:'task',n:'Arny'},{id:'mentor',n:'Mentor Roy'}];
(function placeNpcs(){const M=W.War,cx=150-M.ox,cy=150-M.oy,used=[],spots=[];
  for(let y=cy-9;y<=cy+9;y++)for(let x=cx-9;x<=cx+9;x++){const i=y*M.w+x;if(!inb(M,x,y)||!M.walk[i]||M.tp.has(i))continue;const d=Math.hypot(x-cx,y-cy);if(d<3)continue;let f=0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(M.walk[(y+dy)*M.w+x+dx])f++;if(f>=3)spots.push([x,y,d])}
  spots.sort((a,b)=>a[2]-b[2]);for(const n of NPCS){const s=spots.find(s=>used.every(u=>Math.hypot(u[0]-s[0],u[1]-s[1])>=3));if(!s)break;used.push(s);const o={...n,x:s[0],y:s[1],npc:1};M.npcs.push(o);M.occ.set(s[1]*M.w+s[0],o)}})();
// ---------------- criaturas ----------------
let MID=1;const mobStats=(kind,L)=>({kind,nome:NOME[kind]||kind,lvl:L,hpM:Math.round(15+L*9+L*L*0.35),dmg:[Math.round(L*0.5),Math.round(3+L*1.2)],xp:Math.round(8+L*L*1.4),gold:[0,Math.round(2+L*1.5)],spd:2.2+Math.min(1.6,L/120)});
function addMob(M,kind,L,x,y){const m={id:MID++,...mobStats(kind,L),x,y,sx:x,sy:y,dir:'S',hp:0,moveT:0,atkT:1+Math.random(),thinkT:Math.random()*2,dmgBy:new Map()};m.hp=m.hpM;M.mobs.set(m.id,m);M.occ.set(y*M.w+x,m);return m}
function spawnMobs(M){const Z=ZONES[M.name];if(!Z)return;const cells=[];for(let i=0;i<M.w*M.h;i++)if(M.walk[i]&&!M.safe[i]&&!M.tp.has(i))cells.push(i);
  const n=Math.min(160,Math.floor(cells.length/55));let ex,ey;if(M.name==='WarCave'){ex=150-M.ox;ey=151-M.oy}else[ex,ey]=spawnPoint(M);let maxd=1;for(const i of cells){const d=Math.hypot(i%M.w-ex,((i/M.w)|0)-ey);if(d>maxd)maxd=d}
  for(let k=0;k<n;k++){const i=cells[(Math.random()*cells.length)|0];if(M.occ.has(i))continue;const x=i%M.w,y=(i/M.w)|0;const z=Z.find(z=>z[0](x+M.ox,y+M.oy));const fr=Math.min(1,Math.hypot(x-ex,y-ey)/maxd);
    addMob(M,z[1][(Math.random()*z[1].length)|0],Math.max(1,Math.round(z[2]+(z[3]-z[2])*(fr*0.6+Math.random()*0.4))),x,y)}}
for(const M of Object.values(W))spawnMobs(M);
// ---------------- jogadores ----------------
const PL=new Map();let PID=1;
const NAMES=new Map();let namesLoaded=false;
const normName=n=>String(n).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const RESERVED=['god','gm','admin','adm','moderador','suporte','king valoria','protector daniel','frello','oddy','zorak','arny','mentor roy','eco das cavernas','valoria'];
async function loadNames(tok){if(namesLoaded)return;try{const r=await fetch(`${FB.db}/rank.json${tok?'?auth='+encodeURIComponent(tok):''}`);if(!r.ok)return;const j=await r.json()||{};for(const [k,v] of Object.entries(j))if(k.endsWith('_v2')&&v&&v.n)NAMES.set(normName(v.n),k.slice(0,-3));namesLoaded=true;console.log('nomes carregados:',NAMES.size)}catch(e){console.log('nomes',e.message)}}
if(!NOAUTH)loadNames();
const OUTV={cidadao:1,cavaleiro:1,arqueiro:1,mago:1};
function fresh(){return{v:2,nome:'',sex:'male',voc:'cidadao',lvl:1,xp:0,gold:0,bank:0,hp:150,mp:55,inv:[],eq:{},sk:{melee:10,dist:10,magic:0,shield:10,tm:0,td:0,tmg:0,ts:0},quests:{},task:null,bless:false,promo:false,map:'War'}}
const maxHp=P=>Math.round(145+5*Math.min(P.lvl,8)+Math.max(0,P.lvl-8)*VOC[P.voc].hp),maxMp=P=>Math.round(50+5*Math.min(P.lvl,8)+Math.max(0,P.lvl-8)*VOC[P.voc].mp);
const VS={k:'cavaleiro',a:'arqueiro',m:'mago'};const vok=(P,v)=>!v||v==='kam'||(P.voc!=='cidadao'&&[...v].some(c=>VS[c]===P.voc))||(P.voc==='cidadao'&&v.includes('k'));
const eqv=(P,k)=>Object.values(P.eq).reduce((a,id)=>a+((IT[id]&&IT[id][k])||0),0);
const armor=P=>eqv(P,'arm')+(P.promo?2:0),speed=p=>4.2+eqv(p.P,'spd')*1.3+(p.haste>now()?1.5:0)+(p.fast?6:0),magicLvl=P=>P.sk.magic+eqv(P,'ml');
function send(p,o){if(p.ws&&p.ws.open)p.ws.send(JSON.stringify(o))}
const msg=(p,t,c)=>send(p,{t:'msg',m:t,c:c||'#ddd'});
function fx(M,e){(M.fxq||(M.fxq=[])).push(e)}
function meState(p){const P=p.P;return{t:'me',god:p.god?{gm:!!p.godmode,iv:!!p.invis,fs:!!p.fast}:null,P:{nome:P.nome,sex:P.sex,voc:P.voc,lvl:P.lvl,xp:P.xp,gold:P.gold,bank:P.bank,hp:P.hp,mp:P.mp,inv:P.inv,eq:P.eq,sk:P.sk,quests:P.quests,task:P.task,bless:P.bless,promo:P.promo},cd:p.cd,party:partyInfo(p)}}
let dirty=new Set();const touch=p=>dirty.add(p);
function addItem(p,id,n=1){const P=p.P;if(!IT[id])return false;if(isStack(id)){const s=P.inv.find(x=>x.id===id);if(s){s.n+=n;return true}}if(P.inv.length>=24){msg(p,'Sua mochila está cheia!','#ff9a8a');return false}
  if(isStack(id))P.inv.push({id,n});else for(let i=0;i<n&&P.inv.length<24;i++)P.inv.push({id,n:1});return true}
const countItem=(P,id)=>P.inv.filter(x=>x.id===id).reduce((a,x)=>a+x.n,0);
function takeItem(P,id,n=1){let left=n;for(let i=P.inv.length-1;i>=0&&left>0;i--){const x=P.inv[i];if(x.id!==id)continue;const t=Math.min(left,x.n);x.n-=t;left-=t;if(x.n<=0)P.inv.splice(i,1)}return left===0}
function placeIn(p,name,ax,ay,auto){const old=p.M;if(old){old.players.delete(p)}const M=W[name]||W.War;p.M=M;M.players.add(p);let x,y;
  if(auto||ax==null)[x,y]=name==='WarCave'&&auto?arrive(M,150-M.ox,151-M.oy):spawnPoint(M);else{[x,y]=arrive(M,ax-M.ox,ay-M.oy)}
  p.x=x;p.y=y;p.P.map=M.name;p.target=null;send(p,{t:'map',map:M.name,x,y})}
// ---------------- teleportes (mesma lógica do cliente) ----------------
const DOWN=new Set([74,41]),UP=new Set([92,94]);const HUB=[[144,148],[144,151],[144,155],[147,155],[150,155],[153,155],[156,155],[156,151],[156,148],[150,144]];
const PORTAL=new Map();(function(){const k=(n,x,y)=>n+':'+x+','+y;
  PORTAL.set(k('War',97,115),['WarCavesVIP',64,106]);PORTAL.set(k('War',99,116),['WarCavesVIP',113,94]);PORTAL.set(k('War',100,114),['WarTrainersVIP',147,150]);PORTAL.set(k('War',97,113),['War',150,150]);
  PORTAL.set(k('WarCavesVIP',64,106),['War',150,150]);PORTAL.set(k('WarCavesVIP',113,94),['War',150,150]);PORTAL.set(k('WarTrainersVIP',147,150),['War',150,150]);
  const H={'156,148':['War_3','auto'],'144,148':['War',147,112],'144,151':['War_8','auto'],'156,151':['War_7','auto'],'147,155':['WarCave',211,37],'150,155':['WarCave2',150,195],'144,155':['WarCave',35,19],'156,155':['WarCave',202,209],'150,144':['War',98,114],'153,155':['WarCave',50,230]};
  for(const p in H)PORTAL.set('WarCave:'+p,H[p]);const M=W.WarCave,hub=new Set(HUB.map(p=>p+''));
  for(const [i,t] of M.tp){const x=i%M.w+M.ox,y=((i/M.w)|0)+M.oy;if(t===339&&!hub.has(x+','+y))PORTAL.set(k('WarCave',x,y),['WarCave',150,151])}
  PORTAL.set(k('WarCave',54,231),['War',150,150]);PORTAL.set(k('WarCave',41,228),['War',150,150])})();
function landAt(n,ax,ay){const M=W[n];for(let r=0;r<3;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(walkable(M,ax-M.ox+dx,ay-M.oy+dy))return true;return false}
function checkTp(p){const M=p.M,i=p.y*M.w+p.x;if(!M.tp.has(i))return;const v=M.tp.get(i),ax=p.x+M.ox,ay=p.y+M.oy,key=M.name+':'+ax+','+ay;let dest=PORTAL.get(key);
  if(!dest){const f=FLOOR[M.name],want=DOWN.has(v)?f+1:UP.has(v)?f-1:null;const cands=Object.keys(W).filter(n=>n!==M.name&&(want===null||FLOOR[n]===want));
    let pick=cands.find(n=>{const N=W[n];return N.tp.has((ay-N.oy)*N.w+(ax-N.ox))&&inb(N,ax-N.ox,ay-N.oy)});
    if(!pick)pick=cands.filter(n=>STACK[n]===STACK[M.name]).find(n=>landAt(n,ax,ay));if(!pick&&want!==null)pick=cands.find(n=>landAt(n,ax,ay));dest=pick?[pick,ax,ay]:['WarCave',150,151]}
  placeIn(p,dest[0],dest[1]==='auto'?null:dest[1],dest[2],dest[1]==='auto')}
// ---------------- combate ----------------
const SKF={cavaleiro:{melee:1.1,dist:1.4,magic:3,shield:1.1},arqueiro:{melee:1.2,dist:1.1,magic:1.4,shield:1.1},mago:{melee:2,dist:2,magic:1.1,shield:1.5},cidadao:{melee:1.5,dist:1.5,magic:3,shield:1.5}};
function skillTry(p,k,n=1){const P=p.P,s=P.sk,key={melee:'tm',dist:'td',magic:'tmg',shield:'ts'}[k];s[key]+=n;const f=SKF[P.voc][k];const need=k==='magic'?Math.round(300*Math.pow(f,s.magic)):Math.round(50*Math.pow(f,s[k]-10));
  if(s[key]>=need){s[key]=0;s[k]++;msg(p,`Você avançou para ${{melee:'combate corpo a corpo',dist:'combate à distância',magic:'nível mágico',shield:'defesa com escudo'}[k]} ${s[k]}.`,'#9fd4ff')}touch(p)}
const range=P=>{const w=IT[P.eq.weapon];return w&&w.range?w.range:1};
function playerHit(p,m){const P=p.P,w=IT[P.eq.weapon];let d,kind;
  if(w&&w.w==='wand'){if(P.mp<w.mana){msg(p,'Sem mana para a varinha.','#9fd4ff');return null}P.mp-=w.mana;skillTry(p,'magic',w.mana);d=rnd(w.dmg[0],w.dmg[1]);kind='wand'}
  else{const atk=(w?w.atk:7)+((P.eq.ring&&IT[P.eq.ring].atk)||0),skill=w&&w.w==='dist'?P.sk.dist+(p.sharp>now()?20:0):P.sk.melee;kind=w&&w.w==='dist'?'dist':'melee';d=(0.085*1.1*skill*atk+P.lvl/5)*(0.35+Math.random()*0.65);skillTry(p,kind)}
  return[Math.max(1,Math.round(d-Math.random()*(m.lvl*0.25))),kind]}
function hitMob(p,M,m,d,anim){if(!m||m.dead)return;m.hp-=d;m.aggro=p;m.dmgBy.set(p,(m.dmgBy.get(p)||0)+d);fx(M,{k:'txt',x:m.x,y:m.y,t:String(d),c:'#ffd25a'});fx(M,{k:'anim',spr:anim||'sprBlood',x:m.x,y:m.y});if(m.hp<=0)killMob(M,m,p)}
function rollLoot(m){const out=[];const pool=Object.values(IT).filter(d=>d.p&&!['pot','rune'].includes(d.t)&&(d.l||0)<=m.lvl+10&&(d.l||0)>=m.lvl-40);
  if(pool.length&&Math.random()<0.06+Math.min(.1,m.lvl/2000))out.push(pool[(Math.random()*pool.length)|0].id);
  const pots=m.lvl<50?['sprSmallLifeFluid','sprLifeFluid','sprManaFluid']:m.lvl<130?['sprStrongLifeFluid','sprStrongManaFluid','sprGreatLifeFluid']:['sprGreatManaFluid','sprUltimateLifeFluid','sprGreatSpiritFluid'];if(Math.random()<.18)out.push(pots[(Math.random()*pots.length)|0]);return out}
function gainXp(p,x){const P=p.P;P.xp+=Math.round(x);let up=0;while(P.xp>=expFor(P.lvl+1)){P.lvl++;up++}if(up){P.hp=maxHp(P);P.mp=maxMp(P);msg(p,`Você avançou do nível ${P.lvl-up} para o nível ${P.lvl}.`,'#ffe08a');fx(p.M,{k:'anim',spr:'sprLevelUp',x:p.x,y:p.y});if(P.lvl>=8&&P.voc==='cidadao')send(p,{t:'vocpick'})}touch(p)}
function killMob(M,m,killer){m.dead=1;M.occ.delete(m.y*M.w+m.x);M.mobs.delete(m.id);
  // dono do loot: quem causou mais dano
  let top=killer,best=0;for(const [pp,d] of m.dmgBy)if(d>best&&pp.M===M){best=d;top=pp}
  // experiência compartilhada da party (como no Tibia): +20% dividido entre os membros perto
  const party=top.party?[...top.party.members].filter(q=>q.M===M&&!q.dead&&cheb(q.x,q.y,m.x,m.y)<=30):[top];
  const share=party.length>1?Math.round(m.xp*1.2/party.length):m.xp;for(const q of party){gainXp(q,share);fx(M,{k:'txt',x:q.x,y:q.y-.5,t:`+${share} xp`,c:'#ffffff'});if(q.P.task&&q.P.task.c===m.kind&&q.P.task.k<q.P.task.n){q.P.task.k++;if(q.P.task.k===q.P.task.n)msg(q,'Tarefa concluída! Volte ao Arny.','#ffe08a')}}
  const g=Math.round(rnd(m.gold[0],m.gold[1]));top.P.gold+=g;const lt=rollLoot(m);for(const id of lt)if(addItem(top,id,1))msg(top,`Loot: ${IT[id].n}`,'#ffe08a');
  msg(top,`Você matou ${m.nome}${g?` · ${g} de ouro`:''}`,'#bfe6bf');touch(top);for(const q of M.players)if(q.target===m.id)q.target=null;
  setTimeout(()=>{const free=walkable(M,m.sx,m.sy)&&!M.occ.has(m.sy*M.w+m.sx)&&![...M.players].some(q=>cheb(q.x,q.y,m.sx,m.sy)<=7);if(free)addMob(M,m.kind,m.lvl,m.sx,m.sy);else setTimeout(()=>{if(!M.occ.has(m.sy*M.w+m.sx))addMob(M,m.kind,m.lvl,m.sx,m.sy)},20000)},30000)}
function hurtPlayer(p,m){const P=p.P;if(p.dead||p.godmode)return;const arm=armor(P),sh=P.eq.shield?IT[P.eq.shield].def:0;let d=Math.round(rnd(m.dmg[0],m.dmg[1]));
  if(sh){skillTry(p,'shield');if(Math.random()<Math.min(.5,(sh+P.sk.shield)/(m.lvl*3+40))){fx(p.M,{k:'txt',x:p.x,y:p.y,t:'defendeu',c:'#cfcfcf'});return}}
  d-=Math.round(arm*0.5+Math.random()*arm*0.5);if(d<=0){fx(p.M,{k:'txt',x:p.x,y:p.y,t:'bloqueou',c:'#cfcfcf'});return}
  if(p.ms>now()&&P.mp>0){const a=Math.min(P.mp,d);P.mp-=a;d-=a;fx(p.M,{k:'txt',x:p.x,y:p.y-.3,t:'-'+a,c:'#6aa8ff'});if(d<=0){touch(p);return}}
  P.hp-=d;fx(p.M,{k:'txt',x:p.x,y:p.y,t:'-'+d,c:'#ff5a4a'});fx(p.M,{k:'anim',spr:'sprBlood',x:p.x,y:p.y});if(!p.target)p.target=m.id;touch(p);if(P.hp<=0)die(p)}
function die(p){const P=p.P;p.dead=true;P.hp=0;let lost=Math.round((P.xp-expFor(P.lvl))*0.5+expFor(P.lvl)*0.04);if(P.bless)lost=Math.round(lost*.6);if(P.promo)lost=Math.round(lost*.7);
  const aol=P.eq.amulet&&IT[P.eq.amulet].aol;if(!P.bless&&!aol){const b=P.inv.length;P.inv=P.inv.filter(()=>Math.random()>.35);for(const k in P.eq)if(Math.random()<.1)delete P.eq[k];if(P.inv.length<b)setTimeout(()=>msg(p,'Sem bênção, você perdeu alguns itens da mochila.','#ff9a8a'),300)}
  if(aol&&!P.bless)delete P.eq.amulet;P.bless=false;P.gold=Math.round(P.gold*.9);P.xp=Math.max(expFor(Math.max(1,P.lvl-1)),P.xp-lost);while(P.lvl>1&&P.xp<expFor(P.lvl))P.lvl--;
  msg(p,`Você morreu! Os deuses te trouxeram de volta. Você perdeu ${lost.toLocaleString('pt-BR')} pontos de experiência.`,'#ff5a4a');send(p,{t:'dead'});
  setTimeout(()=>{p.dead=false;P.hp=maxHp(P);P.mp=maxMp(P);placeIn(p,'War',150,150);touch(p);save(p)},1600)}
// ---------------- magias, runas, poções ----------------
function nearestMob(p,r){let b=null,bd=1e9;for(const m of p.M.mobs.values()){const d=cheb(m.x,m.y,p.x,p.y);if(d<=r&&d<bd){bd=d;b=m}}return b}
function castSpell(p,id){const s=SPELLS.find(s=>s.id===id),P=p.P,M=p.M;if(!s||p.dead)return;if(!vok(P,s.v)||(P.voc==='cidadao'&&s.id!=='exura'))return msg(p,'Você não pode usar essa magia nesta vocação.','#ff9a8a');
  if(P.lvl<s.l)return msg(p,`Seu nível é muito baixo (precisa ${s.l}).`,'#ff9a8a');const t=now();if((p.cd[s.id]||0)>t)return;if(P.mp<s.mp)return msg(p,'Você não tem mana suficiente.','#9fd4ff');
  const L=P.lvl,ML=magicLvl(P);let tg=p.target&&M.mobs.get(p.target);
  if(['atk','meleehit'].includes(s.k)){if(!tg){tg=nearestMob(p,s.k==='meleehit'?1:5);if(tg)p.target=tg.id}if(!tg)return msg(p,'Selecione um alvo.','#cfcfcf');if(cheb(tg.x,tg.y,p.x,p.y)>(s.k==='meleehit'?1:5))return msg(p,'Alvo muito longe.','#cfcfcf')}
  P.mp-=s.mp;skillTry(p,'magic',s.mp);p.cd[s.id]=t+s.cd;fx(M,{k:'say',id:p.id,t:s.w});const roll=f=>{const [a,b]=f(L,ML);return Math.round(rnd(a,b))};
  if(s.k==='heal'){const v=roll(s.f);P.hp=Math.min(maxHp(P),P.hp+v);fx(M,{k:'txt',x:p.x,y:p.y,t:'+'+v,c:'#5ef05e'});fx(M,{k:'anim',spr:'sprHealing',x:p.x,y:p.y})}
  else if(s.k==='haste'){p.haste=t+22;fx(M,{k:'anim',spr:'sprRespawnEffect',x:p.x,y:p.y})}else if(s.k==='shield'){p.ms=t+200;msg(p,'Escudo de mana ativado.','#9fd4ff')}else if(s.k==='buff'){p.sharp=t+10;msg(p,'Sua pontaria aumentou!','#9fd4ff')}
  else if(s.k==='atk')hitMob(p,M,tg,roll(s.f),s.fx);
  else if(s.k==='meleehit'){const h=playerHit(p,tg);if(h)hitMob(p,M,tg,Math.round(h[0]*rnd(s.mul[0],s.mul[1])+L/4),s.fx)}
  else{const r=s.r||1,list=[...M.mobs.values()].filter(m=>{const dx=m.x-p.x,dy=m.y-p.y;if(s.k==='wave'){const fwd={N:[0,-1],S:[0,1],E:[1,0],W:[-1,0]}[p.dir]||[0,1];const al=dx*fwd[0]+dy*fwd[1],side=Math.abs(dx*fwd[1]-dy*fwd[0]);return al>=1&&al<=5&&side<=Math.floor(al/2)}return Math.max(Math.abs(dx),Math.abs(dy))<=r});
    if(s.k==='melee_area'){for(const m of list){const h=playerHit(p,m);if(h)hitMob(p,M,m,Math.round(h[0]*rnd(s.mul[0],s.mul[1])+L/4),s.fx)}for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]])fx(M,{k:'anim',spr:s.fx,x:p.x+dx,y:p.y+dy})}
    else for(const m of list)hitMob(p,M,m,roll(s.f),s.fx)}touch(p)}
function useRune(p,id){const d=IT[id],P=p.P,M=p.M;if(!d||d.t!=='rune'||p.dead)return;if(countItem(P,id)<=0)return msg(p,`Você não tem ${d.n}.`,'#ff9a8a');if(magicLvl(P)<d.ml)return msg(p,`Você precisa de nível mágico ${d.ml}.`,'#ff9a8a');
  const t=now();if((p.cd.rune||0)>t)return;const roll=()=>{const [a,b]=d.f(P.lvl,magicLvl(P));return Math.round(rnd(a,b))};
  if(d.kind==='heal'){p.cd.rune=t+1;takeItem(P,id);const v=roll();P.hp=Math.min(maxHp(P),P.hp+v);fx(M,{k:'txt',x:p.x,y:p.y,t:'+'+v,c:'#5ef05e'});fx(M,{k:'anim',spr:'sprHealing',x:p.x,y:p.y});touch(p);return}
  let tg=p.target&&M.mobs.get(p.target);if(!tg)tg=nearestMob(p,6);if(!tg)return msg(p,'Selecione um alvo.','#cfcfcf');p.target=tg.id;if(cheb(tg.x,tg.y,p.x,p.y)>7)return msg(p,'Alvo muito longe.','#cfcfcf');
  p.cd.rune=t+1;takeItem(P,id);if(d.kind==='area'){for(const m of [...M.mobs.values()].filter(m=>cheb(m.x,m.y,tg.x,tg.y)<=1))hitMob(p,M,m,roll(),d.fx)}else hitMob(p,M,tg,roll(),d.fx);touch(p)}
function drink(p,id){const d=IT[id],P=p.P;if(!d||d.t!=='pot'||countItem(P,id)<=0)return;if(P.lvl<(d.l||0))return msg(p,`Você precisa do nível ${d.l}.`,'#ff9a8a');const t=now();if((p.cd.pot||0)>t)return;p.cd.pot=t+1;takeItem(P,id);const v=Math.round(rnd(d.heal[0],d.heal[1]));
  if(d.kind.includes('hp')){P.hp=Math.min(maxHp(P),P.hp+v);fx(p.M,{k:'txt',x:p.x,y:p.y,t:'+'+v,c:'#5ef05e'})}if(d.kind.includes('mp')){P.mp=Math.min(maxMp(P),P.mp+v);fx(p.M,{k:'txt',x:p.x,y:p.y-.3,t:'+'+v,c:'#6aa8ff'})}touch(p)}
// ---------------- NPCs, lojas, baús ----------------
const nearNpc=(p,id)=>p.M.npcs.find(o=>o.id===id&&cheb(o.x,o.y,p.x,p.y)<=2);
const shopList=pots=>Object.values(IT).filter(d=>d.p&&(pots?['pot','rune'].includes(d.t):!['pot','rune'].includes(d.t))&&d.p<=(pots?1e9:40000));
function act(p,a,o){const P=p.P,G=v=>v.toLocaleString('pt-BR');
  if(a==='buy'){const npc=nearNpc(p,'pots')||nearNpc(p,'arms');const d=IT[o.id];if(!npc||!d||!shopList(npc.id==='pots').includes(d))return;if(P.gold<d.p)return msg(p,'Você não tem ouro suficiente.','#ff9a8a');if(addItem(p,d.id,1)){P.gold-=d.p;msg(p,`Você comprou ${d.n} por ${G(d.p)} de ouro.`,'#bfe6bf')}}
  if(a==='sell'){if(!nearNpc(p,'pots')&&!nearNpc(p,'arms'))return;const x=P.inv[o.i];if(!x||!IT[x.id])return;const v=Math.round((IT[x.id].p||300)/3*(isStack(x.id)?x.n:1));P.inv.splice(o.i,1);P.gold+=v;msg(p,`Vendeu ${IT[x.id].n} por ${G(v)} de ouro.`,'#bfe6bf')}
  if(['dep','wd','wd1k','wd10k'].includes(a)){if(!nearNpc(p,'bank'))return;if(a==='dep'){P.bank+=P.gold;P.gold=0}else{const v=a==='wd'?P.bank:Math.min(P.bank,a==='wd1k'?1000:10000);P.bank-=v;P.gold+=v}msg(p,`Saldo no banco: ${G(P.bank)}`,'#bfe6bf')}
  if(a==='bless'){if(!nearNpc(p,'bless'))return;const c=200*P.lvl;if(P.bless)return;if(P.gold<c)return msg(p,'Você não tem ouro suficiente.','#ff9a8a');P.gold-=c;P.bless=true;msg(p,'Que os deuses te abençoem.','#ffe08a')}
  if(a==='promo'){if(!nearNpc(p,'king')||P.promo||P.lvl<20)return;if(P.gold<20000)return msg(p,'Você não tem ouro suficiente.','#ff9a8a');P.gold-=20000;P.promo=true;msg(p,'Você foi promovido!','#ffe08a')}
  if(a==='task'){if(!nearNpc(p,'task')||P.task)return;const mid=+o.mid,n=mid<20?50:mid<60?100:150,ms=mobStats(o.c,Math.round(mid));if(!NOME[o.c])return;P.task={c:o.c,n,k:0,xp:Math.round(ms.xp*n*0.6),g:Math.round(ms.gold[1]*n*0.8)};msg(p,`Tarefa: mate ${n} ${NOME[o.c]}.`,'#ffe08a')}
  if(a==='tk_xp'||a==='tk_g'){if(!nearNpc(p,'task')||!P.task||P.task.k<P.task.n)return;if(a==='tk_xp'){gainXp(p,P.task.xp);msg(p,`Recompensa: ${G(P.task.xp)} de experiência.`,'#ffe08a')}else{P.gold+=P.task.g;msg(p,`Recompensa: ${G(P.task.g)} de ouro.`,'#ffe08a')}P.task=null}
  if(a==='tk_cancel')P.task=null;
  if(a==='equip'){const x=P.inv[o.i];if(!x)return;const d=IT[x.id];if(!d||!['weapon','armor','head','legs','boots','shield','ring','amulet'].includes(d.t))return;if(d.l&&P.lvl<d.l)return msg(p,`Você precisa do nível ${d.l} para usar ${d.n}.`,'#ff9a8a');if(d.v&&!vok(P,d.v))return msg(p,`${d.n} não é para a sua vocação.`,'#ff9a8a');
    const old=P.eq[d.t];P.inv.splice(o.i,1);P.eq[d.t]=x.id;if(old)P.inv.push({id:old,n:1});msg(p,`Você equipou ${d.n}.`,'#bfe6bf')}
  if(a==='unequip'){const id=P.eq[o.slot];if(!id||P.inv.length>=24)return;delete P.eq[o.slot];P.inv.push({id,n:1})}
  if(a==='chest'){const M=p.M,c=CHESTS[M.name+':'+(o.x+M.ox)+','+(o.y+M.oy)];if(!c||cheb(o.x,o.y,p.x,p.y)>1)return;if(P.quests[c.q])return msg(p,'Está vazio.','#cfcfcf');if(c.lvl&&P.lvl<c.lvl)return msg(p,`A alavanca não se move. Você precisa do nível ${c.lvl}.`,'#ff9a8a');
    if(!addItem(p,c.it,c.qty||1))return;if(c.extra)addItem(p,c.extra[0],c.extra[1]);P.quests[c.q]=1;msg(p,`Quest ${c.n}: você encontrou ${c.qty?c.qty+' ':''}${IT[c.it].n}!`,'#ffe08a');fx(M,{k:'anim',spr:'sprLevelUp',x:p.x,y:p.y});save(p)}
  if(a==='voc'){if(P.voc!=='cidadao'||P.lvl<8||!['cavaleiro','arqueiro','mago'].includes(o.v))return;P.voc=o.v;P.hp=maxHp(P);P.mp=maxMp(P);msg(p,`Agora você é ${VOC[P.voc].nome}!`,'#ffe08a');save(p)}
  if(a==='profile'){if(o.sex==='male'||o.sex==='female')P.sex=o.sex;
    if(o.nome!=null&&!P._named){const nm=String(o.nome).replace(/[^A-Za-zÀ-ÿ ]/g,'').replace(/\s+/g,' ').trim(),k=normName(nm);
      const bad=nm.length<3||nm.length>14?'O nome precisa ter de 3 a 14 letras.':(!p.god&&RESERVED.some(r=>k===r||k.split(' ').includes(r)))?'Esse nome não é permitido.':(NAMES.has(k)&&NAMES.get(k)!==p.uid)||[...PL.values()].some(q=>q!==p&&q.P._named&&normName(q.P.nome)===k)?'Esse nome já existe. Escolha outro.':null;
      if(bad){send(p,{t:'nameerr',m:bad});return}P.nome=nm.split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');P._named=1;NAMES.set(k,p.uid);send(p,{t:'named',n:P.nome});msg(p,`Bem-vindo ao Eco das Cavernas, ${P.nome}!`,'#ffe08a')}
    save(p)}
  if(a==='home'){if(p.M.name!=='War'&&!p.dead){if(p.lastHit&&now()-p.lastHit<10)return msg(p,'Você está em combate.','#ff9a8a');placeIn(p,'War',150,150)}}
  touch(p)}
// ---------------- comandos do GOD ----------------
const findP=id=>[...PL.values()].find(q=>q.id===+id&&q.uid);
function godCmd(p,o){if(!p.god)return;const P=p.P,G=v=>Number(v).toLocaleString('pt-BR');
  switch(o.a){
  case 'list':send(p,{t:'godlist',players:[...PL.values()].filter(q=>q.uid).map(q=>({id:q.id,n:q.P.nome||'(sem nome)',l:q.P.lvl,v:q.P.voc,map:q.M&&q.M.name,x:q.x+(q.M?q.M.ox:0),y:q.y+(q.M?q.M.oy:0),god:!!q.god})),maps:Object.keys(W),items:Object.values(IT).map(d=>[d.id,d.n]),mobs:Object.keys(NOME).map(k=>[k,NOME[k]])});return;
  case 'goto':{const q=findP(o.id);if(!q)return msg(p,'Jogador não encontrado.','#ff9a8a');placeIn(p,q.M.name,q.x+q.M.ox,q.y+q.M.oy);return}
  case 'pull':{const q=findP(o.id);if(!q)return;placeIn(q,p.M.name,p.x+p.M.ox,p.y+p.M.oy);msg(q,'Você foi puxado pelo GOD.','#ffd700');return}
  case 'map':{if(!W[o.map])return;placeIn(p,o.map,null,null,true);return}
  case 'temple':{const q=o.id?findP(o.id):p;if(q)placeIn(q,'War',150,150);return}
  case 'level':{const q=o.id?findP(o.id):p;const L=Math.max(1,Math.min(5000,o.lvl|0));if(!q)return;q.P.lvl=L;q.P.xp=expFor(L);q.P.hp=maxHp(q.P);q.P.mp=maxMp(q.P);msg(p,`${q.P.nome} agora está no nível ${L}.`,'#ffd700');touch(q);save(q);return}
  case 'item':{const q=o.id?findP(o.id):p;if(!q||!IT[o.item])return;addItem(q,o.item,Math.max(1,Math.min(1000,o.n|0||1)));msg(p,`Item entregue: ${IT[o.item].n}.`,'#ffd700');touch(q);return}
  case 'gold':{const q=o.id?findP(o.id):p;if(!q)return;q.P.gold+=Math.max(0,Math.min(1e9,o.n|0));msg(p,`Ouro entregue: ${G(o.n|0)}.`,'#ffd700');touch(q);return}
  case 'skill':{const q=o.id?findP(o.id):p;if(!q||!['melee','dist','magic','shield'].includes(o.k))return;q.P.sk[o.k]=Math.max(0,Math.min(200,o.v|0));touch(q);return}
  case 'voc':{const q=o.id?findP(o.id):p;if(!q||!VOC[o.v])return;q.P.voc=o.v;q.P.hp=maxHp(q.P);q.P.mp=maxMp(q.P);touch(q);return}
  case 'godmode':p.godmode=!p.godmode;msg(p,'Invulnerável: '+(p.godmode?'ligado':'desligado'),'#ffd700');touch(p);return;
  case 'invis':p.invis=!p.invis;msg(p,'Invisível: '+(p.invis?'ligado':'desligado'),'#ffd700');touch(p);return;
  case 'fast':p.fast=!p.fast;msg(p,'Velocidade de GOD: '+(p.fast?'ligada':'desligada'),'#ffd700');touch(p);return;
  case 'heal':P.hp=maxHp(P);P.mp=maxMp(P);touch(p);return;
  case 'killall':{let n=0;for(const m of [...p.M.mobs.values()])if(cheb(m.x,m.y,p.x,p.y)<=8){killMob(p.M,m,p);n++}msg(p,`${n} criaturas eliminadas.`,'#ffd700');return}
  case 'spawn':{if(!NOME[o.k])return;const L=Math.max(1,Math.min(999,o.lvl|0||10)),n=Math.max(1,Math.min(20,o.n|0||1));for(let i=0;i<n;i++){const [x,y]=nearestFree(p.M,p.x+1,p.y+1);addMob(p.M,o.k,L,x,y)}msg(p,`${n}x ${NOME[o.k]} (nível ${L}) criados.`,'#ffd700');return}
  case 'broadcast':{const m=String(o.m||'').slice(0,160);if(!m)return;for(const q of PL.values())send(q,{t:'msg',m:'📢 '+m,c:'#ffd700'});return}
  case 'kick':{const q=findP(o.id);if(!q||q.god)return;save(q);send(q,{t:'err',m:'Você foi desconectado pelo GOD.'});q.ws.close();return}
  case 'ban':{const q=findP(o.id);if(!q||q.god)return;BANS.set(q.uid,Date.now()+(Math.max(1,o.h|0||24))*3600e3);save(q);send(q,{t:'err',m:'Você foi banido.'});q.ws.close();msg(p,'Jogador banido.','#ffd700');return}
  case 'reset_mobs':{for(const M of Object.values(W)){for(const m of M.mobs.values())M.occ.delete(m.y*M.w+m.x);M.mobs.clear();spawnMobs(M)}msg(p,'Criaturas de todos os mapas renasceram.','#ffd700');return}}}
// ---------------- party (como no Tibia) ----------------
function partyInfo(p){if(!p.party)return null;return{leader:p.party.leader.id,members:[...p.party.members].map(q=>({id:q.id,n:q.P.nome,l:q.P.lvl,v:q.P.voc,hp:Math.round(q.P.hp/maxHp(q.P)*100),map:q.M&&q.M.name}))}}
function partyMsg(party,t){for(const q of party.members)msg(q,t,'#9fd4ff')}
function partyCmd(p,o){const tgt=[...PL.values()].find(q=>q.id===o.id);
  if(o.a==='invite'){if(!tgt||tgt===p||tgt.party)return msg(p,'Não é possível convidar esse jogador.','#ff9a8a');if(p.party&&p.party.leader!==p)return msg(p,'Só o líder pode convidar.','#ff9a8a');tgt.pinv=p;send(tgt,{t:'pinvite',id:p.id,n:p.P.nome});msg(p,`Convite enviado para ${tgt.P.nome}.`,'#9fd4ff')}
  if(o.a==='accept'){const l=p.pinv;if(!l||!PL.has(l.ws_id)||p.party)return;if(!l.party){l.party={leader:l,members:new Set([l])}}l.party.members.add(p);p.party=l.party;p.pinv=null;partyMsg(p.party,`${p.P.nome} entrou na party.`);for(const q of p.party.members)touch(q)}
  if(o.a==='leave'&&p.party){const pt=p.party;pt.members.delete(p);p.party=null;partyMsg(pt,`${p.P.nome} saiu da party.`);if(pt.leader===p&&pt.members.size)pt.leader=[...pt.members][0];if(pt.members.size<2){for(const q of pt.members){q.party=null;touch(q)}}else for(const q of pt.members)touch(q);touch(p)}}
// ---------------- salvar na nuvem (com o login do próprio jogador) ----------------
async function fbPut(p,path,data){if(NOAUTH||!p.tok)return;try{const r=await fetch(`${FB.db}/${path}.json?auth=${encodeURIComponent(p.tok)}`,{method:'PUT',body:JSON.stringify(data)});if(!r.ok)console.log('save',r.status,path)}catch(e){console.log('save err',e.message)}}
function save(p){const P=p.P;if(!P.nome)return;const s={...P,map:p.M?p.M.name:'War',x:p.x+(p.M?p.M.ox:0),y:p.y+(p.M?p.M.oy:0),t:Date.now()};
  if(NOAUTH){try{const f=path.join(__dirname,'saves_local.json');const all=fs.existsSync(f)?JSON.parse(fs.readFileSync(f)):{};all[p.uid]=s;fs.writeFileSync(f,JSON.stringify(all))}catch(e){}return}
  fbPut(p,`saves/${p.uid}/v2`,s);fbPut(p,`rank/${p.uid}_v2`,{n:P.nome,l:P.lvl,xp:P.xp,v:P.voc,ml:P.sk.magic,t:{'.sv':'timestamp'}})}
setInterval(()=>{for(const p of PL.values())save(p)},30000);
async function verify(tok){const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FB.apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:tok})});if(!r.ok)throw new Error('token inválido');const j=await r.json(),u=j.users[0];if(!u.email)throw new Error('anonimo');return{uid:u.localId,email:String(u.email||'').toLowerCase(),ok:!!u.emailVerified||(u.providerUserInfo||[]).some(p=>p.providerId==='google.com')}}
async function loadSave(uid,tok){if(NOAUTH){try{const f=path.join(__dirname,'saves_local.json');return fs.existsSync(f)?JSON.parse(fs.readFileSync(f))[uid]||null:null}catch(e){return null}}
  const r=await fetch(`${FB.db}/saves/${uid}/v2.json?auth=${encodeURIComponent(tok)}`);if(!r.ok)throw new Error('save '+r.status);return r.json()}
// ---------------- mensagens dos jogadores ----------------
async function onMsg(p,o){if(!o||typeof o.t!=='string')return;
  if(o.t==='hello'){if(p.uid)return;let uid,god=false;try{if(NOAUTH){uid=String(o.uid||'dev'+p.id);god=uid==='god'}else{const v=await verify(o.tok);uid=v.uid;god=v.ok&&GOD_EMAILS.includes(v.email)}}catch(e){send(p,{t:'err',m:e.message==='anonimo'?'É preciso ter uma conta registrada para jogar.':'Login inválido. Entre de novo.'});return p.ws.close()}
    if(BANS.has(uid)&&BANS.get(uid)>Date.now()){send(p,{t:'err',m:'Você está banido temporariamente.'});return p.ws.close()}p.god=god;
    for(const q of PL.values())if(q.uid===uid&&q!==p){save(q);q.ws.close()}
    let s=null;try{s=await loadSave(uid,o.tok)}catch(e){console.log('load',e.message)}const P=Object.assign(fresh(),s&&s.v===2?s:{});P.sk=Object.assign(fresh().sk,P.sk||{});P.inv=P.inv||[];P.eq=P.eq||{};P.quests=P.quests||{};if(!VOC[P.voc])P.voc='cidadao';
    if(!P.inv.length&&!P._starter){P._starter=1;P.inv=[{id:'sprSword',n:1},{id:'sprLifeFluid',n:8},{id:'sprManaFluid',n:5}];P.eq={armor:'sprArmor1',legs:'sprLegs1'}}
    p.uid=uid;p.tok=o.tok;p.P=P;P.hp=Math.min(Math.max(1,P.hp||maxHp(P)),maxHp(P));P.mp=Math.min(P.mp||maxMp(P),maxMp(P));p.cd={};p.dir='S';p.lastStep=0;
    if(!NOAUTH)await loadNames(o.tok);if(P._named&&P.nome)NAMES.set(normName(P.nome),uid);
    send(p,{t:'welcome',id:p.id,named:!!P._named,god:p.god});if(p.god)msg(p,'Bem-vindo, GOD. Seu painel está no botão da coroa.','#ffd700');placeIn(p,W[P.map]?P.map:'War',P.x,P.y);send(p,meState(p));return}
  if(!p.uid||!p.M)return;const M=p.M,P=p.P;if(!P._named&&!(o.t==='act'&&o.a==='profile')&&o.t!=='token')return;
  if(o.t==='token'){p.tok=o.tok;return}
  if(o.t==='step'){if(p.dead)return;const x=o.x|0,y=o.y|0;if(cheb(x,y,p.x,p.y)!==1||(x!==p.x&&y!==p.y))return send(p,{t:'pos',x:p.x,y:p.y});const t=now(),need=1/speed(p)*0.7;
    if(!p.god&&(t-p.lastStep<need||M.occ.has(y*M.w+x))||!walkable(M,x,y))return send(p,{t:'pos',x:p.x,y:p.y});p.lastStep=t;p.dir=x>p.x?'E':x<p.x?'W':y>p.y?'S':'N';p.x=x;p.y=y;checkTp(p);return}
  if(o.t==='face'){if('NESW'.includes(o.d))p.dir=o.d;return}
  if(o.t==='target'){p.target=o.id&&M.mobs.has(o.id)?o.id:null;return}
  if(o.t==='spell')return castSpell(p,o.id);if(o.t==='rune')return useRune(p,o.id);if(o.t==='pot')return drink(p,o.id);
  if(o.t==='god')return godCmd(p,o);
  if(o.t==='act')return act(p,o.a,o);if(o.t==='party')return partyCmd(p,o);
  if(o.t==='chat'){const m=String(o.m||'').slice(0,120).trim();if(!m)return;if(p.chatT&&now()-p.chatT<1)return;p.chatT=now();
    const pt=o.party&&p.party;const out={t:'chat',n:(p.god?'[GOD] ':'')+P.nome,m,pt:!!pt,god:!!p.god};if(pt){for(const q of p.party.members)send(q,out)}else{for(const q of PL.values())send(q,out);fx(M,{k:'say',id:p.id,t:m})}return}}
// ---------------- laço do mundo (10x por segundo) ----------------
let last=now();
setInterval(()=>{const t=now(),dt=Math.min(.25,t-last);last=t;
  for(const M of Object.values(W)){if(!M.players.size){M.fxq=[];continue}
    // criaturas
    for(const m of M.mobs.values()){m.atkT-=dt;m.thinkT-=dt;if(m.moveT>0){m.moveT-=dt;continue}
      let tgt=null,bd=1e9;for(const q of M.players){if(q.dead||q.invis||M.safe[q.y*M.w+q.x])continue;const d=cheb(q.x,q.y,m.x,m.y);if((d<=7||(m.aggro===q&&d<=12))&&d<bd){bd=d;tgt=q}}
      if(tgt){if(bd<=1){m.dir=tgt.x>m.x?'E':tgt.x<m.x?'W':tgt.y>m.y?'S':'N';if(m.atkT<=0){m.atkT=1.6;tgt.lastHit=t;hurtPlayer(tgt,m)}continue}
        if(m.thinkT<=0){m.thinkT=.25;const sx=Math.sign(tgt.x-m.x),sy=Math.sign(tgt.y-m.y);const opts=Math.abs(tgt.x-m.x)>Math.abs(tgt.y-m.y)?[[sx,0],[0,sy]]:[[0,sy],[sx,0]];for(const [dx,dy] of opts)if((dx||dy)&&moveMob(M,m,dx,dy))break}continue}
      m.aggro=null;if(m.thinkT<=0){m.thinkT=1.5+Math.random()*3;const d=[[1,0],[-1,0],[0,1],[0,-1]][(Math.random()*4)|0];if(Math.hypot(m.x+d[0]-m.sx,m.y+d[1]-m.sy)<6)moveMob(M,m,d[0],d[1])}}
    // jogadores: ataque automático e regeneração
    for(const p of M.players){if(p.dead)continue;const P=p.P;const m=p.target&&M.mobs.get(p.target);
      if(m){const d=cheb(m.x,m.y,p.x,p.y);if(d<=range(P)&&(!p.atkT||t>=p.atkT)){p.atkT=t+1;p.lastHit=t;const h=playerHit(p,m);if(h){if(range(P)>1)fx(M,{k:'shot',x0:p.x,y0:p.y,x1:m.x,y1:m.y,wand:h[1]==='wand'});hitMob(p,M,m,h[0])}}}else if(p.target&&!m)p.target=null;
      if(!p.regT||t>=p.regT){p.regT=t+(P.promo?1.3:2);P.hp=Math.min(maxHp(P),P.hp+1+Math.floor(P.lvl/4)+(P.eq.ring&&IT[P.eq.ring].reg?IT[P.eq.ring].reg*P.lvl/4:0));P.mp=Math.min(maxMp(P),P.mp+2+Math.floor(P.lvl/3));touch(p)}}
    // envia o que cada jogador enxerga
    const fxq=M.fxq||[];M.fxq=[];
    for(const p of M.players){const R=20;const pl=[],mb=[];for(const q of M.players)if(q!==p&&(!q.invis||p.god)&&Math.abs(q.x-p.x)<=R&&Math.abs(q.y-p.y)<=R)pl.push([q.id,q.P.nome,q.P.lvl,q.P.voc,q.P.sex,q.x,q.y,q.dir,Math.round(Math.max(0,q.P.hp)/maxHp(q.P)*100),p.party&&p.party.members.has(q)?1:0,q.god?1:0]);
      for(const m of M.mobs.values())if(Math.abs(m.x-p.x)<=R&&Math.abs(m.y-p.y)<=R)mb.push([m.id,m.kind,m.nome,m.lvl,m.x,m.y,m.dir,Math.round(m.hp/m.hpM*100)]);
      const f=fxq.filter(e=>Math.abs((e.x??e.x0??p.x)-p.x)<=R&&Math.abs((e.y??e.y0??p.y)-p.y)<=R);send(p,{t:'s',pl,mb,fx:f,tg:p.target||0,x:p.x,y:p.y})}}
  for(const p of dirty)if(p.ws&&p.ws.open)send(p,meState(p));dirty.clear()},100);
function moveMob(M,m,dx,dy){const nx=m.x+dx,ny=m.y+dy,i=ny*M.w+nx;if(!walkable(M,nx,ny)||M.occ.has(i)||M.tp.has(i)||M.safe[i])return false;for(const q of M.players)if(q.x===nx&&q.y===ny)return false;
  M.occ.delete(m.y*M.w+m.x);m.x=nx;m.y=ny;M.occ.set(i,m);m.dir=dx>0?'E':dx<0?'W':dy>0?'S':'N';m.moveT=1/m.spd;return true}
// ---------------- WebSocket (implementação própria, sem bibliotecas) ----------------
function wsAccept(req,sock){const key=req.headers['sec-websocket-key'];if(!key)return sock.destroy();const acc=crypto.createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+acc+'\r\n\r\n');sock.setNoDelay(true);
  const ws={open:true,send(s){if(!this.open)return;const b=Buffer.from(s);let h;if(b.length<126){h=Buffer.from([0x81,b.length])}else if(b.length<65536){h=Buffer.alloc(4);h[0]=0x81;h[1]=126;h.writeUInt16BE(b.length,2)}else{h=Buffer.alloc(10);h[0]=0x81;h[1]=127;h.writeBigUInt64BE(BigInt(b.length),2)}sock.write(Buffer.concat([h,b]))},
    close(){if(!this.open)return;this.open=false;try{sock.end(Buffer.from([0x88,0]))}catch(e){}onClose()}};
  const p={id:PID++,ws,cd:{}};p.ws_id=p.id;PL.set(p.id,p);let buf=Buffer.alloc(0);
  const onClose=()=>{if(!PL.has(p.id))return;PL.delete(p.id);if(p.party)partyCmd(p,{a:'leave'});if(p.M)p.M.players.delete(p);if(p.uid)save(p)};
  sock.on('data',d=>{buf=Buffer.concat([buf,d]);while(buf.length>=2){const op=buf[0]&15,mask=buf[1]&128;let len=buf[1]&127,off=2;if(len===126){if(buf.length<4)return;len=buf.readUInt16BE(2);off=4}else if(len===127){if(buf.length<10)return;len=Number(buf.readBigUInt64BE(2));off=10}
    if(len>1e6)return ws.close();const mk=mask?buf.slice(off,off+4):null;if(mask)off+=4;if(buf.length<off+len)return;let pl=buf.slice(off,off+len);buf=buf.slice(off+len);if(mk){pl=Buffer.from(pl);for(let i=0;i<pl.length;i++)pl[i]^=mk[i&3]}
    if(op===8)return ws.close();if(op===9){sock.write(Buffer.concat([Buffer.from([0x8A,pl.length]),pl]));continue}if(op===1){let o;try{o=JSON.parse(pl.toString('utf8'))}catch(e){continue}onMsg(p,o).catch(e=>console.log('msg err',e))}}});
  sock.on('close',()=>{ws.open=false;onClose()});sock.on('error',()=>{ws.open=false;onClose()})}
const srv=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Access-Control-Allow-Origin':'*'});res.end(`Eco das Cavernas — servidor online. Jogadores: ${[...PL.values()].filter(p=>p.uid).length}`)});
srv.on('upgrade',(req,sock)=>wsAccept(req,sock));
srv.listen(PORT,()=>console.log('Servidor do Eco das Cavernas na porta',PORT,NOAUTH?'(modo teste sem login)':''));
process.on('SIGTERM',()=>{for(const p of PL.values())save(p);setTimeout(()=>process.exit(0),1500)});
