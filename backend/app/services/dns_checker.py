from typing import Any

import dns.resolver


def _resolve_txt(name: str) -> list[str]:
    try:
        answers = dns.resolver.resolve(name, "TXT")
        return ["".join(part.decode() for part in answer.strings) for answer in answers]
    except Exception:
        return []


def _resolve_mx(domain: str) -> list[str]:
    try:
        answers = dns.resolver.resolve(domain, "MX")
        return [str(answer.exchange).rstrip(".") for answer in answers]
    except Exception:
        return []


def check_domain_dns(domain: str) -> dict[str, Any]:
    spf_records = [record for record in _resolve_txt(domain) if record.lower().startswith("v=spf1")]
    dmarc_records = _resolve_txt(f"_dmarc.{domain}")
    dkim_records = _resolve_txt(f"default._domainkey.{domain}")
    mx_records = _resolve_mx(domain)

    spf = {
        "status": "pass" if spf_records else "fail",
        "record": spf_records[0] if spf_records else None,
        "note": None if spf_records else "SPF record not found",
    }
    dkim = {
        "status": "pass" if dkim_records else "fail",
        "record": dkim_records[0] if dkim_records else None,
        "note": None if dkim_records else "No selector found for default._domainkey",
    }
    dmarc_value = dmarc_records[0] if dmarc_records else None
    dmarc_status = "fail"
    dmarc_note = "DMARC record not found"
    if dmarc_value:
        if "p=reject" in dmarc_value.lower() or "p=quarantine" in dmarc_value.lower():
            dmarc_status = "pass"
            dmarc_note = None
        else:
            dmarc_status = "warn"
            dmarc_note = "Policy is none"
    dmarc = {"status": dmarc_status, "record": dmarc_value, "note": dmarc_note}
    mx = {
        "status": "pass" if mx_records else "fail",
        "records": mx_records,
        "note": None if mx_records else "No MX records found",
    }
    return {"spf": spf, "dkim": dkim, "dmarc": dmarc, "mx": mx}
