def compute_strength(worker: dict) -> int:
    fields = [
        "name",
        "gender",
        "age",
        "city",
        "industries",
        "skills",
        "experience",
        "expected_salary",
        "work_type",
    ]
    filled = 0
    for field in fields:
        value = worker.get(field)
        if value and (not isinstance(value, list) or len(value) > 0):
            filled += 1
    return int((filled / len(fields)) * 100)
