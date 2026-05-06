from app.services.dns_checker import check_domain_dns


def test_dns_checker_parses_expected_statuses(monkeypatch):
    class MockAnswer:
        def __init__(self, data):
            self.data = data
            self.exchange = data
        def to_text(self):
            return self.data

    def fake_resolve(qname, rdtype):
        name = str(qname)
        if rdtype == 'TXT':
            records = {
                "example.com": ["v=spf1 include:_spf.example.com ~all"],
                "_dmarc.example.com": ["v=DMARC1; p=none; rua=mailto:dmarc@example.com"],
                "default._domainkey.example.com": ["v=DKIM1; k=rsa; p=test-key"],
            }
            if name not in records:
                import dns.exception
                raise dns.exception.DNSException("Not found")
            return [MockAnswer(r) for r in records[name]]
        elif rdtype == 'MX':
            return [MockAnswer("mx1.example.com"), MockAnswer("mx2.example.com")]

    monkeypatch.setattr("dns.resolver.resolve", fake_resolve)

    result = check_domain_dns("example.com")

    assert result.spf.status == "warn"
    assert result.dkim.status == "pass"
    assert result.dmarc.status == "warn"
    assert result.dmarc.note == "DMARC policy is none - no enforcement"
    assert result.mx.status == "pass"
    assert result.mx.records == ["mx1.example.com", "mx2.example.com"]
