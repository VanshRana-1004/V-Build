export interface Reply{
    text : string ,
    project : string ,
    files : {
        path : string ,
        content : string 
    }[]
}