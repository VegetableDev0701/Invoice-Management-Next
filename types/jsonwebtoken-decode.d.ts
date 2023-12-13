declare module 'jsonwebtoken/decode' {
  export function decode(
    token: string,
    options?: { complete?: boolean }
  ): null | { [key: string]: any } | string;
}
