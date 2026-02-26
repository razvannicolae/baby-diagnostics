import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantClasses = {
  primary: 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-[0_4px_14px_rgba(21,101,192,.35)]',
  secondary: 'bg-bg text-text-secondary border border-border',
  accent: 'bg-gradient-to-br from-accent to-[#00695C] text-white shadow-[0_4px_14px_rgba(0,137,123,.3)]',
  danger: 'bg-danger text-white',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'h-[50px] text-[15px] rounded-[14px] w-full',
};

export function Button({ variant = 'primary', size = 'md', children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`font-bold flex items-center justify-center gap-2 transition-all tracking-[0.3px]
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
