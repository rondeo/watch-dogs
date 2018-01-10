

export interface PostSummary {
  readonly id:number,
  description: string
}

export function createPostSummary({id, userId, description }:any): PostSummary {
  return {id, description };
}

export function createPostsSummaries(data: any[]): PostSummary[]{
  return data.map(createPostSummary);
}


