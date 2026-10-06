import fs from "node:fs";

type Case={id:string;prompt:string;expected:string;skill:string};
const endpoint=process.env.HESSA_LLM_BASE_URL;
const model=process.env.HESSA_LLM_MODEL;
const key=process.env.HESSA_LLM_API_KEY;
if(!endpoint||!model||!key) throw new Error("Set HESSA_LLM_BASE_URL, HESSA_LLM_MODEL and HESSA_LLM_API_KEY.");
const cases=JSON.parse(fs.readFileSync("benchmarks/hessa-math-ar-v1.json","utf8")) as Case[];
const results=[];
for(const test of cases){
 const started=performance.now();
 const response=await fetch(endpoint.replace(/\/$/,"")+"/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+key},body:JSON.stringify({model,temperature:0,messages:[{role:"system",content:"أجب باختصار وبوضوح. اذكر الناتج النهائي صراحة."},{role:"user",content:test.prompt}]})});
 if(!response.ok) throw new Error("Model request failed: "+response.status);
 const data=await response.json() as {choices?:Array<{message?:{content?:string}}>};
 const answer=data.choices?.[0]?.message?.content??"";
 const latencyMs=Math.round(performance.now()-started);
 const normalized=answer.replace(/\s/g,"");
 const ok=normalized.includes(test.expected.replace(/\s/g,""));
 results.push({id:test.id,skill:test.skill,ok,expected:test.expected,latencyMs,answer});
}
const passed=results.filter(x=>x.ok).length;
console.log(JSON.stringify({model,passed,total:results.length,accuracy:passed/results.length,results},null,2));
