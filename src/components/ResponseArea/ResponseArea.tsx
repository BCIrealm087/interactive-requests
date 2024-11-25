import { Typography } from '@mui/material';

import { ResponseDisplay } from './ResponseDisplay';

import React from "react";
import { Signal } from "@preact/signals-react";

import { Filter } from '@controllers';
import { RequestsControllerType } from '@controllers/RequestsController';
import { RequestsControllerContext } from '@providers';

type Controller = Filter.All<
  RequestsControllerType<any>,  
  'responseHistory' |
  'selectedRequest' |
  'waiting' |
  'scrollToRef'
>

const CurrentStatusDisplay = ({ waiting }: { waiting: Controller['state']['waiting'] }) => {
  return ( (waiting.active) 
    ? <Typography variant='body1'>
        { waiting.value }
      </Typography>
    : null
  )
}

export const ResponseArea = ({ title, disabledState } : 
  { title: string, disabledState?: Signal<any> } ) => 
{
  const controller: Controller = React.useContext(RequestsControllerContext);
  const { responseHistory, selectedRequest, waiting } = controller.state;

  if (disabledState && disabledState.value)
    return null;

  const selectedKey = selectedRequest.value;
  if (!selectedKey)
    return <CurrentStatusDisplay waiting={ waiting } />;

  const selectedRequestInfo = responseHistory.value[selectedKey];

  const [error, data] = (selectedRequestInfo) 
    ? ( (selectedRequestInfo.error) 
        ? [selectedRequestInfo.error, null] as const
        : [null, selectedRequestInfo.data || null] as const
      )
    : [null, null] as const;
  return ( 
    <React.Fragment>
      { (error) 
        ? <ResponseDisplay
            key={ selectedKey }
            title={ title }
            requestErrorInfo={ error }
          />  
        : <ResponseDisplay
            key={ selectedKey }
            title={ title }
            data={ data }
          /> 
      }
      <CurrentStatusDisplay waiting={ waiting } />
    </React.Fragment>
  );
}