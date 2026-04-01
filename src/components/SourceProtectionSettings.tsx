import { useState } from "react";

interface Props {
  sourceSlug: string;
  isProtected: boolean;
  hasPassword: boolean;
}

export function SourceProtectionSettings({
  sourceSlug,
  isProtected: initialProtected,
  hasPassword: initialHasPassword,
}: Props) {
  const [isProtected, setIsProtected] = useState(initialProtected);
  const [password, setPassword] = useState("");
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSave() {
    if (isProtected && !password && !hasPassword) {
      setFeedback({ type: "error", message: "A password is required to enable protection." });
      return;
    }
    setSaving(true);
    setFeedback(null);

    try {
      const body: { is_protected: boolean; password?: string } = { is_protected: isProtected };
      if (isProtected && password) body.password = password;

      const res = await fetch(`/api/admin/source/${sourceSlug}/protection`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setFeedback({ type: "success", message: isProtected ? "Protection enabled." : "Protection removed." });
        if (isProtected && password) {
          setHasPassword(true);
          setPassword("");
        }
        if (!isProtected) setHasPassword(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setFeedback({ type: "error", message: data.error ?? "Failed to save. Please try again." });
      }
    } catch {
      setFeedback({ type: "error", message: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Access protection</h2>

      <div className="space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isProtected}
            onChange={(e) => {
              setIsProtected(e.target.checked);
              setFeedback(null);
            }}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-gray-700">Require a password to access this catalogue</span>
        </label>

        {isProtected && (
          <div>
            <label htmlFor="protection-password" className="block text-sm font-medium text-gray-700">
              {hasPassword ? "New password (leave blank to keep current)" : "Password"}
            </label>
            <input
              id="protection-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={hasPassword ? "Enter new password to rotate" : "Set a password"}
              className="mt-1 block w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoComplete="new-password"
            />
            {hasPassword && !password && (
              <p className="mt-1 text-xs text-gray-500">Password is set. Enter a new one to rotate it.</p>
            )}
          </div>
        )}

        {feedback && (
          <p
            role="status"
            className={`rounded-md px-3 py-2 text-sm ${
              feedback.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {feedback.message}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </div>
  );
}
