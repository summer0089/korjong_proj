"use client";

import React, { forwardRef, useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

interface PasswordBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  showTogglePassword?: boolean;
}

export const PasswordBox = forwardRef<HTMLInputElement, PasswordBoxProps>(
  (
    {
      label,
      error,
      helperText,
      id,
      name,
      placeholder,
      value,
      onChange,
      disabled,
      className = "",
      containerClassName = "",
      showTogglePassword = true,
      ...rest
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || name;

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <div className="flex justify-between items-center mb-1.5">
            <label
              htmlFor={inputId}
              className="block text-sm font-medium text-text-secondary"
            >
              {label}
            </label>
          </div>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error && inputId ? `${inputId}-error` : undefined}
            className={`input-field py-3 px-4 ${showTogglePassword ? "pr-11" : "pr-4"
              } rounded-lg disabled:bg-surface-sunken disabled:text-text-muted disabled:cursor-not-allowed ${error
                ? "border-unavailable-500 focus:ring-1 focus:ring-unavailable-500"
                : "hover:border-border-strong"
              } ${className}`}
            {...rest}
          />

          {showTogglePassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary focus:outline-none cursor-pointer transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {error && (
          <p
            id={inputId ? `${inputId}-error` : undefined}
            role="alert"
            className="mt-1.5 text-xs text-unavailable-600 flex items-center gap-1 font-medium animate-fade-in"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {!error && helperText && (
          <p className="mt-1.5 text-helper">{helperText}</p>
        )}
      </div>
    );
  }
);

PasswordBox.displayName = "PasswordBox";

export default PasswordBox;
