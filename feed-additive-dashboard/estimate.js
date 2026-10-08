/* Shared product-type estimation used by index.html, scenario.html and trends.html.
   Names here (TYPES, NEAR, candidates, estimateRows, CONF_LABEL) must not clash with page globals. */
'use strict';

/* How a product type is estimated (shown on the overview under "단가대 기준표 · 추정 방법"):
   1) The customs sub-code wins when it names the product: 2309.90-3010/3020/3030 are 항생물질/비타민/미량광물질 위주.
   2) Only 2309.90-3090 (그 밖의 사료첨가제) is estimated from its unit price (USD/kg) against the bands below.
   3) Bands overlap, so every band containing the price is a candidate; the first is the one whose
      geometric centre is closest to the price on a log scale. No subjective weighting. */

// Rough bulk price bands (USD/kg) for common feed additives, from international bulk offers / trade records.
const TYPES=[
  {n:'Mineral carrier / pellet binder',k:'미네랄 캐리어·펠렛 바인더',lo:.3,hi:.8},
  {n:'Toxin binder (저가형)',k:'독소흡착제',lo:.35,hi:.8},
  {n:'Mold inhibitor / 저가 acidifier',k:'곰팡이 억제제·저가 산제',lo:.6,hi:1.5},
  {n:'일반 acidifier premix',k:'산제 프리믹스',lo:1,hi:2.5},
  {n:'Yeast cell wall / MOS',k:'효모세포벽·MOS',lo:1.5,hi:4},
  {n:'Phytogenic premix',k:'식물추출물 프리믹스',lo:2,hi:8},
  {n:'Lecithin / LPL',k:'레시틴·LPL',lo:2.5,hi:5},
  {n:'Phytase',k:'피타아제',lo:3,hi:10},
  {n:'NSP enzyme',k:'NSP 효소',lo:5,hi:20},
  {n:'Phage',k:'박테리오파지',lo:5,hi:20},
  {n:'Probiotic',k:'생균제',lo:5,hi:30},
];
const LOW_TYPE={n:'초저가 원료성 첨가제',k:'캐리어·희석제 등 ($0.3/kg 미만)',fit:0,out:true};
const HIGH_TYPE={n:'고가 특수제품 ($30/kg 초과)',k:'고농도 생균·효소·특수 원료',fit:0,out:true};
// Sub-codes whose customs name already says what the product is
const HS_TYPE={
  '2309903010':{n:'항생물질 프리믹스',k:'항생물질 위주 (세관 분류)',hs:true},
  '2309903020':{n:'비타민 프리믹스',k:'비타민 위주 (세관 분류)',hs:true},
  '2309903030':{n:'미량광물질 프리믹스',k:'미량광물질 위주 (세관 분류)',hs:true},
};
const NEAR=0.003;   // within 0.3% of a 2-decimal price = FX / freight rounding noise
const CONF_LABEL={h:'높음',m:'중간',lo:'낮음',mix:'혼합 추정'};

// Candidate types for one row: the customs sub-code if it names the product, else every price band containing p,
// closest band centre (log scale) first
function candidates(p,h){
  if(HS_TYPE[h])return[HS_TYPE[h]];
  const inb=TYPES.filter(t=>p>=t.lo&&p<=t.hi).map(t=>({...t,fit:Math.abs(Math.log(p/Math.sqrt(t.lo*t.hi)))/Math.log(t.hi/t.lo)}));
  if(!inb.length)return[p<TYPES[0].lo?LOW_TYPE:HIGH_TYPE];
  return inb.sort((a,b)=>a.fit-b.fit);
}

/* Add estimation fields to rows {m,c,h,usd,kg}:
   p (USD/kg), mt, cands, and single-product signals.
   Whole-tonne rows (>=1 MT, multiple of 1,000 kg) get conf h/m/lo; other rows are monthly mixes -> conf 'mix'. */
function estimateRows(rows){
  const isWhole=r=>r.kg>=1000&&r.kg%1000===0;
  const whole=rows.filter(isWhole);
  // Repeat order: same country, sub-item and tonnage in another month at a price within ±15%
  const same=(a,b)=>a.c===b.c&&a.h===b.h&&a.kg===b.kg&&Math.abs(Math.log((a.usd/a.kg)/(b.usd/b.kg)))<=Math.log(1.15);
  return rows.filter(r=>r.kg>0).map(r=>{
    const p=r.usd/r.kg,mt=r.kg/1000,cands=candidates(p,r.h);
    if(!isWhole(r))return{...r,p,mt,cands,conf:'mix',single:false};
    const q=Math.round(p*100)/100,exact=Math.abs(q*r.kg-r.usd)<=1,dev=Math.abs(p-q)/p;
    const near=!exact&&p<1&&dev<=NEAR;                     // above $1 almost any price sits near a 2-decimal value
    const rep=whole.filter(o=>same(o,r)).length,big=mt>=20;
    const conf=exact||rep>=2?'h':big||near?'m':'lo';
    return{...r,p,mt,q,exact,dev,near,rep,big,conf,cands,single:conf!=='lo'};
  });
}

// Display groups for the overview matrix (several price-band types roll up into one product family)
const GROUPS=[
  {id:'acid',k:'곰팡이 억제제·산제',types:['Mold inhibitor / 저가 acidifier','일반 acidifier premix'],c:'#1e40af'},
  {id:'yeast',k:'효모세포벽·MOS',types:['Yeast cell wall / MOS'],c:'#f59e0b'},
  {id:'phyto',k:'식물추출물 프리믹스',types:['Phytogenic premix'],c:'#e0718a'},
  {id:'toxin',k:'독소흡착제·바인더',types:['Toxin binder (저가형)','Mineral carrier / pellet binder'],c:'#5b9a5f'},
  {id:'lec',k:'레시틴·LPL',types:['Lecithin / LPL'],c:'#3b9be0'},
  {id:'enz',k:'효소 (피타아제·NSP)',types:['Phytase','NSP enzyme'],c:'#8b5cf6'},
  {id:'bio',k:'생균제·파지',types:['Probiotic','Phage'],c:'#0d9488'},
  {id:'vit',k:'비타민 프리믹스',types:['비타민 프리믹스'],c:'#c2410c'},
  {id:'min',k:'미량광물질 프리믹스',types:['미량광물질 프리믹스'],c:'#78716c'},
  {id:'abx',k:'항생물질 프리믹스',types:['항생물질 프리믹스'],c:'#be123c'},
  {id:'etc',k:'기타 (특수·초저가)',types:[],c:'#94a3b8'},
];
const groupOf=typeName=>GROUPS.find(g=>g.types.includes(typeName))||GROUPS[GROUPS.length-1];
