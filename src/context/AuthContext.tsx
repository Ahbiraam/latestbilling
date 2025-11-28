import { createContext, useContext, useState } from "react";

interface LoginTokens {
  access_token: string;
}

interface AuthContextType {
  token: string | null;
  login: (tokens: LoginTokens) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const login = (tokens: LoginTokens) => {
    localStorage.setItem("token", tokens.access_token);
    setToken(tokens.access_token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
