export interface JwtUser {
  name: string;
  email: string;
  picture: string;
}

export interface TokenPayload {
  aud: string[];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  client_id: string;
  exp: number;
  iat: number;
  iss: string;
  jti: string;
  nbf: number;
  scp: string[];
  sub: string;

  ext: {
    user: JwtUser;
  };
}
