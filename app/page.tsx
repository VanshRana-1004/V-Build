'use client';

import { useRef, useState } from "react";
import CustomSelect from "./components/custom-select";
import { Reply } from "./util/types";
import { Editor } from "@monaco-editor/react";

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

  const bufferRef=useRef<string>('');
  const streamingRef=useRef<boolean>(false);

  // fix this rendering logic again based on space and EVENTTYPE



  function startFlusher(){
    
    setChat((prev)=>[...prev,{ques : null, text : '', project : '', focus : true, files : []}]);

    let eventText : boolean=false;
    let eventProject : boolean=false;
    let eventFileName : boolean=false;
    let eventFileLanguage : boolean=false;
    let eventFileContent : boolean=false;

    function completePrev(chunk : string){

      if(eventText){
        setChat(prev=>{
          if(prev.length===0) return prev;
          const last=prev[prev.length-1];
          return [
            ...prev.slice(0,-1),
            {...last, text : last.text + chunk}
          ]
        })
        eventText=false;
      }
      else if(eventProject){
        setChat(prev=>{
          if(prev.length===0) return prev;
          const last=prev[prev.length-1];
          return [
            ...prev.slice(0,-1),
            {...last, project : last.project + chunk}
          ]
        })
        eventProject=false;
      }
      else if(eventFileName){
        setChat(prev=>{
          if(prev.length===0) return prev;
          
          const last=prev[prev.length-1];
          const files=last.files;
          const lastFile=files[files.length-1];
          
          files[files.length-1]={
            ...lastFile,
            path : lastFile.path+chunk
          }

          return [
            ...prev.slice(0,-1),
            {...last,files}
          ]
        })
        eventFileName=false;
      }
      else if(eventFileLanguage){
        setChat(prev=>{
          if(prev.length===0) return prev;
          
          const last=prev[prev.length-1];
          const files=last.files;
          const lastFile=files[files.length-1];
          
          files[files.length-1]={
            ...lastFile,
            language : lastFile.language+chunk
          }

          return [
            ...prev.slice(0,-1),
            {...last,files}
          ]
        })
        eventFileLanguage=false;
      }
      else if(eventFileContent){
        setChat(prev=>{
          if(prev.length===0) return prev;
          
          const last=prev[prev.length-1];
          const files=last.files;
          const lastFile=files[files.length-1];
          
          files[files.length-1]={
            ...lastFile,
            content : lastFile.content+chunk
          }

          return [
            ...prev.slice(0,-1),
            {...last,files}
          ]
        })
        eventFileContent=false;
      }
      else return;

    }

    const interval=setInterval(()=>{
      
      if(bufferRef.current.length===0 && !streamingRef.current){
        clearInterval(interval);
        return;
      }
      
      const separator=bufferRef.current.indexOf(' ');
      if(separator==-1) return;
      
      let chunk=bufferRef.current.slice(0,separator+1);
      bufferRef.current=bufferRef.current.slice(separator+1);

      console.log(chunk);

      if(chunk.includes('EVENTTEXT')){
        const splits=chunk.split('EVENTTEXT');
        completePrev(splits[0]);
        eventText=true;
        chunk=splits[1];
      }
      else if(chunk.includes('EVENTPROJECTSTART')){
        const splits=chunk.split('EVENTPROJECTSTART');
        completePrev(splits[0]);
        eventProject=true;
        chunk=splits[1];
      }
      else if(chunk.includes('EVENTFILESTART')){
        const splits=chunk.split('EVENTFILESTART');
        completePrev(splits[0]);
        setChat(prev=>{
          if(prev.length===0) return prev;
          const last=prev[prev.length-1]
          return [
            ...prev.slice(0,-1),
            {
              ...last,
              files : [
                ...last.files,
                {
                  path : '' ,
                  content : '',
                  language : '' 
                }
              ] 
            }
          ]
        })
        eventFileName=true;
        chunk=splits[1];
      }
      else if(chunk.includes('EVENTFILELANGUAGE')){
        const splits=chunk.split('EVENTFILELANGUAGE');
        completePrev(splits[0]);
        eventFileLanguage=true;
        chunk=splits[1];
      }
      else if(chunk.includes('EVENTFILECONTENT')){
        const splits=chunk.split('EVENTFILECONTENT');
        completePrev(splits[0]);
        eventFileContent=true;
        chunk=splits[1];
      }
      else if(chunk.includes('EVENTFILEEND')){
        const splits=chunk.split('EVENTFILEEND');   
        completePrev(splits[0]);
      }
      else if(chunk.includes('EVENTPROJECTEND')){
        return;
      }

      if(eventText){
        setChat(prev=>{
          if(prev.length===0) return prev;
          const last=prev[prev.length-1];
          return [
            ...prev.slice(0,-1),
            {...last, text : last.text + chunk}
          ]
        })
      }
      else if(eventProject){
        setChat(prev=>{
          if(prev.length===0) return prev;
          const last=prev[prev.length-1];
          return [
            ...prev.slice(0,-1),
            {...last, project : last.project + chunk}
          ]
        })
      }
      else if(eventFileName){
        setChat(prev=>{
          if(prev.length===0) return prev;
          
          const last=prev[prev.length-1];
          const files=last.files;
          const lastFile=files[files.length-1];
          
          files[files.length-1]={
            ...lastFile,
            path : lastFile.path+chunk
          }

          return [
            ...prev.slice(0,-1),
            {...last,files}
          ]
        })
      }
      else if(eventFileLanguage){
        setChat(prev=>{
          if(prev.length===0) return prev;
          
          const last=prev[prev.length-1];
          const files=last.files;
          const lastFile=files[files.length-1];
          
          files[files.length-1]={
            ...lastFile,
            language : lastFile.language+chunk
          }

          return [
            ...prev.slice(0,-1),
            {...last,files}
          ]
        })
      }
      else if(eventFileContent){
        setChat(prev=>{
          if(prev.length===0) return prev;
          
          const last=prev[prev.length-1];
          const files=last.files;
          const lastFile=files[files.length-1];
          
          files[files.length-1]={
            ...lastFile,
            content : lastFile.content+chunk
          }

          return [
            ...prev.slice(0,-1),
            {...last,files}
          ]
        })
      }
      else{
        return;
      }

    },100);

  }

  async function ask(){
    const ques=quesRef.current?.value;
    ques?.trim();
    bufferRef.current='';
    
    if(ques && ques!=''){
      
      const newQues : Reply={ques : ques, text : '', project : '', focus : false, files : []};
      setChat((chat)=>[...chat,newQues]);
      if(quesRef.current) quesRef.current.value='';
      
      const res=await fetch('/api/ask',{
        method : 'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify({ques,model})
      })

      const reader=res.body?.getReader();
      const decoder=new TextDecoder();
      
      if(!reader) return;
      streamingRef.current=true;

      startFlusher();

      while(true){
        const {value,done}=await reader.read();
        if(done){
          streamingRef.current=false;
          break;
        } 
        const chunk=decoder.decode(value);
        bufferRef.current+=chunk;
      }

    }
  }

  return <div className="bg-zinc-950 flex h-screen w-screen ">

    <div className="w-full h-full flex p-1.5 gap-1.5 ">

      <div className="w-1/4 flex flex-col gap-1.5">

        <div className="h-[80%] border border-zinc-700/50 rounded-md w-full p-3 pt-0 overflow-y-auto ">
          {chat.map((convo : Reply,ind : number)=>(
            <div key={ind} className={`max-w-[80%] h-auto text-wrap ${convo.ques!=null ? 'place-self-end justify-end' : 'place-self-start justify-start' } px-4 py-2 text-sm text-zinc-200 rounded-md mt-3`}>
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
          <div className="text-sm text-zinc-300">
            {chat.map((convo : Reply ,ind : number)=>(
              <p key={ind} className="text-sm text-zinc-300">
                {convo.focus && convo.project}
              </p>
            ))}
          </div>
        </div>
        <div className="flex w-full flex-1">
          
        </div>
      </div>
    
    </div>

  </div>
}