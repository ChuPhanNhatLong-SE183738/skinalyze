/* eslint-disable @typescript-eslint/no-explicit-any */
class ApiError extends Error {
  status: number;
  response: any;

  constructor(message: string, status: number, response: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.response = response;
  }
}

/**
 * Hàm request cơ sở
 * Tự động đính kèm 'credentials: "include"' để gửi cookie (như httpOnly access_token)
 */
async function baseRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const defaultHeaders = new Headers(options.headers as HeadersInit);
  if (!defaultHeaders.has("Content-Type")) {
    defaultHeaders.set("Content-Type", "application/json");
  }

  const defaultOptions: RequestInit = {
    ...options,
    credentials: "include",
    headers: defaultHeaders,
  };

  // Always call the internal Next.js API routes
  const response = await fetch(endpoint, defaultOptions);

  let data;
  try {
    data = await response.json();
  } catch (error) {
    data = { error: "An unexpected error occurred" };
  }

  if (!response.ok) {
    throw new ApiError(
      data.error || "API request failed",
      response.status,
      data
    );
  }

  return data as T;
}

export const http = {
  get: <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    return baseRequest<T>(endpoint, { ...options, method: "GET" });
  },

  post: <T>(
    endpoint: string,
    body: any,
    options: RequestInit = {}
  ): Promise<T> => {
    return baseRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  put: <T>(
    endpoint: string,
    body: any,
    options: RequestInit = {}
  ): Promise<T> => {
    return baseRequest<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  patch: <T>(
    endpoint: string,
    body: any,
    options: RequestInit = {}
  ): Promise<T> => {
    return baseRequest<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  delete: <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    return baseRequest<T>(endpoint, { ...options, method: "DELETE" });
  },
};

export { ApiError };
