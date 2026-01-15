from fastapi import FastAPI

app = FastAPI(title="Milk Bank Traceability API")

from .api import router as api_router

app.include_router(api_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
