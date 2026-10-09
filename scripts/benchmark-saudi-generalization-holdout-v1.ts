import {evaluateSaudiFidelityV5} from "../lib/ai/saudi-fidelity-v5";

type Dialect="saudi"|"hijazi"|"najdi";
type Turn={role:"user"|"assistant";content:string};
type Case={id:number;dialect:Dialect;age:number;intent:string;prompt:string;history?:Turn[];must?:RegExp;mustNot?:RegExp};

const cases:Case[]=[
{id:1,dialect:"saudi",age:10,intent:"concept",prompt:"أنا فاهم إن 3/5 يعني ثلاثة فوق وخمسة تحت، بس إيش معنى الخمسة فعلًا؟",must:/جزء|أجزاء|متساوي/},
{id:2,dialect:"hijazi",age:15,intent:"reason",prompt:"ليش إذا ضربت طرفي المعادلة في نفس العدد ما تتغير صحة المعادلة؟",must:/طرف|مساواة|توازن/},
{id:3,dialect:"najdi",age:17,intent:"uncertainty",prompt:"شفت الحدود 3، 6، 12. أقدر أجزم إن اللي بعدها 24؟",must:/مو أكيد|ما نقدر|احتمال|قاعدة/},
{id:4,dialect:"saudi",age:8,intent:"child",prompt:"إيش يعني نص الشيء؟ اشرحها لي كأني صغير.",must:/نصف|قسم|جزئين|جزء/},
{id:5,dialect:"hijazi",age:13,intent:"truth",prompt:"صاحبي يقول أي عدد ينتهي بـ5 عدد أولي. كلامه مضبوط؟",must:/مو صحيح|غير صحيح|5|أولي/},
{id:6,dialect:"najdi",age:16,intent:"geometry",prompt:"إذا شكل زاويتين في الرسم متشابه، يكفي أقول إنهن متساويات؟",must:/لا|مو|قياس|دليل|خاصية/},
{id:7,dialect:"saudi",age:14,intent:"meta",prompt:"عندي حل من عشر خطوات، كيف أراجع المنطق بدون ما أحسب كل شيء من الصفر؟",must:/خطوة|قاعدة|تحقق|تعويض|معطيات/},
{id:8,dialect:"hijazi",age:9,intent:"hint",prompt:"عندي 6 أكياس وفي كل كيس 4 حبات. لا تقول الناتج، بس لمّح لي.",must:/مجموعة|أكياس|عد|ضرب/,mustNot:/24/},
{id:9,dialect:"najdi",age:18,intent:"proof",prompt:"أبي أفهم فكرة البرهان بالتناقض، مو بس أحفظ خطواته.",must:/افترض|عكس|تناقض|مستحيل/},
{id:10,dialect:"saudi",age:12,intent:"pattern",prompt:"الفروق الأولى طلعت 5، 8، 11، 14. وش الشيء المفيد اللي أفحصه؟",must:/فروق.*ثاني|الثانية|3/},
{id:11,dialect:"hijazi",age:16,intent:"concept",prompt:"ليش 1/3 + 1/4 مو 2/7؟",must:/مقام|أجزاء|مشترك/},
{id:12,dialect:"najdi",age:11,intent:"reason",prompt:"ليش أي عدد نضربه في صفر يطلع صفر؟ أبي معنى مو قاعدة أحفظها.",must:/مجموع|مجموعة|صفر/},
{id:13,dialect:"saudi",age:17,intent:"uncertainty",prompt:"ثلاث نقاط طلعت على خط واحد في العينة. هل هذا يثبت إن العلاقة كلها خطية؟",must:/ما نقدر|لا يثبت|معلومات|نقاط/},
{id:14,dialect:"hijazi",age:8,intent:"child",prompt:"إيش هو المتغير؟ لا تستخدم كلام جامعي.",must:/رمز|عدد|صندوق|يتغير/},
{id:15,dialect:"najdi",age:15,intent:"truth",prompt:"واحد قال لي السالب في السالب يطلع سالب. صح؟",must:/مو صحيح|موجب|سالب/},
{id:16,dialect:"saudi",age:13,intent:"geometry",prompt:"كيف أثبت إن هذي الزاويتين قد بعض إذا الرسم مو على القياس؟",must:/قياس|خاصية|دليل|تطابق|متقابل/},
{id:17,dialect:"hijazi",age:17,intent:"review",prompt:"أنا حليت معادلة وطلعت قيمة س. كيف أشيك الجواب بسرعة؟",must:/عوض|تعويض|طرف/},
{id:18,dialect:"najdi",age:10,intent:"reteach",prompt:"شرحت لي الضرب كم مرة وما فهمت. غير الطريقة تمامًا.",must:/رسم|مجموع|مجموعة|نقاط|صفوف/},
{id:19,dialect:"saudi",age:16,intent:"proof",prompt:"لو أبي أثبت إن مربع العدد الفردي فردي، من وين أبدأ؟ لا تكمل البرهان كله.",must:/2.*ك|فردي|مثّل|اكتب/},
{id:20,dialect:"hijazi",age:14,intent:"pattern",prompt:"إذا لا الفروق الأولى ولا الثانية ثبتت، إيش أجرب بعد كذا؟",must:/نسب|رقم الحد|قيمته|قاعدة/},
{id:21,dialect:"najdi",age:9,intent:"concept",prompt:"ليش لما أقسم بيتزا لأجزاء أكثر تصير القطعة أصغر؟",must:/أجزاء|نفس|أصغر|تقسيم/},
{id:22,dialect:"saudi",age:15,intent:"reason",prompt:"ليش القسمة على كسر تقلب لضرب في مقلوبه؟ أبغى الفكرة.",must:/مقلوب|ضرب|قسمة/},
{id:23,dialect:"hijazi",age:18,intent:"uncertainty",prompt:"لقيت قاعدة تضبط أول أربع حدود. خلاص أعتبرها القاعدة الوحيدة؟",must:/لا|مو|قاعدة|أكثر|إضاف/},
{id:24,dialect:"najdi",age:12,intent:"truth",prompt:"هل 1 عدد أولي؟ وليه؟",must:/مو|ليس|قاسم|عامل|واحد/},
{id:25,dialect:"saudi",age:8,intent:"age-fit",prompt:"علمني 4 × 3 بدون شرح طويل.",must:/مجموعة|4|3|أربع|ثلاث/},
{id:26,dialect:"hijazi",age:16,intent:"meta",prompt:"كيف أعرف إن خطوة في برهاني تحتاج تبرير زيادة؟",must:/سبب|قاعدة|معطى|خطوة/},
{id:27,dialect:"najdi",age:14,intent:"geometry",prompt:"إذا مستقيمين متوازيين قطعهم قاطع، إيش العلاقة اللي أقدر أستفيد منها بين الزوايا؟",must:/متناظر|متبادل|زاوي/},
{id:28,dialect:"saudi",age:11,intent:"hint",prompt:"36 ÷ 6، لا تعطيني الجواب. عطيني طريقة أفكر فيها.",must:/ضرب|عدد|6/,mustNot:/=s*6|الناتج.*6/},
{id:29,dialect:"hijazi",age:17,intent:"concept",prompt:"إيش الفرق بين المتوسط والوسيط؟ لا تعطيني تعريف كتابي ناشف.",must:/متوسط|وسيط|ترتيب|مجموع/},
{id:30,dialect:"najdi",age:15,intent:"reason",prompt:"ليش تغيير إشارة المتباينة يصير لما أضرب في عدد سالب؟",must:/اتجاه|سالب|متباين|إشارة/},
{id:31,dialect:"saudi",age:13,intent:"multiturn",prompt:"طيب لو بدل 3 صار 5، تتغير الفكرة؟",history:[{role:"user",content:"اشرح لي ليش 3 × 4 يعني أربع تتكرر ثلاث مرات"},{role:"assistant",content:"نقدر نشوفها كثلاث مجموعات، في كل مجموعة أربع عناصر."}],must:/مجموعة|5|خمس|نفس/},
{id:32,dialect:"hijazi",age:12,intent:"multiturn",prompt:"أنا لسه مو فاهم ليش ما أجمع اللي تحت.",history:[{role:"user",content:"ليش 1/2 + 1/3 يحتاج مقام مشترك؟"},{role:"assistant",content:"لأن المقامين يحددان حجم الأجزاء، ولازم تكون الأجزاء بنفس الحجم قبل جمعها."}],must:/مقام|حجم|أجزاء|نفس/},
{id:33,dialect:"najdi",age:17,intent:"multiturn",prompt:"زين، وإذا ما لقيت تناقض وش يعني؟",history:[{role:"user",content:"وش فكرة البرهان بالتناقض؟"},{role:"assistant",content:"نفترض عكس المطلوب ونبحث عن تناقض منطقي."}],must:/ما يعني|لا يعني|تناقض|افتراض/},
{id:34,dialect:"saudi",age:10,intent:"misconception",prompt:"أنا حسبت 2/3 + 1/3 = 3/6. وين غلطت؟",must:/المقام|3\\/3|البسط|نفس/},
{id:35,dialect:"hijazi",age:15,intent:"misconception",prompt:"قلت إن 0.5 أكبر من 0.75 لأن 5 أكبر من 7؟ صحح لي الفكرة.",must:/0\.75|0\.5|أكبر|منزل|عشر/},
{id:36,dialect:"najdi",age:16,intent:"epistemic",prompt:"إذا ما عندك معلومات كفاية عن المسألة، وش المفروض تسوي بدل التخمين؟",must:/معلومات|ما أقدر|أطلب|توضيح|ما نقدر/},
{id:37,dialect:"saudi",age:9,intent:"age-fit",prompt:"وش يعني 25%؟ اشرحها بسرعة وبشيء أشوفه في حياتي.",must:/100|مئة|ربع|25/},
{id:38,dialect:"hijazi",age:18,intent:"reason",prompt:"هل التحقق بالتعويض يعتبر برهان دائمًا؟",must:/لا|مو|تحقق|برهان/},
{id:39,dialect:"najdi",age:13,intent:"pattern",prompt:"عندي 2، 5، 10، 17. لا تخمن الحد الجاي؛ ورني كيف تفحص النمط.",must:/فروق|3|5|7|ثاني/},
{id:40,dialect:"saudi",age:16,intent:"concept",prompt:"ليش الجذر التربيعي لـ49 هو 7؟ إيش معنى الجذر أصلًا؟",must:/7|ضرب|مربع|نفسه/}
];

const base=process.env.HESSA_BASE_URL??"http://127.0.0.1:3000";
async function login(){const r=await fetch(base+"/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:"student@hessa.local",password:"Student123!"})});if(!r.ok)throw Error("login "+r.status);return r.headers.get("set-cookie")??""}
const add=(o:Record<string,{p:number;t:number;s:number}>,k:string,ok:boolean,s:number)=>{o[k]??={p:0,t:0,s:0};o[k].t++;o[k].s+=s;if(ok)o[k].p++};
async function main(){const cookie=await login();let pass=0,sum=0;const failures:any[]=[];const byDialect:any={},byIntent:any={},byAge:any={};
for(const c of cases){const started=Date.now();const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),90000);let r:Response;
try{r=await fetch(base+"/api/ai/tutor",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({message:c.prompt,subject:"الرياضيات",student:{age:c.age,preferredDialect:c.dialect},history:c.history??[],retrievedContext:[]}),signal:controller.signal})}finally{clearTimeout(timer)}
if(!r.ok){failures.push({...c,http:r.status,body:(await r.text()).slice(0,500)});console.log(`[${String(c.id).padStart(2,"0")}/40] FAIL HTTP ${r.status}`);continue}
const j=await r.json();const answer=String(j.answer??"");const q=evaluateSaudiFidelityV5({answer,dialect:c.dialect,age:c.age,intent:c.intent,required:c.must,forbidden:c.mustNot});const ok=q.pass;sum+=q.score;if(ok)pass++;else failures.push({...c,score:q.score,issues:q.issues,answer});
add(byDialect,c.dialect,ok,q.score);add(byIntent,c.intent,ok,q.score);add(byAge,c.age<=10?"7-10":c.age<=13?"11-13":"14-18",ok,q.score);
console.log(`[${String(c.id).padStart(2,"0")}/40] ${ok?"PASS":"FAIL"} | ${c.dialect} | ${c.intent} | ${((Date.now()-started)/1000).toFixed(1)}s | ${q.score.toFixed(3)}`)}
const norm=(o:any)=>Object.fromEntries(Object.entries(o).map(([k,v]:any)=>[k,{passed:v.p,total:v.t,rate:+(v.p/v.t).toFixed(3),score:+(v.s/v.t).toFixed(3)}]));
const out={suite:"hessa-saudi-generalization-holdout-v1",frozen:true,passed:pass,total:cases.length,rate:+(pass/cases.length).toFixed(3),overall:+(sum/cases.length).toFixed(3),byDialect:norm(byDialect),byIntent:norm(byIntent),byAge:norm(byAge),failures};
console.log(JSON.stringify(out,null,2));if(pass/cases.length<.85)process.exitCode=1}
main().catch(e=>{console.error(e);process.exit(1)});
