const base=process.env.HESSA_E2E_BASE_URL??"http://127.0.0.1:3000";
type Turn={role:"user"|"assistant";content:string};
async function main(){
 const login=await fetch(base+"/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:"student@hessa.local",password:"demo-password"})});const b=await login.json() as{success?:boolean};if(!login.ok||!b.success)throw new Error("login failed");const raw=login.headers.get("set-cookie");if(!raw)throw new Error("cookie missing");const cookie=raw.split(";")[0];
 async function ask(message:string,history:Turn[]=[]){const r=await fetch(base+"/api/ai/tutor",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({message,subject:"الرياضيات",student:{preferredDialect:"saudi"},history})});const d=await r.json() as{success?:boolean;answer?:string;verification?:{verified?:boolean;method?:string}};if(!r.ok||!d.success||!d.answer)throw new Error(JSON.stringify(d));return d}
 const suites=[
  {id:"algebra",turns:["ساعدني في 5س + 7 = 42 بدون ما تعطيني قيمة س.","أول شيء أطرح 7 من الطرفين؟","ليش لازم أسوي نفس الشيء للطرفين؟"]},
  {id:"child",turns:["عمري 8 سنوات وما أفهم الضرب. علمني 4 × 6 بدون ما تعطيني الناتج.","يعني أجمع 6 أربع مرات؟","طيب أعطني سؤال صغير جديد أجربه بنفسي."]},
  {id:"reteach",turns:["اشرح لي ليش مساحة المثلث نقسمها على 2.","ما فهمت.","لسه ما فهمت. لا تكرر نفس الشرح، استخدم تصور مختلف."]},
  {id:"fractions",turns:["أنا أقول 1/2 + 1/3 = 2/5. صح؟","بس ليش ما أجمع المقامين؟","اختبرني بسؤال مشابه بدون ما تقول الحل."]},
  {id:"division",turns:["لا تعطيني جواب 288 ÷ 8. أبغى تلميح.","أتوقع 37، صح؟","ما فهمت ليش غلط. استخدم طريقة ثانية بدون الحل."]}
 ];
 for(const suite of suites){const history:Turn[]=[];const answers:string[]=[];for(const message of suite.turns){const d=await ask(message,history);answers.push(d.answer!);history.push({role:"user",content:message},{role:"assistant",content:d.answer!})}
  const joined=answers.join("\n");if(suite.id==="child"&&/\b24\b/.test(joined))throw new Error("child leaked 24");if(suite.id==="division"&&/\b36\b/.test(joined))throw new Error("division leaked 36");if(suite.id==="algebra"&&!/(صحيح|صح|بالضبط)/.test(answers[1]))throw new Error("algebra failed to acknowledge correct step");if(suite.id==="fractions"&&!/5\s*\/\s*6/.test(answers[0]))throw new Error("fraction correction missing 5/6");
  console.log("\n==="+suite.id+"===");answers.forEach((a,i)=>console.log("TURN",i+1,a))}
 console.log("\nTutor multi-turn HTTP E2E: PASS");
}main().catch(e=>{console.error(e);process.exitCode=1});