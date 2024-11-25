import { Box, ClickAwayListener, Link, Popper } from "@mui/material";

import React from "react";

import { scrollIntoView } from "../utils";

import { Filter } from '@controllers';
import { RequestsControllerType } from '@controllers/RequestsController';
import { RequestsControllerContext } from '@providers';

type Controller = Filter.All<
  RequestsControllerType<any>, 
  'notification' | 'scrollToRef'
>

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

export const ResponseNotification = ({ 
    defaultNotification='You have received a notification regarding your collection process.' 
  } : { defaultNotification: string }) => 
{
  const controller: Controller = React.useContext(RequestsControllerContext);
  const scrollToRef = controller.state.scrollToRef.value;
  const notificationState = controller.state.notification;
  const notification = notificationState.value;

  return (
    <ClickAwayListener onClickAway={()=>notificationState.active=false}>
      <Popper
        sx={{zIndex: 1299}}
        open={!!notification}
        anchorEl={{
          getBoundingClientRect: getBoundingClientRect
        }}
      >
        <Box 
          sx = {{ 
            color: (notification?.errors) ? 'red' : 'inherit', border: 1, 
            p: '3em', bgcolor: 'background.paper', transform: `translate(0, -3em)` 
          }}
        >
          <Link
            component="button"
            variant="body2"
            onClick={()=>{
              scrollToRef && scrollIntoView(scrollToRef);
              notificationState.active=false;
            }}
          >
            { notification?.message || defaultNotification }
          </Link>
        </Box>
      </Popper>
    </ClickAwayListener>
  );
}