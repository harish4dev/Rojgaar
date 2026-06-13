from services.matching import (
    experience_level,
    is_strong_recommendation,
    passes_relevance_filter,
    score_worker_for_job,
)
from services.salary_parse import parse_expected_salary


def test_parse_salary_range():
    lo, hi = parse_expected_salary("₹10k - ₹15k")
    assert lo == 10000
    assert hi == 15000


def test_parse_salary_plus():
    lo, hi = parse_expected_salary("₹25k+")
    assert lo == 25000
    assert hi == 50000


def test_experience_level_normalization():
    assert experience_level("3-5 Years") == 3
    assert experience_level("2-5 Yrs") == 3
    assert experience_level("Fresher") == 0


def test_score_same_city_and_industry():
    worker = {
        "city": "Bengaluru",
        "skills": ["Mason"],
        "experience": "3-5 Years",
        "expected_salary_min": 15000,
        "expected_salary_max": 20000,
        "industries": ["construction"],
        "work_type": "Full Time",
        "availability_status": "Available",
    }
    job = {
        "active": True,
        "city": "Bengaluru",
        "title": "Mason",
        "description": "Construction mason work",
        "industry": "construction",
        "experience_band": "3-5 Years",
        "experience": "3-5 Years",
        "salary_min": 14000,
        "salary_max": 22000,
        "job_type": "Full Time",
        "requirements": ["Mason"],
    }
    result = score_worker_for_job(worker, job)
    assert result["score"] >= 50
    assert "same_city" in result["reasons"]


def test_score_excludes_gender_mismatch():
    worker = {"gender": "Male", "availability_status": "Available"}
    job = {"active": True, "gender_preference": "Female"}
    result = score_worker_for_job(worker, job)
    assert result["score"] == 0


def test_relevance_filter_blocks_unrelated_industry():
    worker = {"industries": ["construction"], "skills": ["Mason"], "city": "Bengaluru"}
    job = {"industry": "hospitality", "title": "Waiter", "city": "Bengaluru"}
    assert passes_relevance_filter(worker, job) is False


def test_relevance_filter_allows_matching_skill():
    worker = {"industries": ["construction"], "skills": ["Mason"], "city": "Bengaluru"}
    job = {"industry": "construction", "title": "Mason", "requirements": ["Mason"], "city": "Bengaluru"}
    assert passes_relevance_filter(worker, job) is True


def test_relevance_filter_blocks_skill_mismatch_same_industry():
    worker = {"industries": ["construction"], "skills": ["Steel Fixer"], "city": "Bengaluru"}
    job = {"industry": "construction", "title": "jcbc", "description": "generic work", "city": "Bengaluru"}
    assert passes_relevance_filter(worker, job) is False


def test_strong_recommendation_requires_core_signal():
    assert is_strong_recommendation(50, ["work_type_match"]) is False
    assert is_strong_recommendation(50, ["same_city", "skills_match"]) is True
    assert is_strong_recommendation(30, ["same_city", "skills_match"]) is False
