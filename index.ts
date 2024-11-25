import { ResponseNotification } from "./src/components/ResponseNotification";
import { ResponseArea } from "./src/components/ResponseArea";

import { OptionalSignal } from "@controllers";
import type { ControllerBase, Filter, OptionalGetter, OptionalSetter } from "@controllers";

import { RequestsController, APIRequestError, APIResponseError } from "@controllers/RequestsController";
import type { 
  RequestsControllerType, ResponseHistory, FetchClient, 
  FetchClientWithData, APIInterceptFn, RequestStateHandler
} from "@controllers/RequestsController";

import { RequestsControllerContext as RCC, RequestsControllerProvider as RCP } from "@providers";

export namespace Providers {
  export const RequestsControllerContext = RCC;
  export const RequestsControllerProvider = RCP;
}

export { 
  RequestsController, ResponseArea, ResponseNotification, APIRequestError, APIResponseError, OptionalSignal
}
export type { 
  ControllerBase, Filter, 
  OptionalGetter, OptionalSetter, FetchClient, 
  FetchClientWithData, APIInterceptFn, RequestStateHandler, 
  ResponseHistory, RequestsControllerType
}