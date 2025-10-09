import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
  fullWidth?: boolean;
}

export default function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  fullWidth = false
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} ${fullWidth ? 'w-100' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
