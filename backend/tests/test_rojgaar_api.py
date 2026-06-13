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


# ---------- Auth (Twilio Verify or dev OTP when API has OTP_DEV_MODE / no Twilio) ----------
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
        assert "access_token" in data and data["access_token"]
        assert "_id" not in data["user"]
        pytest.worker_phone = phone
        pytest.worker_id = data["user"]["id"]
        pytest.worker_token = data["access_token"]
        s.headers["Authorization"] = f"Bearer {data['access_token']}"

    def test_verify_otp_business_demo(self, s):
        r = s.post(f"{API}/auth/verify-otp", json={"phone": "9999999999", "otp": "0000", "role": "business"})
        assert r.status_code == 200
        data = r.json()
        u = data["user"]
        assert u["company"] == "Sharma Construction"
        assert data["needs_profile"] is False
        assert "_id" not in u
        pytest.business_id = u["id"]

    def test_verify_otp_partner_demo(self, s):
        r = s.post(f"{API}/auth/verify-otp", json={"phone": "8888888888", "otp": "9999", "role": "partner"})
        assert r.status_code == 200
        data = r.json()
        u = data["user"]
        assert data["needs_profile"] is False
        assert "_id" not in u
        pytest.partner_id = u["id"]

    def test_verify_otp_new_business_needs_profile(self, s):
        phone = f"8{uuid.uuid4().int % 1000000000:09d}"
        r = s.post(f"{API}/auth/verify-otp", json={"phone": phone, "otp": "1234", "role": "business"})
        assert r.status_code == 200
        data = r.json()
        assert data["is_new"] is True
        assert data["needs_profile"] is True
        biz_id = data["user"]["id"]
        r2 = s.patch(
            f"{API}/businesses/{biz_id}",
            json={"name": "TEST Biz Owner", "company": "TEST Company", "city": "Chennai", "industry": "garments"},
        )
        assert r2.status_code == 200
        assert r2.json()["profile_complete"] is True
        r3 = s.post(f"{API}/auth/verify-otp", json={"phone": phone, "otp": "1234", "role": "business"})
        assert r3.json()["needs_profile"] is False

    @pytest.mark.parametrize("bad_otp", ["12", "12345", "123456", "abcd", ""])
    def test_verify_otp_rejects_invalid_code(self, s, bad_otp):
        r = s.post(f"{API}/auth/verify-otp", json={"phone": "7777777777", "otp": bad_otp, "role": "worker"})
        assert r.status_code == 400


# ---------- Jobs ----------
class TestJobs:
    def test_create_job(self, s):
        payload = {
            "title": "Test Job - Carpenter",
            "company": "QA Co",
            "industry": "construction",
            "city": "Bengaluru",
            "salary_min": 15000,
            "salary_max": 20000,
            "requirements": ["Carpenter"],
            "experience_band": "1-2 Years",
            "job_type": "Full Time",
        }
        r = s.post(f"{API}/jobs", json=payload)
        assert r.status_code == 200
        job = r.json()
        assert job["title"] == "Test Job - Carpenter"
        pytest.test_job_id = job["id"]
        pytest.created_job_id = job["id"]
        g = s.get(f"{API}/jobs/{job['id']}")
        assert g.status_code == 200 and g.json()["title"] == "Test Job - Carpenter"

    def test_list_jobs(self, s):
        r = s.get(f"{API}/jobs")
        assert r.status_code == 200
        jobs = r.json()
        assert isinstance(jobs, list)
        for j in jobs:
            assert "_id" not in j

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

    def test_stop_hiring_blocks_new_applications(self, s):
        r = s.patch(f"{API}/jobs/{pytest.created_job_id}/hiring-status", json={"hiring_status": "stopped"})
        assert r.status_code == 200
        assert r.json()["hiring_status"] == "stopped"
        block = s.post(
            f"{API}/applications",
            json={"worker_id": pytest.worker_id, "job_id": pytest.created_job_id},
        )
        assert block.status_code == 400


# ---------- Workers ----------
class TestWorkers:
    def test_patch_worker_updates_strength(self, s):
        wid = pytest.worker_id
        payload = {
            "phone": pytest.worker_phone,
            "name": "TEST_Worker",
            "gender": "Male",
            "age": 25,
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
        assert isinstance(jobs, list)
        for j in jobs:
            assert "applications_count" in j

    def test_business_applications_with_worker(self, s):
        r = s.get(f"{API}/businesses/{pytest.business_id}/applications")
        assert r.status_code == 200
        apps = r.json()
        assert isinstance(apps, list)
        if apps:
            app = apps[0]
            assert "worker" in app
            assert "job" in app
            assert "worker_id" in app
            assert "_id" not in app

    def test_update_application_status(self, s):
        apps = s.get(f"{API}/businesses/{pytest.business_id}/applications").json()
        if not apps:
            pytest.skip("No applications to test")
        app_id = apps[0]["id"]
        r = s.patch(f"{API}/applications/{app_id}", json={"status": "Accepted"})
        assert r.status_code == 200
        assert r.json()["status"] == "Accepted"


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

    def test_add_partner_candidate_with_otp(self, s):
        payload = {
            "name": "TEST_Candidate",
            "employee_number": "9876500099",
            "skill": "Mason",
            "experience": "Fresher",
            "city": "Bengaluru",
            "gender": "Male",
            "age": 25,
            "collar_type": "Blue Collar",
        }
        r = s.post(f"{API}/partners/{pytest.partner_id}/candidates/request-otp", json=payload)
        assert r.status_code == 200
        assert r.json()["success"] is True
        r2 = s.post(
            f"{API}/partners/{pytest.partner_id}/candidates/confirm",
            json={"employee_number": "9876500099", "otp": "1234"},
        )
        assert r2.status_code == 200
        assert r2.json()["candidate"]["name"] == "TEST_Candidate"
        assert r2.json()["candidate"]["gender"] == "Male"
        assert r2.json()["candidate"]["collar_type"] == "Blue Collar"

    def test_partner_bulk_candidate_upload_csv(self, s):
        csv_text = (
            "name,employee_number,skill,experience,city,gender,age,collar_type\n"
            "Bulk One,9876500101,Mason,Fresher,Bengaluru,Male,26,Gray Collar\n"
        )
        files = {"file": ("bulk_candidates.csv", csv_text, "text/csv")}
        r = requests.post(f"{API}/partners/{pytest.partner_id}/bulk/candidates", files=files)
        assert r.status_code == 200
        assert r.json()["created"] >= 1


# ---------- Meta ----------
class TestMeta:
    def test_cities(self, s):
        r = s.get(f"{API}/meta/cities")
        d = r.json()
        assert "Bengaluru" in d["nearby"] and "Chennai" in d["popular"]

    def test_industries(self, s):
        r = s.get(f"{API}/meta/industries")
        keys = [i["key"] for i in r.json()]
        assert "garments" in keys

    def test_skills(self, s):
        r = s.get(f"{API}/meta/skills")
        skills = r.json()
        for sk in ("Tailor", "Helper", "Cutting Master"):
            assert sk in skills

    def test_industry_job_titles(self, s):
        r = s.get(f"{API}/meta/industry-job-titles")
        assert r.status_code == 200
        payload = r.json()
        assert "garments" in payload
        assert "Tailor" in payload["garments"]

    def test_grey_collar_skills(self, s):
        r = s.get(f"{API}/meta/grey-collar-skills")
        assert r.status_code == 200
        payload = r.json()
        assert "garments" in payload
        assert len(payload["garments"]) > 0


class TestRecommendations:
    def test_worker_recommendations(self, s):
        r = s.get(f"{API}/recommendations/workers/{pytest.worker_id}/jobs")
        assert r.status_code == 200
        jobs = r.json()
        assert isinstance(jobs, list)
        if jobs:
            assert "match_score" in jobs[0]

    def test_job_candidate_ranking(self, s):
        r = s.get(f"{API}/recommendations/jobs/{pytest.test_job_id}/candidates")
        assert r.status_code == 200
        ranks = r.json()
        assert isinstance(ranks, list)
        if ranks:
            assert "worker" in ranks[0]
            assert "match_score" in ranks[0]
