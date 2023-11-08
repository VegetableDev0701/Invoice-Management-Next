export interface RequestConfig {
  url: string;
  method?: string;
  headers?: Headers;
  body?: string | object;
}

export interface Headers {
  [key: string]: string;
}
