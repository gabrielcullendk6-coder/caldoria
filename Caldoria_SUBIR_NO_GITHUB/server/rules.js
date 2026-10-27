// Regras do jogo (geradas a partir do cliente)
const IT={};const it=(id,o)=>IT[id]=Object.assign({id},o);
// armas de cavaleiro
[['sprSword','Espada Curta',8,0,60],['sprSword1','Espada',12,5,250],['sprSword2','Sabre',16,10,600],['sprAxe','Machado de Batalha',20,15,1200],['sprSword3','Espada Larga',24,20,2200],['sprSword11','Espada de Fogo',29,30,5000],['sprSword12','Lâmina Rúnica',33,40,9000],['sprSword13','Espada do Guardião',37,50,15000],['sprSword14','Lâmina Dracônica',41,60,24000],['sprSword16','Espada Real',45,75,38000],['sprSword22','Machado Demoníaco',49,90,60000],['sprSword26','Lâmina do Abismo',53,110,95000],['sprSword27','Espada Infernal',58,130,150000]]
 .forEach(([s,n,a,l,p])=>it(s,{n,t:'weapon',w:'melee',v:'k',atk:a,l,p}));
// arcos e bestas (arqueiro)
[['sprBow1','Arco Curto',9,0,80],['sprBow2','Arco',13,5,300],['sprBow3','Arco Composto',18,15,1300],['sprCrossbow1','Besta',22,20,2400],['sprBow4','Arco Élfico',27,30,5200],['sprCrossbow2','Besta Pesada',31,40,9500],['sprBow5','Arco Silvestre',36,55,17000],['sprCrossbow4','Besta Real',41,70,30000],['sprBow6','Arco Celestial',46,90,55000],['sprCrossbow5','Besta Infernal',50,110,90000],['sprBow7','Arco do Dragão',55,130,140000]]
 .forEach(([s,n,a,l,p])=>it(s,{n,t:'weapon',w:'dist',v:'a',atk:a,l,p,range:5}));
// varinhas (mago): dano mágico fixo
[['sprWand1','Varinha de Aprendiz',[6,14],0,90],['sprWand2','Varinha de Vortex',[10,20],6,400],['sprWand3','Varinha de Faíscas',[14,26],13,1300],['sprWand4','Varinha de Fogo',[19,33],19,2600],['sprWand5','Varinha Glacial',[25,41],26,5000],['sprWand6','Varinha de Terra',[31,49],33,9000],['sprWand7','Varinha Elétrica',[38,58],42,15000],['sprWand8','Varinha Sombria',[46,68],55,26000],['sprWand9','Varinha Arcana',[55,80],70,45000],['sprWand10','Varinha Infernal',[66,96],90,80000]]
 .forEach(([s,n,d,l,p])=>it(s,{n,t:'weapon',w:'wand',v:'m',dmg:d,l,p,range:5,mana:3}));
// armaduras
[['sprArmor1','Armadura de Couro',3,0,40,'kam'],['sprArmor2','Cota de Malha',5,5,300,'ka'],['sprArmor3','Armadura de Escamas',7,12,900,'ka'],['sprArmor4','Armadura de Placas',9,20,2400,'k'],['sprArmor5','Armadura de Cavaleiro',11,30,6000,'k'],['sprArmor6','Armadura Nobre',10,25,4200,'ka'],['sprArmor7','Armadura Élfica',11,35,8000,'a'],['sprArmor8','Armadura Dourada',13,45,14000,'k'],['sprArmor9','Armadura Coroada',14,55,22000,'k'],['sprArmor10','Armadura de Paladino',13,55,20000,'a'],['sprArmor11','Armadura Mágica',14,70,36000,'ka'],['sprArmor13','Armadura do Arqueiro',15,60,0,'a'],['sprArmor15','Armadura do Cavaleiro Real',16,60,0,'k'],['sprArmor14','Armadura de Dragão',17,90,70000,'ka'],['sprArmor16','Armadura de Lava',18,110,110000,'k'],['sprArmor18','Armadura Celestial',18,120,120000,'a'],['sprArmor20','Armadura Demoníaca',20,130,0,'k'],
 ['sprRobe1','Manto de Aprendiz',3,0,60,'m'],['sprRobe2','Manto Azul',7,25,3000,'m'],['sprRobe3','Manto Arcano',12,60,0,'m']]
 .forEach(([s,n,a,l,p,v])=>it(s,{n,t:'armor',arm:a,l,p,v}));
[['sprHelmet1','Elmo de Couro',1,0,30,'kam'],['sprHelmet2','Elmo de Ferro',2,5,200,'ka'],['sprHelmet3','Elmo de Aço',3,12,700,'ka'],['sprHelmet4','Elmo de Guerra',4,20,1800,'k'],['sprHelmet5','Elmo de Cruzado',5,30,4500,'ka'],['sprHelmet6','Elmo Real',6,45,10000,'k'],['sprHelmet7','Elmo de Dragão',7,60,20000,'k'],['sprHelmet8','Elmo Demoníaco',8,90,45000,'ka'],['sprHelmet9','Elmo Dourado',9,50,0,'kam'],['sprHelmet10','Elmo do Destino',10,110,90000,'kam'],['sprHat1','Chapéu de Mago',2,0,150,'m'],['sprHat2','Chapéu Arcano',5,40,8000,'m']]
 .forEach(([s,n,a,l,p,v])=>it(s,{n,t:'head',arm:a,l,p,v}));
[['sprLegs1','Calça de Couro',1,0,30],['sprLegs2','Calça de Malha',3,5,250],['sprLegs3','Calça de Placas',5,15,1500],['sprLegs4','Calça de Cavaleiro',6,25,4000],['sprLegs5','Calça Nobre',7,35,8000],['sprLegs6','Calça Élfica',7,40,9000],['sprLegs7','Calça Dourada',8,55,18000],['sprLegs9','Calça de Dragão',9,70,32000],['sprLegs10','Calça Mágica',8,60,24000],['sprLegs16','Calça de Lava',10,90,60000],['sprLegs17','Calça Celestial',11,110,95000],['sprLegs18','Calça do Abismo',12,130,140000]]
 .forEach(([s,n,a,l,p])=>it(s,{n,t:'legs',arm:a,l,p,v:'kam'}));
[['sprBoots1','Botas de Couro',1,0,40,0],['sprBoots2','Botas de Aço',2,15,1200,0],['sprBoots3','Botas da Pressa',2,25,0,1.2],['sprBoots4','Botas de Dragão',4,80,40000,0.3]]
 .forEach(([s,n,a,l,p,sp])=>it(s,{n,t:'boots',arm:a,l,p,v:'kam',spd:sp}));
[['sprShield2','Escudo de Madeira',8,0,60],['sprShield3','Escudo de Aço',13,8,500],['sprShield4','Escudo de Batalha',17,15,1400],['sprShield5','Escudo de Torre',21,25,3500],['sprShield6','Escudo Nobre',24,35,7000],['sprShield7','Escudo do Guardião',27,45,13000],['sprShield8','Escudo Real',30,55,22000],['sprShield9','Escudo de Dragão',33,70,36000],['sprShield10','Escudo Demoníaco',36,90,60000],['sprShield11','Escudo do Abismo',39,110,100000]]
 .forEach(([s,n,d,l,p])=>it(s,{n,t:'shield',def:d,l,p,v:'k'}));
[['sprSpellbook1','Livro de Magias',10,0,150],['sprSpellbook2','Livro Arcano',16,25,4000],['sprSpellbook3','Livro dos Sábios',22,50,16000],['sprSpellbook4','Grimório Infernal',28,90,60000]]
 .forEach(([s,n,d,l,p])=>it(s,{n,t:'shield',def:d,l,p,v:'m',ml:Math.round(l/25)}));
[['sprRing1','Anel de Vida',0,800,{reg:2}],['sprRing4','Anel de Energia',10,2000,{ms:1}],['sprRing5','Anel da Força',20,3000,{atk:3}],['sprRing6','Anel do Tempo',30,5000,{spd:.3}],['sprRing7','Anel de Proteção',40,8000,{arm:3}]]
 .forEach(([s,n,l,p,b])=>it(s,{n,t:'ring',l,p,v:'kam',...b}));
[['sprAmulet1','Amuleto de Proteção',0,500,{arm:2}],['sprAmulet2','Amuleto de Sabedoria',20,4000,{ml:2}],['sprAmulet3','Amuleto da Perda',30,30000,{aol:1}]]
 .forEach(([s,n,l,p,b])=>it(s,{n,t:'amulet',l,p,v:'kam',...b}));
// poções (fluids) e runas
[['sprSmallLifeFluid','Small Life Fluid',[40,60],0,15,'hp'],['sprLifeFluid','Life Fluid',[75,105],0,40,'hp'],['sprStrongLifeFluid','Strong Life Fluid',[150,220],50,100,'hp'],['sprGreatLifeFluid','Great Life Fluid',[300,420],80,190,'hp'],['sprUltimateLifeFluid','Ultimate Life Fluid',[500,700],130,310,'hp'],['sprSupremeLifeFluid','Supreme Life Fluid',[800,1100],200,500,'hp'],
 ['sprManaFluid','Mana Fluid',[70,130],0,50,'mp'],['sprStrongManaFluid','Strong Mana Fluid',[110,190],50,80,'mp'],['sprGreatManaFluid','Great Mana Fluid',[200,300],80,120,'mp'],['sprUltimateManaFluid','Ultimate Mana Fluid',[400,550],130,350,'mp'],['sprGreatSpiritFluid','Great Spirit Fluid',[200,300],80,190,'hpmp'],['sprUltimateSpiritFluid','Ultimate Spirit Fluid',[400,550],130,440,'hpmp']]
 .forEach(([s,n,h,l,p,k])=>it(s,{n,t:'pot',heal:h,l,p,kind:k,stack:1}));
[['sprHeavyMagicMissileRune','Runa Míssil Mágico',1,'atk',(L,M)=>[L/5+M*0.8+5,L/5+M*1.6+12],'sprEnergyStrike',30,'kam'],['sprFireballRune','Runa Bola de Fogo',5,'atk',(L,M)=>[L/5+M*1.8+10,L/5+M*3+18],'sprPoisonExplosion',45,'am'],
 ['sprAvalancheRune','Runa Avalanche',4,'area',(L,M)=>[L/5+M*1.2+7,L/5+M*2.8+12],'sprThornado',57,'am'],['sprSdRune','Runa Morte Súbita',15,'atk',(L,M)=>[L/5+M*4.3+32,L/5+M*6.8+42],'sprDeathStrike',135,'m'],
 ['sprUltimateHealingRune','Runa Cura Suprema',4,'heal',(L,M)=>[L/5+M*7.3+42,L/5+M*12.4+90],'sprHealing',175,'kam']]
 .forEach(([s,n,ml,k,f,fx,p,v])=>it(s,{n,t:'rune',ml,kind:k,f,fx,p,v,stack:1}));

const isStack=id=>IT[id]&&IT[id].stack;

const SPELLS=[
 {id:'exura',n:'Cura Leve',w:'exura',v:'kam',l:8,mp:20,cd:1,ic:'sprMinorHealingSpell',k:'heal',f:(L,M)=>[L/5+M*1.4+8,L/5+M*1.8+11]},
 {id:'utani',n:'Pressa',w:'utani hur',v:'kam',l:14,mp:60,cd:2,ic:'sprRunSpell',k:'haste'},
 {id:'exori_vis',n:'Golpe de Energia',w:'exori vis',v:'m',l:12,mp:20,cd:2,ic:'sprMinorEnergySpell',k:'atk',fx:'sprEnergyStrike',f:(L,M)=>[L/5+M*1.4+8,L/5+M*2.2+14]},
 {id:'utamo',n:'Escudo de Mana',w:'utamo vita',v:'m',l:14,mp:50,cd:2,ic:'sprManaShield',k:'shield'},
 {id:'exura_gran',n:'Cura Intensa',w:'exura gran',v:'am',l:20,mp:70,cd:1,ic:'sprHealingSpell',k:'heal',f:(L,M)=>[L/5+M*3.2+20,L/5+M*5.4+40]},
 {id:'exevo_vis_hur',n:'Onda de Energia',w:'exevo vis hur',v:'m',l:38,mp:170,cd:6,ic:'sprEnergyWave',k:'wave',fx:'sprThunderstormStrike',f:(L,M)=>[L/5+M*4.5,L/5+M*9]},
 {id:'exura_vita',n:'Cura Suprema',w:'exura vita',v:'m',l:30,mp:160,cd:1,ic:'sprHealIntense',k:'heal',f:(L,M)=>[L/5+M*6.9+40,L/5+M*13.2+82]},
 {id:'exevo_gran_mas_vis',n:'Tempestade',w:'exevo gran mas vis',v:'m',l:55,mp:600,cd:30,ic:'sprEnergySpell',k:'area',r:4,fx:'sprThunderstorm',f:(L,M)=>[L/5+M*5,L/5+M*12]},
 {id:'exori_san',n:'Golpe Divino',w:'exori san',v:'a',l:25,mp:20,cd:2,ic:'sprDivineShoot',k:'atk',fx:'sprDivineStrike',f:(L,M)=>[L/5+M*1.79+11,L/5+M*3+18]},
 {id:'utito',n:'Tiro Certeiro',w:'utito tempo san',v:'a',l:60,mp:450,cd:10,ic:'sprSharpshoot',k:'buff'},
 {id:'exevo_mas_san',n:'Caldeirão Divino',w:'exevo mas san',v:'a',l:50,mp:160,cd:4,ic:'sprDivineCaldera',k:'area',r:3,fx:'sprDivineStrike',f:(L,M)=>[L/5+M*4,L/5+M*6]},
 {id:'exori_ico',n:'Golpe Fatal',w:'exori ico',v:'k',l:16,mp:30,cd:6,ic:'sprWhirlwindSpell',k:'meleehit',fx:'sprFatal',mul:[1.1,1.8]},
 {id:'exori',n:'Berserk',w:'exori',v:'k',l:35,mp:115,cd:4,ic:'sprBerserkSpell',k:'melee_area',r:1,fx:'sprFrontSweep',mul:[1.0,1.6]},
 {id:'exori_gran',n:'Fúria',w:'exori gran',v:'k',l:90,mp:340,cd:6,ic:'sprUltimateExplosion',k:'melee_area',r:1,fx:'sprFrontSweep',mul:[1.6,2.6]},
 {id:'exura_ico',n:'Cura Ferida',w:'exura ico',v:'k',l:8,mp:40,cd:1,ic:'sprHealUltimate',k:'heal',f:(L,M)=>[L/5+60,L/5+120]}];

const NOME={rat:'Rato',rabbit:'Coelho',snake:'Cobra',spider:'Aranha',hamster:'Hamster',Ram:'Carneiro',muffel:'Muflão',sheep:'Ovelha',wolf:'Lobo',fox:'Raposa',troll:'Troll',Goblin:'Goblin',orc:'Orc',dwarf:'Anão',skeleton:'Esqueleto',larva:'Larva',worm:'Verme',giantSpider:'Aranha Gigante',elf:'Elfo',feralFox:'Raposa Feroz',phamster:'Hamster Pálido',dwarfSoldier:'Soldado Anão',elfArcher:'Arqueiro Elfo',minotaur:'Minotauro',minotaurArcher:'Minotauro Arqueiro',minotaurSoldier:'Minotauro Guerreiro',minotaurShaman:'Minotauro Xamã',cyclops:'Ciclope',vampire:'Vampiro',zombie:'Zumbi',yeti:'Yeti',AncientScarab:'Escaravelho Antigo',akenaton:'Akenaton',centipede:'Centopeia',golem:'Golem',dwarfGuard:'Guarda Anão',ironHamster:'Hamster de Ferro',puffsed:'Baiacu',toxicpuffsed:'Baiacu Tóxico',tarantula:'Tarântula',Medusa:'Medusa',OrcBerserker:'Orc Berserker',orcLeader:'Líder Orc',necromancer:'Necromante',Warlock:'Bruxo',skeletonM:'Esqueleto Mago',skeletonW:'Esqueleto Guerreiro',pharaoh:'Faraó',Margonth:'Margonth',souleater:'Devorador de Almas',tyrantHunter:'Caçador Tirano',tyrant:'Tirano',fury:'Fúria',dragon:'Dragão',dragon2:'Dragão Ancião',hydra:'Hidra',Behemoth:'Behemoth',demon:'Demônio',demonic:'Demoníaco',destroyer:'Destruidor',hades:'Hades',angel:'Anjo Caído',tyrantElite:'Tirano de Elite',tyrantSorcerer:'Tirano Feiticeiro'};
const ZONES={
 WarCave:[[(x,y)=>x<80&&y<80,['Goblin','troll','orc'],8,20],[(x,y)=>x>170&&y<90,['dwarf','dwarfSoldier','dwarfGuard'],15,35],[(x,y)=>x<90&&y>190,['minotaur','minotaurArcher','minotaurSoldier','minotaurShaman'],30,60],
          [(x,y)=>x>175&&y>185,['cyclops','golem','Behemoth'],40,80],[()=>true,['rat','snake','spider','larva','hamster','wolf'],1,10]],
 WarCave2:[[()=>true,['centipede','worm','giantSpider','tarantula'],40,70]],
 War_2:[[()=>true,['rat','spider','giantSpider','larva','worm','centipede'],3,15]],
 War_3:[[()=>true,['AncientScarab','akenaton','pharaoh','worm','snake'],25,50]],
 War_4:[[()=>true,['skeleton','skeletonW','skeletonM','zombie','necromancer','Warlock'],60,110]],
 War_5:[[()=>true,['snake','toxicpuffsed','puffsed','larva','Medusa'],50,90]],
 War_6:[[()=>true,['wolf','fox','feralFox','rabbit','sheep','Ram','muffel','elf','elfArcher','hamster'],1,12]],
 War_7:[[()=>true,['vampire','zombie','skeletonM','souleater','necromancer','fury'],80,140]],
 War_8:[[()=>true,['orc','OrcBerserker','orcLeader','minotaurSoldier','tyrant','tyrantHunter','tyrantSorcerer','tyrantElite'],100,180]],
 WarCavesVIP:[[(x,y)=>Math.hypot(x-64,y-106)<Math.hypot(x-113,y-94),['dragon','dragon2'],150,220],[()=>true,['hydra'],180,260]]};

const CHESTS={'WarCave:26,17':{q:'first',it:'sprBow2',n:'Primeiras Armas'},'WarCave:28,17':{q:'first',it:'sprSword2',n:'Primeiras Armas'},'WarCave:30,17':{q:'first',it:'sprWand2',n:'Primeiras Armas'},
 'WarCave:195,34':{q:'boh',it:'sprBoots3',n:'Botas da Pressa'},'WarCave:49,231':{q:'gh',it:'sprHelmet9',n:'Elmo Dourado'},
 'WarCave:194,208':{q:'armors',it:'sprArmor15',n:'Últimas Armaduras'},'WarCave:197,208':{q:'armors',it:'sprRobe3',n:'Últimas Armaduras'},'WarCave:200,208':{q:'armors',it:'sprArmor13',n:'Últimas Armaduras'},
 'WarCave2:149,197':{q:'fluids',it:'sprStrongLifeFluid',n:'Poções Fortes',qty:20,extra:['sprStrongManaFluid',20]},
 'War:147,109':{q:'anihi',it:'sprArmor20',n:'Aniquilador',lvl:100}};

const VOC={cidadao:{hp:5,mp:5,range:1,nome:'Cidadão'},cavaleiro:{hp:15,mp:5,range:1,nome:'Cavaleiro'},arqueiro:{hp:10,mp:15,range:5,nome:'Arqueiro'},mago:{hp:5,mp:30,range:5,nome:'Mago'}};
const expFor=l=>Math.round(50/3*(l*l*l-6*l*l+17*l-12));

const FLOOR={War:0,WarCave:1,WarCave2:2,WarCavesVIP:1,WarTrainersVIP:1,War_1:0,War_2:1,War_3:2,War_4:3,War_5:1,War_6:0,War_7:1,War_8:2};
const STACK={War:'A',WarCave:'A',WarCave2:'A',War_5:'A',War_8:'A',War_1:'B',War_2:'B',War_3:'B',War_4:'B',War_6:'C',War_7:'C',WarCavesVIP:'V',WarTrainersVIP:'V'};

module.exports={IT,isStack,SPELLS,NOME,ZONES,CHESTS,VOC,expFor,FLOOR,STACK};
