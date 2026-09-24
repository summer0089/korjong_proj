import React, { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

interface TextBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const TextBox = forwardRef<HTMLInputElement, TextBoxProps>(
  (
    {
      label,
      error,
      helperText,
      id,
      name,
      type = "text",
      placeholder,
      value,
      onChange,
      disabled,
      className = "",
      containerClassName = "",
      ...rest
    },
    ref
  ) => {
    const inputId = id || name;

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          className={`input-field py-3 px-4 rounded-lg disabled:bg-surface-sunken disabled:text-text-muted disabled:cursor-not-allowed ${error
            ? "border-unavailable-500 focus:ring-1 focus:ring-unavailable-500 focus:border-unavailable-500"
            : "hover:border-border-strong"
            } ${className}`}
          {...rest}
        />

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

TextBox.displayName = "TextBox";

export default TextBox;
