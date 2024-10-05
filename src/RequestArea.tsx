import { Box } from "@mui/material";

import React, { ReactNode } from "react";
import { Signal } from "@preact/signals-react";

import { ResponseHistory } from './ResponseArea';
import { 
  APIInterceptFn, APIRequestError, APIResponseError, 
  FetchClientWithData, RequestStateHandler
} from './types-interactive-requests';
import { scrollIntoView } from "./utils-interactive-requests";

import { getReasonPhrase } from "http-status-codes";
import { BetterFetch } from "@bcirealm087/better-fetching";

interface RequestAreaProps<T> { responseHistoryState: Signal<ResponseHistory<T>>, 
  requestPathState: Signal<string>, 
  selectedRequestState?: Signal<string>, waiting?: {
    waitingState: Signal<boolean>, 
    waitingMessageState: Signal<string>
  }, notification?: {
    notifState: Signal<boolean>, 
    notifMessageState: Signal<{ message: string, errors: boolean }>
  }, requestHandlerState?: Signal<RequestStateHandler<T>|null>, 
  displayAreaRefState?: Signal<HTMLDivElement|null>, 
  disabledState?: Signal<any>, 
  maxParallelRequests?: number
  children?: ReactNode
}

const { betterFetch, config: fetchingConfig } = BetterFetch();

const fetchWithRetries = <T,>(baseURL: string, endpointURL: string = '', retries = 5, 
  waitingMessageState: Signal<string>|null = null, message: string|null = null) : 
  Promise<T> => 
{
  const finalURL = baseURL + endpointURL;
  return betterFetch(finalURL, 
    ()=>waitingMessageState && (waitingMessageState.value = (message===null) ? `Esperando "${finalURL}"...` : message), 
    (response, responseJSON)=>{
      throw new APIResponseError(
        endpointURL || baseURL, 
        `A requisição retornou com status ${response.status} (${getReasonPhrase(response.status)})`, 
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
        .then(()=>fetchWithRetries(baseURL, endpointURL, retries-1, waitingMessageState, 
          `Falha na requisição, ${retries} ${(retries !== 1) ? 'tentativas restantes' : 'tentativa restante'}...`)));
    });
};

function orchestrate<T,>(
  waiting: RequestAreaProps<T>['waiting'], notification: RequestAreaProps<T>['notification'], 
  responseHistoryState: RequestAreaProps<T>['responseHistoryState'], 
  requestPathState: RequestAreaProps<T>['requestPathState'], 
  selectedRequestState: RequestAreaProps<T>['selectedRequestState'], 
  displayAreaRefState: RequestAreaProps<T>['displayAreaRefState'], 
  interceptFn?: APIInterceptFn<T>, reqPathOverride?: string, scrollToOutput: boolean = true
){
  const waitingOn = !!waiting;
  const notifsOn = !!notification;

  if (scrollToOutput && displayAreaRefState)
    scrollIntoView(displayAreaRefState.value);

  waitingOn && (waiting.waitingState.value = true);
  const apiRequestHandler: FetchClientWithData<T> = (baseURL: string, endpointURL: string = '', 
      retries=5, message: string|null = null) => 
  {
    return fetchWithRetries<T>(baseURL, endpointURL, retries, (waitingOn) ? waiting.waitingMessageState : null, message)
      .then(data=>{
        const resultUrl = endpointURL||baseURL;
        responseHistoryState.value = {
          ...responseHistoryState.value, 
          [resultUrl]: { data }
        };
        return { status: 'ok', updated: 1, data: data, lastURL: resultUrl } as const;
      }).catch(error=>{
        if (!(error instanceof APIResponseError)) throw error;
        const resultUrl = endpointURL||baseURL;
        responseHistoryState.value = {
          ...responseHistoryState.value, 
          [resultUrl]: { error: {
            message: error.message, 
            json: error.responseJSON
          } }
        };
        return { status: error, updated: 1, errors: 1, lastURL: resultUrl };
      })
   }

  var notif = {
    message: 'Sua coleta terminou com erros.', 
    errors: true
  };
  var collected = 0;
  var errors = 0;
  var failed = 0;
  const requestPath = (reqPathOverride || reqPathOverride==='') ? reqPathOverride : requestPathState.value;
  (((interceptFn) && interceptFn(requestPath, apiRequestHandler, (!selectedRequestState || !selectedRequestState.value) ? { 
    responses: responseHistoryState.value
   } : {
    responses: responseHistoryState.value, 
    selected: selectedRequestState.value
   })) || apiRequestHandler(requestPath))
    .then((result)=>{
      collected = result.updated;
      if (result.status==='ok') {
        selectedRequestState && (selectedRequestState.value = result.lastURL);
        notif = {
          message: result.message || 'Sua coleta terminou com sucesso', 
          errors: false
        };
      } else {
        selectedRequestState && (selectedRequestState.value = result.lastURL || result.status.reqEndpointPath);
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
      waitingOn && (waiting.waitingState.value = false);
      if (notifsOn) {
        notif.message = notif.message.replace(/\.$/, "") + ((collected>0) 
          ? ` (${collected} registro${(collected>1) ? 's' : ''}`
            + ((errors>0) ? `; ${errors} com erros` : '')
            + ((failed>0) ? `; ${failed} ${(failed>1) ? 'falha' : 'falhas'} de instrução` : '')
            + ').' 
          : '.');
        notification.notifMessageState.value = notif;
        notification.notifState.value = true;
      }
    });
}

export const RequestArea = <T,>({ responseHistoryState, requestPathState, 
    selectedRequestState, waiting,  
    notification, requestHandlerState, 
    displayAreaRefState, 
    maxParallelRequests=10, 
    disabledState, 
    children=null
  } : RequestAreaProps<T>) => {

  React.useEffect(()=>{
    fetchingConfig.maxParallelRequests = maxParallelRequests;
    if(requestHandlerState)
      requestHandlerState.value=({ interceptFn, reqPathOverride, scrollToOutput=true }={ scrollToOutput: true })=>{
        orchestrate(
          waiting, notification, responseHistoryState, 
          requestPathState, selectedRequestState, displayAreaRefState, 
          interceptFn, reqPathOverride, scrollToOutput
        )
      }
    }, []);

  return ( (requestPathState.value && !(disabledState && disabledState.value)) 
    ? <Box>
        {children}
      </Box> 
    : null
  )
}