import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { domainService, type DomainDto } from "../../services/domainService";

export default function DomainsListPage() {
  const { token } = useAuth();
  const [domains, setDomains] = useState<DomainDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadDomains() {
    if (!token) return;
    try {
      setDomains(await domainService.list(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load domains");
    }
  }

  async function onDelete(id: number) {
    if (!token) return;
    if (!window.confirm("Delete this domain?")) return;
    await domainService.remove(token, id);
    await loadDomains();
  }

  useEffect(() => {
    void loadDomains();
  }, [token]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tracked Domains</h2>
        <Link to="/domains/new" className="rounded bg-slate-900 px-3 py-2 text-white">
          Add Domain
        </Link>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="overflow-hidden rounded border bg-white">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-sm text-slate-600">
            <tr>
              <th className="p-3">Domain</th>
              <th className="p-3">Score</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {domains.map((domain) => (
              <tr key={domain.id} className="border-t">
                <td className="p-3">
                  <Link className="text-blue-600" to={`/domains/${domain.id}`}>
                    {domain.domain}
                  </Link>
                </td>
                <td className="p-3">{Math.round(domain.health_score)}</td>
                <td className="p-3">{domain.status}</td>
                <td className="p-3">
                  <button className="text-rose-700" onClick={() => void onDelete(domain.id)} type="button">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {domains.length === 0 && (
              <tr>
                <td className="p-4 text-slate-500" colSpan={4}>
                  No domains tracked yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
