import {HessaAICore} from "../lib/ai/core";import {gradeTutorResponse} from "../lib/ai/response-evaluator";
async function main(){
const cases=[["3 + 5 كم؟","8",8],["24 ÷ 6 كم؟","4",9],["1/2 + 1/4","3/4",11],["25% من 80","20",12],["2س + 3 = 11","4",12],["مساحة مثلث قاعدته 10 وارتفاعه 4","20",11],["معه 4 أقلام ثم اشترى 3 أقلام، كم أصبح معه؟","7",7],["اشرح لماذا 3 + 5 يساوي 2","8",10],["5 ÷ 0 كم؟",undefined,11]] as const;
const core=new HessaAICore();const results=[];for(const [prompt,expected,age] of cases){const r=await core.tutor({message:prompt,subject:"الرياضيات",student:{age,preferredDialect:"saudi"}});const grade=gradeTutorResponse({expected,answer:r.answer,verified:r.verification.verified,grounded:r.context.grounded,age});results.push({prompt,answer:r.answer,verified:r.verification.verified,method:r.verification.method,grade});}
console.log("HESSA_PREVIEW_SCIENCE_EVAL="+JSON.stringify({overall:results.reduce((n,x)=>n+x.grade.overall,0)/results.length,results}));
}
main().catch(error=>{console.error("HESSA_PREVIEW_SCIENCE_EVAL_ERROR",error);process.exit(1);});