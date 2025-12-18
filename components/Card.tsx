import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={[
        "bg-card text-card-foreground border border-border rounded-md",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={["p-4 pb-3 border-b border-border", className].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = "", ...props }: CardProps) {
  return (
    <div className={["p-4 pt-3", className].join(" ")} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={[
        "p-4 pt-3 border-t border-border flex justify-end gap-2",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
