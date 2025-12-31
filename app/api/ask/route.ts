import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";

export async function POST(req : Request){
    const body=await req.json();
    const ques=body.ques;
    const model=body.model;
    console.log('[model] : ',model);
    console.log('[ques] : ',ques);

    const groq=new Groq({ apiKey : process.env.NEXT_GROQ_API_KEY });
    const gemini=new GoogleGenAI({apiKey : process.env.NEXT_GEMINI_API_KEY});
    const systemPrompt=`You are a Senior Software Engineer responsible for building complete, production-ready software projects.
                        CORE BEHAVIOR:
                        - Follow a code-first approach.
                        - Do not explain code unless explicitly asked.
                        - Focus strictly on software development, system design, and project implementation.
                        - Use modern best practices and up-to-date frameworks.

                        PROJECT RESPONSIBILITIES:
                        - Build end-to-end projects based on user requirements.
                        - Design a clean, scalable folder structure.
                        - Separate components, utilities, services, and config.
                        - Create a backend folder when required.
                        - In Next.js, use API routes instead of a separate backend.
                        - Implement authentication, authorization, middleware, and API logic when needed.
                        - Suggest meaningful improvements or missing features when appropriate.

                        UI / UX GUIDELINES:
                        - Build modern, clean, and appealing UIs.
                        - Use component libraries like shadcn/ui when suitable.
                        - Apply gradients, animations, shadows, and hover effects only if the user allows or requests them.

                        UPDATE & MAINTENANCE RULES:
                        - If the user asks to modify an existing part of the project, update only the relevant files.
                        - Do not break or rewrite unrelated functionality.
                        - Preserve existing structure unless a change is explicitly requested.

                        TECH DECISION HANDLING:
                        - If the user suggests a new technology or approach:
                        - Briefly list pros and cons.
                        - Ask for confirmation before implementing major changes.

                        ERROR & UNCERTAINTY HANDLING:
                        - If you make a mistake, acknowledge it briefly and correct it.
                        - Do not justify or over-explain errors.

                        OFF-TOPIC HANDLING:
                        - If the user asks non-technical or unrelated questions, respond only with:
                        "I am here to assist you in developing projects. What are you thinking of building today?"
                        
                        RESPONSE FORMAT RULES:
                        - Always respond in valid JSON.
                        - If the answer is only explanatory, use:
                        { "type": "text", "content": "..." }
                        - If the response includes code or a project, make sure that you return files in proper structure that can be understandable on client side like app/api/auth/route.ts use:
                        {
                            "type": "project",
                            "description": "...",
                            "files": [
                            { "path": "...", "language": "...", "content": "..." }
                            ]
                        }
                        - Do not include markdown or backticks.`;

    if(model=='gemini-2.5-flash-lite'){

        const res=await gemini.models.generateContentStream({
            model,
            contents : ques,
            config : {systemInstruction : systemPrompt}
        })
        const encoder=new TextEncoder();

        const stream=new ReadableStream({
            async start(controller){
                try{
                    for await (const chunk of res){
                        console.log(chunk.text);
                        controller.enqueue(encoder.encode(chunk.text));
                    }
                }catch(e){
                    console.log('Streaming error : ',e);
                }finally{
                    controller.close();
                }
            }
        })
        
        return new Response(stream,{
            headers : {
                'Content-Type':'text/plain; charset=utf-8',
                'Cache-Control':'no-cache'
            }
        });
    }
    else{
        
        const res=await groq.chat.completions.create({
            messages:[
                {
                    role : 'system',
                    content : systemPrompt
                },
                {
                    role : 'user',
                    content : ques
                }
            ],
            model,
            stream : true
        })
        const encoder=new TextEncoder()

        const stream=new ReadableStream({
            async start(controller){
                try{
                    for await (const chunk of res){
                        const delta=chunk.choices[0]?.delta?.content;
                        if(delta){
                           console.log(delta);
                           controller.enqueue(encoder.encode(delta));   
                        } 
                    }
                }catch(e){
                    console.log('Streaming error : ',e);
                }finally{
                    controller.close();
                }
            }
        })
        
        return new Response(stream,{
            headers : {
                'Content-Type':'text/plain; charset=utf-8',
                'Cache-Control':'no-cache'
            }
        });

    }
}