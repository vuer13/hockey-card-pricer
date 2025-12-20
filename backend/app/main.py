from fastapi import FastAPI

app = FastAPI()

@app.get("/check")
def health_check():
    return {"status": "ok"}