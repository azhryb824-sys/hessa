import{guardTutorResponse,GuardContext}from"./tutor-policy-guard";import{verifyExplicitArithmetic}from"./math-verifier";
export function validateTutorOutput(c:GuardContext){const policy=guardTutorResponse(c),math=verifyExplicitArithmetic(c.response);return{ok:policy.ok&&math.ok,policy,math,action:policy.ok&&math.ok?"ACCEPT":"REGENERATE"}}
