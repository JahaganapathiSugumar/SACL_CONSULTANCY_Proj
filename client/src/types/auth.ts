export interface LoginCredentials {
  username: string;
  password: string;
  role?: string;
  department_id?: string;
}

export interface AuthContextType {
  user: any | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<any>;
  logout: () => void;
  updateUser: (user: any) => void;
  isAuthenticated: boolean;
  loading: boolean;
}