import React, { createContext, useContext } from 'react';
import useMetaMask from '../hooks/useMetaMask';

const MetaMaskContext = createContext(null);

export const MetaMaskProvider = ({ children }) => {
  const metamaskState = useMetaMask();

  return (
    <MetaMaskContext.Provider value={metamaskState}>
      {children}
    </MetaMaskContext.Provider>
  );
};

export const useMetaMaskContext = () => {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error('useMetaMaskContext must be used within MetaMaskProvider');
  }
  return context;
};
