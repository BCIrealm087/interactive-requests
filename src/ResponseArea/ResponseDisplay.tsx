import { Box, Paper, Typography } from '@mui/material';

import { JsonView, Props as JsonViewProps, collapseAllNested } from 'react-json-view-lite';

import React from 'react';
import { Signal } from '@preact/signals-react';

import styled, { css } from 'styled-components';
import jsonViewCSS from 'react-json-view-lite/dist/index.css'; //import the css rules as a string


const JsonViewStyled = styled(
  (props : JsonViewProps & { className?: string }) => {
    const { className, ...otherProps} = props;
    return (
      <div className={ props.className } >
        <JsonView { ...otherProps } />
      </div>
    );
  }
)`
  ${css`${jsonViewCSS}`} 
`;

export const ResponseDisplay = ({ data = null, 
    waitingInfo, 
    requestErrorInfo = null, 
    displayAreaRefState
  } : { data?: object|null, 
    waitingInfo: { waitingForResponse: true, waitingMessage: string } | { waitingForResponse: false }, 
    requestErrorInfo?: { message: string, json: object|null }|null, 
    displayAreaRefState?: Signal<HTMLDivElement|null>
  }) => 
{
  const displayAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(()=>{
    if(displayAreaRefState && displayAreaRef.current)
      displayAreaRefState.value = displayAreaRef.current;
  }, []);

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
                    <JsonViewStyled data={data} shouldExpandNode={collapseAllNested}/>
                </Paper>
              </Box> 
            : null
            )  
          : <Box>
              <Typography variant='h6' color={'red'}>
                { requestErrorInfo.message }
              </Typography>
              { (requestErrorInfo.json)  
                  ? <JsonView data={requestErrorInfo.json} />
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