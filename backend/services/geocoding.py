"""Reverse geocoding and place search via OpenStreetMap Nominatim (no API key)."""

from __future__ import annotations

import logging
from typing import Any, Optional

import requests

logger = logging.getLogger(__name__)

NOMINATIM = "https://nominatim.openstreetmap.org"
HEADERS = {"User-Agent": "Rojgaar/1.0 (support@rojgaar.in)"}


def _pick_locality(address: dict[str, Any]) -> str:
    for key in (
        "road",
        "neighbourhood",
        "suburb",
        "quarter",
        "hamlet",
        "village",
        "locality",
        "residential",
    ):
        val = (address.get(key) or "").strip()
        if val:
            return val
    return ""


def _pick_city(address: dict[str, Any]) -> str:
    for key in (
        "city",
        "town",
        "municipality",
        "county",
        "state_district",
        "district",
    ):
        val = (address.get(key) or "").strip()
        if val:
            return val
    return ""


def _build_location_label(locality: str, city: str, display_name: str = "") -> str:
    if locality and city:
        return f"{locality}, {city}"
    if city:
        return city
    if locality:
        return locality
    return display_name.split(",")[0].strip() if display_name else ""


def parse_nominatim_result(item: dict[str, Any]) -> dict[str, Any]:
    address = item.get("address") or {}
    locality = _pick_locality(address)
    city = _pick_city(address)
    lat = float(item.get("lat") or 0)
    lng = float(item.get("lon") or 0)
    label = _build_location_label(locality, city, item.get("display_name") or "")
    return {
        "locality": locality,
        "city": city,
        "location_label": label,
        "location_lat": lat,
        "location_lng": lng,
        "display_name": item.get("display_name") or label,
    }


def reverse_geocode(lat: float, lng: float) -> Optional[dict[str, Any]]:
    try:
        r = requests.get(
            f"{NOMINATIM}/reverse",
            params={"lat": lat, "lon": lng, "format": "json", "addressdetails": 1},
            headers=HEADERS,
            timeout=8,
        )
        r.raise_for_status()
        data = r.json()
        if not data or "error" in data:
            return None
        parsed = parse_nominatim_result(data)
        if not parsed["city"] and not parsed["locality"]:
            return None
        return parsed
    except Exception as exc:
        logger.warning("reverse_geocode failed: %s", exc)
        return None


def search_places(query: str, limit: int = 8) -> list[dict[str, Any]]:
    q = query.strip()
    if len(q) < 2:
        return []
    try:
        r = requests.get(
            f"{NOMINATIM}/search",
            params={
                "q": q,
                "format": "json",
                "addressdetails": 1,
                "countrycodes": "in",
                "limit": limit,
            },
            headers=HEADERS,
            timeout=8,
        )
        r.raise_for_status()
        items = r.json() or []
        results = []
        for item in items:
            parsed = parse_nominatim_result(item)
            if parsed["city"] or parsed["locality"]:
                results.append(parsed)
        return results
    except Exception as exc:
        logger.warning("search_places failed: %s", exc)
        return []
