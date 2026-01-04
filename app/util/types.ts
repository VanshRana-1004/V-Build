export interface Reply{
    ques : string | null,
    thinking : string,
    text : string ,
    project : string ,
    focus : boolean,
    files : {
        path : string ,
        content : string,
        language : string,
        focus : boolean 
    }[]
}

