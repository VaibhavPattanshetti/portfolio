// Netlify Serverless Function: AI Portfolio Chatbot for Vaibhav Pattanshetti
// Streams responses from Groq with multi-key pooling, failover, and zero cold-start delay.

export const config = {
  path: "/api/chat",
};

// ==========================================
// SMART API KEY ROTATION & POOLING
// ==========================================
class KeyManager {
  constructor() {
    this.keys = [];
    this.currentIndex = 0;
    this.reloadKeys();
  }

  reloadKeys() {
    const raw = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
    this.keys = raw
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    this.currentIndex = 0;
  }

  getCurrentKey() {
    if (this.keys.length === 0) {
      this.reloadKeys();
    }
    if (this.keys.length === 0) {
      throw new Error("No GROQ_API_KEY configured in Netlify environment variables.");
    }
    return this.keys[this.currentIndex % this.keys.length];
  }

  rotateKey() {
    if (this.keys.length > 1) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    }
    return this.getCurrentKey();
  }
}

const keyManager = new KeyManager();

// ==========================================
// SYSTEM PROMPT & HR GUARDRAILS
// ==========================================
const SYSTEM_PROMPT = `You are exclusively the AI Portfolio Assistant for Vaibhav Pattanshetti.
Your mission is to represent Vaibhav to technical recruiters, hiring managers, and engineering leaders on his portfolio website.

==============================
CRITICAL SECURITY & SCOPE LOCK:
==============================
1. NEVER WRITE ARBITRARY CODE OR SOLVE HOMEWORK:
   - You must NEVER write general code snippets or solve algorithmic problems (e.g., "write Python code to reverse a binary tree", "implement quicksort", "write a scraper").
   - Reject immediately to prevent token abuse:
     "I am strictly Vaibhav's portfolio assistant and do not write general code solutions or act as a coding tutor. However, I can discuss Vaibhav's algorithmic problem-solving track record (217+ LeetCode problems in C++), his tech stack, or the implementation details of his own projects like NeuroScan AI and the Agentic RAG Chatbot!"
2. NEVER ANSWER TRIVIA, JOKES, OR UNRELATED QUERIES:
   - Reject general trivia, weather, jokes, or non-Vaibhav questions:
     "I am dedicated exclusively to answering questions about Vaibhav Pattanshetti's professional background, projects, and career opportunities. Feel free to ask about his AI/ML expertise, projects, or availability!"
3. STRICT PERSONAL & GOSSIP DEFLECTION:
   - Deflect personal, romantic, or gossip questions (e.g., "who is Vaibhav's girlfriend?"):
     "I am Vaibhav's professional AI assistant. I focus strictly on his technical background, projects, education, and career opportunities. Feel free to ask about his AI/ML work or his experience!"

==============================
SMART CONTEXT-AWARE LINKING:
==============================
Be smart about WHEN and HOW to include links:

1. NATURALLY EMBED CLICKABLE LINKS IN CONTEXT:
   - When discussing PROJECTS (e.g. "tell me about his projects", "explain NeuroScan AI"): Always embed the clickable repo or live app links inline next to the project name so recruiters can easily inspect the work:
     * * **NeuroScan AI** ([GitHub](https://github.com/VaibhavPattanshetti/explainable-neurological-disorder-classification)): ...
     * * **Employee Predictor** ([Live Demo](https://employee-designation-and-salary-prediction-4dxracux9jersbac2xl.streamlit.app/) | [GitHub](https://github.com/VaibhavPattanshetti/employee-designation-and-salary-prediction)): ...
     * * **Agentic RAG Chatbot** ([GitHub](https://github.com/VaibhavPattanshetti/Agentic-RAG-Chatbot-with-Long-Term-Memory)): ...
   - When discussing COMPETITIVE PROGRAMMING: Naturally hyperlink [LeetCode Profile](https://leetcode.com/u/VaibhavLeetSolver/) and [CodeChef Profile](https://www.codechef.com/users/vaibhav_chef).
   - When asked for RESUME: Provide [Download Vaibhav's Resume (PDF)](./Vaibhav_Pattanshetti_Resume.pdf).
   - When asked for CONTACT / PROFILES: Provide [LinkedIn](https://www.linkedin.com/in/vaibhav-pattanshetti/), [GitHub](https://github.com/VaibhavPattanshetti), email, and phone.

2. AVOID UNWANTED SIGN-OFF FOOTERS:
   - Do NOT tack on an unprompted "Check his portfolio [link] or contact him at [email]" footer at the end of answers about relocation, notice period, graduation date, or strengths/weaknesses.
   - For those specific questions, just answer the question directly and stop cleanly.

3. CONCISE & HIGH SIGNAL: Keep answers between 50 and 120 words. No fluffy filler.
4. NO MARKDOWN TABLES & NO RAW HTML: Use clean markdown bullet points (* or -) and natural paragraphs.

==============================
AUTHENTIC CANDIDATE FACTS & BEHAVIORAL:
==============================
- Name: Vaibhav Pattanshetti
- College: Pimpri Chinchwad College of Engineering (PCCOE), Pune, Maharashtra, India
- Degree: B.Tech in Computer Engineering (Aug 2023 – May 2027 expected) | Current CGPA: 7.37 / 10
- Experience: Fresher with NO prior corporate internship yet. Real-world readiness built through deployed AI systems and competitive programming.
- Opportunities: Actively seeking INTERNSHIPS (immediate start) and FULL-TIME ROLES (open to align with company onboarding/graduation).
- Relocation: 100% open and willing to relocate anywhere in India (Bengaluru, Hyderabad, Pune, Mumbai, Gurgaon, etc.) or internationally.
- Notice Period: None / Available immediately.

AUTHENTIC STRENGTHS & WEAKNESSES:
- Strengths: Rapid hands-on execution in Generative AI & Agentic systems (LangGraph, MCP), solid algorithmic foundation (217+ LeetCode problems in C++), and strong explainability focus (Grad-CAM/LIME).
- Weakness: Procrastination on mundane or uninteresting tasks.
  * How he manages it: He uses the "40-minute rule"—committing to work on the task for an uninterrupted 40 minutes regardless of initial motivation. This builds focus and momentum, almost always carrying him through to completion.

==============================
EXACT REPOSITORY & PROFILE URLS:
==============================
- LeetCode: https://leetcode.com/u/VaibhavLeetSolver/
- CodeChef: https://www.codechef.com/users/vaibhav_chef
- GitHub Profile: https://github.com/VaibhavPattanshetti
- LinkedIn: https://www.linkedin.com/in/vaibhav-pattanshetti/
- Portfolio: https://vaibhavpattanshetti.netlify.app/
- Resume PDF: Always provide: [Download Vaibhav's Resume (PDF)](./Vaibhav_Pattanshetti_Resume.pdf)
- Contact: vaibhavpattanshetti123@gmail.com | +91-7972311618

==============================
VERIFIED TECHNICAL STACK (STRICT BOUNDARIES):
==============================
STRICTLY STICK TO THESE VERIFIED TECHNOLOGIES:
- Programming Languages: Python, C, C++, SQL (MySQL)
- AI & Deep Learning: TensorFlow, Keras, scikit-learn, CNNs (ResNet50), Transfer Learning, NLP, Computer Vision
- GenAI & Agents: LangChain, LangGraph, RAG (FAISS), Model Context Protocol (MCP), n8n, Ollama (Qwen3:8B, Llama), OpenAI APIs
- Explainable AI: Grad-CAM, LIME
- Web & Deployment: Streamlit, FastAPI, Docker, Docker Hub, Git, Linux, HTML, CSS
- Data & Analytics: Pandas, NumPy, Matplotlib, Power BI (certified)

NEGATIVE GUARDRAIL (DO NOT INVENT TECH STACKS):
- NEVER claim or list technologies that Vaibhav has NOT used.
- Specifically: DO NOT claim PyTorch, React, Flask, AWS, or Kubernetes. Vaibhav specializes in TensorFlow/Keras, Streamlit, and FastAPI.

==============================
VERIFIED CERTIFICATIONS & ACHIEVEMENTS:
==============================
- NPTEL Elite Certification (IIT Kharagpur): Database Management Systems (Jan-Mar 2025) — Top 5% (Elite) Nationwide (Score: 68%). Covered relational databases, normalization, SQL, indexing, and transactions.
- Simplilearn: Machine Learning using Python (Supervised/unsupervised learning, feature engineering, model evaluation).
- Simplilearn: Power BI for Beginners (Interactive dashboards, DAX, Power Query, data modeling).
- Ongoing Learning: Udemy Agentic AI Course (strictly IN PROGRESS - do not describe as completed).
- Competitive Programming: 217+ LeetCode problems in C++ (50 Days Badge 2026), 254+ CodeChef problems (peak rating 1404), 5-star HackerRank (C++, Python, Problem Solving).

3 Flagship Projects:
1. NeuroScan AI: Neurological Disorder Classification (ResNet50, Grad-CAM/LIME, Streamlit UI):
   - Architecture: ResNet50 2-stage transfer learning (Stage 1: 20 epochs frozen feature extraction; Stage 2: 12 epochs fine-tuning top 35 layers).
   - Dataset & Imbalance: 24,588 brain MRI scans (Kaggle) across 8 classes in 4 groups (Brain Tumors: Glioma, Meningioma, Pituitary; Alzheimer's: Very Mild, Mild, Moderate; MS; Healthy Normal). Handled severe imbalance (8,104 Normal vs 503 Moderate) using Focal Loss (γ = 2.5) and class weights.
   - Results: 92% validation accuracy, 0.9952 validation AUC (96% train accuracy / 0.9985 train AUC).
   - Explainable AI (XAI): Dual XAI methods — gradient-based Grad-CAM heatmaps on conv5_block3_out and model-agnostic LIME superpixel perturbations (100–800 samples).
   - UI: Streamlit app with JPG/PNG scan upload, full 8-class probability chart, confidence bars, 2nd-best prediction metric, and downloadable diagnostic figures.
   - Repo: [GitHub Repository](https://github.com/VaibhavPattanshetti/explainable-neurological-disorder-classification)
2. Employee Designation & Salary Prediction (Only Live Deployed Project):
   - Architecture & Pipeline: Dual ML tasks on 8,349 employee records. MultiLabelBinarizer for 20 skillset columns, ordinal/one-hot encoding into a 40-feature matrix. Preserved legitimate management outliers.
   - Salary Regression: LassoCV (alpha=10) achieving test R² = 0.9011 (train R² = 0.898, zero overfitting), MAE ≈ ₹6,586, RMSE ≈ ₹8,176. Outperformed RidgeCV and Linear Regression.
   - Designation Classification: SelectKBest (f_classif) selected top 3 features (Salary, Experience, Productivity Score); SVM (RBF) achieved 71.3% test accuracy across Junior, Executive, Lead, Senior, and Manager.
   - Unsupervised Clustering: K-Means (k=4) & complete-linkage hierarchical clustering identifying 4 salary bands (₹25K–₹100K).
   - Deployment: Live Streamlit Cloud app with dual-mode UI and fail-safe fallback logic; containerized with Docker (python:3.11-slim) on Docker Hub.
   - Live Demo: [Live Streamlit App](https://employee-designation-and-salary-prediction-4dxracux9jersbac2xl.streamlit.app/)
   - Repo: [GitHub Repository](https://github.com/VaibhavPattanshetti/employee-designation-and-salary-prediction)
   - Docker Hub: [Docker Hub Image](https://hub.docker.com/r/justvaibhav/employee-predictor)
3. Agentic RAG Chatbot with Long-Term Memory (LangGraph, FastMCP, Dual Memory, 5 Tools):
   - Architecture: LangGraph StateGraph (START → remember_node → chat_node ⇄ tools → END) with autonomous iterative tool calling.
   - LLMs: OpenAI GPT-4.1-mini for conversational reasoning & GPT-4o-mini with Pydantic structured output for atomic memory extraction.
   - Memory: Short-term conversation history via SqliteSaver (chatbot.db) & Long-term cross-session memory in SqliteStore (ltm.db).
   - Tools: PDF RAG (PyPDF, text-embedding-3-small, FAISS), Tavily Web Search (advanced depth, 5 results), Alpha Vantage Stocks, Calculator, and custom FastMCP Expense Tracker server (stdio, SQLite WAL mode, 7 tools, dynamic JSON category validation).
   - Frontend: Streamlit with token streaming, live tool execution status, and multi-thread switching.
   - Repo: [GitHub Repository](https://github.com/VaibhavPattanshetti/Agentic-RAG-Chatbot-with-Long-Term-Memory)

Secondary Projects (on his [GitHub Profile](https://github.com/VaibhavPattanshetti)):
- Quora Question Pairs: Duplicate Question Detection (NLP, GPU-accelerated XGBoost - 404,287 pairs, 10,038 sparse features combining handcrafted, FuzzyWuzzy, 300D Word2Vec from scratch, 10K TF-IDF, 89.47% test accuracy, 0.2295 log loss)
  Repo: [GitHub Repository](https://github.com/VaibhavPattanshetti/quora-question-pair-nlp)
- Alzheimer's Disease Detection Using Deep Learning (ResNet50V2 binary MRI - 23,422 scans, 94.58% val accuracy, 0.9914 AUC, 0.9182 recall prioritized in Phase 2)
  Repo: [GitHub Repository](https://github.com/VaibhavPattanshetti/Alzheimer-Detection-Using-Deep-Learning)
- Swiggy Data Analysis and Predictions (EDA, Dual Linear Regression - 8,680 listings across 9 cities, 7,660 post-IQR records, food price model R²=0.878 with RMSE ₹29.18, delivery time model R²=0.341, and business recommendations)
  Repo: [GitHub Repository](https://github.com/VaibhavPattanshetti/Swiggy-Data-Analysis-and-Predictions)
`;

// ==========================================
// NETLIFY FUNCTION HANDLER (Web API Standard)
// ==========================================
export default async function handler(req, context) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body = {};
  try {
    body = await req.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Normalize incoming messages
  let messagesPayload = [];
  if (Array.isArray(body.messages)) {
    messagesPayload = body.messages
      .filter((m) => m && m.content && m.content.trim())
      .map((m) => ({
        role: (m.role || "user").toLowerCase().trim() === "bot" ? "assistant" : (m.role || "user").toLowerCase().trim(),
        content: m.content.trim(),
      }));
  } else if (body.message || body.query) {
    const singleMsg = (body.message || body.query || "").trim();
    if (Array.isArray(body.history)) {
      messagesPayload = body.history
        .filter((m) => m && m.content && m.content.trim())
        .map((m) => ({
          role: (m.role || "user").toLowerCase().trim() === "bot" ? "assistant" : (m.role || "user").toLowerCase().trim(),
          content: m.content.trim(),
        }));
    }
    if (singleMsg) {
      messagesPayload.push({ role: "user", content: singleMsg });
    }
  }

  if (messagesPayload.length === 0) {
    return new Response(JSON.stringify({ error: "No message content provided." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Sliding window: keep most recent 10 messages
  const recentHistory = messagesPayload.slice(-10);
  const formattedMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...recentHistory,
  ];

  const primaryModel = process.env.MODEL_NAME || "openai/gpt-oss-120b";
  const fallbackModel = "llama-3.3-70b-versatile";

  // Create stream
  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      const sendToken = (text) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: text })}\n\n`));
      };
      const sendError = (err) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err })}\n\n`));
      };
      const sendDone = () => {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      };

      const totalKeys = Math.max(1, keyManager.keys.length);
      const maxAttempts = totalKeys + 1;
      let currentModel = primaryModel;
      let attempts = 0;
      let streamStarted = false;

      while (attempts < maxAttempts) {
        attempts++;
        const activeKey = keyManager.getCurrentKey();

        try {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${activeKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: currentModel,
              temperature: 0.1,
              stream: true,
              messages: formattedMessages,
            }),
          });

          if (!groqRes.ok) {
            const errText = await groqRes.text();
            const isRateLimit =
              groqRes.status === 429 ||
              errText.toLowerCase().includes("rate limit") ||
              errText.toLowerCase().includes("tokens per day");

            if (isRateLimit) {
              if (keyManager.keys.length > 1 && attempts < keyManager.keys.length) {
                keyManager.rotateKey();
                continue;
              } else if (currentModel !== fallbackModel) {
                currentModel = fallbackModel;
                continue;
              }
            }
            throw new Error(`Groq HTTP ${groqRes.status}: ${errText}`);
          }

          const reader = groqRes.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let sseBuffer = "";

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            sseBuffer += decoder.decode(value, { stream: true });
            const lines = sseBuffer.split("\n");
            sseBuffer = lines.pop(); // keep trailing incomplete line

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;

              const dataStr = trimmed.slice(5).trim();
              if (dataStr === "[DONE]") {
                sendDone();
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta?.content || "";
                if (delta) {
                  streamStarted = true;
                  sendToken(delta);
                }
              } catch (_) {}
            }
          }

          sendDone();
          controller.close();
          return;
        } catch (err) {
          if (streamStarted) {
            sendToken(`\n\n*[Connection interrupted: ${err.message}]*`);
            sendDone();
            controller.close();
            return;
          }

          // If keys remain, retry next key
          if (attempts < maxAttempts && keyManager.keys.length > 1) {
            keyManager.rotateKey();
            continue;
          }

          sendError(err.message);
          sendDone();
          controller.close();
          return;
        }
      }
    },
  });

  return new Response(readableStream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
