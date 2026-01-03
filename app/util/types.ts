export interface Reply{
    ques : string | null,
    text : string ,
    project : string ,
    focus : boolean,
    files : {
        path : string ,
        content : string,
        language : string 
    }[]
}

