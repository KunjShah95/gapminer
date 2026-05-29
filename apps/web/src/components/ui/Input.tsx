import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldProps
>(({ label, hint, error, className, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="gm-label">{label}</label>}
    <input ref={ref} className={cn("gm-input", error && "border-error/50", className)} {...props} />
    {hint && !error && <p className="mt-1 text-xs text-outline">{hint}</p>}
    {error && <p className="mt-1 text-xs text-error">{error}</p>}
  </div>
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps
>(({ label, hint, error, className, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="gm-label">{label}</label>}
    <textarea
      ref={ref}
      className={cn("gm-textarea", error && "border-error/50", className)}
      {...props}
    />
    {hint && !error && <p className="mt-1 text-xs text-outline">{hint}</p>}
    {error && <p className="mt-1 text-xs text-error">{error}</p>}
  </div>
));
Textarea.displayName = "Textarea";
