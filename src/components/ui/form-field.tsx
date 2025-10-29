import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ className, type, label, error, ...props }, ref) => {
    const id = React.useId();
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className="relative space-y-2">
        <div className="relative">
          <input
            type={type}
            className={cn(
              "h-12 w-full rounded-lg border bg-background px-3 pt-4 text-base transition-all",
              "placeholder:text-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
              error && "border-destructive focus:border-destructive focus:ring-destructive/20",
              className
            )}
            ref={ref}
            {...props}
            id={id}
            placeholder={label}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
          />
          <Label
            htmlFor={id}
            className={cn(
              "absolute left-3 top-1/2 cursor-text text-muted-foreground transition-all",
              (isFocused || props.value) && "-translate-y-3.5 text-xs",
              isFocused && "text-primary",
              error && "text-destructive"
            )}
          >
            {label}
          </Label>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";