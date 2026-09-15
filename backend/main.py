from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router

app = FastAPI(title="ANPR API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since frontend is on Vercel, allow all origins (or specify the vercel URL later)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "API is running"}

app.include_router(router)
