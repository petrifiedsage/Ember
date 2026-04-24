import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Badge } from "../../components/common/Badge";
import { useAuth } from "../../hooks/useAuth";
import { domainService, type DNSLatestDto } from "../../services/domainService";

function extractRecord(record: Record<string, unknown>) {
  const value = record.record ?? record.records ?? null;
  return value ? JSON.stringify(value) : "N/A";
}

export default function DomainDetailPage() {
  const { token } = useAuth();
  const { domainId } = useParams();
  const [result, setResult] = useState<DNSLatestDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLatest() {
      if (!token || !domainId) return;
      try {
        setResult(await domainService.latestDns(token, Number(domainId)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load DNS data");
      }
    }
    void loadLatest();
  }, [token, domainId]);

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (!result) return <p className="text-sm text-slate-500">Loading DNS check...</p>;

  const rows = [
    { label: "SPF", value: result.spf },
    { label: "DKIM", value: result.dkim },
    { label: "DMARC", value: result.dmarc },
    { label: "MX", value: result.mx }
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Domain DNS Audit</h2>
      <p className="text-sm text-slate-500">Last checked: {new Date(result.checked_at).toLocaleString()}</p>
      <div className="overflow-hidden rounded border bg-white">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-sm text-slate-600">
            <tr>
              <th className="p-3">Record</th>
              <th className="p-3">Status</th>
              <th className="p-3">Raw Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t" key={row.label}>
                <td className="p-3 font-medium">{row.label}</td>
                <td className="p-3">
                  <Badge status={String(row.value.status ?? "unknown")} />
                </td>
                <td className="p-3 text-sm text-slate-700">{extractRecord(row.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
