def business_needs_profile(doc: dict) -> bool:
    if doc.get("profile_complete"):
        return False
    name = (doc.get("name") or "").strip()
    company = (doc.get("company") or "").strip()
    city = (doc.get("city") or "").strip()
    if name and company and city and name != "New Business" and company != "My Company":
        return False
    return True


def partner_needs_profile(doc: dict) -> bool:
    if doc.get("profile_complete"):
        return False
    name = (doc.get("name") or "").strip()
    city = (doc.get("city") or "").strip()
    if name and city and name != "New Partner":
        return False
    return True
