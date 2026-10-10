import {evaluateSaudiFidelityV5} from "../lib/ai/saudi-fidelity-v5";
type D="saudi"|"hijazi"|"najdi";type C={id:number,dialect:D,age:number,intent:string,prompt:string,required?:RegExp,forbidden?:RegExp};
const cases:C[]=[
{id:1,dialect:"hijazi",age:9,intent:"concept",prompt:"لو عندي 5/8، الثمانية تحت إيش تحكي لي عن الشيء كامل؟",required:/8|أجزاء|متساوي/},
{id:2,dialect:"saudi",age:16,intent:"reason",prompt:"إيش الفكرة وراء إن إضافة نفس المقدار للجهتين تحفظ المعادلة؟",required:/مساواة|طرف|توازن/},
{id:3,dialect:"najdi",age:14,intent:"uncertainty",prompt:"الحدود 4، 12، 36 تمشي بالضرب في 3. أقول أكيد الرابع 108؟",required:/مو أكيد|ما نقدر|احتمال|قاعدة/},
{id:4,dialect:"hijazi",age:8,intent:"child",prompt:"إذا قلت ربع الشوكولاتة، يعني إيش؟ بشرح قصير.",required:/4|أربع|جزء|متساوي|ربع/},
{id:5,dialect:"saudi",age:13,intent:"truth",prompt:"هل كل عدد فردي يعتبر أولي؟",required:/مو|لا|9|فردي|أولي|قسمة/},
{id:6,dialect:"najdi",age:17,intent:"geometry",prompt:"رسمت مثلثين شكلهم قريب من بعض. هل الشكل لحاله يثبت إنهم متطابقين؟",required:/لا|مو|دليل|أضلاع|زوايا|تطابق/},
{id:7,dialect:"hijazi",age:15,intent:"meta",prompt:"كيف أراجع حل جبري طويل وألقط أول خطوة خربت المنطق؟",required:/خطوة|قاعدة|تحقق|معطيات/},
{id:8,dialect:"saudi",age:10,intent:"hint",prompt:"7 مجموعات، بكل مجموعة 3. أبغى تلميح بس ولا تقول الناتج.",required:/مجموعة|ضرب|جمع|عد/,forbidden:/\b21\b/},
{id:9,dialect:"najdi",age:16,intent:"proof",prompt:"وش الفرق بين إني أجرب عشر أمثلة وبين إني أثبت الكلام لكل الأعداد؟",required:/مثال|برهان|إثبات|كل|عام/},
{id:10,dialect:"hijazi",age:14,intent:"pattern",prompt:"حسبت الفروق الأولى والثانية وما طلع ثبات. فين أروح بعدها بدل التخمين؟",required:/نسب|رقم الحد|قيمته|قاعدة|فروق/},
{id:11,dialect:"saudi",age:12,intent:"concept",prompt:"ليش 2/5 و2/9 مو نفس الكمية مع إن البسط نفسه؟",required:/مقام|حجم|أجزاء|5|9/},
{id:12,dialect:"hijazi",age:17,intent:"reason",prompt:"ليش الصفر ما له مقلوب ضربي؟",required:/صفر|1|واحد|ضرب|مقلوب/},
{id:13,dialect:"najdi",age:15,intent:"uncertainty",prompt:"لقيت منحنى يمر بأربع نقاط من البيانات. هل كذا أثبت إن هذا هو القانون الحقيقي؟",required:/لا|مو|ما نقدر|نقاط|قانون|معلومات/},
{id:14,dialect:"saudi",age:9,intent:"child",prompt:"وش يعني مجهول في الرياضيات؟ لا تطول.",required:/عدد|قيمة|ما نعرف|رمز/},
{id:15,dialect:"hijazi",age:16,intent:"truth",prompt:"هل جذر 36 ممكن يكون 6 و-6 بنفس المعنى؟",required:/6|الجذر|حل|موجب|سالب/},
{id:16,dialect:"najdi",age:13,intent:"geometry",prompt:"إذا زاويتين متقابلة بالرأس، أحتاج أقيسهم عشان أعرف إنهم متساويات؟",required:/متقابل|متساوي|خاصية|قياس/},
{id:17,dialect:"saudi",age:18,intent:"review",prompt:"بعد ما أحل معادلة، وش أسرع فحص مستقل أسويه للناتج؟",required:/تعويض|طرف|تحقق/},
{id:18,dialect:"hijazi",age:10,intent:"reteach",prompt:"الجمع المتكرر ما فهمني الضرب. ورينيه بصورة ثانية.",required:/مجموعات|صفوف|رسم|نقاط|مصفوف/},
{id:19,dialect:"najdi",age:17,intent:"proof",prompt:"أبي بداية برهان إن مجموع عددين زوجيين زوجي، بس لا تكمله كله.",required:/2|ك|م|زوجي|مثّل/},
{id:20,dialect:"saudi",age:14,intent:"pattern",prompt:"لو النسب بين الحدود ثابتة، وش يوحي لك هذا؟",required:/هندسي|ضرب|نسبة|ثابت/},
{id:21,dialect:"hijazi",age:9,intent:"concept",prompt:"ليش 1/10 أصغر من 1/4 مع إن العشرة أكبر من الأربعة؟",required:/أجزاء|أصغر|مقام|تقسيم/},
{id:22,dialect:"najdi",age:16,intent:"reason",prompt:"ليش طرح عدد سالب يصير كأنه إضافة؟ أبي معنى مو حفظ.",required:/سالب|اتجاه|إضافة|طرح/},
{id:23,dialect:"saudi",age:17,intent:"epistemic",prompt:"إذا السؤال ناقص معلومة أساسية، الأفضل تعطيني أقرب جواب ولا تقول ما يكفي؟",required:/ما يكفي|معلومة|توضيح|ما نقدر|تخمين/},
{id:24,dialect:"hijazi",age:12,intent:"truth",prompt:"هل الصفر عدد موجب؟",required:/لا|مو|صفر|موجب|سالب/},
{id:25,dialect:"najdi",age:8,intent:"age-fit",prompt:"فسّر لي 3/4 بجملة أو جملتين.",required:/4|أربع|3|ثلاث|أجزاء/},
{id:26,dialect:"saudi",age:16,intent:"meta",prompt:"متى أعرف إن الاستنتاج اللي كتبته قفزة وما له تبرير كفاية؟",required:/سبب|قاعدة|معطى|خطوة|تبرير/},
{id:27,dialect:"hijazi",age:15,intent:"geometry",prompt:"إيش أستفيد من تطابق مثلثين بعد ما أثبته؟",required:/أضلاع|زوايا|متناظر|متساوي/},
{id:28,dialect:"najdi",age:11,intent:"hint",prompt:"45 ÷ 5. لا تحله، بس عطِني سؤال يساعدني أوصل.",required:/ضرب|5|خمسة/,forbidden:/\b9\b/},
{id:29,dialect:"saudi",age:17,intent:"concept",prompt:"إيش الفرق العملي بين المنوال والوسيط؟",required:/منوال|وسيط|تكرار|ترتيب/},
{id:30,dialect:"hijazi",age:14,intent:"reason",prompt:"ليش إذا كبرت المقام والكسر وحده واحد، قيمة الكسر تصغر؟",required:/أجزاء|أصغر|مقام|تقسيم/},
{id:31,dialect:"najdi",age:12,intent:"misconception",prompt:"قلت 3/4 + 2/4 = 5/8. إيش الفكرة اللي لخبطت فيها؟",required:/مقام|4|بسط|أجزاء/},
{id:32,dialect:"saudi",age:15,intent:"misconception",prompt:"أنا حسبت -3² = 9. وين لازم أنتبه في الإشارة؟",required:/سالب|تربيع|أقواس|9/},
{id:33,dialect:"hijazi",age:16,intent:"reason",prompt:"هل مثال مضاد واحد يكفي يهدم عبارة تقول كل الأعداد لها صفة معينة؟",required:/نعم|يكفي|مثال|كل|عبارة/},
{id:34,dialect:"najdi",age:10,intent:"child",prompt:"وش يعني محيط؟ لا تعطيني قانون أول شيء.",required:/حول|حدود|أطراف|شكل/},
{id:35,dialect:"saudi",age:18,intent:"proof",prompt:"إذا أثبت حالة n وحالة n+1 بدون قاعدة انتقال، هل هذا استقراء كامل؟",required:/لا|مو|استقراء|انتقال|فرض/},
{id:36,dialect:"hijazi",age:13,intent:"uncertainty",prompt:"النمط 1، 4، 9، 16 واضح، بس هل لازم اللي بعده 25 منطقيًا؟",required:/مو أكيد|ما نقدر|قاعدة|احتمال|25/},
{id:37,dialect:"najdi",age:9,intent:"age-fit",prompt:"إيش يعني 50% بشيء بسيط من الحياة؟",required:/نصف|100|مئة|50/},
{id:38,dialect:"saudi",age:16,intent:"review",prompt:"لو طلع جواب المعادلة، كيف أكتشف بسرعة إذا دخل حل دخيل؟",required:/تعويض|الأصل|تحقق|معادلة/},
{id:39,dialect:"hijazi",age:15,intent:"concept",prompt:"ليش المتوسط يتأثر برقم شاذ كبير أكثر من الوسيط؟",required:/متوسط|وسيط|قيمة|ترتيب|مجموع/},
{id:40,dialect:"najdi",age:17,intent:"epistemic",prompt:"لو عندك طريقتين كلهم يطابقون البيانات الموجودة، تقدر تختار وحدة كحقيقة؟",required:/لا|مو|معلومات|بيانات|دليل|ما نقدر/}
];
const base=process.env.HESSA_E2E_BASE_URL??"http://127.0.0.1:3000";
const add=(o:any,k:string,ok:boolean,s:number)=>{o[k]??={p:0,t:0,s:0};o[k].t++;o[k].s+=s;if(ok)o[k].p++};
async function main(){const l=await fetch(base+"/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:"student@hessa.local",password:"demo-password"})});if(!l.ok)throw Error("login "+l.status);const cookie=(l.headers.get("set-cookie")??"").split(";")[0];let pass=0,sum=0;const failures:any[]=[];const byD:any={},byI:any={},byA:any={};
for(const c of cases){const started=Date.now();const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),90000);let r:Response;try{r=await fetch(base+"/api/ai/tutor",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({message:c.prompt,subject:"الرياضيات",student:{age:c.age,preferredDialect:c.dialect},history:[],retrievedContext:[]}),signal:controller.signal})}finally{clearTimeout(timer)}
if(!r.ok){failures.push({...c,http:r.status});console.log(`[${String(c.id).padStart(2,"0")}/40] FAIL HTTP ${r.status}`);continue}const j=await r.json();const answer=String(j.answer??"");const q=evaluateSaudiFidelityV5(answer,{dialect:c.dialect,prompt:c.prompt,age:c.age,required:c.required});const forbidden=!!c.forbidden?.test(answer);const ok=q.pass&&!forbidden;const score=forbidden?Math.min(q.score,.5):q.score;sum+=score;if(ok)pass++;else failures.push({...c,score,issues:[...q.issues,...(forbidden?["FORBIDDEN_OUTPUT"]:[])],answer});add(byD,c.dialect,ok,score);add(byI,c.intent,ok,score);add(byA,c.age<=10?"7-10":c.age<=13?"11-13":"14-18",ok,score);console.log(`[${String(c.id).padStart(2,"0")}/40] ${ok?"PASS":"FAIL"} | ${c.dialect} | ${c.intent} | ${((Date.now()-started)/1000).toFixed(1)}s | ${score.toFixed(3)}`)}
const norm=(o:any)=>Object.fromEntries(Object.entries(o).map(([k,v]:any)=>[k,{passed:v.p,total:v.t,rate:+(v.p/v.t).toFixed(3),score:+(v.s/v.t).toFixed(3)}]));console.log(JSON.stringify({suite:"hessa-saudi-generalization-holdout-v2",frozen:true,passed:pass,total:cases.length,rate:+(pass/cases.length).toFixed(3),overall:+(sum/cases.length).toFixed(3),byDialect:norm(byD),byIntent:norm(byI),byAge:norm(byA),failures},null,2))}
main().catch(e=>{console.error(e);process.exit(1)});