# Vaibhav Portfolio Chatbot Backend

A lightweight, production-ready FastAPI backend powered by **LangChain** and **Groq** (`openai/gpt-oss-120b`). Built specifically for recruiters and hiring managers visiting Vaibhav's portfolio website.

---

## 📁 Project Structure

```
backend/
├── main.py              # FastAPI app with CORS and SSE streaming endpoint (/api/chat)
├── chatbot.py           # LangChain Groq model setup & comprehensive knowledge system prompt
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variables template
├── .env                 # Your local secrets (add your GROQ_API_KEY here)
└── README.md            # Setup and deployment guide
```

---

## 🚀 Quickstart (Local Development)

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Your Groq API Keys (With Automatic Failover)
Open `.env` in the `backend/` folder. You can add one key or multiple keys separated by a comma:
```env
# Multi-key failover pool (auto-switches if daily rate limit is hit)
GROQ_API_KEY=gsk_first_key_here,gsk_second_key_here
MODEL_NAME=openai/gpt-oss-120b
ALLOWED_ORIGINS=*
PORT=8000
```
> Get free Groq API keys at: [https://console.groq.com/keys](https://console.groq.com/keys)

### 3. Start the Backend Server
```bash
python main.py
```
Or with Uvicorn directly:
```bash
uvicorn main:app --reload --port 8000
```

The server will be running at:
- **API URL:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/health`

---

## 🌐 Deploying to Production (Render / Railway / Hugging Face)

Since Netlify hosts static files (HTML/CSS/JS), your FastAPI backend can be hosted for **free** on any Python cloud provider like **Render** or **Railway**:

### Option A: Render.com (Recommended & Free)
1. Push your repo to GitHub.
2. Sign in to [Render.com](https://render.com) and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   - `GROQ_API_KEY`: `gsk_first_key_here,gsk_second_key_here` (both keys separated by comma)
   - `MODEL_NAME`: `openai/gpt-oss-120b`
   - `ALLOWED_ORIGINS`: `*` (or `https://vaibhavpattanshetti.netlify.app`)
6. Click **Deploy Web Service**. Render will give you a public URL (e.g., `https://vaibhav-portfolio-backend.onrender.com`).
7. In your portfolio's `askme.js` (or in `index.html`), update the API URL:
   ```javascript
   window.ASKME_API_URL = "https://vaibhav-portfolio-backend.onrender.com";
   ```

---

## 📡 API Endpoints

- `GET /` — API service info & model status
- `GET /health` — Health check indicating if Groq API key is present
- `POST /api/chat` — Server-Sent Events (SSE) streaming chat endpoint
  - **Payload:**
    ```json
    {
      "messages": [
        {"role": "user", "content": "Tell me about your experience in Agentic AI and LangGraph"}
      ]
    }
    ```
  - **Stream Response:**
    ```
    data: {"token": "Vaibhav"}
    data: {"token": " has"}
    data: {"token": " built"}
    ...
    data: [DONE]
    ```
