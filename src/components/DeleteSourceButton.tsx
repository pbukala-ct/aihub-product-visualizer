import { useState } from "react";

interface Props {
  slug: string;
}

export function DeleteSourceButton({ slug }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirming) {
      setConfirming(true);
      return;
    }

    setLoading(true);
    await fetch(`/api/sources/${slug}`, { method: "DELETE" });
    window.location.reload();
  }

  function handleCancel(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div
        role="presentation"
        className="flex items-center gap-1"
        onClick={(e) => e.preventDefault()}
        onKeyDown={(e) => e.preventDefault()}
      >
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors disabled:opacity-40"
        >
          {loading ? "Deleting…" : "Confirm"}
        </button>
        <span className="text-gray-300">·</span>
        <button onClick={handleCancel} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button onClick={handleDelete} className="text-gray-300 hover:text-red-500 transition-colors" title="Delete source">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}
