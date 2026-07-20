"use client";

import { useCallback, useEffect, useState } from "react";

interface UsePaginatedResourceOptions {
  endpoint: string;
  params?: Record<string, string | undefined>;
  pageSize?: number;
}

/** Fetches a paginated list from one of the API routes, refetching whenever filters change. */
export function usePaginatedResource<T>({ endpoint, params = {}, pageSize = 10 }: UsePaginatedResourceOptions) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<T[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const paramsKey = JSON.stringify(params);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setPage(1);
     
  }, [paramsKey]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const search = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    for (const [key, value] of Object.entries(JSON.parse(paramsKey) as Record<string, string | undefined>)) {
      if (value) search.set(key, value);
    }

    fetch(`${endpoint}?${search.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (!active) return;
        setData(json.data ?? []);
        setCount(json.count ?? 0);
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
     
  }, [endpoint, paramsKey, page, pageSize, refreshKey]);

  return { data, count, page, setPage, loading, pageSize, refetch };
}
