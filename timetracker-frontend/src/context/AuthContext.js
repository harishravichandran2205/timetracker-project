import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const login = (data) => {
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('username', data.username);
    localStorage.setItem('roles', JSON.stringify(data.roles));
    setToken(data.accessToken); // This triggers the re-render!
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);