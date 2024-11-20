export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
}

export interface AuthConfig {
  jwt: {
    secret: string;
    expiresIn: string | number;
  };
  providers: {
    kakao: OAuthProviderConfig;
    naver: OAuthProviderConfig;
    apple: OAuthProviderConfig;
  };
}
