import {
  adminRefreshTokenResponseSchema,
  type ApiEnvelope
} from "@mbc/api-contracts";

import {
  adminAccessTokenStorageKey,
  adminPermissionsStorageKey,
  adminUserStorageKey,
  clearStoredAdminSession,
  notifyAdminSessionCleared
} from "../auth/auth_storage";
import { appConfig } from "../config/env";
import { ApiRequestError, type StructuredApiErrorBody } from "./api_errors";

export {
  ApiRequestError,
  formatApiErrorMessage,
  isApiRequestError,
  type StructuredApiErrorBody
} from "./api_errors";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

type DataSchema<T> = {
  parse(value: unknown): T;
};

export class ApiClient {
  constructor(private readonly baseUrl = appConfig.apiBaseUrl) {}

  async get<T>(path: string): Promise<ApiEnvelope<T>> {
    return this.request<T>(path);
  }

  async getData<T>(path: string, schema: DataSchema<T>): Promise<T> {
    return this.parseData(await this.get<unknown>(path), schema);
  }

  async getDataEnvelope<T>(
    path: string,
    schema: DataSchema<T>
  ): Promise<ApiEnvelope<T>> {
    return this.parseDataEnvelope(await this.get<unknown>(path), schema);
  }

  async post<T>(
    path: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<ApiEnvelope<T>> {
    return this.request<T>(path, {
      method: "POST",
      body,
      ...(headers ? { headers } : {})
    });
  }

  async postData<T>(
    path: string,
    body: unknown,
    schema: DataSchema<T>,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.parseData(await this.post<unknown>(path, body, headers), schema);
  }

  async patch<T>(
    path: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<ApiEnvelope<T>> {
    return this.request<T>(path, {
      method: "PATCH",
      body,
      ...(headers ? { headers } : {})
    });
  }

  async patchData<T>(
    path: string,
    body: unknown,
    schema: DataSchema<T>,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.parseData(await this.patch<unknown>(path, body, headers), schema);
  }

  async putData<T>(
    path: string,
    body: unknown,
    schema: DataSchema<T>,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.parseData(
      await this.request<unknown>(path, {
        method: "PUT",
        body,
        ...(headers ? { headers } : {})
      }),
      schema
    );
  }

  async delete<T = unknown>(
    path: string,
    headers?: Record<string, string>
  ): Promise<ApiEnvelope<T>> {
    return this.request<T>(path, {
      method: "DELETE",
      ...(headers ? { headers } : {})
    });
  }

  async deleteData<T>(
    path: string,
    schema: DataSchema<T>,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.parseData(await this.delete<unknown>(path, headers), schema);
  }

  async uploadBinary<T>(
    path: string,
    file: File,
    requestHeaders?: Record<string, string>
  ): Promise<ApiEnvelope<T>> {
    const headers = this.buildHeaders(file.type || "application/octet-stream");
    Object.assign(headers, requestHeaders);
    headers["x-file-name"] = encodeURIComponent(file.name || "sermon-audio");
    const response = await this.fetchWithRefresh(
      path,
      {
        method: "POST",
        headers,
        credentials: "include",
        body: file
      },
      headers
    );
    return this.parseEnvelopeResponse<T>(response);
  }

  async uploadBinaryData<T>(
    path: string,
    file: File,
    schema: DataSchema<T>,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.parseData(
      await this.uploadBinary<unknown>(path, file, headers),
      schema
    );
  }

  async getBlob(path: string): Promise<Blob> {
    const headers = this.buildHeaders();
    const response = await this.fetchWithRefresh(
      path,
      {
        method: "GET",
        headers,
        credentials: "include"
      },
      headers
    );
    if (!response.ok) {
      throw await this.errorFromResponse(response);
    }
    return response.blob();
  }

  private async request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<ApiEnvelope<T>> {
    const headers = this.buildHeaders("application/json");
    Object.assign(headers, options.headers);

    const init: RequestInit = {
      method: options.method ?? "GET",
      headers,
      credentials: "include"
    };
    if (options.body !== undefined) {
      init.body = JSON.stringify(options.body);
    }

    const response = await this.fetchWithRefresh(path, init, headers);
    return this.parseEnvelopeResponse<T>(response);
  }

  private parseData<T>(
    envelope: ApiEnvelope<unknown>,
    schema: DataSchema<T>
  ): T {
    return this.parseDataEnvelope(envelope, schema).data;
  }

  private parseDataEnvelope<T>(
    envelope: ApiEnvelope<unknown>,
    schema: DataSchema<T>
  ): ApiEnvelope<T> {
    return {
      ...envelope,
      data: schema.parse(envelope.data)
    };
  }

  private buildHeaders(contentType?: string): Record<string, string> {
    const headers: Record<string, string> = {
      accept: "application/json",
      "x-client-platform": "admin"
    };
    if (contentType) {
      headers["content-type"] = contentType;
    }
    const accessToken = localStorage.getItem(adminAccessTokenStorageKey);
    if (accessToken) {
      headers.authorization = `Bearer ${accessToken}`;
    }
    return headers;
  }

  private async fetchWithRefresh(
    path: string,
    init: RequestInit,
    headers: Record<string, string>
  ) {
    let response = await fetch(`${this.baseUrl}${path}`, init);
    if (
      response.status === 401 &&
      path !== "/admin/auth/login" &&
      path !== "/admin/auth/refresh"
    ) {
      const refreshed = await this.tryRefreshSession();
      if (refreshed) {
        headers.authorization = `Bearer ${refreshed}`;
        response = await fetch(`${this.baseUrl}${path}`, init);
      }
    }
    return response;
  }

  private async parseEnvelopeResponse<T>(
    response: Response
  ): Promise<ApiEnvelope<T>> {
    const json = (await response.json()) as ApiEnvelope<T> | {
      error?: StructuredApiErrorBody;
      requestId?: string;
    };

    if (!response.ok) {
      const message =
        "error" in json && json.error?.message
          ? json.error.message
          : "Request failed.";
      throw new ApiRequestError(
        message,
        response.status,
        "requestId" in json ? json.requestId : undefined,
        "error" in json ? json.error ?? {} : {}
      );
    }

    return json as ApiEnvelope<T>;
  }

  private async errorFromResponse(response: Response): Promise<Error> {
    try {
      const json = (await response.json()) as {
        error?: StructuredApiErrorBody;
        requestId?: string;
      };
      return new ApiRequestError(
        json.error?.message ?? "Request failed.",
        response.status,
        json.requestId,
        json.error ?? {}
      );
    } catch {
      return new ApiRequestError("Request failed.", response.status);
    }
  }

  private async tryRefreshSession(): Promise<string | null> {
    const response = await fetch(`${this.baseUrl}/admin/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-client-platform": "admin"
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      clearStoredAdminSession();
      notifyAdminSessionCleared();
      return null;
    }

    const json = (await response.json()) as ApiEnvelope<unknown>;
    const session = adminRefreshTokenResponseSchema.parse(json.data);
    localStorage.setItem(adminAccessTokenStorageKey, session.accessToken);
    localStorage.setItem(adminUserStorageKey, JSON.stringify(session.user));
    localStorage.setItem(
      adminPermissionsStorageKey,
      JSON.stringify(session.permissions)
    );
    return session.accessToken;
  }
}

export const apiClient = new ApiClient();
