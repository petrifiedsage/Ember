import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { domainService } from "../../services/domainService";

export default function AddDomainPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setError(null);
    try {
      await domainService.create(token, domain);
      navigate("/domains");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create domain");
    }
  }

  return (
    <section className="max-w-lg rounded border bg-white p-5">
      <h2 className="mb-4 text-xl font-semibold">Add Domain</h2>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input
          className="w-full rounded border p-2"
          placeholder="example.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button className="rounded bg-slate-900 px-4 py-2 text-white" type="submit">
          Save Domain
        </button>
      </form>
    </section>
  );
}
