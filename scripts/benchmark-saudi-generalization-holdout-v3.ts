import {evaluateSaudiFidelityV5} from "../lib/ai/saudi-fidelity-v5";
type D="saudi"|"hijazi"|"najdi";type C={id:number,d:D,age:number,intent:string,m:string,need:RegExp,ban?:RegExp};
const cases:C[]=[
{id:1,d:"saudi",age:10,intent:"concept",m:"إذا نفس الفطيرة قسمتها 8 قطع بدل 4، وش يصير بحجم القطعة؟ وليه؟",need:/أجزاء|أصغر|تقسيم/},
{id:2,d:"hijazi",age:16,intent:"statistics",m:"عندي بيانات فيها قيمة ضخمة مرة. مين غالبًا يتغير أكثر: المتوسط ولا الوسيط؟ وليش؟",need:/متوسط|وسيط|قيمة|جمع|ترتيب/},
{id:3,d:"najdi",age:12,intent:"hint",m:"81 ÷ 9، وجّهني بس ولا تحسبها لي.",need:/ضرب|فكّر|فكر|ما راح أكشف|تلميح/,ban:/\b9\b/},
{id:4,d:"saudi",age:17,intent:"epistemic",m:"لقيت صيغة توافق أول ست نتائج. وش يمنعني أقول إنها القانون الوحيد؟",need:/مو|لا|ما نقدر|قاعدة|قانون|برهان|معلومات/},
{id:5,d:"hijazi",age:9,intent:"child",m:"إيش يعني ثلاثة أرباع؟ أبغاه بصورة سهلة.",need:/4|أربع|3|ثلاث|أجزاء/},
{id:6,d:"najdi",age:15,intent:"proof",m:"لو العبارة تقول كل الأعداد تحقق شرط، ولقيت عدد واحد ما يحققه، إيش صار للعبارة؟",need:/خاط|غير صحيح|تسقط|مثال|كل|واحد/},
{id:7,d:"saudi",age:14,intent:"geometry",m:"إذا مثلثين متطابقين، هل أقدر أنقل قياس زاوية من واحد للزاوية المناظرة بالثاني؟",need:/نعم|تقدر|زاوية|متناظر|متساوي/},
{id:8,d:"hijazi",age:8,intent:"percent",m:"إيش يعني 25 بالمية لو عندي 20 حبة؟ اشرح الفكرة قبل الحساب.",need:/ربع|25|100|أربع/},
{id:9,d:"najdi",age:16,intent:"zero",m:"هل ممكن يكون فيه مقلوب للصفر لو اخترنا عدد كبير جدًا؟",need:/لا|مو|صفر|1|واحد|ضرب/},
{id:10,d:"saudi",age:13,intent:"misconception",m:"أشوف 1/9 أكبر من 1/4 لأن 9 أكبر. صح تفكيري؟",need:/لا|مو|أجزاء|مقام|أصغر/},
{id:11,d:"hijazi",age:17,intent:"meta",m:"في حل طويل، كيف أميز خطوة صحيحة منطقيًا من خطوة بس شكلها مقنع؟",need:/سبب|قاعدة|معط|تبرير|خطوة/},
{id:12,d:"najdi",age:9,intent:"perimeter",m:"لو مشيت حول حواف شكل كامل، الشي اللي أقيسه اسمه إيش؟",need:/محيط|حول|حدود|حواف/},
{id:13,d:"saudi",age:16,intent:"induction",m:"ليش في الاستقراء ما يكفي أثبت حالتين ووقف؟",need:/انتقال|استقراء|فرض|التالي|كل/},
{id:14,d:"hijazi",age:11,intent:"hint",m:"عندي 4 مجموعات، كل مجموعة فيها 7. لا تعطيني الناتج، بس وريني تمثيل يساعدني.",need:/مجموعات|جمع|عناصر|مثّل|مثل/,ban:/\b28\b/},
{id:15,d:"najdi",age:15,intent:"statistics",m:"إذا أبغى القيمة الأكثر ظهورًا في البيانات، أدور على الوسيط ولا المنوال؟",need:/منوال|تكرار|ظهور/},
{id:16,d:"saudi",age:18,intent:"uncertainty",m:"تفسيرين مختلفين يناسبون نفس البيانات تمام. هل عندي حق أختار واحد كأنه مؤكد؟",need:/لا|مو|ما نقدر|بيانات|دليل|معلومات/},
{id:17,d:"hijazi",age:10,intent:"fraction",m:"مين أكبر: النص ولا الثلث؟ اشرحها بالقطع مو بالقانون.",need:/نص|نصف|ثلث|أجزاء|قطع/},
{id:18,d:"najdi",age:16,intent:"review",m:"طلعت قيمة س. وش أسوي عشان أتأكد منها بدون إعادة الحل كله؟",need:/تعويض|طرف|معادلة|تحقق/},
{id:19,d:"saudi",age:14,intent:"truth",m:"واحد يقول أي عدد فردي لازم يكون أولي. عطه حكم واضح.",need:/مو|لا|9|15|فردي|أولي/},
{id:20,d:"hijazi",age:15,intent:"geometry",m:"بعد إثبات تطابق مثلثين، إيش معنى ضلعين متناظرين؟",need:/ضلع|متناظر|متساوي|يقابل/},
{id:21,d:"najdi",age:8,intent:"concept",m:"وش يعني متغير؟ جملة أو جملتين بس.",need:/رمز|عدد|قيمة|يتغير|ما نعرف/},
{id:22,d:"saudi",age:17,intent:"reason",m:"ليش ضرب طرفي متباينة في عدد سالب يغير اتجاهها؟",need:/سالب|إشارة|اتجاه|ترتيب/},
{id:23,d:"hijazi",age:13,intent:"pattern",m:"الفروق الأولى والثانية مو ثابتة. وش نوع فحص ثاني ممكن أجربه؟",need:/نسب|رقم الحد|قيمته|قاعدة/},
{id:24,d:"najdi",age:16,intent:"proof",m:"إيش الفرق بين إني أشوف القاعدة ناجحة في أمثلة كثيرة وبين برهان؟",need:/مثال|برهان|كل|عام/},
{id:25,d:"saudi",age:9,intent:"hint",m:"5 × 8، لا تقول لي كم؛ بس كيف أمثلها؟",need:/مجموعات|عناصر|جمع|مثّل|مثل/,ban:/\b40\b/},
{id:26,d:"hijazi",age:16,intent:"concept",m:"ليش كسرين لهم نفس البسط ممكن تكون قيمتهم مختلفة؟",need:/مقام|حجم|أجزاء/},
{id:27,d:"najdi",age:14,intent:"truth",m:"هل الصفر موجب أو سالب؟",need:/لا|مو|صفر|موجب|سالب/},
{id:28,d:"saudi",age:17,intent:"counterexample",m:"لو أعطيتك مثال مضاد واحد لعبارة عامة، هل لازم أفحص باقي الحالات عشان أهدمها؟",need:/لا|مو|يكفي|مثال|عام|كل/},
{id:29,d:"hijazi",age:12,intent:"misconception",m:"جمعت 2/7 + 3/7 وقلت المقام يصير 14. وين الخلل في الفكرة؟",need:/مقام|7|بسط|أجزاء/},
{id:30,d:"najdi",age:15,intent:"concept",m:"إيش الفرق بين المتوسط والمنوال؟",need:/متوسط|منوال|جمع|تكرار/},
{id:31,d:"saudi",age:10,intent:"reteach",m:"شرح الضرب بالكلام لخبطني. عطيني طريقة بالرسم أو المجموعات.",need:/رسم|مجموعات|نقاط|صفوف|عناصر/},
{id:32,d:"hijazi",age:18,intent:"induction",m:"في برهان الاستقراء، إيش وظيفة فرض الاستقراء بالضبط؟",need:/فرض|n|k|انتقال|التالي/},
{id:33,d:"najdi",age:13,intent:"reason",m:"ليش ما ينفع نقسم عدد عادي على صفر؟",need:/صفر|ضرب|غير|ما فيه|لا يوجد/},
{id:34,d:"saudi",age:16,intent:"geometry",m:"هل شكل الرسم يكفي وحده عشان أحكم إن زاويتين متساويتين؟",need:/لا|مو|قياس|خاصية|دليل/},
{id:35,d:"hijazi",age:9,intent:"percent",m:"50 بالمية من الشيء معناها إيش بدون عمليات؟",need:/نص|نصف|50|100/},
{id:36,d:"najdi",age:17,intent:"uncertainty",m:"لو النمط يطابق كل الحدود اللي عندي، هل أقدر أقول مستحيل فيه قاعدة ثانية؟",need:/لا|مو|ما نقدر|قاعدة|أخرى|ثانية/},
{id:37,d:"saudi",age:12,intent:"review",m:"إذا غيرت طرف واحد من المعادلة بس، كيف أعرف إني كسرت المساواة؟",need:/طرف|مساواة|توازن|نفس/},
{id:38,d:"hijazi",age:15,intent:"concept",m:"الوسيط ليش أحيانًا يكون أنسب من المتوسط مع القيم الشاذة؟",need:/وسيط|متوسط|شاذ|ترتيب|تأثر/},
{id:39,d:"najdi",age:10,intent:"hint",m:"48 على 6، لا تحلها؛ خليني أوصل بنفسي.",need:/ضرب|فكّر|فكر|ما راح أكشف/,ban:/\b8\b/},
{id:40,d:"saudi",age:17,intent:"epistemic",m:"إذا المعطيات ما تكفي تحدد جواب واحد، وش المفروض يسوي المدرس الذكي؟",need:/ما يكفي|معلومة|توضيح|تخمين|ما نقدر/}
];
const base=process.env.HESSA_E2E_BASE_URL??"http://127.0.0.1:3000";
const add=(o:any,k:string,ok:boolean,s:number)=>{o[k]??={p:0,t:0,s:0};o[k].t++;o[k].s+=s;if(ok)o[k].p++};
async function main(){const l=await fetch(base+"/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:"student@hessa.local",password:"demo-password"})});if(!l.ok)throw Error("login "+l.status);const cookie=(l.headers.get("set-cookie")??"").split(";")[0];let p=0,sum=0;const failures:any[]=[];const bd:any={},bi:any={},ba:any={};
for(const c of cases){const st=Date.now();const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),90000);let r:Response;try{r=await fetch(base+"/api/ai/tutor",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({message:c.m,subject:"الرياضيات",student:{age:c.age,preferredDialect:c.d},history:[],retrievedContext:[]}),signal:ctl.signal})}finally{clearTimeout(timer)}if(!r.ok){failures.push({...c,http:r.status});continue}const j=await r.json();const answer=String(j.answer??"");const q=evaluateSaudiFidelityV5(answer,{dialect:c.d,prompt:c.m,age:c.age,required:c.need});const forbidden=!!c.ban?.test(answer);const ok=q.pass&&!forbidden;const score=forbidden?Math.min(q.score,.5):q.score;p+=+ok;sum+=score;if(!ok)failures.push({...c,score,issues:[...q.issues,...(forbidden?["FORBIDDEN_OUTPUT"]:[])],answer,method:j.verification?.method});add(bd,c.d,ok,score);add(bi,c.intent,ok,score);add(ba,c.age<=10?"7-10":c.age<=13?"11-13":"14-18",ok,score);console.log(`[${String(c.id).padStart(2,"0")}/40] ${ok?"PASS":"FAIL"} | ${c.d} | ${c.intent} | ${((Date.now()-st)/1000).toFixed(1)}s | ${score.toFixed(3)} | ${j.verification?.method}`)}
const norm=(o:any)=>Object.fromEntries(Object.entries(o).map(([k,v]:any)=>[k,{passed:v.p,total:v.t,rate:+(v.p/v.t).toFixed(3),score:+(v.s/v.t).toFixed(3)}]));console.log(JSON.stringify({suite:"hessa-saudi-generalization-holdout-v3",frozen:true,passed:p,total:cases.length,rate:+(p/cases.length).toFixed(3),overall:+(sum/cases.length).toFixed(3),byDialect:norm(bd),byIntent:norm(bi),byAge:norm(ba),failures},null,2))}
main().catch(e=>{console.error(e);process.exit(1)});