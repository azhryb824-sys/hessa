import fs from "node:fs";
import { solveDeterministicMath, verifyMathAnswer } from "../lib/ai/math-engine";

type Case={id:string;prompt:string;expected:string;skill:string};
const cases=JSON.parse(fs.readFileSync("benchmarks/hessa-math-ar-v1.json","utf8")) as Case[];
let passed=0;
const results=cases.map(test=>{const solved=solveDeterministicMath(test.prompt);const answer=solved?.answer??"";const verification=verifyMathAnswer(test.prompt,answer);const ok=verification.verified&&verification.expectedAnswer===test.expected; if(ok)passed++; return{id:test.id,skill:test.skill,ok,expected:test.expected,actual:verification.expectedAnswer??null};});
const accuracy=cases.length?passed/cases.length:0;
console.log(JSON.stringify({suite:"hessa-math-ar-v1",passed,total:cases.length,accuracy,results},null,2));
if(accuracy<1)process.exitCode=1;
