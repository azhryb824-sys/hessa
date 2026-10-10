const base=process.env.HESSA_E2E_BASE_URL??"http://127.0.0.1:3000";
type C={id:string;dialect:"saudi"|"hijazi"|"najdi";prompt:string;must:RegExp[];avoid:RegExp[];age?:number};
const cases:C[]=[
{id:"saudi-why",dialect:"saudi",prompt:"ليش إذا طرحت نفس العدد من طرفي المعادلة تظل صحيحة؟",must:[/لأن|عشان|يبقى|تظل/],avoid:[/إنّ|لذا|وعليه/]},
{id:"saudi-hint",dialect:"saudi",prompt:"أبغى تلميح بس، لا تعطيني الجواب النهائي: كيف أبدأ 36 ÷ 4؟",must:[/تلميح|فكّر|جرب|جرّب|مجموعات|ضرب/],avoid:[/الجواب هو|الناتج هو|يساوي 9/]},
{id:"hijazi-child",dialect:"hijazi",age:9,prompt:"أنا عمري 9، مو فاهم المتغير، اشرحه لي بطريقة سهلة.",must:[/يعني|مثلاً|تخيّل|شي|عدد|صندوق/],avoid:[/حيث إن|وعليه|بناءً على/]},
{id:"hijazi-reteach",dialect:"hijazi",prompt:"لسه ما فهمت الكسور، غير الطريقة ولا تعيد نفس الكلام.",must:[/خل|تخيّل|مثال|قطع|أجزاء/],avoid:[/كما ذكرت سابقًا/]},
{id:"najdi-hint",dialect:"najdi",prompt:"وش أسوي أول إذا أبي أراجع حلي بدون ما تعيد الحل عني؟",must:[/شف|شوف|راجع|تأكد|تحقق|خطوة/],avoid:[/يتعين عليك|ينبغي لك/]},
{id:"najdi-wrong",dialect:"najdi",prompt:"أنا أقول كل عدد أولي فردي، صح ولا لا؟",must:[/لا|مو|2|اثنين/],avoid:[/نعم، صحيح/]},
{id:"saudi-natural",dialect:"saudi",prompt:"إذا غلطت في خطوة بالحساب، كيف أعرف وين الغلط؟",must:[/خطوة|راجع|ارجع|تأكد|تحقق/],avoid:[/أيها الطالب|يا فتى/]},
{id:"saudi-uncertain",dialect:"saudi",prompt:"عندي 2، 4، 8 بس. أقدر أقول أكيد اللي بعده 16؟",must:[/ما نقدر|مو أكيد|لا يمكن|أكثر من|ممكن/],avoid:[/بالتأكيد.*16/]},
{id:"hijazi-encourage",dialect:"hijazi",age:8,prompt:"أنا مو فاهم الضرب مرة، علمني بدون ما تحسسني إني غلطان.",must:[/عادي|خل|نبدأ|ببساطة|مجموعات/],avoid:[/فشلت|ضعيف|خطأك/]},
{id:"saudi-proof",dialect:"saudi",prompt:"فهمني فكرة البرهان بالتناقض بكلام بسيط، مو تعريف كتاب.",must:[/نفترض|عكس|تناقض|يطلع/],avoid:[/يُعرَّف البرهان/]},
{id:"saudi-code-switch",dialect:"saudi",prompt:"إذا قلت لك check my steps في مسألة، وش المفروض تسوي؟",must:[/خطوات|راجع|أتأكد|تحقق/],avoid:[/لا أفهم اللغة/]},
{id:"hijazi-fraction",dialect:"hijazi",prompt:"ليش ما أجمع المقامين وخلاص؟",must:[/أجزاء|حجم|مقام|نفس/],avoid:[/وعليه|لذا فإن/]},
];
async function main(){const l=await fetch(base+"/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:"student@hessa.local",password:"demo-password"})});const lb=await l.json() as any;if(!l.ok||!lb.success)throw new Error("login failed");const cookie=(l.headers.get("set-cookie")??"").split(";")[0];let p=0;const per:any={};for(const c of cases){const r=await fetch(base+"/api/ai/tutor",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({message:c.prompt,subject:"الرياضيات",student:{age:c.age??14,preferredDialect:c.dialect},history:[],retrievedContext:[]})});const raw=await r.text();let d:any;try{d=JSON.parse(raw)}catch{throw new Error(c.id+" non-json "+r.status+" "+raw.slice(0,300))}const a=String(d.answer??"");const fails:string[]=[];for(const x of c.must)if(!x.test(a))fails.push("must:"+x);for(const x of c.avoid)if(x.test(a))fails.push("avoid:"+x);const ok=r.ok&&d.success&&!fails.length;if(ok)p++;per[c.dialect]??={p:0,t:0};per[c.dialect].t++;if(ok)per[c.dialect].p++;console.log(JSON.stringify({id:c.id,dialect:c.dialect,ok,fails,provider:d.metadata?.provider,answer:a},null,2))}
for(const k of Object.keys(per))per[k].rate=per[k].p/per[k].t;const rate=p/cases.length;console.log(JSON.stringify({suite:"hessa-saudi-dialect-v1",passed:p,total:cases.length,rate,perDialect:per},null,2));if(rate<.9)throw new Error("Saudi dialect benchmark below 0.90")}
main().catch(e=>{console.error(e);process.exitCode=1});