import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full
          px-3 py-2
          border border-border rounded-lg
          bg-background
          text-foreground
          placeholder:text-foreground-secondary
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          transition-colors duration-200
          disabled:bg-gray-100 disabled:cursor-not-allowed
          dark:bg-gray-800 dark:border-gray-700
          ${error ? "border-error focus:ring-error" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-error mt-1">{error}</p>}
      {helperText && !error && (
        <p className="text-sm text-foreground-secondary mt-1">{helperText}</p>
      )}
    </div>
  );
}
