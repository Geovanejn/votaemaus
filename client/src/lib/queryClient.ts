import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw new Error(json.message || text || res.statusText);
    } catch (e) {
      throw new Error(text || res.statusText);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let url = "";
    const stringParts: string[] = [];
    let queryParams: Record<string, any> | null = null;
    
    for (const part of queryKey) {
      if (typeof part === "string") {
        stringParts.push(part);
      } else if (typeof part === "object" && part !== null) {
        queryParams = part as Record<string, any>;
      }
    }
    
    url = stringParts.join("/");
    
    if (queryParams) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== null && value !== undefined) {
          searchParams.append(key, String(value));
        }
      }
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
    }

    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
