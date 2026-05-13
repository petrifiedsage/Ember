def register_and_login(client, email: str = "user@example.com", password: str = "Passw0rd!"):
    register_response = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )
    assert register_response.status_code == 201

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == 200
    access_token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


def test_auth_flow(client):
    headers = register_and_login(client)

    me_response = client.get("/api/v1/auth/users/me", headers=headers)

    assert me_response.status_code == 200
    assert me_response.json()["email"] == "user@example.com"


from app.schemas.dns import DnsCheckResult, RecordStatus, MxStatus
from datetime import datetime, timezone

def test_domain_crud_and_dns_latest(client, monkeypatch):
    calls = {"count": 0}

    def fake_check_domain_dns(domain: str):
        calls["count"] += 1
        assert domain == "gmail.com"
        return DnsCheckResult(
            checked_at=datetime.now(timezone.utc),
            spf=RecordStatus(status="pass", record="v=spf1 include:_spf.google.com ~all", note=None),
            dkim=RecordStatus(status="fail", record=None, note="No selector found for default._domainkey"),
            dmarc=RecordStatus(status="pass", record="v=DMARC1; p=reject;", note=None),
            mx=MxStatus(status="pass", records=["smtp.google.com"])
        )

    monkeypatch.setattr("app.api.v1.dns.check_domain_dns", fake_check_domain_dns)

    headers = register_and_login(client, email="domains@example.com")

    create_response = client.post("/api/v1/domains", json={"domain": "gmail.com"}, headers=headers)
    assert create_response.status_code == 201
    domain_id = create_response.json()["id"]

    list_response = client.get("/api/v1/domains", headers=headers)
    assert list_response.status_code == 200
    assert [row["domain"] for row in list_response.json()] == ["gmail.com"]

    dns_response = client.get(f"/api/v1/dns/{domain_id}/latest", headers=headers)
    assert dns_response.status_code == 200
    assert dns_response.json()["spf"]["status"] == "pass"
    assert dns_response.json()["dmarc"]["status"] == "pass"

    cached_dns_response = client.get(f"/api/v1/dns/{domain_id}/latest", headers=headers)
    assert cached_dns_response.status_code == 200
    assert calls["count"] == 1

    delete_response = client.delete(f"/api/v1/domains/{domain_id}", headers=headers)
    assert delete_response.status_code == 204

    final_list_response = client.get("/api/v1/domains", headers=headers)
    assert final_list_response.status_code == 200
    assert final_list_response.json() == []
