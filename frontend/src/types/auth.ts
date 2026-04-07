export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  token: string | null;
  login: (credential: string) => Promise<void>;
  devLogin: () => Promise<void>;
  logout: () => void;
}

export interface GoogleLoginResponse {
  credential: string;
}
