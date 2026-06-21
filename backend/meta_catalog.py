"""Single source of truth for industries, job roles, and skills.

Add new industries by appending to INDUSTRY_CATALOG — all meta endpoints derive from here.
"""

from typing import Any

INDUSTRY_CATALOG: list[dict[str, Any]] = [
    {
        "key": "garments",
        "label": "Garments",
        "icon": "shirt-outline",
        "job_roles": ["Tailor", "Helper", "Cutting Master"],
        "skills": ["Stitching", "Pattern Cutting", "Quality Inspection"],
    },
]


def normalize_industry_key(value: str) -> str:
    return (value or "").strip().lower()


def get_industries() -> list[dict[str, str]]:
    return [
        {"key": item["key"], "label": item["label"], "icon": item.get("icon", "business")}
        for item in INDUSTRY_CATALOG
    ]


def get_industry_job_titles() -> dict[str, list[str]]:
    return {item["key"]: list(item["job_roles"]) for item in INDUSTRY_CATALOG}


def get_all_job_roles() -> list[str]:
    roles: list[str] = []
    for item in INDUSTRY_CATALOG:
        for role in item["job_roles"]:
            if role not in roles:
                roles.append(role)
    return roles


def get_grey_collar_skills() -> dict[str, list[str]]:
    return {item["key"]: list(item["skills"]) for item in INDUSTRY_CATALOG}


def job_roles_for_industry(industry_key: str) -> list[str]:
    key = normalize_industry_key(industry_key)
    for item in INDUSTRY_CATALOG:
        if item["key"] == key:
            return list(item["job_roles"])
    return []


def is_valid_industry(industry_key: str) -> bool:
    key = normalize_industry_key(industry_key)
    return any(item["key"] == key for item in INDUSTRY_CATALOG)


def is_valid_job_role(industry_key: str, role: str) -> bool:
    return role in job_roles_for_industry(industry_key)
