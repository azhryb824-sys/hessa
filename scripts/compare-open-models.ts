import fs from "node:fs";
type Case={id:string;prompt:string;expected:string;skill:string};
type Model={id:string;endpoint:string;apiKey:string};
const configPath=process.argv[2];
if(!configPath) throw new Error("Provide benchmark model config JSON.");
const models=JSON.parse(fs.readFileSync(configPath,"utf8")) as Model[];
const cases=JSON.parse(fs.readFileSync("benchmarks/hessa-math-ar-v1.json","utf8")) as Case[];
const report=[];
for(const model of models){
 let passed=0,totalLatency=0;
 const casesOut=[];
 for(const test of cases){
  const started=performance.now();
  const response=await fetch(model.endpoint.replace(/\/$/,"")+"/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+model.apiKey},body:JSON.stringify({model:model.id,temperature:0,messages:[{role:"system",content:"أجب كمعلم رياضيات عربي. اذكر الناتج النهائي بوضوح."},{role:"user",content:test.prompt}]})});
  const latencyMs=Math.round(performance.now()-started); totalLatency+=latencyMs;
  if(!response.ok){casesOut.push({id:test.id,ok:false,latencyMs,error:"HTTP "+response.status});continue;}
  const data=await response.json() as {choices?:Array<{message?:{content?:string}}>};
  const answer=data.choices?.[0]?.message?.content??"";
  const ok=answer.replace(/\s/g,"").includes(test.expected.replace(/\s/g,"")); if(ok)passed++;
  casesOut.push({id:test.id,skill:test.skill,ok,latencyMs,answer});
 }
 report.push({model:model.id,passed,total:cases.length,accuracy:passed/cases.length,meanLatencyMs:Math.round(totalLatency/cases.length),cases:casesOut});
}
console.log(JSON.stringify({suite:"hessa-open-model-comparison-v1",generatedAt:new Date().toISOString(),report},null,2));
