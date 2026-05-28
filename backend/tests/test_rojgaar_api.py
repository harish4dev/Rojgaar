"""Rojgaar backend API tests - comprehensive coverage of all endpoints."""
import os
import pytest
import requests
import uuid

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://rojgaar-connect.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---------- Health ----------
def test_health(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------- Auth (mocked OTP) ----------
class TestAuth:
    def test_send_otp_worker(self, s):
        r = s.post(f"{API}/auth/send-otp", json={"phone": "7777777777", "role": "worker"})
        assert r.status_code == 200 and r.json()["success"] is True

    def test_send_otp_business(self, s):
        r = s.post(f"{API}/auth/send-otp", json={"phone": "9999999999", "role": "business"})
        assert r.status_code == 200 and r.json()["success"] is True

    def test_send_otp_partner(self, s):
        r = s.post(f"{API}/auth/send-otp", json={"phone": "8888888888", "role": "partner"})
        assert r.status_code == 200 and r.json()["success"] is True

    def test_verify_otp_worker_creates(self, s):
        phone = f"9{uuid.uuid4().int % 1000000000:09d}"
        r = s.post(f"{API}/auth/verify-otp", json={"phone": phone, "otp": "1234", "role": "worker"})
        assert r.status_code == 200
        data = r.json()
        assert data["success"] is True
        assert "user" in data and data["user"]["phone"] == phone
        assert "_id" not in data["user"]
        pytest.worker_phone = phone
        pytest.worker_id = data["user"]["id"]

    def test_verify_otp_business_demo(self, s):
        r = s.post(f"{API}/auth/verify-otp", json={"phone": "9999999999", "otp": "0000", "role": "business"})
        assert r.status_code == 200
        u = r.json()["user"]
        assert u["company"] == "Sharma Construction"
        assert "_id" not in u
        pytest.business_id = u["id"]

    def test_verify_otp_partner_demo(self, s):
        r = s.post(f"{API}/auth/verify-otp", json={"phone": "8888888888", "otp": "9999", "role": "partner"})
        assert r.status_code == 200
        u = r.json()["user"]
        assert "_id" not in u
        pytest.partner_id = u["id"]

    @pytest.mark.parametrize("bad_otp", ["123", "12345", "abcd", ""])
    def test_verify_otp_rejects_non_4_digit(self, s, bad_otp):
        r = s.post(f"{API}/auth/verify-otp", json={"phone": "7777777777", "otp": bad_otp, "role": "worker"})
        assert r.status_code == 400


# ---------- Jobs ----------
class TestJobs:
    def test_list_jobs_has_11_and_test_job(self, s):
        r = s.get(f"{API}/jobs")
        assert r.status_code == 200
        jobs = r.json()
        assert len(jobs) >= 11
        titles = [j["title"] for j in jobs]
        assert "Test Job - Carpenter" in titles
        for j in jobs:
            assert "_id" not in j
        pytest.test_job_id = next(j["id"] for j in jobs if j["title"] == "Test Job - Carpenter")

    def test_filter_by_city(self, s):
        r = s.get(f"{API}/jobs", params={"city": "Bengaluru"})
        assert r.status_code == 200
        assert all(j["city"] == "Bengaluru" for j in r.json())

    def test_filter_by_industry(self, s):
        r = s.get(f"{API}/jobs", params={"industry": "construction"})
        assert all(j["industry"] == "construction" for j in r.json())

    def test_filter_by_job_type(self, s):
        r = s.get(f"{API}/jobs", params={"job_type": "Full Time"})
        assert all(j["job_type"] == "Full Time" for j in r.json())

    def test_filter_by_salary(self, s):
        r = s.get(f"{API}/jobs", params={"salary_min": 20000, "salary_max": 30000})
        assert r.status_code == 200
        for j in r.json():
            assert j["salary_max"] >= 20000 and j["salary_min"] <= 30000

    def test_filter_by_search(self, s):
        r = s.get(f"{API}/jobs", params={"search": "mason"})
        titles = " ".join(j["title"].lower() + j["company"].lower() + j["industry"].lower() for j in r.json())
        assert "mason" in titles

    def test_get_job_by_id(self, s):
        r = s.get(f"{API}/jobs/{pytest.test_job_id}")
        assert r.status_code == 200
        assert r.json()["title"] == "Test Job - Carpenter"

    def test_get_job_404(self, s):
        r = s.get(f"{API}/jobs/nonexistent-id")
        assert r.status_code == 404

    def test_create_job(self, s):
        payload = {
            "title": "TEST_QA Carpenter",
            "company": "QA Co",
            "industry": "construction",
            "city": "Bengaluru",
            "salary_min": 15000,
            "salary_max": 20000,
        }
        r = s.post(f"{API}/jobs", json=payload)
        assert r.status_code == 200
        job = r.json()
        assert job["title"] == "TEST_QA Carpenter"
        pytest.created_job_id = job["id"]
        # verify GET
        g = s.get(f"{API}/jobs/{job['id']}")
        assert g.status_code == 200 and g.json()["title"] == "TEST_QA Carpenter"


# ---------- Workers ----------
class TestWorkers:
    def test_patch_worker_updates_strength(self, s):
        wid = pytest.worker_id
        payload = {
            "phone": pytest.worker_phone,
            "name": "TEST_Worker",
            "city": "Bengaluru",
            "industries": ["construction"],
            "skills": ["Mason"],
            "experience": "1-2 Years",
            "expected_salary": "20000",
            "work_type": "Full Time",
        }
        r = s.patch(f"{API}/workers/{wid}", json=payload)
        assert r.status_code == 200
        w = r.json()
        assert w["name"] == "TEST_Worker"
        assert w["profile_strength"] == 100
        assert "_id" not in w


# ---------- Applications ----------
class TestApplications:
    def test_create_application(self, s):
        r = s.post(f"{API}/applications", json={"worker_id": pytest.worker_id, "job_id": pytest.test_job_id})
        assert r.status_code == 200
        a = r.json()
        assert a["worker_id"] == pytest.worker_id and a["job_id"] == pytest.test_job_id

    def test_application_idempotent(self, s):
        r1 = s.post(f"{API}/applications", json={"worker_id": pytest.worker_id, "job_id": pytest.test_job_id})
        r2 = s.post(f"{API}/applications", json={"worker_id": pytest.worker_id, "job_id": pytest.test_job_id})
        assert r1.json()["id"] == r2.json()["id"]

    def test_list_applications_with_job(self, s):
        r = s.get(f"{API}/applications", params={"worker_id": pytest.worker_id})
        assert r.status_code == 200
        apps = r.json()
        assert len(apps) >= 1
        assert apps[0].get("job") and apps[0]["job"]["title"] == "Test Job - Carpenter"
        for a in apps:
            assert "_id" not in a


# ---------- Saved Jobs ----------
class TestSavedJobs:
    def test_save_job(self, s):
        r = s.post(f"{API}/saved-jobs", json={"worker_id": pytest.worker_id, "job_id": pytest.test_job_id})
        assert r.status_code == 200

    def test_list_saved(self, s):
        r = s.get(f"{API}/saved-jobs", params={"worker_id": pytest.worker_id})
        assert r.status_code == 200
        jobs = r.json()
        assert any(j["id"] == pytest.test_job_id for j in jobs)

    def test_unsave_job(self, s):
        r = s.delete(f"{API}/saved-jobs", params={"worker_id": pytest.worker_id, "job_id": pytest.test_job_id})
        assert r.status_code == 200
        r2 = s.get(f"{API}/saved-jobs", params={"worker_id": pytest.worker_id})
        assert not any(j["id"] == pytest.test_job_id for j in r2.json())


# ---------- Business ----------
class TestBusiness:
    def test_business_stats(self, s):
        r = s.get(f"{API}/businesses/{pytest.business_id}/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ("active_jobs", "applications", "hired", "profile_views"):
            assert k in d

    def test_business_jobs(self, s):
        r = s.get(f"{API}/businesses/{pytest.business_id}/jobs")
        assert r.status_code == 200
        jobs = r.json()
        # Demo business has Sharma Construction jobs (at least 1: Mason)
        assert len(jobs) >= 1
        for j in jobs:
            assert "applications_count" in j


# ---------- Partner ----------
class TestPartner:
    def test_partner_stats(self, s):
        r = s.get(f"{API}/partners/{pytest.partner_id}/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ("people_added", "job_matches", "placed", "total_earnings"):
            assert k in d
        assert d["people_added"] >= 4
        assert d["placed"] >= 1
        assert d["total_earnings"] == d["placed"] * 2000

    def test_partner_candidates(self, s):
        r = s.get(f"{API}/partners/{pytest.partner_id}/candidates")
        assert r.status_code == 200
        cs = r.json()
        names = [c["name"] for c in cs]
        for nm in ("Mahesh Kumar", "Suresh R", "Raju P", "Prakash M"):
            assert nm in names

    def test_add_partner_candidate(self, s):
        payload = {"name": "TEST_Candidate", "skill": "Mason", "experience": "Fresher", "city": "Bengaluru"}
        r = s.post(f"{API}/partners/{pytest.partner_id}/candidates", json=payload)
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_Candidate"


# ---------- Meta ----------
class TestMeta:
    def test_cities(self, s):
        r = s.get(f"{API}/meta/cities")
        d = r.json()
        assert "Bengaluru" in d["nearby"] and "Chennai" in d["popular"]

    def test_industries(self, s):
        r = s.get(f"{API}/meta/industries")
        keys = [i["key"] for i in r.json()]
        for k in ("construction", "factory", "delivery", "driver"):
            assert k in keys

    def test_skills(self, s):
        r = s.get(f"{API}/meta/skills")
        skills = r.json()
        for sk in ("Mason", "Carpenter", "Electrician", "Plumber"):
            assert sk in skills
