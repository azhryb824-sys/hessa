import assert from"node:assert/strict";import{HessaAICore}from"../lib/ai/core";import type{HessaModelProvider,GenerationInput}from"../lib/ai/provider";
class Fake implements HessaModelProvider{readonly name="fake";calls=0;constructor(private xs:string[]){}async generate(_i:GenerationInput){return this.xs[Math.min(this.calls++,this.xs.length-1)]}}
async function main(){
 // 1) Deterministic math path: provider must not be called.
 const deterministicProvider=new Fake(["SHOULD NOT BE USED"]);const deterministicCore=new HessaAICore(deterministicProvider);
 const d=await deterministicCore.tutor({message:"لا تعطيني جواب 288 ÷ 8. أبغى تلميح.",subject:"MATH",student:{},history:[],retrievedContext:["هذا سياق منهجي تجريبي عن التحقق من صلاحية الاستدلال في البراهين دون تقديم نتيجة عددية جاهزة."]} as any);
 assert.equal(deterministicProvider.calls,0);assert.ok(!d.answer.includes("36"));
 console.log("Deterministic tutor path: PASS",{providerCalls:deterministicProvider.calls,answer:d.answer.slice(0,120)});

 // 2) Generative math path: first output is rejected, second is accepted.
 const repairProvider=new Fake([
   "في هذا النمط نفترض أن 7 × 7 = 4. بعد التوحيد نجمع الحجم. ".repeat(10),
   "خلّنا نغيّر الطريقة: مثّل الفكرة برسم بسيط، وحدد المعطيات أولًا ثم اكتب ملاحظتك بدون القفز إلى نتيجة نهائية."
 ]);
 const repairCore=new HessaAICore(repairProvider);
 const r=await repairCore.tutor({message:"ما فهمت كيف أقرر إذا الاستدلال الرياضي في هذا البرهان صالح. اشرح بطريقة ثانية.",subject:"MATH",lessonTitle:"برهان استقرائي متقدم",student:{age:12},history:[{role:"assistant",content:"اقرأ البرهان مرة ثانية فقط."}],retrievedContext:[]} as any);
 assert.equal(repairProvider.calls,2);assert.ok(!r.answer.includes("7 × 7 = 4"));assert.ok(!r.answer.includes("بعد التوحيد نجمع الحجم"));
 console.log("Generative reject/regenerate path: PASS",{providerCalls:repairProvider.calls,answer:r.answer.slice(0,140)});

 // 3) Both generations fail: safe fallback must replace them.
 const failProvider=new Fake(["7 × 7 = 4. ".repeat(30),"7 × 7 = 4. ".repeat(30)]);
 const failCore=new HessaAICore(failProvider);
 const f=await failCore.tutor({message:"ما فهمت كيف أراجع صلاحية الاستدلال في برهان رياضي. اشرح بطريقة ثانية.",subject:"MATH",student:{age:12},history:[{role:"assistant",content:"كرر قراءة البرهان."}],retrievedContext:[]} as any);
 assert.equal(failProvider.calls,2);assert.ok(!f.answer.includes("7 × 7 = 4"));assert.match(f.answer,/نغيّر التمثيل|خطوة خطوة/);
 console.log("Generative safe-fallback path: PASS",{providerCalls:failProvider.calls,answer:f.answer.slice(0,140)});
}
main();