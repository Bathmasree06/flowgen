from fastapi import FastAPI

app = FastAPI(title="Flowgen API")

@app.get("/")
def read_root():
    return {"status": "success", "message": "Flowgen backend is running"}