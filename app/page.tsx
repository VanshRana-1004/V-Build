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
  const [chat,setChat]=useState<Reply[]>([]);

  async function ask(){
    const ques=quesRef.current?.value;
    ques?.trim();
    if(ques && ques!=''){
      
      const newQues : Reply={ques : ques, text : '', project : '', files : []};
      setChat((chat)=>[...chat,newQues]);
      
      const res=await fetch('/api/ask',{
        method : 'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({ques,model})
      })
      if(quesRef.current) quesRef.current.value='';

      const reader=res.body?.getReader();
      const decoder=new TextDecoder();
      
      const curReply : Reply = { ques : null, text : '', project : '', files : []};
      const curFile : { path : string, content : string}={ path : '', content : ''}

      let EVENT_TEXT : boolean=false;
      let EVENT_PROJECT_START : boolean=false;
      let EVENT_FILE_START : boolean=false;

      let buffer : string='';

      while(true && reader){
        const {value,done}=await reader?.read();

        if(done) {
          
          if(EVENT_TEXT){
            curReply.text=buffer;
            EVENT_TEXT=false;
          }

          const newAns : Reply ={
            ques : null,
            text : curReply.text,
            project : curReply.project,
            files : curReply.files
          };

          setChat((chat)=>[...chat,newAns]);

          curReply.files=[];
          curReply.project='';
          curReply.text='';
          break;
        };
        
        const chunk=decoder.decode(value);
        buffer+=chunk;
        
        if(buffer.includes('EVENT_TEXT')){
          EVENT_TEXT=true;
          let splits=buffer.split('EVENT_TEXT');
          buffer=splits[1];
        }
        else if(buffer.includes('EVENT_PROJECT_START')){
          EVENT_PROJECT_START=true;
          let splits=buffer.split('EVENT_PROJECT_START');
          if(EVENT_TEXT){
            EVENT_TEXT=false;
            curReply.text=splits[0];
          }            
          buffer=splits[1];
        }
        else if(buffer.includes('EVENT_FILE_START')){          
          EVENT_FILE_START=true;
          let splits=buffer.split('EVENT_FILE_START');
          if(EVENT_PROJECT_START){
            EVENT_PROJECT_START=false;
            curReply.project=splits[0];
          }
          buffer=splits[1];
        }
        else if(buffer.includes('EVENT_FILE_CONTENT')){
          let splits=buffer.split('EVENT_FILE_CONTENT');
          if(EVENT_FILE_START){
            EVENT_FILE_START=false;
            curFile.path=splits[0];
          }
          buffer=splits[1];
        }
        else if(buffer.includes('EVENT_FILE_END')){
          let splits=buffer.split('EVENT_FILE_END');
          curFile.content=splits[0];
          buffer=splits[1];

          curReply.files.push(curFile);
          curFile.content='';
          curFile.path='';
        }
        else if(buffer.includes('EVENT_PROJECT_END')){
          // console.log('Project built Successfully.') 
        }
      }      

    }
  }

  return <div className="bg-zinc-950 flex h-screen w-screen ">

    <div className="w-full h-full flex p-1.5 gap-1.5 ">

      <div className="w-1/4 flex flex-col gap-1.5">

        <div className="h-[80%] border border-zinc-700/50 rounded-md w-full p-3 pt-0 overflow-y-auto ">
          {chat.map((convo : Reply,ind : number)=>(
            <div key={ind} className={`max-w-[80%] h-auto text-wrap ${convo.ques!=null ? 'place-self-end justify-end' : 'place-self-start justify-start' } border border-zinc-700/50 px-4 py-2 text-sm text-zinc-200 rounded-md mt-3`}>
              {convo.ques!=null ? convo.ques : convo.text}
            </div>
          ))}
        </div>
      
        <div className="h-[20%] w-full  self-center relative rounded-md p-3 border border-zinc-700/50 flex flex-col items-center ">
          <textarea ref={quesRef} placeholder="What you want to build today?" className="text-white bg-none text-sm resize-none focus:outline-0 flex-1 h-full w-full"></textarea>
          <div className="flex gap-2 right-2 bottom-2 self-end">
            <CustomSelect options={modelOptions} initialValue={model} onChange={setModel}/>
            <div onClick={ask} className="bg-zinc-50 px-4 py-1.5 rounded text-sm text-zinc-900 font-medium hover:bg-zinc-200 cursor-pointer">Send</div>
          </div>
        </div>
      
      </div>
      
      <div className="w-3/4 h-full flex flex-col border border-zinc-700/50 rounded-md">
        <div className="w-full h-auto py-2 border-b border-zinc-700/50 px-5">
          <p className="text-sm text-zinc-300">Description</p>
        </div>
        <div className="flex w-full flex-1">
          <div className="w-1/4 h-full border-r border-zinc-700/50 flex flex-col">
            {}
          </div>
          <div className="w-3/4 h-full">
          </div>
        </div>
      </div>
    
    </div>

  </div>
}

// handle conversations code - always show current convo code unless user clicked on particular previous chat to check it.