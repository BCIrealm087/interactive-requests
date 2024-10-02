type RequestErrorData = { message: string, json: object|null };

export type ResponseHistory<T> = { [reqString: string] : { 
  data: T, 
  error?: undefined
} | { 
  error: RequestErrorData
} }