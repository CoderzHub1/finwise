import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user');
    const storedPassword = localStorage.getItem('password');
    if (storedUser && storedPassword) {
      setUser({ 
        ...JSON.parse(storedUser), 
        password: storedPassword 
      });
    }
    setLoading(false);
  }, []);

  const signup = async (userData) => {
    try {
      const response = await axios.post('http://localhost:5000/add-user', userData);
      if (response.data.msg) {
        return { success: true, message: response.data.msg };
      }
      return { success: false, message: response.data.error };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Signup failed' 
      };
    }
  };

  const signin = async (identifier, password) => {
    try {
      const response = await axios.post('http://localhost:5000/signin', {
        identifier,
        password
      });
      
      if (response.data.user) {
        const userData = { 
          ...response.data.user, 
          password 
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('password', password);
        return { success: true, user: userData };
      }
      return { success: false, message: response.data.error };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Signin failed' 
      };
    }
  };

  const signout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('password');
  };

  const value = {
    user,
    signup,
    signin,
    signout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
