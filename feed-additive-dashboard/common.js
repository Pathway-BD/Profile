/* Shared constants and helpers for index.html (overview) and dashboard.html.
   Plain script (no modules) so the pages also work from a simple static server. */
'use strict';

// HS 2309.90-30 sub-items (Korean tariff 10-digit codes)
const ITEM_LABEL={'2309903010':'항생물질 위주','2309903020':'비타민 위주','2309903030':'미량광물질 위주','2309903090':'기타 사료첨가제'};
const ITEM_DESC={'2309903010':'항생물질을 주로 한 것','2309903020':'비타민을 주로 한 것','2309903030':'미량광물질을 주로 한 것','2309903090':'그 밖의 사료첨가제'};

// 16 assigned markets
const MARKETS=['SA','AE','QA','KW','OM','BH','JO','IQ','EG','KE','NG','TZ','BD','PK','NP','KZ'];

// Region mapping (7 regions; anything else falls into '기타')
const REGIONS=["아시아","서남아","중앙아시아","중동","아프리카","유럽","미주"];
const REG={};
'CN JP TW HK MO MN KP VN TH MY SG ID PH MM KH LA BN TL AU NZ PG FJ NC PF WS TO VU SB KI FM MH PW NR TV GU MP AS CK NU'.split(' ').forEach(c=>REG[c]='아시아');
'IN PK BD NP LK BT MV AF'.split(' ').forEach(c=>REG[c]='서남아');
'KZ UZ TM KG TJ AZ AM GE'.split(' ').forEach(c=>REG[c]='중앙아시아');
'SA AE QA KW OM BH JO IQ IR IL PS LB SY YE TR'.split(' ').forEach(c=>REG[c]='중동');
'DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW EH RE YT SH'.split(' ').forEach(c=>REG[c]='아프리카');
'GB IE FR DE NL BE LU CH AT IT ES PT GR CY MT DK SE NO FI IS PL CZ SK HU RO BG HR SI RS BA ME MK AL XK EE LV LT BY UA MD RU AD MC SM VA LI GI FO GG JE IM'.split(' ').forEach(c=>REG[c]='유럽');
'US CA MX GT BZ SV HN NI CR PA CU DO HT JM TT BS BB AG DM GD KN LC VC PR AR BO BR CL CO EC GY PY PE SR UY VE AW CW KY BM VG VI TC GP MQ GF FK MS AI SX BQ BL MF PM GL'.split(' ').forEach(c=>REG[c]='미주');
const regOf=c=>REG[c]||'기타';

const LINK='https://www.data.go.kr/data/15100475/openapi.do';

// DOM / text helpers
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// Month helpers: months are [year, month] pairs or "YYYY.MM" strings
const pad=n=>String(n).padStart(2,'0');
const addM=([y,m],k)=>{m+=k;while(m<1){m+=12;y--}while(m>12){m-=12;y++}return[y,m]};
const yyyymm=a=>`${a[0]}${pad(a[1])}`, dot=s=>`${s.slice(0,4)}.${s.slice(4)}`;
const mkey=a=>`${a[0]}.${pad(a[1])}`;                       // [2026,8] -> "2026.08"
const parseM=s=>s.split('.').map(Number);                   // "2026.08" -> [2026,8]
const korM=s=>{const[y,m]=parseM(s);return`${y}년 ${m}월`};

// Number formatters (USD, USD/kg, MT)
const fUSD=v=>{const a=Math.abs(v);return a>=1e6?`$${(v/1e6).toFixed(2)}M`:a>=1e3?`$${(v/1e3).toFixed(0)}K`:`$${Math.round(v)}`};
const fPv=v=>v==null?'-':`$${v.toFixed(2)}`;
const fMT=kg=>`${(kg/1000).toLocaleString(undefined,{maximumFractionDigits:kg<100000?1:0})} MT`;
const fPct=v=>v==null?'-':`${v>=0?'▲':'▼'} ${Math.abs(v*100).toFixed(1)}%`;

// Load codes.json + the data file. Resolves to {CN, DATA}; rejects with 'missing' if the data file is absent.
function loadData(){
  return Promise.all([
    fetch('codes.json').then(r=>r.json()),
    fetch('data/feed_additive.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('missing');return r.json()})
  ]).then(([c,d])=>({CN:Object.fromEntries(c.country),DATA:d}));
}
