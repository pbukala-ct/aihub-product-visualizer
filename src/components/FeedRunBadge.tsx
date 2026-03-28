import { cn } from "@/lib/utils";
import type { FeedRunType } from "@/types";

interface Props {
  type: FeedRunType;
}

const config: Record<FeedRunType, { label: string; className: string }> = {
  full: { label: "Full", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  delta: { label: "Delta", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  unknown: { label: "Unknown", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

export function FeedRunBadge({ type }: Props) {
  const { label, className } = config[type] ?? config.unknown;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}
