export interface Reply{
    ques : string | null,
    text : string ,
    project : string ,
    files : {
        path : string ,
        content : string 
    }[]
}