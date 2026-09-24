import React, {
  forwardRef,
  createContext,
  useContext,
  useId,
  useState,
} from "react";
import { AlertCircle } from "lucide-react";

interface CheckBoxOption {
  label: React.ReactNode;
  value: string;
  description?: React.ReactNode;
  disabled?: boolean;
}

interface CheckBoxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  labelClassName?: string;
}

interface CheckBoxGroupProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
  helperText?: string;
  options?: CheckBoxOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (selectedValues: string[]) => void;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  className?: string;
  children?: React.ReactNode;
}

// Context for Group management
interface CheckBoxGroupContextType {
  name?: string;
  value: string[];
  onChange: (val: string, checked: boolean) => void;
  disabled?: boolean;
}

const CheckBoxGroupContext = createContext<CheckBoxGroupContextType | null>(
  null
);

// Individual CheckBox component
export const CheckBox = forwardRef<HTMLInputElement, CheckBoxProps>(
  (
    {
      label,
      description,
      error,
      helperText,
      id,
      name,
      value,
      checked,
      onChange,
      disabled,
      className = "",
      containerClassName = "",
      labelClassName = "",
      ...rest
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = id || autoId;
    const groupContext = useContext(CheckBoxGroupContext);

    const isInsideGroup = Boolean(groupContext);
    const itemValue = value !== undefined ? String(value) : undefined;

    // Determine checked state: from group context if available, otherwise from direct prop
    const isChecked = isInsideGroup && itemValue !== undefined
      ? groupContext!.value.includes(itemValue)
      : checked;

    const isDisabled = disabled || (isInsideGroup && groupContext?.disabled);
    const inputName = name || (isInsideGroup ? groupContext?.name : undefined);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isInsideGroup && itemValue !== undefined && groupContext) {
        groupContext.onChange(itemValue, e.target.checked);
      }
      onChange?.(e);
    };

    return (
      <div className={`flex flex-col ${containerClassName}`}>
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              id={inputId}
              name={inputName}
              type="checkbox"
              value={value}
              checked={isChecked}
              onChange={handleChange}
              disabled={isDisabled}
              className={`w-4 h-4 text-primary-600 rounded border-border-strong focus:ring-primary-500 focus:ring-2 focus:ring-offset-1 transition duration-150 enabled:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${error
                  ? "border-unavailable-500 focus:ring-unavailable-500 text-unavailable-600"
                  : "hover:border-secondary-400"
                } ${className}`}
              {...rest}
            />
          </div>

          {(label || description) && (
            <div className="ml-2.5 text-sm select-none">
              {label && (
                <label
                  htmlFor={inputId}
                  className={`font-medium cursor-pointer ${isDisabled
                      ? "text-text-muted cursor-not-allowed"
                      : "text-text-secondary hover:text-text"
                    } ${labelClassName}`}
                >
                  {label}
                </label>
              )}
              {description && (
                <p
                  className={`text-xs mt-0.5 ${isDisabled ? "text-secondary-300" : "text-text-muted"
                    }`}
                >
                  {description}
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-xs text-unavailable-600 flex items-center gap-1 font-medium animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {!error && helperText && (
          <p className="mt-1 text-helper">{helperText}</p>
        )}
      </div>
    );
  }
);

CheckBox.displayName = "CheckBox";

// Group component
export const CheckBoxGroup: React.FC<CheckBoxGroupProps> = ({
  label,
  description,
  error,
  helperText,
  options,
  value: controlledValue,
  defaultValue = [],
  onChange,
  disabled = false,
  orientation = "vertical",
  className = "",
  children,
}) => {
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue);
  const isControlled = controlledValue !== undefined;
  const currentValues = isControlled ? controlledValue : internalValue;
  const groupId = useId();

  const handleToggle = (val: string, isChecked: boolean) => {
    let nextValues: string[];
    if (isChecked) {
      nextValues = [...currentValues, val];
    } else {
      nextValues = currentValues.filter((v) => v !== val);
    }

    if (!isControlled) {
      setInternalValue(nextValues);
    }
    onChange?.(nextValues);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1">
          {label}
        </label>
      )}

      {description && (
        <p className="text-xs text-text-muted mb-2">{description}</p>
      )}

      <CheckBoxGroupContext.Provider
        value={{
          name: groupId,
          value: currentValues,
          onChange: handleToggle,
          disabled,
        }}
      >
        <div
          className={`flex ${orientation === "horizontal"
              ? "flex-row flex-wrap gap-4"
              : "flex-col gap-2.5"
            }`}
        >
          {options
            ? options.map((option: CheckBoxOption) => (
              <CheckBox
                key={option.value}
                value={option.value}
                label={option.label}
                description={option.description}
                disabled={option.disabled}
              />
            ))
            : children}
        </div>
      </CheckBoxGroupContext.Provider>

      {error && (
        <p className="mt-1.5 text-xs text-unavailable-600 flex items-center gap-1 font-medium animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {!error && helperText && (
        <p className="mt-1.5 text-helper">{helperText}</p>
      )}
    </div>
  );
};

// Attach Group to CheckBox for compound component usage
export type CheckBoxComponent = typeof CheckBox & {
  Group: typeof CheckBoxGroup;
};

const CompoundCheckBox = CheckBox as CheckBoxComponent;
CompoundCheckBox.Group = CheckBoxGroup;

export default CompoundCheckBox;
