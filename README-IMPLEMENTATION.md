Implementation notes and next steps

- Use Poetry to manage dependencies: `poetry install`
- Run app locally: `uvicorn src.app.main:app --reload`
- Database: default uses sqlite `milkbank.db` but recommend Postgres in production (set DATABASE_URL)
- Install dependencies for development: `python -m pip install -r requirements.txt` and `pip install -e .` (editable install)
- Run tests: `PYTHONPATH=src pytest -q` or after editable install just `pytest -q`

Next tasks:
- Implement state machines and enforce hard stops in API endpoints
- Add barcode generation + label templates
- Add sample/microbiology and pasteurisation endpoints with signed logs
- Create two-person verification workflow for release, dispatch, and NICU admin
- Add CI with test runs and code quality checks
