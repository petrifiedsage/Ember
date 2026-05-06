def compute_score(dns_result: dict, blacklist_result: dict) -> int:
    score = 0
    
    # SPF (25)
    if dns_result.get('spf', {}).get('status') == 'pass':
        score += 25
    elif dns_result.get('spf', {}).get('status') == 'warn':
        score += 10
        
    # DKIM (25)
    if dns_result.get('dkim', {}).get('status') == 'pass':
        score += 25
    elif dns_result.get('dkim', {}).get('status') == 'warn':
        score += 10
        
    # DMARC (20)
    if dns_result.get('dmarc', {}).get('status') == 'pass':
        score += 20
    elif dns_result.get('dmarc', {}).get('status') == 'warn':
        score += 10
        
    # MX (10)
    if dns_result.get('mx', {}).get('status') == 'pass':
        score += 10
        
    # Blacklists (20)
    if not blacklist_result.get('is_listed', False):
        score += 20
        
    return score
