import { signal, Signal, effect, batch } from "@preact/signals-react";

import { getReasonPhrase } from "http-status-codes";
import { BetterFetch } from "@bcirealm087/better-fetching";

import { 
  ResponseHistory, APIInterceptFn, APIRequestError, 
  APIResponseError, FetchClientWithData, RequestStateHandler
} from './types-Requests';
import { scrollIntoView } from "../../utils";
import { ControllerBase, OptionalSignal } from "@controllers/general";

type RequestsControllerState<ResponseData> = Readonly<{
  responseHistory: Signal<ResponseHistory<ResponseData>>;
  requestPath: Signal<string|null>;
  selectedRequest: Signal<string|null>;
  waiting: OptionalSignal<string>;
  notification: OptionalSignal<{ message: string, errors: boolean }>;
  scrollToRef: OptionalSignal<HTMLDivElement>;
}>

export interface RequestsControllerType<ResponseData> extends ControllerBase {
  readonly state: RequestsControllerState<ResponseData>, 
  labels: typeof defaultLabels, 
  responseJsonExpandNode: ((level: number, value: any, field?: string) => boolean)|null, 
  readonly fetchingConfig: BetterFetchConfig,
  readonly requestHandler: RequestStateHandler<ResponseData>
}

type BetterFetchType = ReturnType<typeof BetterFetch>['betterFetch'];
type BetterFetchConfig = ReturnType<typeof BetterFetch>['config'];
type ControllerMin<ResponseData> = Pick<ReturnType<typeof RequestsController<ResponseData>>, 'state' | 'labels'>;

const defaultLabels = {
  fetchURLWait: (url: string) => `Waiting for "${url}"...`, 
  fetchURLResponse: (status: number, statusPhrase: string) =>
    `The request returned with status ${status} (${statusPhrase})`, 
  fetchRetry: (remainingRetries: number) => 
    `Request failed, ${remainingRetries} ${(remainingRetries !== 1) ? 'tries left' : 'try left'}...`, 
  partialSuccessDefault: () => 'The procedure finished with errors.', 
  successDefault: () => 'The procedure finished successfully', 
  collected: (collectedEntries: number) => `${collectedEntries} ${(collectedEntries>1) ? 'entries' : 'entry'}`, 
  errors: (entriesWithErrors: number) => `${entriesWithErrors} with errors`, 
  failures: (failedInstructions: number) => `${failedInstructions} instruction failure ${(failedInstructions>1) ? 's' : ''}`

} as const;

function fetchWithRetries<ResponseData>(baseURL: string, endpointURL: string = '', retries = 5, 
  message: string|null = null, betterFetch: BetterFetchType, 
  controller: ControllerMin<ResponseData>) : Promise<ResponseData>
{
  const finalURL = baseURL + endpointURL;
  const waiting = controller.state.waiting;
  const labels = controller.labels;
  return betterFetch(finalURL, 
    ()=>waiting.enabled && (waiting.value = (message===null) ? labels.fetchURLWait(finalURL) : message), 
    (response, responseJSON)=>{
      throw new APIResponseError(
        endpointURL || baseURL, 
        labels.fetchURLResponse(response.status, getReasonPhrase(response.status)), 
        responseJSON
      );
    }
  )
    .catch(error=>{
      if (error instanceof TypeError) {
        if (retries<=0) throw new APIResponseError(finalURL, error.message);
      } else if (error instanceof APIResponseError) {
        if (retries<=0) throw error;
      } else throw error;
      return (new Promise(resolve=>setTimeout(resolve, 500))
        .then(()=>fetchWithRetries(baseURL, endpointURL, retries-1, 
          labels.fetchRetry(retries), betterFetch, controller)));
    });
}

function apiRequestHandler<ResponseData>(baseURL: string, endpointURL: string = '', 
  retries=5, message: string|null = null, betterFetch: BetterFetchType, 
  controller: ControllerMin<ResponseData>): ReturnType<FetchClientWithData<ResponseData>>
{
  const state = controller.state;
  return fetchWithRetries(baseURL, endpointURL, retries, message, betterFetch, controller)
    .then(data=>{
      const resultUrl = endpointURL||baseURL;
      state.responseHistory.value = {
        ...state.responseHistory.value, 
        [resultUrl]: { data }
      };
      return { status: 'ok', updated: 1, data: data, lastURL: resultUrl } as const;
    }).catch(error=>{
      if (!(error instanceof APIResponseError)) throw error;
      const resultUrl = endpointURL||baseURL;
      state.responseHistory.value = {
        ...state.responseHistory.value, 
        [resultUrl]: { error: {
          message: error.message, 
          json: error.responseJSON
        } }
      };
      return { status: error, updated: 1, errors: 1, lastURL: resultUrl };
    })
}

function orchestrate<ResponseData>(betterFetch: BetterFetchType, controller: ControllerMin<ResponseData>, 
  interceptFn?: APIInterceptFn<ResponseData>, reqPathOverride?: string, scrollToOutput: boolean = true
){
  const state = controller.state;
  const labels = controller.labels;

  const waiting = state.waiting;
  const notification = state.notification;
  const waitingOn = waiting.enabled;
  const notifsOn = notification.enabled;

  const scrollToRef = state.scrollToRef.value;
  if (scrollToOutput && scrollToRef)
    scrollIntoView(scrollToRef);

  waitingOn && (waiting.active = true);

  var notif = {
    message: labels.partialSuccessDefault(), 
    errors: true
  };
  var collected = 0;
  var errors = 0;
  var failed = 0;
  const apiRequestHandlerOut = (
    baseURL: string, endpointURL: string = '', 
    retries=5, message: string|null = null
  ) => apiRequestHandler(baseURL, endpointURL, retries, message, betterFetch, controller);
  const requestPath = (reqPathOverride || reqPathOverride==='') ? reqPathOverride : state.requestPath.value || '';
  (((interceptFn) && interceptFn(requestPath, apiRequestHandlerOut, (!state.selectedRequest || !state.selectedRequest.value) ? { 
    responses: state.responseHistory.value
   } : {
    responses: state.responseHistory.value, 
    selected: state.selectedRequest.value
   })) || apiRequestHandlerOut(requestPath))
    .then((result)=>{
      collected = result.updated;
      if (result.status==='ok') {
        state.selectedRequest && (state.selectedRequest.value = result.lastURL);
        notif = {
          message: result.message || labels.successDefault(), 
          errors: false
        };
      } else {
        state.selectedRequest && (state.selectedRequest.value = result.lastURL || result.status.reqEndpointPath);
        errors = result.errors;
        if (result.failed)
          failed = result.failed;
      }
    })
    .catch(error=>{
      if (!(error instanceof APIRequestError)) throw error;
      notif = {
        message: error.message, 
        errors: true
      };
    })
    .finally(()=>{
      waitingOn && (waiting.active = false);
      if (notifsOn) {
        notif.message = notif.message.replace(/\.$/, "") + ((collected>0) 
          ? ` (${labels.collected(collected)}`
            + ((errors>0) ? `; ${labels.errors(errors)}` : '')
            + ((failed>0) ? `; ${labels.failures(failed)}` : '')
            + ').' 
          : '.');
        batch(()=>{
          notification.value = notif;
          notification.active = true;
        });
      }
    });
}

export function RequestsController<ResponseData>({ 
  maxParallelRequests = 10, 
  postLimitDelay = 250, 
  defaultWaitingMessage = null, 
  responseJsonExpandNode = null, 
  useWaiting, 
  useNotification, 
  labels
}
: { 
    maxParallelRequests?: number, 
    postLimitDelay?: number, 
    defaultWaitingMessage?: string|null, 
    useWaiting?: boolean, 
    useNotification?: boolean, 
    labels?: Partial<typeof defaultLabels>, 
    responseJsonExpandNode?: RequestsControllerType<ResponseData>['responseJsonExpandNode']
  } = { 
    maxParallelRequests: 10, 
    postLimitDelay: 250, 
    defaultWaitingMessage: null, 
    responseJsonExpandNode: null
  }): RequestsControllerType<ResponseData> {
  const { betterFetch, config: betterFetchConfig } = BetterFetch(maxParallelRequests, postLimitDelay);
  const baseState: RequestsControllerState<ResponseData> = {
    responseHistory: signal({ }),
    requestPath: signal(null),
    selectedRequest: signal(null),
    waiting: new OptionalSignal<string>(defaultWaitingMessage), 
    notification: new OptionalSignal<{
      message: string;
      errors: boolean;
    }>,
    scrollToRef: new OptionalSignal<HTMLDivElement>(null, true)
  }

  const controllerMin: ControllerMin<ResponseData> = {
    state: baseState, 
    labels: { ...defaultLabels, ...labels }
  }
  if (useWaiting) controllerMin.state.waiting.enabled = true;
  if (useNotification) controllerMin.state.notification.enabled = true;
  return {
    state: controllerMin.state, 
    labels: controllerMin.labels, 
    responseJsonExpandNode, 
    fetchingConfig: betterFetchConfig, 
    requestHandler: ({ interceptFn, reqPathOverride, scrollToOutput=true }={ scrollToOutput: true }) =>
      orchestrate(betterFetch, controllerMin, interceptFn, reqPathOverride, scrollToOutput)
  }
}