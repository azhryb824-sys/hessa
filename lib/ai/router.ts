import type { HessaSubject } from "./types";
const patterns: Array<[HessaSubject, RegExp]> = [
["MATH", /(رياضيات|جمع|طرح|ضرب|قسمة|كسر|كسور|معادلة|محيط|مساحة|زاوية|\d+\s*[+\-×x÷*/]\s*\d+)/i],
["SCIENCE", /(علوم|خلية|طاقة|مادة|تبخر|تكاثف|قوة|حركة|جسم|كوكب|ذرة)/i],
["ARABIC", /(لغة عربية|نحو|إعراب|املاء|إملاء|بلاغة|فاعل|مفعول|مبتدأ|خبر)/i],
["ENGLISH", /(english|grammar|vocabulary|reading|writing|tense|verb|noun)/i],
];
export function routeSubject(message:string,explicitSubject?:string):HessaSubject{
 const raw=explicitSubject?.trim()??"";const explicit=raw.toUpperCase();
 if(explicit&&["MATH","SCIENCE","ARABIC","ENGLISH","GENERAL"].includes(explicit))return explicit as HessaSubject;
 if(raw){for(const[s,p]of patterns)if(p.test(raw))return s;}
 for(const[s,p]of patterns)if(p.test(message))return s;
 return"GENERAL";
}