'use client';

import { useRef, useState } from "react";
import CustomSelect from "./components/custom-select";
import { Reply } from "./util/types";

export default function Home() {

  const quesRef=useRef<HTMLTextAreaElement>(null);
  const [model,setModel]=useState<string>('gemini-2.5-flash-lite');
  const modelOptions : {value : string, label : string}[]=[
    {value : 'gemini-2.5-flash-lite', label : 'Gemini 2.5 flash-lite'},
    {value : 'llama-3.1-8b-instant', label : 'Llama 3.1 8b-instant'},
    {value : 'qwen/qwen3-32b', label : 'Qwen 3 Coder 32B'},
    {value : 'meta-llama/llama-4-scout-17b-16e-instruct', label : 'Llama 4 Scout'},
    {value : 'openai/gpt-oss-120b', label : 'GPT-OSS 120B'},
    {value : 'llama-3.3-70b-versatile', label : 'Llama 3.3 70b-versatile'},
  ]

  async function ask(){
    const ques=quesRef.current?.value;
    ques?.trim();
    if(ques!=''){
      const res=await fetch('/api/ask',{
        method : 'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({ques,model})
      })
      const reader=res.body?.getReader();
      const decoder=new TextDecoder();
      while(true && reader){
        const {value,done}=await reader?.read();
        if(done) break;
        const chunk=decoder.decode(value);
        console.log(chunk);
      }
    }
  }

  return <div className="bg-zinc-950 flex flex-col flec-col py-5 h-screen w-screen">

    <div className="w-full h-[83%] flex flex-col"></div>

    <div className="h-[17%] w-[50%] self-center relative py-3 px-5 bg-zinc-900/60 rounded-lg border border-zinc-900 shadow-sm shadow-zinc-950/90 flex items-center ">
      <textarea ref={quesRef} className="text-white bg-none resize-none focus:outline-0 flex-1 h-full w-full"></textarea>
      <div className="flex gap-2 absolute right-2 bottom-2">
        <CustomSelect options={modelOptions} initialValue={model} onChange={setModel}/>
        <div onClick={ask} className="bg-zinc-50 px-4 py-1.5 rounded text-sm text-zinc-900 font-medium hover:bg-zinc-200 cursor-pointer">Send</div>
      </div>
    </div>

  </div>
}
