"""Iteration 2 backend tests: gender/age on Worker, translations on Jobs,
profile_strength with 9 fields, idempotent Application from Call button."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://rojgaar-connect.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="module")
def worker(s):
    phone = f"9{uuid.uuid4().int % 1000000000:09d}"
    r = s.post(f"{API}/auth/verify-otp", json={"phone": phone, "otp": "1234", "role": "worker"})
    assert r.status_code == 200
    return r.json()["user"]


# ---------- Worker gender/age fields ----------
class TestWorkerGenderAge:
    def test_new_worker_has_gender_age_keys(self, worker):
        # Fields exist and start None (optional)
        assert "gender" in worker
        assert "age" in worker
        assert worker["gender"] is None
        assert worker["age"] is None

    def test_patch_only_gender_age_name(self, s, worker):
        wid = worker["id"]
        r = s.patch(f"{API}/workers/{wid}", json={
            "name": "TEST_GenderAge",
            "gender": "Female",
            "age": 28,
        })
        assert r.status_code == 200
        w = r.json()
        assert w["name"] == "TEST_GenderAge"
        assert w["gender"] == "Female"
        assert w["age"] == 28
        # 3 of 9 fields → 33%
        assert w["profile_strength"] == int((3 / 9) * 100)

    def test_full_profile_strength_uses_9_fields(self, s, worker):
        wid = worker["id"]
        r = s.patch(f"{API}/workers/{wid}", json={
            "name": "TEST_Full",
            "gender": "Male",
            "age": 30,
            "city": "Bengaluru",
            "industries": ["construction"],
            "skills": ["Mason"],
            "experience": "1-2 Years",
            "expected_salary": "20000",
            "work_type": "Full Time",
        })
        assert r.status_code == 200
        w = r.json()
        assert w["profile_strength"] == 100
        assert w["gender"] == "Male" and w["age"] == 30

    def test_get_worker_persists_gender_age(self, s, worker):
        wid = worker["id"]
        r = s.get(f"{API}/workers/{wid}")
        assert r.status_code == 200
        w = r.json()
        assert w["gender"] == "Male"
        assert w["age"] == 30
        assert "_id" not in w

    def test_patch_language_works(self, s, worker):
        wid = worker["id"]
        r = s.patch(f"{API}/workers/{wid}", json={"language": "hi"})
        assert r.status_code == 200
        assert r.json()["language"] == "hi"
        r2 = s.patch(f"{API}/workers/{wid}", json={"language": "kn"})
        assert r2.json()["language"] == "kn"


# ---------- Job translations ----------
EXPECTED_HI_TITLES = {
    "Mason": "राजमिस्त्री",
    "Helper": "हेल्पर",
    "Electrician": "इलेक्ट्रीशियन",
    "Steel Fixer": "स्टील फिक्सर",
    "Painter": "पेंटर",
    "Delivery Executive": "डिलीवरी एक्जीक्यूटिव",
    "Security Guard": "सुरक्षा गार्ड",
    "Plumber": "प्लंबर",
    "Factory Worker": "फैक्ट्री वर्कर",
    "AC Technician": "एसी तकनीशियन",
    "Test Job - Carpenter": "टेस्ट जॉब - बढ़ई",
}

EXPECTED_KN_TITLES = {
    "Mason": "ಮೇಸ್ತ್ರಿ",
    "Helper": "ಸಹಾಯಕ",
    "Electrician": "ವಿದ್ಯುತ್ ತಂತ್ರಜ್ಞ",
}


class TestJobTranslations:
    def test_all_seeded_jobs_have_translations(self, s):
        r = s.get(f"{API}/jobs")
        assert r.status_code == 200
        jobs = r.json()
        seeded = [j for j in jobs if j["title"] in EXPECTED_HI_TITLES]
        assert len(seeded) >= len(EXPECTED_HI_TITLES), (
            f"Expected {len(EXPECTED_HI_TITLES)} seeded titles, found {len(seeded)}"
        )
        for j in seeded:
            assert "translations" in j and isinstance(j["translations"], dict), (
                f"Job {j['title']} missing translations dict"
            )
            assert "hi" in j["translations"], f"{j['title']} missing 'hi'"
            assert "kn" in j["translations"], f"{j['title']} missing 'kn'"
            for lang in ("hi", "kn"):
                tr = j["translations"][lang]
                for key in ("title", "description", "requirements", "experience", "job_type"):
                    assert key in tr, f"{j['title']} {lang} missing key {key}"

    def test_hindi_titles_match(self, s):
        r = s.get(f"{API}/jobs")
        jobs = {j["title"]: j for j in r.json()}
        for en, hi in EXPECTED_HI_TITLES.items():
            assert en in jobs, f"Missing seeded job: {en}"
            assert jobs[en]["translations"]["hi"]["title"] == hi

    def test_kannada_titles_match(self, s):
        r = s.get(f"{API}/jobs")
        jobs = {j["title"]: j for j in r.json()}
        for en, kn in EXPECTED_KN_TITLES.items():
            assert jobs[en]["translations"]["kn"]["title"] == kn

    def test_requirements_translated_as_list(self, s):
        r = s.get(f"{API}/jobs")
        mason = next(j for j in r.json() if j["title"] == "Mason")
        reqs_hi = mason["translations"]["hi"]["requirements"]
        assert isinstance(reqs_hi, list) and len(reqs_hi) >= 1
        # Hindi devanagari char check
        assert any("\u0900" <= ch <= "\u097F" for ch in reqs_hi[0])

    def test_get_job_by_id_includes_translations(self, s):
        r = s.get(f"{API}/jobs")
        mason = next(j for j in r.json() if j["title"] == "Mason")
        r2 = s.get(f"{API}/jobs/{mason['id']}")
        assert r2.status_code == 200
        j = r2.json()
        assert j["translations"]["hi"]["title"] == "राजमिस्त्री"
        assert j["translations"]["kn"]["title"] == "ಮೇಸ್ತ್ರಿ"


# ---------- Application via Call button (idempotent) ----------
class TestCallButtonApplication:
    def test_call_creates_application(self, s, worker):
        wid = worker["id"]
        r = s.get(f"{API}/jobs")
        job_id = next(j["id"] for j in r.json() if j["title"] == "Mason")
        # First call: create
        r1 = s.post(f"{API}/applications", json={"worker_id": wid, "job_id": job_id})
        assert r1.status_code == 200
        a1 = r1.json()
        # Second call (Call button re-click): same application returned
        r2 = s.post(f"{API}/applications", json={"worker_id": wid, "job_id": job_id})
        assert r2.status_code == 200
        a2 = r2.json()
        assert a1["id"] == a2["id"]

    def test_application_count_grows_per_distinct_job(self, s, worker):
        wid = worker["id"]
        before = s.get(f"{API}/applications", params={"worker_id": wid}).json()
        before_count = len(before)
        # Apply to another job
        jobs = s.get(f"{API}/jobs").json()
        helper_id = next(j["id"] for j in jobs if j["title"] == "Helper")
        s.post(f"{API}/applications", json={"worker_id": wid, "job_id": helper_id})
        after = s.get(f"{API}/applications", params={"worker_id": wid}).json()
        assert len(after) == before_count + 1
