from app.services.dns_checker import check_domain_dns


def test_dns_checker_parses_expected_statuses(monkeypatch):
    def fake_resolve_txt(name: str):
        records = {
            "example.com": ["v=spf1 include:_spf.example.com ~all"],
            "_dmarc.example.com": ["v=DMARC1; p=none; rua=mailto:dmarc@example.com"],
            "default._domainkey.example.com": ["k=rsa; p=test-key"],
        }
        return records.get(name, [])

    def fake_resolve_mx(_: str):
        return ["mx1.example.com", "mx2.example.com"]

    monkeypatch.setattr("app.services.dns_checker._resolve_txt", fake_resolve_txt)
    monkeypatch.setattr("app.services.dns_checker._resolve_mx", fake_resolve_mx)

    result = check_domain_dns("example.com")

    assert result["spf"]["status"] == "pass"
    assert result["dkim"]["status"] == "pass"
    assert result["dmarc"]["status"] == "warn"
    assert result["dmarc"]["note"] == "Policy is none"
    assert result["mx"]["status"] == "pass"
    assert result["mx"]["records"] == ["mx1.example.com", "mx2.example.com"]
