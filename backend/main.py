import os
import json
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from backend/.env or root .env
env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
load_dotenv()

try:
    from chatbot import stream_chat_response, key_manager
except ImportError:
    from backend.chatbot import stream_chat_response, key_manager

app = FastAPI(
    title="Vaibhav Pattanshetti Portfolio Chatbot API",
    description="FastAPI + LangChain + Groq backend for recruiter interactions",
    version="1.0.0",
)

# Configure CORS
origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in origins else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str = "user"
    content: str = ""


class ChatRequest(BaseModel):
    messages: Optional[List[ChatMessage]] = None
    message: Optional[str] = None
    query: Optional[str] = None
    history: Optional[List[ChatMessage]] = None


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Vaibhav Portfolio Chatbot API",
        "model": os.getenv("MODEL_NAME", "openai/gpt-oss-120b"),
        "documentation": "/docs",
    }


@app.get("/health")
def health_check():
    key_count = len(key_manager.keys)
    return {
        "status": "healthy" if key_count > 0 else "missing_api_key",
        "keys_configured": key_count,
        "active_key_index": key_manager.current_idx + 1,
        "model": os.getenv("MODEL_NAME", "openai/gpt-oss-120b"),
    }


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Streaming chat endpoint using Server-Sent Events (SSE).
    Accepts:
      { "messages": [{"role": "user", "content": "..."}] }
    OR:
      { "message": "..." }
    """
    # Normalize input from different possible payload formats
    messages_payload = []

    if request.messages:
        messages_payload = [
            {"role": m.role.strip().lower(), "content": m.content}
            for m in request.messages
            if m.content.strip()
        ]
    elif request.message or request.query:
        single_msg = (request.message or request.query or "").strip()
        if request.history:
            messages_payload = [
                {"role": m.role.strip().lower(), "content": m.content}
                for m in request.history
                if m.content.strip()
            ]
        messages_payload.append({"role": "user", "content": single_msg})

    if not messages_payload:
        return JSONResponse(
            status_code=400,
            content={"error": "No message content provided. Please send a non-empty message."},
        )

    async def event_generator():
        try:
            async for chunk in stream_chat_response(messages_payload):
                data = json.dumps({"token": chunk})
                yield f"data: {data}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            err = json.dumps({"error": str(e)})
            yield f"data: {err}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
