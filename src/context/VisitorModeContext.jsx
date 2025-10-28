import { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';

const VisitorModeContext = createContext();

export function VisitorModeProvider({ children }) {
  const { isAuthenticated } = useAuth();

  // Visitor mode is active when user is NOT authenticated
  const isVisitorMode = !isAuthenticated;

  return (
    <VisitorModeContext.Provider value={{ isVisitorMode }}>
      {children}
    </VisitorModeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useVisitorMode() {
  const context = useContext(VisitorModeContext);
  if (context === undefined) {
    throw new Error('useVisitorMode must be used within a VisitorModeProvider');
  }
  return context;
}
