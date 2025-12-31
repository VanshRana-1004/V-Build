export interface Reply{
    type : 'text' | 'project',
    content : string | null,
    description : string | null,
    files : {
        path : string,
        language : string,
        content : string
    }[]
}