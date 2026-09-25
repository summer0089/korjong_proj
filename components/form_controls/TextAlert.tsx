import React from "react";
import { AlertTriangle, AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type TextAlertVariant = "error" | "warning" | "success" | "info";

interface TextAlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  text?: React.ReactNode;
  variant?: TextAlertVariant;
  icon?: React.ReactNode | boolean;
  title?: React.ReactNode;
  onClose?: () => void;
}

const variantStyles: Record<TextAlertVariant, { container: string; iconColor: string }> = {
  error: {
    container: "bg-unavailable-50 border-unavailable-200 text-unavailable-700",
    iconColor: "text-unavailable-500",
  },
  warning: {
    container: "bg-booked-50 border-booked-200 text-booked-800",
    iconColor: "text-booked-500",
  },
  success: {
    container: "bg-available-50 border-available-200 text-available-800",
    iconColor: "text-available-500",
  },
  info: {
    container: "bg-primary-50 border-primary-200 text-primary-800",
    iconColor: "text-primary-500",
  },
};

const defaultIcons: Record<TextAlertVariant, React.ReactNode> = {
  error: <AlertTriangle className="w-4 h-4 shrink-0" />,
  warning: <AlertCircle className="w-4 h-4 shrink-0" />,
  success: <CheckCircle2 className="w-4 h-4 shrink-0" />,
  info: <Info className="w-4 h-4 shrink-0" />,
};

export const TextAlert: React.FC<TextAlertProps> = ({
  text,
  variant = "error",
  icon = true,
  title,
  onClose,
  children,
  className = "",
  ...rest
}) => {
  const content = text ?? children;
  if (!content && !title) return null;

  const { container, iconColor } = variantStyles[variant];

  // Resolve icon element
  let renderedIcon: React.ReactNode = null;
  if (icon === true || icon === undefined) {
    renderedIcon = (
      <span className={`${iconColor} shrink-0`}>
        {defaultIcons[variant]}
      </span>
    );
  } else if (icon) {
    renderedIcon = <span className="shrink-0">{icon}</span>;
  }

  return (
    <div
      role="alert"
      className={`p-3.5 border text-sm rounded-lg flex items-start gap-2.5 transition-all ${container} ${className}`}
      {...rest}
    >
      {renderedIcon && <div className="mt-0.5">{renderedIcon}</div>}

      <div className="flex-1">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        {content && <span>{content}</span>}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 ml-2 -mr-1 -mt-1 p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-black/5 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

TextAlert.displayName = "TextAlert";

export default TextAlert;
