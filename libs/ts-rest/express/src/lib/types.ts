import {
  AppRoute,
  AppRouteDeleteNoBody,
  AppRouteMutation,
  AppRouteQuery,
  AppRouter,
  FlattenAppRouter,
  ServerInferRequest,
  ServerInferResponseBody,
  ServerInferResponses,
} from '@ts-rest/core';
import { Express, NextFunction, Response, Request } from 'express';
import { RequestValidationError } from './request-validation-error';

export type AppRouteQueryImplementation<
  T extends AppRouteQuery | AppRouteDeleteNoBody,
  TLocals extends Record<string, any> = Record<string, any>,
> = (
  input: ServerInferRequest<T, Express['request']['headers']> & {
    req: TsRestRequest<T>;
    res: Response<any, TLocals>;
  },
) => Promise<ServerInferResponses<T>>;

export type AppRouteMutationImplementation<
  T extends AppRouteMutation,
  TLocals extends Record<string, any> = Record<string, any>,
> = (
  input: ServerInferRequest<T, Express['request']['headers']> & {
    files: unknown;
    file: unknown;
    req: TsRestRequest<T>;
    res: Response<any, TLocals>;
  },
) => Promise<ServerInferResponses<T>>;

export type AppRouteImplementation<
  T extends AppRoute,
  TLocals extends Record<string, any> = Record<string, any>,
> = T extends AppRouteMutation
  ? AppRouteMutationImplementation<T, TLocals>
  : T extends AppRouteQuery | AppRouteDeleteNoBody
  ? AppRouteQueryImplementation<T, TLocals>
  : never;

export type TsRestRequest<
  T extends AppRouter | AppRoute,
  F extends FlattenAppRouter<T> = FlattenAppRouter<T>,
  S extends ServerInferRequest<F> = ServerInferRequest<F>,
> = Request<
  'params' extends keyof S ? S['params'] : Express['request']['params'],
  ServerInferResponseBody<F>,
  'body' extends keyof S ? S['body'] : Express['request']['body'],
  'query' extends keyof S ? S['query'] : Express['request']['query']
> & {
  tsRestRoute: F;
  headers: 'headers' extends keyof S
    ? S['headers']
    : Express['request']['headers'];
};

export type TsRestRequestHandler<T extends AppRouter | AppRoute> = (
  req: TsRestRequest<T>,
  res: Response,
  next: NextFunction,
) => void;

// Express middleware can supply more specific locals than the router can see.
// The second signature keeps the other handler inputs checked contravariantly.
type AllowNarrowerResponse<THandler> = THandler extends (
  input: infer TInput,
) => infer TOutput
  ? { handler(input: TInput): TOutput }['handler'] &
      ((input: Omit<TInput, 'res'> & { res: never }) => TOutput)
  : never;

type RegisteredRouteHandler<TRoute extends AppRoute> = AllowNarrowerResponse<
  AppRouteImplementation<TRoute>
>;

export interface AppRouteOptions<TRoute extends AppRoute> {
  middleware?: TsRestRequestHandler<TRoute>[];
  handler: RegisteredRouteHandler<TRoute>;
}

export type AppRouteImplementationOrOptions<TRoute extends AppRoute> =
  | AppRouteOptions<TRoute>
  | RegisteredRouteHandler<TRoute>;

export const isAppRouteImplementation = <TRoute extends AppRoute>(
  obj: AppRouteImplementationOrOptions<TRoute>,
): obj is RegisteredRouteHandler<TRoute> => {
  return typeof obj === 'function';
};

export type RouterImplementation<T extends AppRouter> = {
  [TKey in keyof T]: T[TKey] extends AppRouter
    ? RouterImplementation<T[TKey]>
    : T[TKey] extends AppRoute
    ? AppRouteImplementationOrOptions<T[TKey]>
    : never;
};

export type TsRestExpressOptions<T extends AppRouter> = {
  logInitialization?: boolean;
  jsonQuery?: boolean;
  responseValidation?: boolean;
  globalMiddleware?: TsRestRequestHandler<FlattenAppRouter<T>>[];
  requestValidationErrorHandler?:
    | 'default'
    | 'combined'
    | ((
        err: RequestValidationError,
        req: TsRestRequest<FlattenAppRouter<T>>,
        res: Response,
        next: NextFunction,
      ) => void);
};
