import { AppRoute, ClientArgs } from '@ts-rest/core';
import {
  EnsureQueryDataOptions,
  FetchInfiniteQueryOptions,
  FetchQueryOptions,
  InfiniteData,
  InvalidateOptions,
  InvalidateQueryFilters,
  QueryFilters,
  QueryKey,
  QueryState,
  SetDataOptions,
} from '@tanstack/react-query';
import {
  DataResponse,
  ErrorResponse,
  WithoutQueryKey,
  PartialQueryData,
  RequestData,
} from './common';
import {
  TsRestInfiniteQueryOptions,
  TsRestQueryOptions,
} from './hooks-options';

type Updater<TInput, TOutput> = TOutput | ((input: TInput) => TOutput);

export interface TsRestQueryClientFunctions<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TQueryFnData = DataResponse<TAppRoute>,
  TError = ErrorResponse<TAppRoute>,
> {
  getQueryData(
    queryData?: RequestData<TAppRoute, TClientArgs>,
  ): TQueryFnData | undefined;

  invalidateQueries(
    queryData?: PartialQueryData<RequestData<TAppRoute, TClientArgs>>,
    filters?: Omit<InvalidateQueryFilters, 'queryKey' | 'exact'>,
    options?: InvalidateOptions,
  ): Promise<void>;

  ensureQueryData<TData = TQueryFnData>(
    options: WithoutQueryKey<
      EnsureQueryDataOptions<TQueryFnData, TError, TData>
    > &
      TsRestQueryOptions<TAppRoute, TClientArgs>,
  ): Promise<TData>;

  getQueriesData(
    filters: QueryFilters,
  ): Array<[QueryKey, TQueryFnData | undefined]>;

  setQueryData(
    queryData: RequestData<TAppRoute, TClientArgs> | undefined,
    updater: Updater<TQueryFnData | undefined, TQueryFnData | undefined>,
    options?: SetDataOptions,
  ): TQueryFnData | undefined;

  setQueriesData(
    filters: QueryFilters,
    updater: Updater<TQueryFnData | undefined, TQueryFnData | undefined>,
    options?: SetDataOptions,
  ): Array<[QueryKey, TQueryFnData | undefined]>;

  getQueryState(
    queryData?: RequestData<TAppRoute, TClientArgs>,
  ): QueryState<TQueryFnData, TError> | undefined;

  fetchQuery<TData = TQueryFnData>(
    options: WithoutQueryKey<FetchQueryOptions<TQueryFnData, TError, TData>> &
      TsRestQueryOptions<TAppRoute, TClientArgs>,
  ): Promise<TData>;

  prefetchQuery<TData = TQueryFnData>(
    options: WithoutQueryKey<
      FetchQueryOptions<TQueryFnData, TError, TData, QueryKey>
    > &
      TsRestQueryOptions<TAppRoute, TClientArgs>,
  ): Promise<void>;

  fetchInfiniteQuery<TData = TQueryFnData, TPageParam = unknown>(
    options: WithoutQueryKey<
      FetchInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        QueryKey,
        TPageParam
      >
    > &
      TsRestInfiniteQueryOptions<TAppRoute, TClientArgs, TPageParam>,
  ): Promise<InfiniteData<TData, TPageParam>>;

  prefetchInfiniteQuery<TData = TQueryFnData, TPageParam = unknown>(
    options: WithoutQueryKey<
      FetchInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        QueryKey,
        TPageParam
      >
    > &
      TsRestInfiniteQueryOptions<TAppRoute, TClientArgs, TPageParam>,
  ): Promise<void>;
}
