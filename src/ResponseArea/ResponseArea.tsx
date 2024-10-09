import { ResponseDisplay } from './ResponseDisplay';

import React from "react";
import { Signal } from "@preact/signals-react";

import { ResponseHistory } from "./types-ResponseArea";

export const ResponseArea = ({ responseHistoryState, selectedRequestState, 
    waitingState, waitingMessageState, 
    displayAreaRefState, 
    disabledState
  } : 
  { responseHistoryState: Signal<ResponseHistory<any>>, selectedRequestState: Signal<string>,
    waitingState: Signal<boolean>, waitingMessageState: Signal<string>, 
    displayAreaRefState: Signal<HTMLDivElement|null>, disabledState?: Signal<any>
  }) => {

  const selectedRequestInfo = responseHistoryState.value[selectedRequestState.value];

  if (disabledState && disabledState.value)
    return null;
  
  const waitingInfo = (!waitingState.value) ? {
    waitingForResponse: false, 
  } as const : {
    waitingForResponse: true, 
    waitingMessage: waitingMessageState.value
  } as const;

  const [error, data] = (selectedRequestInfo) 
    ? ( (selectedRequestInfo.error) 
          ? [selectedRequestInfo.error, null] as const
          : [null, selectedRequestInfo.data || null] as const
      )
    : [null, null] as const;
  return ( (error) 
    ? <ResponseDisplay
        waitingInfo = { waitingInfo }
        requestErrorInfo={ error }
        displayAreaRefState={ displayAreaRefState }
      />  
    : <ResponseDisplay
        data={ data }
        waitingInfo = { waitingInfo }
        displayAreaRefState={ displayAreaRefState }
      /> 
  );
}