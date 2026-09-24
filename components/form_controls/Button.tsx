import { forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";
type ButtonIconPosition = "left" | "right";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  text?: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: ButtonIconPosition;
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "text-text-inverse bg-primary-600 hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-500 shadow-sm",
  secondary:
    "text-text bg-secondary-100 hover:bg-secondary-200 active:bg-secondary-300 focus:ring-secondary-400",
  outline:
    "border border-border-strong bg-transparent text-text-secondary hover:bg-surface-sunken active:bg-secondary-100 focus:ring-primary-500",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-sunken active:bg-secondary-200 focus:ring-secondary-400",
  danger:
    "text-text-inverse bg-unavailable-500 hover:bg-unavailable-600 active:bg-unavailable-700 focus:ring-unavailable-500 shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "py-2 px-3 text-xs rounded-md gap-1.5",
  md: "py-3 px-4 text-sm rounded-lg gap-2",
  lg: "py-3.5 px-6 text-base rounded-xl gap-2.5",
};

const spinnerSizeStyles: Record<ButtonSize, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-5 h-5 border-2",
  lg: "w-6 h-6 border-[2.5px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      text,
      icon,
      iconPosition = "left",
      loading = false,
      loadingText,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = "",
      type = "button",
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const content = text ?? children;
    const effectiveLeftIcon =
      leftIcon || (iconPosition === "left" ? icon : undefined);
    const effectiveRightIcon =
      rightIcon || (iconPosition === "right" ? icon : undefined);

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`font-semibold inline-flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-75 select-none enabled:cursor-pointer disabled:cursor-not-allowed ${fullWidth ? "w-full" : ""
          } ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...rest}
      >
        {loading ? (
          <>
            <div
              className={`${spinnerSizeStyles[size]} border-current border-t-transparent rounded-full animate-spin shrink-0`}
            />
            {loadingText && <span>{loadingText}</span>}
          </>
        ) : (
          <>
            {effectiveLeftIcon && (
              <span className="shrink-0">{effectiveLeftIcon}</span>
            )}
            {content && <span>{content}</span>}
            {effectiveRightIcon && (
              <span className="shrink-0">{effectiveRightIcon}</span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
