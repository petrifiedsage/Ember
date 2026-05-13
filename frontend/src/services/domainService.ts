import { apiClient } from "./apiClient";

export type DomainDto = {
  id: number;
  domain: string;
  health_score: number;
  status: string;
  added_at: string;
};

export type DNSLatestDto = {
  checked_at: string;
  spf: Record<string, unknown>;
  dkim: Record<string, unknown>;
  dmarc: Record<string, unknown>;
  mx: Record<string, unknown>;
};

export const domainService = {
  list(token: string) {
    return apiClient<DomainDto[]>("/domains", { token });
  },
  create(token: string, domain: string) {
    return apiClient<DomainDto>("/domains", {
      method: "POST",
      token,
      body: { domain }
    });
  },
  remove(token: string, domainId: number) {
    return apiClient<void>(`/domains/${domainId}`, {
      method: "DELETE",
      token
    });
  },
  latestDns(token: string, domainId: number) {
    return apiClient<DNSLatestDto>(`/dns/${domainId}/latest`, { token });
  }
};
