
import { strict as assert } from "node:assert";
import { HessaAICore } from "../lib/ai/core";

const core=new HessaAICore({
 name:"test-provider",
 async generate(){throw new Error("هذه الحالات يجب ألا تحتاج توليدًا");}
});

async function main(){
 const history:Array<{role:"user"|"assistant";content:string}>=[];
 for(const [message,reveal] of [
  ["84 ÷ 7، لا تعطيني الناتج، بس ساعدني أبدأ",false],
  ["جربت 11، هل محاولتي صحيحة؟ لا تكشف الناتج",false],
  ["الآن أعطني الحل الكامل للمسألة 84 ÷ 7",true]
 ] as const){
  const result=await core.tutor({message,subject:"MATH",history});
  if(reveal)assert.match(result.answer,/(?:^|\D)12(?:\D|$)/);
  else{
   assert.doesNotMatch(result.answer,/(?:^|\D)12(?:\D|$)/);
   assert.equal(result.verification.expectedAnswer,undefined);
  }
  if(message.startsWith("جربت"))assert.match(result.answer,/محاولتك تحتاج تعديل/);
  history.push({role:"user",content:message},{role:"assistant",content:result.answer});
 }
 console.log("PASS: التلميح ومراجعة المحاولة وإذن كشف الحل");

 const rectangleHistory:Array<{role:"user"|"assistant";content:string}>=[
  {role:"user",content:"أحتاج شريطًا حول حواف لوحة مستطيلة، ماذا أقيس؟"}
 ];
 for(const [message,expected] of [
  ["طولها 6 سم وعرضها 4 سم، كم طول الشريط؟","20"],
  ["طيب لو أبغى أغطي داخل نفس اللوحة بورق، كم المساحة؟","24"]
 ] as const){
  const result=await core.tutor({message,subject:"MATH",history:rectangleHistory});
  assert.equal(result.verification.expectedAnswer,expected);
  assert.equal(result.verification.method,"contextual-rectangle-engine");
  rectangleHistory.push({role:"user",content:message},{role:"assistant",content:result.answer});
 }
 console.log("PASS: سياق أبعاد المستطيل");

 const halfHistory:Array<{role:"user"|"assistant";content:string}>=[];
 const answers:string[]=[];
 for(const message of [
  "اشرح لي معنى النصف",
  "ما فهمت، اشرح بطريقة ثانية",
  "لسه ما فهمت، جرب مثال جديد ولا تكرر نفس المثال"
 ]){
  const result=await core.tutor({
   message,subject:"MATH",student:{age:8},history:halfHistory
  });
  answers.push(result.answer);
  halfHistory.push({role:"user",content:message},{role:"assistant",content:result.answer});
 }
 assert.ok(answers[0].includes("ورقة"));
 assert.ok(answers[1].includes("6 مكعبات"));
 assert.ok(answers[2].includes("منتصف الطريق"));
 console.log("PASS: تغيير أمثلة النصف");
}
main().catch(error=>{console.error(error);process.exitCode=1});
