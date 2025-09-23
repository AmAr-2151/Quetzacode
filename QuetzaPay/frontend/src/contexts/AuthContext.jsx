import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un merchant guardado (localStorage)
    const savedMerchant = localStorage.getItem('quetza_merchant');
    if (savedMerchant) {
      setMerchant(JSON.parse(savedMerchant));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Simulación de login - en producción conectar al backend
      const mockMerchant = {
        id: 'test-merchant-id',
        name: 'Tienda de Prueba',
        email: email,
        walletAddress: 'https://ilp.interledger-test.dev/cesarh225',
        businessName: 'Mi Negocio'
      };

      setMerchant(mockMerchant);
      localStorage.setItem('quetza_merchant', JSON.stringify(mockMerchant));
      
      return { success: true, merchant: mockMerchant };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setMerchant(null);
    localStorage.removeItem('quetza_merchant');
  };

  const value = {
    merchant,
    login,
    logout,
    loading,
    isAuthenticated: !!merchant
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};