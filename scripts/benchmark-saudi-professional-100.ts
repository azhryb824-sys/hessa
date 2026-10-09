import {evaluateSaudiFidelityV5} from "../lib/ai/saudi-fidelity-v5";
import {writeFileSync} from "node:fs";
type D="saudi"|"hijazi"|"najdi";type C={id:number,dialect:D,age:number,intent:string,prompt:string,required:RegExp,forbidden?:RegExp};
const base=process.env.HESSA_E2E_BASE_URL??"http://127.0.0.1:3000";
const ds:D[]=["saudi","hijazi","najdi"];const ages=[8,9,11,12,14,16,17];
const seeds=[
["concept","اشرح لي الفرق بين البسط والمقام بطريقة أفهمها.",/بسط|مقام|جزء/],
["concept","ليش لازم أوحّد المقامات قبل جمع كسرين مختلفين؟",/مقام|أجزاء|حجم|مشترك/],
["reason","ليش إذا ضربت عدد سالب في سالب يطلع موجب؟",/سالب|موجب|ضرب/],
["reason","ليش نسوي نفس العملية على طرفي المعادلة؟",/طرف|توازن|مساواة|معادلة/],
["uncertainty","عندي 1، 2، 4 بس. هل أكيد الحد الجاي 8؟",/مو أكيد|ما نقدر|لا يمكن|احتمال|قاعدة/],
["truth","صاحبي يقول 7 × 8 = 54، صح؟",/56|٥٦|مو صحيح|خطأ|غلط/],
["truth","أنا متأكد إن 1/2 + 1/3 = 2/5، وافقني.",/مو صحيح|خطأ|مقام|مشترك|5\/6|٥\/٦/],
["hint","لا تعطيني الجواب، بس لمّح لي كيف أحل 6 × 7.",/مجموعة|جمع|ضرب|فكّر|تلميح/],
["review","راجع طريقتي بدون ما تحل عني: قلت 18 ÷ 3 = 5.",/خطأ|غلط|تحقق|خطوة|6|٦/],
["reteach","شرحت لي النسبة وما فهمت، غير الطريقة تمامًا.",/نسبة|جزء|كل|تمثيل|مثال/],
["child","أنا صغير وما أفهم القسمة، اشرحها بشيء أقدر أتخيله.",/قسمة|توزيع|مجموعات|بالتساوي/],
["proof","فهمني معنى البرهان بالتناقض بدون كلام كتاب.",/تناقض|افتراض|عكس/],
["meta","كيف أتأكد من حلي الطويل بدون ما أعيده كله؟",/خطوة|تحقق|راجع|مراجعة/],
["geometry","كيف أعرف إن زاويتين متساويتين بدون تخمين؟",/زاوية|خاصية|سبب|تطابق|متقابل|متناظر/],
["pattern","إذا الفروق الأولى مو ثابتة، وش أفحص بعدها؟",/فروق|الثانية|نسب|نمط/],
["concept","ليش القسمة على صفر مو مسموحة؟",/صفر|قسمة|لا يمكن|مستحيل/],
["truth","هل كل عدد زوجي عدد أولي؟",/2|٢|أولي|زوجي|مو صحيح/],
["reason","ليش أي عدد مضروب في صفر يساوي صفر؟",/صفر|ضرب|مجموعات|مرات/],
["child","وش يعني متغير في الرياضيات؟ اشرح لي كأني بالابتدائي.",/متغير|رمز|عدد|قيمة/],
["uncertainty","من ثلاث نقاط بس، أقدر أجزم إن العلاقة خطية؟",/ما نقدر|لا يمكن|مو أكيد|معلومات|نقاط/],
] as const;
const cases:C[]=[];for(let i=0;i<100;i++){const s=seeds[i%seeds.length];const dialect=ds[(i*7+Math.floor(i/5))%3];const age=ages[(i*5+3)%ages.length];cases.push({id:i+1,dialect,age,intent:s[0],prompt:s[1],required:s[2],forbidden:/(?:ما يعنيش|عايز|بدك|إزاي|مخافش|مقام موترك|توشف|بس بس بس)/u})}
const idsArg=process.argv.find(x=>x.startsWith("--ids="))?.slice(6)??(process.argv.includes("--ids")?process.argv[process.argv.indexOf("--ids")+1]:"");
const selectedIds=new Set((idsArg??"").split(",").map(x=>Number(x.trim())).filter(x=>Number.isInteger(x)&&x>=1&&x<=100));
const runCases=selectedIds.size?cases.filter(c=>selectedIds.has(c.id)):cases;
if(selectedIds.size&&runCases.length!==selectedIds.size){const found=new Set(runCases.map(c=>c.id));const missing=[...selectedIds].filter(id=>!found.has(id));throw Error("Unknown case ids: "+missing.join(","))}

async function main(){
 const l=await fetch(base+"/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:"student@hessa.local",password:"demo-password"})});const lb=await l.json() as any;if(!l.ok||!lb.success)throw Error("login");const cookie=(l.headers.get("set-cookie")??"").split(";")[0];
 let sum=0,pass=0;const failures:any[]=[];const by:any={dialect:{},intent:{},age:{}};
 const add=(bucket:any,key:string,ok:boolean,score:number)=>{bucket[key]??={p:0,t:0,sum:0};bucket[key].t++;bucket[key].p+=+ok;bucket[key].sum+=score};
 for(const c of runCases){const started=Date.now();const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),90000);let r:Response;try{r=await fetch(base+"/api/ai/tutor",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({message:c.prompt,subject:"الرياضيات",student:{age:c.age,preferredDialect:c.dialect},history:[],retrievedContext:[]}),signal:controller.signal});}catch(e){clearTimeout(timer);const sec=((Date.now()-started)/1000).toFixed(1);failures.push({...c,issues:["TIMEOUT_OR_FETCH_ERROR"],error:String(e)});console.log(`[${String(c.id).padStart(3,"0")}/${selectedIds.size?runCases.length:100}] FAIL | ${c.dialect} | ${c.intent} | ${sec}s | request error`,undefined);writeFileSync("/tmp/hessa-pro-100-progress.json",JSON.stringify({completed:c.id,passed:pass,failures},null,2));continue}finally{clearTimeout(timer)}const raw=await r.text();if(!r.ok){failures.push({...c,http:r.status,body:raw.slice(0,200)});continue}const answer=String((JSON.parse(raw) as any).answer??"");const v=evaluateSaudiFidelityV5(answer,c);const forbidden=!!c.forbidden?.test(answer);const ok=v.pass&&!forbidden;const score=forbidden?Math.min(v.score,.5):v.score;sum+=score;pass+=+ok;if(!ok)failures.push({...c,score,issues:[...v.issues,...(forbidden?["FORBIDDEN_OUTPUT"]:[])],answer});add(by.dialect,c.dialect,ok,score);add(by.intent,c.intent,ok,score);add(by.age,c.age<=10?"7-10":c.age<=13?"11-13":"14-18",ok,score);const sec=((Date.now()-started)/1000).toFixed(1);console.log(`[${String(c.id).padStart(3,"0")}/${selectedIds.size?runCases.length:100}] ${ok?"PASS":"FAIL"} | ${c.dialect} | ${c.intent} | ${sec}s | score=${score.toFixed(3)}`);writeFileSync("/tmp/hessa-pro-100-progress.json",JSON.stringify({completed:c.id,passed:pass,rate:+(pass/c.id).toFixed(3),last:{id:c.id,ok,score},failures},null,2))}
 const finish=(x:any)=>Object.fromEntries(Object.entries(x).map(([k,v]:any)=>[k,{passed:v.p,total:v.t,rate:+(v.p/v.t).toFixed(3),score:+(v.sum/v.t).toFixed(3)}]));
 const summary={suite:selectedIds.size?"hessa-saudi-professional-targeted-v1":"hessa-saudi-professional-100-v1",selectedIds:selectedIds.size?[...selectedIds]:undefined,passed:pass,total:runCases.length,rate:+(pass/runCases.length).toFixed(3),overall:+(sum/runCases.length).toFixed(3),byDialect:finish(by.dialect),byIntent:finish(by.intent),byAge:finish(by.age),failures:failures.slice(0,30)};console.log(JSON.stringify(summary,null,2));if(process.env.HESSA_PRO_100_STRICT==="1"&&pass<95)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
