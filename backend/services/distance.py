"""Haversine distance helpers."""

from __future__ import annotations

import math
from typing import Any, Optional


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlng / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def attach_job_distances(worker: dict[str, Any], jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    wlat = worker.get("location_lat")
    wlng = worker.get("location_lng")
    if wlat is None or wlng is None:
        return jobs
    for job in jobs:
        jlat = job.get("location_lat")
        jlng = job.get("location_lng")
        if jlat is not None and jlng is not None:
            job["distance_km"] = round(haversine_km(float(wlat), float(wlng), float(jlat), float(jlng)), 2)
    return jobs
