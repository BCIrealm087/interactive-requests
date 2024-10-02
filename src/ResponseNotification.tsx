import { Box, ClickAwayListener, Link, Popper } from "@mui/material";

import React from "react";
import { Signal } from "@preact/signals-react";

import { scrollIntoView } from "./utils-interactive-requests";

function getBoundingClientRect() {
  const x = window.innerWidth / 2;
  const y = window.innerHeight / 2;

  const rect = {
    width: 0,
    height: 0,
    top: y,
    right: x,
    bottom: y,
    left: x, 
    x: x, 
    y: y, 
  };

  return {
    ...rect, 
    toJSON: ()=>JSON.stringify(rect)
  }
}

export const ResponseNotification = ({ openState, messageState, 
    displayAreaRefState
  } : 
  { openState: Signal<boolean>, messageState: Signal<{message: string, errors: boolean}>, 
    displayAreaRefState: Signal<HTMLDivElement|null>
  }) => {

  return ( (openState.value) ?
    <ClickAwayListener onClickAway={()=>openState.value=false}>
      <Popper
        sx={{zIndex: 1299}}
        open={openState.value}
        anchorEl={{
          getBoundingClientRect: getBoundingClientRect
        }}
      >
        <Box 
          sx = {{ 
            color: (messageState.value.errors) ? 'red' : 'inherit', border: 1, 
            p: '3em', bgcolor: 'background.paper', transform: `translate(0, -3em)` 
          }}
        >
          <Link
            component="button"
            variant="body2"
            onClick={()=>{
              scrollIntoView(displayAreaRefState.value);
              openState.value = false;
            }}
          >
            {messageState.value.message}
          </Link>
        </Box>
      </Popper>
    </ClickAwayListener> : null
  );
}