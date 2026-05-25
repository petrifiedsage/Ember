from app.db.session import SessionLocal
from app.models.seed_test import SeedTest
from app.models.seed_test_result import SeedTestResult
db = SessionLocal()
test = db.query(SeedTest).filter(SeedTest.id == '9aada911-7e4c-481e-b7de-09087441e781').first()
print(f"Test ID: {test.id}, Status: {test.status}")
results = db.query(SeedTestResult).filter(SeedTestResult.seed_test_id == test.id).all()
for r in results:
    print(f"  {r.provider}: {r.placement}")
