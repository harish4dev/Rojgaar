"""Legacy seed job titles — used only to purge demo data from the database."""

SEED_JOB_TITLES = [
    "Mason",
    "Helper",
    "Electrician",
    "Steel Fixer",
    "Painter",
    "Delivery Executive",
    "Security Guard",
    "Plumber",
    "Factory Worker",
    "AC Technician",
    "Test Job - Carpenter",
]

# No new demo jobs are inserted in production.
SEED_JOBS: list[dict] = []
