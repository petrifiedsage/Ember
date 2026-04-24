import { Link } from "react-router-dom";

export function Sidebar() {
  return (
    <aside className="w-56 border-r border-slate-200 p-4">
      <h1 className="mb-6 text-xl font-bold">Mailscope</h1>
      <nav className="flex flex-col gap-2">
        <Link to="/domains" className="rounded px-3 py-2 hover:bg-slate-100">
          Domains
        </Link>
        <Link to="/domains/new" className="rounded px-3 py-2 hover:bg-slate-100">
          Add Domain
        </Link>
      </nav>
    </aside>
  );
}
