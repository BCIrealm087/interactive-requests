import React from "react";

import { RequestsController, RequestsControllerType } from "@controllers/RequestsController";

export const RequestsControllerContext = React.createContext(RequestsController<any>());

export const RequestsControllerProvider = <T extends RequestsControllerType<any>,>({requestsController, children} : 
  { requestsController: T } & React.PropsWithChildren) => 
{
  return (
    <RequestsControllerContext.Provider value={requestsController}>
      {...React.Children.toArray(children)}
    </RequestsControllerContext.Provider>
  );
}