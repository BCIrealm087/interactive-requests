export class APIRequestError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class APIResponseError extends Error {
  reqEndpointPath: string
  responseJSON: object | null

  constructor(reqEndpointPath: string, message: string, responseJSON: APIResponseError['responseJSON'] = null) {
    super(message);
    this.reqEndpointPath = reqEndpointPath;
    this.responseJSON = responseJSON;
  }
};

type RequestErrorData = { message: string, json: object|null };

export type ResponseHistory<T> = { [reqString: string] : { 
  data: T, 
  error?: undefined
} | { 
  error: RequestErrorData
} }

export type FetchClientWithData<T> = (baseURL: string, endpointsURL?: string, retries?: number, message?: string) => Promise<{
  status: 'ok', message?: string, updated: number, data: T, lastURL: string } | 
  { status: APIResponseError, updated: number, errors: number, failed?: number, lastURL: string|null } >;

export type FetchClient = (baseURL: string, endpointsURL?: string, retries?: number, message?: string) => Promise<{
  status: 'ok', message?: string, updated: number, lastURL: string } | 
  { status: APIResponseError, updated: number, errors: number, failed?: number, lastURL: string|null } >;

export type APIInterceptFn<T> = (endpointURL: string, fetchStateHandler: FetchClientWithData<T>, history: { 
  responses: ResponseHistory<T>, 
  selected?: string 
})=>Promise<
  { status: APIResponseError, updated: number, errors: number, failed?: number, lastURL: string|null } 
  |
  { status: 'ok', message?: string, updated: number, lastURL: string }
>;

export type RequestStateHandler<T> = (handlerParams? : 
  { interceptFn?: APIInterceptFn<T>, reqPathOverride?: string, scrollToOutput?: boolean }
)=>void;