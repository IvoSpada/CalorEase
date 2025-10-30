// src/components/UserMenu.tsx
import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, User as UserIcon, Target } from "lucide-react";

type Props = {
  profile?: { nombre?: string; email?: string; [k: string]: any } | null;
  onLogout: () => void;
  className?: string;
};

export default function UserMenu({ profile, onLogout, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const name = profile?.nombre ?? profile?.name ?? "Usuario";
  const email = profile?.email ?? "";

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const initials = (name || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 px-3 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 focus:outline-none"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="inline-flex items-center justify-center rounded-full bg-primary-600 text-white w-8 h-8 text-sm font-semibold">
          {initials}
        </div>
        <div className="hidden sm:flex flex-col text-left leading-tight">
          <span className="font-medium text-sm">{name}</span>
          <span className="text-xs text-muted-foreground truncate" style={{ maxWidth: 200 }}>
            {email}
          </span>
        </div>
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border rounded shadow-md z-50 py-1"
        >
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
            onClick={() => (window.location.href = "/profile")}
          >
            <UserIcon className="w-4 h-4" /> Perfil
          </button>

          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
            onClick={() => (window.location.href = "/dashboard")}
          >
            <Target className="w-4 h-4" /> Dashboard
          </button>

          <div className="border-t my-1" />

          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rose-600 hover:bg-gray-50 dark:hover:bg-zinc-800"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
