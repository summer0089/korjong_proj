import React, { forwardRef } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectBoxProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const SelectBox = forwardRef<HTMLSelectElement, SelectBoxProps>(
  (
    {
      label,
      error,
      helperText,
      id,
      name,
      value,
      onChange,
      disabled,
      className = "",
      containerClassName = "",
      options,
      placeholder,
      ...rest
    },
    ref
  ) => {
    const selectId = id || name;

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-text-secondary mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error && selectId ? `${selectId}-error` : undefined}
            className={`input-field py-3 px-4 pr-10 rounded-lg appearance-none disabled:bg-surface-sunken disabled:text-text-muted disabled:cursor-not-allowed ${error
              ? "border-unavailable-500 focus:ring-1 focus:ring-unavailable-500 focus:border-unavailable-500"
              : "hover:border-border-strong"
              } ${!value ? "text-text-muted" : "text-text"} ${className}`}
            {...rest}
          >
            <option value="" disabled hidden={Boolean(value)}>
              {placeholder || "เลือกข้อมูล..."}
            </option>
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="text-text"
              >
                {opt.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>

        {error && (
          <p
            id={selectId ? `${selectId}-error` : undefined}
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

SelectBox.displayName = "SelectBox";

export default SelectBox;
