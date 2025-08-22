import React, { useEffect, useState, createContext, useContext } from 'react';
type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const ThemeProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };
  return <ThemeContext.Provider value={{
    isDarkMode,
    toggleTheme
  }}>
      {children}
    </ThemeContext.Provider>;
};
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};