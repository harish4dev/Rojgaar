import re
from typing import Optional, Tuple


def _parse_amount(token: str) -> Optional[int]:
    cleaned = (token or "").strip().lower().replace(",", "").replace("₹", "").replace("rs", "").strip()
    if not cleaned:
        return None
    mult = 1
    if cleaned.endswith("k"):
        mult = 1000
        cleaned = cleaned[:-1]
    elif cleaned.endswith("l") or cleaned.endswith("lac"):
        mult = 100000
        cleaned = re.sub(r"(lac|l)$", "", cleaned)
    try:
        return int(float(cleaned) * mult)
    except ValueError:
        return None


def parse_expected_salary(text: Optional[str]) -> Tuple[Optional[int], Optional[int]]:
    """Parse UI salary labels like '₹10k - ₹15k' or '₹25k+' into min/max."""
    if not text or not str(text).strip():
        return None, None
    raw = str(text).strip().lower()
    if "+" in raw:
        low = _parse_amount(raw.split("+", 1)[0])
        return low, (low * 2 if low else None)
    parts = re.split(r"\s*[-–]\s*", raw)
    if len(parts) >= 2:
        low = _parse_amount(parts[0])
        high = _parse_amount(parts[1])
        return low, high
    single = _parse_amount(raw)
    return single, single
