from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextIn(BaseModel):
    text: str

class AnalysisOut(BaseModel):
    sentiment: float
    keywords: list[str]

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/process_text", response_model=AnalysisOut)
def process_text(payload: TextIn):
    text = payload.text.lower()

    # temporary fake sentiment logic
    positive_words = ["good", "happy", "love", "excited", "great"]
    score = 0.8 if any(w in text for w in positive_words) else 0.3

    # extract keywords (first few long words)
    words = [w for w in text.split() if len(w) > 4][:5]

    return {"sentiment": score, "keywords": words}
