// contexts/ErrorContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  FC,
} from "react";

interface ErrorContextType {
  error: Error | null;
  setError: (error: Error | null) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [error, setError] = useState<Error | null>(null);

  return (
    <ErrorContext.Provider value={{ error, setError }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
};
