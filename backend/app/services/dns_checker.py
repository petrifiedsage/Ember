import dns.resolver
import dns.exception
from app.schemas.dns import DnsCheckResult, RecordStatus, MxStatus
from datetime import datetime, timezone

def check_domain_dns(domain: str) -> DnsCheckResult:
    # 1. SPF
    spf_status = "fail"
    spf_record = None
    spf_note = "No SPF record found"
    try:
        answers = dns.resolver.resolve(domain, 'TXT')
        for rdata in answers:
            txt = rdata.to_text().strip('"')
            if txt.startswith("v=spf1"):
                spf_record = txt
                if "-all" in txt:
                    spf_status = "pass"
                    spf_note = "Valid SPF record with strict enforcement"
                elif "~all" in txt:
                    spf_status = "warn"
                    spf_note = "SPF ends with ~all (soft fail)"
                else:
                    spf_status = "warn"
                    spf_note = "SPF has unknown or missing enforcement"
                break
    except dns.exception.DNSException:
        pass

    # 2. DKIM
    dkim_status = "fail"
    dkim_record = None
    dkim_note = "No selector found at default._domainkey"
    try:
        answers = dns.resolver.resolve(f"default._domainkey.{domain}", 'TXT')
        for rdata in answers:
            txt = rdata.to_text().strip('"')
            if txt.startswith("v=DKIM1"):
                dkim_record = txt
                dkim_status = "pass"
                dkim_note = "DKIM record found for default selector"
                break
    except dns.exception.DNSException:
        pass

    # 3. DMARC
    dmarc_status = "fail"
    dmarc_record = None
    dmarc_note = "No DMARC record found"
    try:
        answers = dns.resolver.resolve(f"_dmarc.{domain}", 'TXT')
        for rdata in answers:
            txt = rdata.to_text().strip('"')
            if txt.startswith("v=DMARC1"):
                dmarc_record = txt
                if "p=reject" in txt:
                    dmarc_status = "pass"
                    dmarc_note = "DMARC policy is reject"
                elif "p=quarantine" in txt:
                    dmarc_status = "warn"
                    dmarc_note = "DMARC policy is quarantine"
                elif "p=none" in txt:
                    dmarc_status = "warn"
                    dmarc_note = "DMARC policy is none - no enforcement"
                else:
                    dmarc_status = "warn"
                    dmarc_note = "Unknown DMARC policy"
                break
    except dns.exception.DNSException:
        pass

    # 4. MX
    mx_status = "fail"
    mx_records = []
    try:
        answers = dns.resolver.resolve(domain, 'MX')
        for rdata in answers:
            mx_records.append(str(rdata.exchange).rstrip('.'))
        if mx_records:
            mx_status = "pass"
    except dns.exception.DNSException:
        pass

    return DnsCheckResult(
        checked_at=datetime.now(timezone.utc),
        spf=RecordStatus(status=spf_status, record=spf_record, note=spf_note),
        dkim=RecordStatus(status=dkim_status, record=dkim_record, note=dkim_note),
        dmarc=RecordStatus(status=dmarc_status, record=dmarc_record, note=dmarc_note),
        mx=MxStatus(status=mx_status, records=mx_records)
    )
