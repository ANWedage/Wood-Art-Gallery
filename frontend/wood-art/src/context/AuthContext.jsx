import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        // Fetch full user profile after login
        const profileRes = await fetch(`/api/user/profile?email=${encodeURIComponent(data.user.email)}`);
        const profileData = await profileRes.json();
        if (profileData.success) {
          setUser({ ...profileData.user });
          return { success: true, role: data.user.role };
        } else {
          setUser({ email: data.user.email, role: data.user.role });
          return { success: true, role: data.user.role };
        }
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const register = async (email, password, role, name, address, phone) => {
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, name, address, phone })
      });
      const data = await res.json();
      if (data.success) {
        return { 
          success: true, 
          message: data.message || 'Registration successful! Please check your email for login credentials.'
        };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Direct login function for role-based access with predefined credentials
  const directLogin = (email, password) => {
    console.log('Direct login attempt:', email, password);
    
    const predefinedUsers = {
      'financial@gmail.com': { password: 'Financial@123', role: 'financial', name: 'Financial Manager' },
      'inventory@gmail.com': { password: 'Inventory@123', role: 'inventory', name: 'Inventory Manager' },
      'delivery@gmail.com': { password: 'Delivery@123', role: 'delivery', name: 'Delivery Partner' },
      'staff@gmail.com': { password: 'Staff@123', role: 'staffdesigner', name: 'Staff Designer' },
      'admin@gmail.com': { password: 'Admin@123', role: 'admin', name: 'Admin User' }
    };
    
    const userCredentials = predefinedUsers[email];
    console.log('Found credentials:', userCredentials);
    
    if (userCredentials && userCredentials.password === password) {
      const user = {
        email: email,
        role: userCredentials.role,
        name: userCredentials.name
      };
      console.log('Setting user:', user);
      setUser(user);
      return { success: true, role: userCredentials.role };
    }
    console.log('Login failed for:', email);
    return { success: false, message: 'Invalid credentials' };
  };
  
  const updateUser = (updatedUserData) => {
    setUser(currentUser => {
      const newUserData = { ...currentUser, ...updatedUserData };
      return newUserData;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, directLogin, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { AuthContext };
