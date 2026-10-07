import os,torch
from fastapi import FastAPI,HTTPException
from pydantic import BaseModel
from typing import List,Literal,Optional
from transformers import AutoTokenizer,AutoModelForCausalLM,BitsAndBytesConfig
MODEL=os.getenv("HESSA_QWEN_MODEL","Qwen/Qwen3-4B-Instruct-2507")
DEVICE=int(os.getenv("HESSA_QWEN_GPU","1"))
torch.cuda.set_device(DEVICE)
q=BitsAndBytesConfig(load_in_4bit=True,bnb_4bit_quant_type="nf4",bnb_4bit_use_double_quant=True,bnb_4bit_compute_dtype=torch.float16)
tok=AutoTokenizer.from_pretrained(MODEL)
model=AutoModelForCausalLM.from_pretrained(MODEL,quantization_config=q,device_map={"":DEVICE},torch_dtype=torch.float16,low_cpu_mem_usage=True)
model.eval()
app=FastAPI()
class Msg(BaseModel): role:Literal["system","user","assistant"];content:str
class Req(BaseModel): model:Optional[str]=None;messages:List[Msg];temperature:float=.2;max_tokens:Optional[int]=220
@app.get("/health")
def health():return{"ok":True,"model":MODEL,"gpu":DEVICE}
@app.post("/v1/chat/completions")
def chat(r:Req):
 try:
  messages=[m.model_dump() for m in r.messages]
  text=tok.apply_chat_template(messages,tokenize=False,add_generation_prompt=True)
  inputs=tok(text,return_tensors="pt",truncation=True,max_length=2600).to(f"cuda:{DEVICE}")
  with torch.inference_mode():
   out=model.generate(**inputs,max_new_tokens=min(r.max_tokens or 220,300),do_sample=False,repetition_penalty=1.05,pad_token_id=tok.eos_token_id)
  ans=tok.decode(out[0][inputs["input_ids"].shape[1]:],skip_special_tokens=True).strip()
  return{"id":"hessa-local","object":"chat.completion","model":MODEL,"choices":[{"index":0,"message":{"role":"assistant","content":ans},"finish_reason":"stop"}]}
 except Exception as e: raise HTTPException(status_code=500,detail=str(e))
