import { computeMastery, chooseLearningAction } from "../lib/ai/mastery-engine";
const cases=[
{a:0,c:0,s:[],t:.85,status:"NOT_STARTED",action:"TEACH"},
{a:1,c:0,s:[0],t:.85,status:"LEARNING",action:"DIAGNOSE",last:false},
{a:2,c:0,s:[0,0],t:.85,status:"REMEDIATE",action:"REMEDIATE"},
{a:3,c:2,s:[.7,.7,.7],t:.85,status:"RETEST",action:"RETEST"},
{a:5,c:5,s:[1,.9,.9],t:.85,status:"MASTERED",action:"ADVANCE"}
];
let passed=0;
for(const x of cases){const m=computeMastery(x.a,x.c,x.s,x.t);const action=chooseLearningAction(m.status,x.a,x.last);const ok=m.status===x.status&&action===x.action;if(ok)passed++;else console.error({case:x,actual:{status:m.status,action}});}
console.log({passed,total:cases.length});if(passed!==cases.length)process.exitCode=1;
