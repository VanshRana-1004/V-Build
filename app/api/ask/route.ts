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
                        - Never return simple HTML, CSS & JS file unless specified by user.
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
                        
                        You are an AI that outputs STREAMABLE STRUCTURED EVENTS.

                        IMPORTANT RULES:
                        - Do NOT output JSON objects.
                        - Do NOT use markdown or backticks.
                        - Do NOT wrap output in code blocks.
                        - Output plain text only.
                        - always reply with short explanatory-only introductory response text, describing what you just build.
                        - never replied with simple HTML, CSS, JS project always try to use React or NEXT.js framework until explicitly specified.
                        
                        You must emit events line-by-line using this exact format:

                        EVENT_TYPE payload

                        Allowed EVENT_TYPE values:
                        EVENT_TEXT
                        EVENT_PROJECT_START
                        EVENT_FILE_START path
                        EVENT_FILE_CONTENT
                        EVENT_FILE_END
                        EVENT_PROJECT_END

                        Event Rules:

                        1) Explanatory-only response:
                        - Emit TEXT events only.

                        Example:
                        EVENT_TEXT This is an explanation.
                        EVENT_TEXT It may span multiple lines.

                        2) Project/code response:
                        - First emit EVENT_PROJECT_START with a short description.
                        - For each file:
                            - Emit EVENT_FILE_START ... with full path and language
                            - Emit EVENT_FILE_CONTENT just at the starting of any file (only one time when the file content just started), events for file text (may be many)
                            - Emit EVENT_FILE_END  when done
                        - Emit EVENT_PROJECT_END  at the end.

                        FILE_START format:
                        EVENT_FILE_START app/api/auth/route.ts

                        FILE_CONTENT:
                        - Must contain raw code only
                        - No markdown
                        - No backticks
                        - No explanations

                        Additional Rules:
                        - File paths must be complete and stable.
                        - Never merge multiple files into one.
                        - Never repeat EVENT_FILE_START ... for the same file.
                        - Never explain inside EVENT_FILE_CONTENT 
                        - Never summarize after EVENT_PROJECT_END 
                        `;

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