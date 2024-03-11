// components/ErrorDisplay.tsx
import React, { FC } from "react";
import { useError } from "../contexts/ErrorContext";

const ErrorDisplay: FC = () => {
  const { error } = useError();

  if (!error) return null;

  return (
    <div className="error-display text-red-500">
      <p>Error: {error.message}</p>
      {/* You can add more detailed error information or a button to clear the error here */}
    </div>
  );
};

export default ErrorDisplay;
