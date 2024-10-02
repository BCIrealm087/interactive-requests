import { ResponseDisplay } from './ResponseDisplay';

import React from "react";
import { Signal } from "@preact/signals-react";

import { ResponseHistory } from "./types-ResponseArea";

import 'react-json-view-lite/dist/index.css';

export const ResponseArea = ({ responseHistoryState, selectedRequestState, 
    waitingState, waitingMessageState, 
    displayAreaRefState, 
    DisplaySuspenseComponent, 
    disabledState, 
    cssURL = './css/ResponseArea/ResponseArea.css'
  } : 
  { responseHistoryState: Signal<ResponseHistory<any>>, selectedRequestState: Signal<string>,
    waitingState: Signal<boolean>, waitingMessageState: Signal<string>, 
    displayAreaRefState: Signal<HTMLDivElement|null>, DisplaySuspenseComponent: React.ComponentType
    disabledState?: Signal<any>, cssURL?: string
  }) => {

  const selectedRequestInfo = responseHistoryState.value[selectedRequestState.value];

  if (!selectedRequestInfo || (disabledState && disabledState.value))
    return null;
  
  const waitingInfo = (!waitingState.value) ? {
    waitingForResponse: false, 
  } as const : {
    waitingForResponse: true, 
    waitingMessage: waitingMessageState.value
  } as const;

  return ( (selectedRequestInfo.error) 
    ? <ResponseDisplay
        waitingInfo = { waitingInfo }
        requestErrorInfo={ selectedRequestInfo.error }
        displayAreaRefState={ displayAreaRefState } 
        DisplaySuspenseComponent={ DisplaySuspenseComponent }
        cssURL={ cssURL }
      />  
    : <ResponseDisplay
        data={ (selectedRequestInfo.data) || null }
        waitingInfo = { waitingInfo }
        displayAreaRefState={ displayAreaRefState }
        DisplaySuspenseComponent={ DisplaySuspenseComponent }
        cssURL={ cssURL }
      /> 
  );
}