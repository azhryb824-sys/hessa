import fs from "node:fs";
type Skill={id:string;grade:number;title:string;outcomes:string[];prerequisites:string[];masteryThreshold:number};
type Graph={skills:Skill[]};
const graph=JSON.parse(fs.readFileSync("data/curriculum/hessa-math-primary-v1.json","utf8")) as Graph;
const items=graph.skills.flatMap(skill=>skill.outcomes.map((outcome,index)=>({
 id:`${skill.id}-check-${index+1}`,skillId:skill.id,grade:skill.grade,type:"MASTERY_CHECK",prompt:`أنشئ سؤالًا أصليًا قصيرًا يقيس هذا الناتج فقط: ${outcome}`,rubric:{outcome,masteryThreshold:skill.masteryThreshold,requiresExplanation:true},prerequisites:skill.prerequisites
})));
fs.mkdirSync("data/curriculum/generated",{recursive:true});
fs.writeFileSync("data/curriculum/generated/hessa-math-primary-mastery-specs.json",JSON.stringify(items,null,2));
console.log("Generated mastery specifications:",items.length);
