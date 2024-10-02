import { Box, Paper, Typography } from '@mui/material';

import { JsonView, collapseAllNested } from 'react-json-view-lite';

import React from 'react';
import { Signal } from '@preact/signals-react';

import { useDynamicCSS } from '@bcirealm087/use-dynamic-css';

export const ResponseDisplay = ({ data = null, 
    waitingInfo, 
    requestErrorInfo = null, 
    displayAreaRefState, 
    DisplaySuspenseComponent, 
    cssURL = '../css/ResponseArea/index.0.css'
  } : { data?: object|null, 
    waitingInfo: { waitingForResponse: true, waitingMessage: string } | { waitingForResponse: false }, 
    requestErrorInfo?: { message: string, json: object|null }|null, 
    displayAreaRefState?: Signal<HTMLDivElement|null>, 
    DisplaySuspenseComponent: React.ComponentType
    cssURL?: string
  }) => 
{
  const displayAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(()=>{
    if(displayAreaRefState && displayAreaRef.current)
      displayAreaRefState.value = displayAreaRef.current;
  }, []);

  const cssLoaded = useDynamicCSS(cssURL);

  return (
    <Box
      ref={displayAreaRef}
    >
      { (!waitingInfo.waitingForResponse)  
        ? ( (!requestErrorInfo) 
          ? ( (data) 
            ? <Box>
                <Typography variant='h6' sx={{marginBottom: '0.25em'}}>
                  Dados coletados
                </Typography>
                <Paper elevation={3} >
                  { (cssLoaded) 
                    ? <JsonView data={data} shouldExpandNode={collapseAllNested}/>
                    : <Box p={ '1.5em' }>
                        <DisplaySuspenseComponent /> 
                      </Box> 
                  }
                </Paper>
              </Box> 
            : null
            )  
          : <Box>
              <Typography variant='h6' color={'red'}>
                { requestErrorInfo.message }
              </Typography>
              { (requestErrorInfo.json)  
                ? ( (cssLoaded)
                    ? <JsonView data={requestErrorInfo.json} />
                    : <Box marginLeft={ '0.5em' }>
                        <DisplaySuspenseComponent /> 
                      </Box> 
                  )
                : null
              }
            </Box>
          )  
        : <Typography variant='body1'>
            {waitingInfo.waitingMessage}
          </Typography>
      }
    </Box>
  );
}