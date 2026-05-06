import dns.resolver
from datetime import datetime, timezone
import ipaddress

RBLS = [
    "zen.spamhaus.org",
    "b.barracudacentral.org",
    "dnsbl.sorbs.net",
    "bl.spamcop.net"
]

def check_blacklist(domain: str) -> dict:
    try:
        answers = dns.resolver.resolve(domain, 'A')
        ip_addr = answers[0].to_text()
    except Exception:
        # If no A record, assume clean for IP-based RBLs
        return {
            "is_listed": False, 
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "results": [{"rbl": rbl, "status": "clean"} for rbl in RBLS]
        }

    reversed_ip = ipaddress.ip_address(ip_addr).reverse_pointer.replace('.in-addr.arpa', '').replace('.ip6.arpa', '')
    
    results = []
    is_listed = False
    
    for rbl in RBLS:
        query = f"{reversed_ip}.{rbl}"
        try:
            dns.resolver.resolve(query, 'A')
            is_listed = True
            results.append({"rbl": rbl, "status": "listed"})
        except Exception:
            results.append({"rbl": rbl, "status": "clean"})
            
    return {
        "is_listed": is_listed,
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "results": results
    }
