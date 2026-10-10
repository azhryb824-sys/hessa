import { generateMathQuestions } from "../lib/ai/math-question-bank";
import { solveDeterministicMath } from "../lib/ai/math-engine";
const skills=["g1-add-10","g1-sub-10","g3-multiply","g3-division","g6-ratios","g6-algebra"];
let total=0,passed=0;const failures:any[]=[];
for(const skill of skills){for(const q of generateMathQuestions(skill,60,20261006)){total++;const solved=solveDeterministicMath(q.prompt);const ok=solved?.expectedAnswer===q.answer;if(ok)passed++;else failures.push({skill,prompt:q.prompt,expected:q.answer,actual:solved?.expectedAnswer??null});}}
const accuracy=passed/total;console.log(JSON.stringify({suite:"hessa-scientific-math-v1",passed,total,accuracy,failures:failures.slice(0,30)},null,2));if(accuracy<.98)process.exitCode=1;
