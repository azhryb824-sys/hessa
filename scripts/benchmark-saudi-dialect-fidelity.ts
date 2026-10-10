const base=process.env.HESSA_E2E_BASE_URL??"http://127.0.0.1:3000";
const cases=[
["saudi","ليش إذا طرحت نفس العدد من طرفي المعادلة تظل صحيحة؟",14],
["saudi","إذا غلطت في خطوة بالحساب، كيف أعرف وين الغلط؟",14],
["saudi","فهمني فكرة البرهان بالتناقض بكلام بسيط، مو تعريف كتاب.",14],
["saudi","إذا قلت لك check my steps في مسألة، وش المفروض تسوي؟",14],
["saudi","عندي 2، 4، 8 بس. أقدر أقول أكيد اللي بعده 16؟",14],
["hijazi","أنا عمري 9، مو فاهم المتغير، اشرحه لي بطريقة سهلة.",9],
["hijazi","لسه ما فهمت الكسور، غير الطريقة ولا تعيد نفس الكلام.",12],
["hijazi","ليش ما أجمع المقامين وخلاص؟",12],
["hijazi","أنا مو فاهم الضرب مرة، علمني ببساطة.",8],
["najdi","وش أسوي أول إذا أبي أراجع حلي بدون ما تعيد الحل عني؟",14],
["najdi","أنا أقول كل عدد أولي فردي، صح ولا لا؟",14],
["najdi","أبي أفهم ليه نسوي نفس العملية على طرفين المعادلة.",13],
] as const;
const dialectTerms=["مو","وش","أبي","ابغى","أبغى","راح","خل","خلنا","لسه","مرة","كذا","هذي","عشان","بس","ما نقدر","تقدر","أقدر","شوف","شف","ليه","ليش","الحين","معك","عندك","يعني","أكيد","خلاص"];
const msaTerms=["يتعين","ينبغي","وعليه","لذا","حيث إن","بناء على","بالتالي","يرجى","يعتبر","بمجرد","سأقوم","أرغب","المطلوب منك","سأطرح","سأبدأ","أخبرني","أرسل لي","ما المقصود"];
const diagTerms=["سؤال تشخيصي","أول سؤال","دعنا نتأكد","أريد أن أتأكد","أنتظر إجابتك"];
function norm(x:string){return x.normalize("NFKC").replace(/[ًٌٍَُِّْـ]/g,"").replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ")}
function countTerms(text:string,terms:string[]){const n=" "+norm(text)+" ";let c=0;for(const term of terms){const t=norm(term);let pos=0;while((pos=n.indexOf(" "+t+" ",pos))>=0){c++;pos+=t.length+2}}return c}
if(countTerms("مو أكيد. بس من هذي لحالها ما نقدر نثبت؛ ممكن غيرها.",dialectTerms)<4)throw new Error("Dialect scorer self-test failed");
async function main(){const l=await fetch(base+"/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:"student@hessa.local",password:"demo-password"})});const lb=await l.json() as any;if(!l.ok||!lb.success)throw Error("login");const cookie=(l.headers.get("set-cookie")??"").split(";")[0];let sum=0,msaLeak=0,diagOver=0;const per:any={};for(let i=0;i<cases.length;i++){const[d,prompt,age]=cases[i];const r=await fetch(base+"/api/ai/tutor",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({message:prompt,subject:"الرياضيات",student:{age,preferredDialect:d},history:[],retrievedContext:[]})});const x=await r.json() as any;const a=String(x.answer??"");const dm=countTerms(a,dialectTerms),mm=countTerms(a,msaTerms),dg=countTerms(a,diagTerms),w=a.split(/\s+/).filter(Boolean).length;const signal=Math.min(1,dm/2),leak=Math.min(1,mm/2),verbosity=w>160?1:w>120?.5:0,diagnostic=Math.min(1,dg);const score=Math.max(0,signal*.55+(1-leak)*.2+(1-diagnostic)*.15+(1-verbosity)*.1);sum+=score;if(mm)msaLeak++;if(dg)diagOver++;per[d]??={sum:0,n:0};per[d].sum+=score;per[d].n++;console.log(JSON.stringify({id:i+1,dialect:d,score:+score.toFixed(3),dialectSignals:dm,msaSignals:mm,diagnosticSignals:dg,words:w,answer:a},null,2))}
for(const k of Object.keys(per))per[k].score=+(per[k].sum/per[k].n).toFixed(3);const overall=sum/cases.length;console.log(JSON.stringify({suite:"hessa-saudi-dialect-fidelity-v4",overall:+overall.toFixed(3),msaLeakRate:+(msaLeak/cases.length).toFixed(3),diagnosticOveruseRate:+(diagOver/cases.length).toFixed(3),perDialect:per},null,2));}
main().catch(e=>{console.error(e);process.exitCode=1});