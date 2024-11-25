import { Box, Paper, Typography } from '@mui/material';

import { JsonView, Props as JsonViewProps, collapseAllNested } from 'react-json-view-lite';

import React from 'react';

import styled from '@emotion/styled';
import { css } from '@emotion/react';
import jsonViewCSS from 'react-json-view-lite/dist/index.css'; //import the css rules as a string

import { Filter } from '@controllers';
import { RequestsControllerType } from '@controllers/RequestsController';
import { RequestsControllerContext } from '@providers';

type Controller = Filter.All<RequestsControllerType<any>, 'scrollToRef' | 'waiting', 'responseJsonExpandNode'>;

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
    title, 
    requestErrorInfo = null
  } : { data?: object|null, title: string, 
    requestErrorInfo?: { message: string, json: object|null }|null
  }) => 
{
  const controller: Controller = React.useContext(RequestsControllerContext);
  const displayAreaRef = React.useRef<HTMLDivElement>(null);
  const scrollToRefState = controller.state.scrollToRef;

  React.useEffect(()=>{
    if(scrollToRefState.enabled && displayAreaRef.current)
      scrollToRefState.value = displayAreaRef.current;
  }, []);

  return (
    <Box
      ref={displayAreaRef}
    >
      { (!controller.state.waiting.active)  
        ? ( (!requestErrorInfo) 
          ? ( (data) 
            ? <Box>
                <Typography variant='h6' sx={{ marginBottom: '0.25em' }}>
                  { title }
                </Typography>
                <Paper elevation={3} >
                    <JsonViewStyled data={ data } shouldExpandNode={ controller.responseJsonExpandNode || collapseAllNested }/>
                </Paper>
              </Box> 
            : null
            )  
          : <Box>
              <Typography variant='h6' color={'red'}>
                { requestErrorInfo.message }
              </Typography>
              { (requestErrorInfo.json)  
                  ? <JsonView data={ requestErrorInfo.json } />
                  : null
              }
            </Box>
          )  
        : null
      }
    </Box>
  );
}