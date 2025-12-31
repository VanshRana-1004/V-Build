export interface Reply{
    text : string | null,
    project : string | null,
    files : {
        path : string | null,
        content : string | null
    }[]
}