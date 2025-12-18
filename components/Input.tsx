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
        className={[
          "w-full h-9 px-3",
          "border border-border rounded-md",
          "bg-input text-foreground",
          "placeholder:text-foreground-secondary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
          "transition-colors duration-150 ease-out",
          "disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed",
          error ? "border-error focus-visible:ring-error/30 focus-visible:border-error" : "",
          className,
        ].join(" ")}
        {...props}
      />
      {error && <p className="text-small text-error mt-1">{error}</p>}
      {helperText && !error && (
        <p className="text-small text-foreground-secondary mt-1">{helperText}</p>
      )}
    </div>
  );
}
