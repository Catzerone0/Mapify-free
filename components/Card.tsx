import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`
        bg-background
        border border-border
        rounded-lg
        p-4
        dark:bg-gray-800 dark:border-gray-700
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div className={`pb-3 border-b border-border ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div className={`pt-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`pt-3 border-t border-border flex justify-end gap-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
