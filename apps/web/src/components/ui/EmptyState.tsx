import { ReactNode } from "react";
import Card from "./Card";
import Button from "./Button";

export default function EmptyState({
  icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <Card padding="lg" className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-on-surface">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
          {description}
        </p>
      )}
      {action && onAction && (
        <Button className="mt-6" onClick={onAction}>
          {action}
        </Button>
      )}
    </Card>
  );
}
