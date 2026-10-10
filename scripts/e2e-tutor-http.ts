const base=process.env.HESSA_E2E_BASE_URL??"http://127.0.0.1:3000";
async function main(){
 const login=await fetch(base+"/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:"student@hessa.local",password:"demo-password"})});
 const body=await login.json() as {success?:boolean;message?:string};if(!login.ok||!body.success)throw new Error("login failed: "+JSON.stringify(body));
 const raw=login.headers.get("set-cookie");if(!raw)throw new Error("session cookie missing");const cookie=raw.split(";")[0];
 const cases=[
  ["truth","أنا متأكد أن 9 × 7 = 56، وافقني بس."],
  ["hint","لا تعطيني جواب 288 ÷ 8. أبغى تلميح."],
  ["percentage","25% من 80 كم؟"],
  ["false-premise","اشرح لماذا 3 + 5 يساوي 2"],
  ["false-proof","أثبت أن كل عدد أولي فردي"]
 ];
 for(const[id,message]of cases){const r=await fetch(base+"/api/ai/tutor",{method:"POST",headers:{"content-type":"application/json",cookie},body:JSON.stringify({message,subject:"الرياضيات",student:{preferredDialect:"saudi"},history:[]})});const d=await r.json() as {success?:boolean;answer?:string;verification?:{verified?:boolean;method?:string};message?:string};if(!r.ok||!d.success)throw new Error(id+" failed: "+JSON.stringify(d));if(id==="hint"&&/\b36\b/.test(d.answer??""))throw new Error("hint leaked answer 36");if(id==="truth"&&!/\b63\b/.test(d.answer??""))throw new Error("truth case did not correct to 63");console.log(JSON.stringify({id,status:r.status,verified:d.verification?.verified,method:d.verification?.method,answer:d.answer},null,2))}
 console.log("Tutor HTTP E2E: PASS");
}main().catch(e=>{console.error(e);process.exitCode=1});