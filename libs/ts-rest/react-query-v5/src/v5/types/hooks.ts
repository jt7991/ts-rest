import {
  AppRoute,
  AppRouteFunction,
  ClientArgs,
  IfAllPropertiesOptional,
} from '@ts-rest/core';
import {
  FetchInfiniteQueryOptions,
  FetchQueryOptions,
  InfiniteData,
  QueryKey,
  QueryClient,
} from '@tanstack/react-query';
import {
  QueryOptionsResult,
  TsRestInfiniteQueryOptions,
  TsRestQueryOptions,
  TsRestSuspenseQueryOptions,
  UseInfiniteQueryOptions,
  UseInfiniteQueryOptionsWithInitialData,
  UseInfiniteQueryOptionsWithoutInitialData,
  UseMutationOptions,
  UseQueriesOptions,
  UseQueryOptions,
  UseQueryOptionsWithInitialData,
  UseQueryOptionsWithoutInitialData,
  UseSuspenseInfiniteQueryOptions,
  UseSuspenseQueriesOptions,
  UseSuspenseQueryOptions,
} from './hooks-options';
import {
  DataResponse,
  ErrorResponse,
  WithoutQueryKey,
  RequestData,
} from './common';
import {
  DefinedUseInfiniteQueryResult,
  DefinedUseQueryResult,
  UseInfiniteQueryResult,
  UseMutationResult,
  UseQueriesResult,
  UseQueryResult,
  UseSuspenseInfiniteQueryResult,
  UseSuspenseQueriesResult,
  UseSuspenseQueryResult,
} from './hooks-results';

export interface QueryHooks<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TQueryFnData = DataResponse<TAppRoute>,
  TError = ErrorResponse<TAppRoute>,
> {
  query: AppRouteFunction<TAppRoute, TClientArgs>;

  getQueryKey(
    queryData?: RequestData<TAppRoute, TClientArgs>,
    type?: 'infinite',
  ): QueryKey;

  queryOptions<TData = TQueryFnData>(
    options: UseQueryOptionsWithInitialData<TAppRoute, TClientArgs, TData> &
      TsRestSuspenseQueryOptions<TAppRoute, TClientArgs>,
  ): QueryOptionsResult<
    TAppRoute,
    UseQueryOptionsWithInitialData<TAppRoute, TClientArgs, TData>,
    never
  >;

  queryOptions<TData = TQueryFnData>(
    options: UseQueryOptions<TAppRoute, TClientArgs, TData> &
      TsRestSuspenseQueryOptions<TAppRoute, TClientArgs>,
  ): QueryOptionsResult<
    TAppRoute,
    UseQueryOptions<TAppRoute, TClientArgs, TData>,
    never
  >;

  queryOptions<TData = TQueryFnData>(
    options: UseQueryOptions<TAppRoute, TClientArgs, TData>,
  ): QueryOptionsResult<
    TAppRoute,
    UseQueryOptions<TAppRoute, TClientArgs, TData>
  >;

  useQuery(
    ...args: IfAllPropertiesOptional<
      RequestData<TAppRoute, TClientArgs>,
      [options?: undefined, queryClient?: QueryClient],
      [options: never]
    >
  ): UseQueryResult<TAppRoute, TQueryFnData, TError>;

  useQuery<TData = TQueryFnData>(
    options: UseQueryOptionsWithInitialData<TAppRoute, TClientArgs, TData>,
    queryClient?: QueryClient,
  ): DefinedUseQueryResult<TAppRoute, TData, TError>;

  useQuery<TData = TQueryFnData>(
    options: UseQueryOptionsWithoutInitialData<TAppRoute, TClientArgs, TData>,
    queryClient?: QueryClient,
  ): UseQueryResult<TAppRoute, TData, TError>;

  useQuery<TData = TQueryFnData>(
    options: UseQueryOptions<TAppRoute, TClientArgs, TData>,
    queryClient?: QueryClient,
  ): UseQueryResult<TAppRoute, TData, TError>;

  useSuspenseQuery<TData = TQueryFnData>(
    options: UseSuspenseQueryOptions<TAppRoute, TClientArgs, TData>,
    queryClient?: QueryClient,
  ): UseSuspenseQueryResult<TAppRoute, TData, TError>;

  useQueries<
    T extends Array<any>,
    TCombinedResult = UseQueriesResult<TAppRoute, T>,
  >(
    options: UseQueriesOptions<TAppRoute, TClientArgs, T, TCombinedResult>,
    queryClient?: QueryClient,
  ): TCombinedResult;

  useSuspenseQueries<
    T extends Array<any>,
    TCombinedResult = UseSuspenseQueriesResult<TAppRoute, T>,
  >(
    options: UseSuspenseQueriesOptions<
      TAppRoute,
      TClientArgs,
      T,
      TCombinedResult
    >,
    queryClient?: QueryClient,
  ): TCombinedResult;

  useInfiniteQuery<TData = InfiniteData<TQueryFnData>, TPageParam = unknown>(
    options: UseInfiniteQueryOptionsWithInitialData<
      TAppRoute,
      TClientArgs,
      TData,
      TPageParam
    >,
    queryClient?: QueryClient,
  ): DefinedUseInfiniteQueryResult<TAppRoute, TData, TError>;

  useInfiniteQuery<TData = InfiniteData<TQueryFnData>, TPageParam = unknown>(
    options: UseInfiniteQueryOptionsWithoutInitialData<
      TAppRoute,
      TClientArgs,
      TData,
      TPageParam
    >,
    queryClient?: QueryClient,
  ): UseInfiniteQueryResult<TAppRoute, TData, TError>;

  useInfiniteQuery<TData = InfiniteData<TQueryFnData>, TPageParam = unknown>(
    options: UseInfiniteQueryOptions<TAppRoute, TClientArgs, TData, TPageParam>,
    queryClient?: QueryClient,
  ): UseInfiniteQueryResult<TAppRoute, TData, TError>;

  useSuspenseInfiniteQuery<
    TData = InfiniteData<TQueryFnData>,
    TPageParam = unknown,
  >(
    options: UseSuspenseInfiniteQueryOptions<
      TAppRoute,
      TClientArgs,
      TData,
      TPageParam
    >,
    queryClient?: QueryClient,
  ): UseSuspenseInfiniteQueryResult<TAppRoute, TData, TError>;

  usePrefetchQuery<TData = TQueryFnData>(
    options: WithoutQueryKey<FetchQueryOptions<TQueryFnData, TError, TData>> &
      TsRestQueryOptions<TAppRoute, TClientArgs>,
  ): void;

  usePrefetchInfiniteQuery<TData = TQueryFnData, TPageParam = unknown>(
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
  ): void;
}

export interface MutationHooks<
  TAppRoute extends AppRoute,
  TClientArgs extends ClientArgs,
  TData = DataResponse<TAppRoute>,
  TError = ErrorResponse<TAppRoute>,
  TVariables = RequestData<TAppRoute, TClientArgs>,
> {
  mutate: AppRouteFunction<TAppRoute, TClientArgs>;

  useMutation<TContext = unknown>(
    options?: UseMutationOptions<TAppRoute, TClientArgs, TContext>,
    queryClient?: QueryClient,
  ): UseMutationResult<
    TAppRoute,
    TClientArgs,
    TData,
    TError,
    TVariables,
    TContext
  >;
}
