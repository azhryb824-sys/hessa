import { mapQuestionToSkill } from "../lib/ai/question-skill-mapper";
import { aggregateSkillEvidence, nextMastery } from "../lib/ai/mastery-update";
const mapping=[
["كم يساوي 5 + 7؟","g2-add-sub-100"],
["كم يساوي 8 × 3؟","g3-multiply"],
["ما ناتج 20 ÷ 4؟","g3-division"],
["25% من 80","g6-ratios"],
["2س + 3 = 11","g6-algebra"],
["مساحة مثلث قاعدته 8 وارتفاعه 5","g6-geometry"]
] as const;
let passed=0;
for(const [q,e] of mapping){if(mapQuestionToSkill(q,"الرياضيات")===e)passed++;else console.error("mapping failed",q,mapQuestionToSkill(q,"الرياضيات"),e);}
const grouped=aggregateSkillEvidence([{skillId:"g3-multiply",correct:true,score:1},{skillId:"g3-multiply",correct:false,score:0}]);
const current=grouped.get("g3-multiply")!;
const next=nextMastery({attempts:2,correctAttempts:2},current,.85);
const aggregationOk=next.attempts===4&&next.correctAttempts===3&&Math.abs(next.accuracy-.75)<.001;
if(aggregationOk)passed++;else console.error("aggregation failed",next);
console.log({passed,total:mapping.length+1});if(passed!==mapping.length+1)process.exitCode=1;
