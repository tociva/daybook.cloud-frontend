export interface AppUser {
    sub: string;
    email: string;
    name: string;
    picture: string;
}

export interface Tokens {
    accessToken: string;
    idToken: string;
    refreshToken: string;
}

export interface AuthState {
    user: AppUser | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    tokens: Tokens | null;
  }
  