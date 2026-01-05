'use client';

import { useEffect, useRef, useState } from "react";
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

  const bufferRef=useRef<string>('');
  const streamingRef=useRef<boolean>(false);
  const [newReply,setNewReply]=useState<boolean>(false);

  function startFlusher(){

    let thinking : boolean=false;
    let eventText : boolean=false;
    let eventProject : boolean=false;
    let eventFileName : boolean=false;
    let eventFileLanguage : boolean=false;
    let eventFileContent : boolean=false;

    // to push previous type of streamed content based on its EVENTTYPE
    async function completePrev(chunk : string,caller : string){
      if(thinking){
        setChat(prev=>{
          if(prev.length===0) return prev;
          const last=prev[prev.length-1];
          return [
            ...prev.slice(0,-1),
            {...last, thinking : last.thinking + chunk}
          ]
        })
        thinking=false;
      }
      else if(eventText){
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
          const files=last.files.map((f,i)=>
            i===last.files.length-1 ? {...f,path : f.path + chunk} : f
          )
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
          const files=last.files.map((f,i)=>
            i===last.files.length-1 ? {...f,language : f.language + chunk} : f
          )
          return [
            ...prev.slice(0,-1),
            {...last,files}
          ]
        })
        eventFileLanguage=false;
      }
      else if(eventFileContent){
        if(chunk.includes('EVENTFILEEND')){
          const splits=chunk.split('EVENTFILEEND');
          chunk=splits[0];
        }
        setChat(prev=>{
          if(prev.length===0) return prev;
          const last=prev[prev.length-1];
          const files=last.files.map((f,i)=>
            i===last.files.length-1 ? {...f,content : f.content + chunk} : f
          )
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
      let chunk=bufferRef.current;
      if(separator!=-1){
        chunk=bufferRef.current.slice(0,separator+1);
        bufferRef.current=bufferRef.current.slice(separator+1);
      }
      else{
        bufferRef.current='';
      }
      console.log('[chunk] : ',chunk);

      // to separate previous and current content based on EVENTTYPE
      if(chunk.includes('<think>')){
        const split=chunk.split('<think>');
        thinking=true;
        chunk=split[1];
      }
      if(chunk.includes('</think>')){
        const split=chunk.split('</think>');
        completePrev(split[0],'</think>');
        bufferRef.current=split[1]+bufferRef.current;
      }
      if(chunk.includes('EVENTTEXT')){
        const splits=chunk.split('EVENTTEXT');
        completePrev(splits[0],'EVENTTEXT');
        eventText=true;
        chunk=splits[1];
      }
      if(chunk.includes('EVENTPROJECTSTART')){
        const splits=chunk.split('EVENTPROJECTSTART');
        completePrev(splits[0],'EVENTPROJECTSTART');
        eventProject=true;
        chunk=splits[1];
      }
      if(chunk.includes('EVENTFILESTART')){
        const splits=chunk.split('EVENTFILESTART');
        completePrev(splits[0],'EVENTFILESTART');
        setChat(prev=>{
          if(prev.length===0) return prev;
          const last=prev[prev.length-1];
          const updatedFiles = [
            ...last.files.map((f, i) =>
              i === last.files.length - 1
                ? { ...f, focus: false }
                : f
            ),
            {
              path: '',
              content: '',
              language: '',
              focus: true,
            },
          ];
          return [
            ...prev.slice(0,-1),
            {
              ...last,
              files : updatedFiles 
            }
          ]
        })
        eventFileName=true;
        chunk=splits[1];
      }
      if(chunk.includes('EVENTFILELANGUAGE')){
        const splits=chunk.split('EVENTFILELANGUAGE');
        completePrev(splits[0],'EVENTFILELANGUAGE');
        eventFileLanguage=true;
        chunk=splits[1];
      }
      if(chunk.includes('EVENTFILECONTENT')){
        const splits=chunk.split('EVENTFILECONTENT');
        completePrev(splits[0],'EVENTFILECONTENT');
        eventFileContent=true;
        chunk=splits[1];
      }
      if(chunk.includes('EVENTFILEEND')){
        const splits=chunk.split('EVENTFILEEND');   
        completePrev(splits[0],'EVENTFILEEND');
        chunk=splits[1];
      }
      if(chunk.includes('EVENTPROJECTEND')){
        const splits=chunk.split('EVENTPROJECTEND');   
        completePrev(splits[0],'EVENTPROJECTEND');
        return;
      }

      // to push new streamed content based on its EVENTTYPE
      if(thinking){
        setChat(prev=>{
          if(prev.length===0) return prev;
          const last=prev[prev.length-1];
          return [
            ...prev.slice(0,-1),
            {...last, thinking : last.thinking + chunk}
          ]
        })
      }
      else if(eventText){
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
          const files=last.files.map((f,i)=>
            i===last.files.length-1 ? {...f,path : f.path + chunk} : f
          )
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
          const files=last.files.map((f,i)=>
            i===last.files.length-1 ? {...f,language : f.language + chunk} : f
          )
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
          const files=last.files.map((f,i)=>
            i===last.files.length-1 ? {...f,content : f.content + chunk} : f
          )
          return [
            ...prev.slice(0,-1),
            {...last,files}
          ]
        })
      }
      else{
        return;
      }

    },5);

  }

  useEffect(()=>{
    startFlusher();
  },[newReply]);

  async function ask(){
    const ques=quesRef.current?.value;
    ques?.trim();
    bufferRef.current='';
    
    if(ques && ques!=''){
      
      const newQues : Reply={ques : ques, thinking : '',text : '', project : '', focus : false, files : []};
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

      setChat(prev =>
        prev.map(c => ({
          ...c,
          focus: false,
        }))
      );

      setChat((prev)=>[...prev,{ques : null, thinking : '',text : '', project : '', focus : true, files : []}]);
      // startFlusher();
      setNewReply(newReply=>!newReply)

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

  function changeFileFocus(ind : number, fileInd : number){
    setChat(prev =>
      prev.map((chat, chatIndex) => {
        if (chatIndex !== ind) return chat;

        return {
          ...chat,
          files: chat.files.map((file, fIndex) => ({
            ...file,
            focus: fIndex === fileInd,
          })),
        };
      })
    );
  }

  function changeReplyFocus(ind: number) {
    setChat(prev =>
      prev.map((chat, chatInd) => ({
        ...chat,
        focus: chatInd === ind,
      }))
    );
  }

  return <div className="bg-zinc-950 flex h-screen w-screen ">

    <div className="w-full h-full flex p-1.5 gap-1.5 ">

      <div className="w-1/4 flex flex-col gap-1.5">

        <div className="h-[80%] border border-zinc-700/50 rounded-md w-full p-3 pt-0 overflow-y-auto ">
          {chat.map((convo : Reply,ind : number)=>(
            <div key={ind} onClick={()=>changeReplyFocus(ind)} className={`text-sm max-w-[80%] h-auto text-wrap  ${convo.ques!=null ? 'place-self-end justify-end ' : 'border border-transparent place-self-start justify-start bg-zinc-600/20' } ${convo.ques==null && 'hover:border hover:border-zinc-100/30'} px-4 py-2 text-sm text-zinc-200 rounded-md mt-3`}>
              {convo.ques !== null && <p>{convo.ques}</p>}
              {convo.ques === null && convo.thinking !== '' && <p className="italic opacity-70 border-b border-zinc-600">Thinking : {convo.thinking}</p>}
              {convo.ques === null && convo.text !== '' && <p className={convo.thinking !== '' ? 'mt-2' : ''}>{convo.text} </p>}
            </div>
          ))}
        </div>
      
        <div className="h-[20%] w-full  self-center relative rounded-md p-3 border border-zinc-700/50 flex flex-col items-center ">
          <textarea ref={quesRef} placeholder="What you want to build today?" className="text-white bg-none text-sm resize-none focus:outline-0 flex-1 h-full w-full"></textarea>
          <div className="flex gap-2 right-2 bottom-2 self-end">
            <CustomSelect options={modelOptions} initialValue={model} onChange={setModel}/>
            <div onClick={ask} className="bg-zinc-50 px-4 py-1.5 rounded-lg text-sm text-zinc-900 font-medium hover:bg-zinc-200 cursor-pointer">Send</div>
          </div>
        </div>
      
      </div>
      
      <div className="w-3/4 h-full flex flex-col border border-zinc-700/50 rounded-md">
        <div className="w-full h-auto py-2 border-b border-zinc-700/50 px-5">
          <div className="text-sm text-zinc-300 flex gap-1">
            Project Description : { chat.filter(c=>c.focus).map((r)=>(r.project))}
          </div>
        </div>
        <div className="flex w-full flex-1">
          <div className="w-1/5 h-full border-r border-r-zinc-700/50 flex flex-col ">
            <p className="border-b border-zinc-700/50 text-zinc-400 px-5 py-1.5 text-sm">Project Files</p>
            {chat.map((c,ind)=>
              c.focus && (
                <div key={ind} className="flex flex-col px-2 py-1 gap-1">
                  {c.files.map((f,fileInd)=>(
                    <p key={fileInd} onClick={()=>changeFileFocus(ind,fileInd)} className="text-zinc-400 text-sm hover:bg-zinc-700/30 cursor-pointer px-3 rounded-md py-1 truncate">{f.path}</p>
                  ))}
                </div>
              )
            )}
          </div>
          <div className="w-4/5 h-full flex flex-col">
            <div className="flex gap-1 items-center border-b border-zinc-700/50 text-zinc-400 px-5 py-1.5 text-sm">
              File Name : 
              {chat.filter(c=>c.focus).map((r,ind)=>(
                <div key={ind} className="flex flex-col px-5 ">
                  {r.files.filter(f=>f.focus).map((f,fileInd)=>(
                    <p key={fileInd}  className="text-zinc-400 text-sm ">{f.path}</p>
                  ))}
                </div>
              ))}
            </div>
            <div className="w-full px-3 overflow-y-auto h-[645px]">
              {chat.filter(c=>c.focus).map((r,ind)=>(
                <div key={ind} className="flex flex-col px-5 py-0.5">
                  {r.files.filter(f=>f.focus).map((f,fileInd)=>(
                    <pre key={fileInd} className="text-zinc-400 text-sm">{f.content}</pre>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    
    </div>

  </div>
}