import json,os
from pathlib import Path
CFG=json.loads(Path("training/qlora-v1.json").read_text())
def main():
 import torch
 from datasets import load_dataset
 from transformers import AutoTokenizer,AutoModelForCausalLM,BitsAndBytesConfig,TrainingArguments
 from peft import LoraConfig
 from trl import SFTTrainer
 model_id=CFG["base_model"]
 tok=AutoTokenizer.from_pretrained(model_id)
 quant=BitsAndBytesConfig(load_in_4bit=True,bnb_4bit_quant_type="nf4",bnb_4bit_use_double_quant=True,bnb_4bit_compute_dtype=torch.bfloat16)
 model=AutoModelForCausalLM.from_pretrained(model_id,quantization_config=quant,device_map="auto")
 ds=load_dataset("json",data_files={"train":"data/training/v1/train.jsonl","validation":"data/training/v1/validation.jsonl"})
 def fmt(x): return {"text":tok.apply_chat_template(x["messages"],tokenize=False,add_generation_prompt=False)}
 ds=ds.map(fmt)
 lora=LoraConfig(r=CFG["lora_r"],lora_alpha=CFG["lora_alpha"],lora_dropout=CFG["lora_dropout"],target_modules=CFG["target_modules"],task_type="CAUSAL_LM")
 args=TrainingArguments(output_dir="artifacts/hessa-tutor-v1",num_train_epochs=CFG["epochs"],learning_rate=CFG["learning_rate"],per_device_train_batch_size=1,gradient_accumulation_steps=CFG["gradient_accumulation_steps"],bf16=True,logging_steps=10,save_steps=100,eval_steps=100,eval_strategy="steps",report_to="none",seed=CFG["seed"])
 trainer=SFTTrainer(model=model,args=args,train_dataset=ds["train"],eval_dataset=ds["validation"],peft_config=lora,processing_class=tok,dataset_text_field="text",max_seq_length=CFG["max_seq_length"])
 trainer.train();trainer.save_model("artifacts/hessa-tutor-v1/final")
if __name__=="__main__": main()
