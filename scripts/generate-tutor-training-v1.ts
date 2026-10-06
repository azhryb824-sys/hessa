import fs from"node:fs";import crypto from"node:crypto";
type Msg={role:"system"|"user"|"assistant";content:string};type Ex={id:string;skill:string;messages:Msg[];tags:string[];difficulty:number;variant:string};
const out:Ex[]=[];const seen=new Set<string>();const sys="أنت مدرس حصة الذكي. علّم الطالب بوضوح، شخّص الخطأ، واستخدم التلميح وإعادة الشرح حسب الحاجة. لا تكن آلة إجابات.";
function add(skill:string,msgs:Msg[],tags:string[],difficulty=1,variant="dialogue"){const key=crypto.createHash("sha256").update(JSON.stringify(msgs)).digest("hex");if(seen.has(key))return;seen.add(key);out.push({id:key.slice(0,16),skill,messages:[{role:"system",content:sys},...msgs],tags,difficulty,variant});}
const nums=Array.from({length:60},(_,i)=>i+2);
for(const a of nums)for(const b of Array.from({length:18},(_,i)=>i+2)){
 const product=a*b;
 add("multiplication",[{role:"user",content:`لا تعطيني ناتج ${a} × ${b}. ساعدني أفكر.`},{role:"assistant",content:`نمثلها كمجموعات: عندنا ${a} مجموعات، في كل مجموعة ${b} عناصر. ابدأ بحساب مجموعتين فقط، ثم وسّع نفس الفكرة. ما الخطوة التي ستفعلها أولًا؟`}],["hint","socratic"],1,"groups");
 add("division",[{role:"user",content:`أبغى تلميح لـ ${product} ÷ ${b} بدون الجواب.`},{role:"assistant",content:`استخدم العملية العكسية: ابحث عن عدد إذا ضربناه في ${b} يعطينا ${product}. اكتب محاولة واحدة وسنتحقق منها.`}],["hint","inverse"],1,"inverse");
 add("division",[{role:"user",content:`أعتقد أن ${product} ÷ ${b} = ${a+1}. صح؟`},{role:"assistant",content:`خلّنا نتحقق بالضرب: لو كانت إجابتك ${a+1} صحيحة، فيجب أن يكون ${a+1} × ${b} = ${product}. هذا لا يتحقق. جرّب العدد ${a} وتحقق بضربه في ${b}.`}],["check","misconception"],2,"verification");
}
for(let d=2;d<=20;d++)for(let n=1;n<d;n++){
 add("fractions",[{role:"user",content:`اشرح لي ${n}/${d} كأني مبتدئ.`},{role:"assistant",content:`المقام ${d} يعني أن الكل انقسم إلى ${d} أجزاء متساوية، والبسط ${n} يعني أننا أخذنا ${n} أجزاء. تخيل شريطًا مقسمًا إلى ${d} خانات متساوية ولوّن ${n} منها. ماذا يمثل الجزء غير الملون؟`}],["concept","visual"],1,"fraction-bar");
 if(n<d-1)add("fractions",[{role:"user",content:`أنا أجمع البسط والمقام دائمًا. هل هذه الطريقة صح في الكسور؟`},{role:"assistant",content:"ليست قاعدة صحيحة للجمع؛ المقام يحدد حجم الجزء، لذلك نحتاج أولًا إلى أجزاء من الحجم نفسه. بدل حفظ قاعدة، تخيل أن أنصاف البيتزا وأثلاثها ليست قطعًا بالحجم نفسه. ما الذي يجب توحيده قبل جمع عدد القطع؟"}],["misconception","diagnose"],2,"conceptual");
}
for(const base of Array.from({length:100},(_,i)=>(i+1)*10))for(const p of [5,10,15,20,25,30,40,50,60,75]){
 const v=base*p/100;add("percent",[{role:"user",content:`ليش ${p}% من ${base} = ${v}؟`},{role:"assistant",content:`${p}% تعني ${p} من كل 100. نكتبها ${p}/100 ثم نضرب في ${base}، فنحصل على ${v}. الفكرة الأساسية أن % تعني «من مئة». جرّب تطبيق نفس الفكرة على عدد آخر.`}],["why","concept"],2,"percent");
}
for(let x=1;x<=100;x++)for(const a of [2,3,4,5,6]){const b=(x%9)+1,c=a*x+b;add("algebra",[{role:"user",content:`ساعدني أفهم ${a}س + ${b} = ${c} بدون حفظ خطوات.`},{role:"assistant",content:`هدفنا إبقاء س وحدها مع الحفاظ على توازن الطرفين. أولًا أزل ${b} من الطرفين بالعملية العكسية. بعد ذلك سيبقى ${a}س، ثم نستخدم القسمة. ما العملية العكسية لـ +${b}؟`}],["hint","inverse-operation"],2,"equation");}
for(let w=2;w<=30;w++)for(let h=2;h<=20;h++){add("geometry",[{role:"user",content:`ليش مساحة مستطيل طوله ${w} وعرضه ${h} نحسبها بالضرب؟`},{role:"assistant",content:`لأننا نستطيع ترتيبه في ${h} صفوف، في كل صف ${w} وحدات مربعة. لذلك نجمع ${w} عدد ${h} مرات، وهذا هو ${w} × ${h}. ارسم صفين أولًا لترى الفكرة.`}],["why","visual"],2,"area-array");}
fs.mkdirSync("data/training",{recursive:true});fs.writeFileSync("data/training/hessa-tutor-v1.raw.jsonl",out.map(JSON.stringify).join("\n")+"\n");const counts=Object.fromEntries([...new Set(out.map(x=>x.skill))].map(s=>[s,out.filter(x=>x.skill===s).length]));console.log(JSON.stringify({examples:out.length,counts},null,2));