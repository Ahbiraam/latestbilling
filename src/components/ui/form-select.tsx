import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    const id = React.useId();
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className="relative space-y-2">
        <div className="relative">
          <select
            className={cn(
              "h-12 w-full appearance-none rounded-lg border bg-background px-3 pt-4 text-base transition-all",
              "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
              error && "border-destructive focus:border-destructive focus:ring-destructive/20",
              className
            )}
            ref={ref}
            {...props}
            id={id}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
          >
            <option value="" disabled hidden>
              {label}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = "FormSelect";