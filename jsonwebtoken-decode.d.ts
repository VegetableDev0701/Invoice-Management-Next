declare module 'jsonwebtoken/decode' {
  type JsonWebTokenDecode = (token: string, options?: object) => object | null;

  const jwtDecode: JsonWebTokenDecode;

  export default jwtDecode;
}
