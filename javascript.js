// Select all navbar buttons and all pages
const navLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("article");

// Add animation classes to elements
function addAnimations() {
  // Animate service items
  const serviceItems = document.querySelectorAll('.service-item');
  serviceItems.forEach((item, index) => {
    item.classList.add('animate-slide-in-up');
    item.style.animationDelay = `${index * 0.1}s`;
  });

  // Animate project cards
  const projectItems = document.querySelectorAll('.blog-post-item');
  projectItems.forEach((item, index) => {
    item.classList.add('animate-scale-in');
    item.style.animationDelay = `${index * 0.15}s`;
  });

  // Animate achievement cards
  const achievementItems = document.querySelectorAll('.testimonials-item');
  achievementItems.forEach((item, index) => {
    item.classList.add('animate-slide-in-left');
    item.style.animationDelay = `${index * 0.2}s`;
  });
}

// Animate skill bars when page becomes active
function animateSkillBars() {
  const skillBars = document.querySelectorAll('.skill-progress-fill');
  skillBars.forEach((bar, index) => {
    const targetWidth = bar.getAttribute('data-width');
    if (targetWidth) {
      // Reset width first
      bar.style.width = '0%';
      // Force reflow to ensure reset is applied
      void bar.offsetWidth;
      // Animate to target width after a short delay
      setTimeout(() => {
        bar.style.width = targetWidth;
        bar.style.transition = 'width 1.5s ease-out';
      }, 100 + (index * 100)); // Staggered animation
    }
  });
}

// Navigation event listener
navLinks.forEach(link => {
  link.addEventListener("click", () => {
    const targetPage = link.dataset.page;

    // Remove active from all buttons
    navLinks.forEach(btn => btn.classList.remove("active"));

    // Remove active from all pages
    pages.forEach(page => page.classList.remove("active"));

    // Add active to clicked button
    link.classList.add("active");

    // Show matching page
    pages.forEach(page => {
      if (page.dataset.page === targetPage) {
        page.classList.add("active");
        
        // Trigger animations for active page
        setTimeout(() => {
          addAnimations();
          if (targetPage === 'resume') {
            // Small delay to ensure page is visible before animating
            setTimeout(() => {
              animateSkillBars();
            }, 50);
          }
        }, 100);
      }
    });
  });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Reset skill bars to 0%
  const skillBars = document.querySelectorAll('.skill-progress-fill');
  skillBars.forEach(bar => {
    bar.style.width = '0%';
  });
  
  // Check if resume page is active on load
  const activePage = document.querySelector('article.active');
  if (activePage && activePage.dataset.page === 'resume') {
    setTimeout(() => {
      animateSkillBars();
    }, 100);
  }
  
  // Add initial animations
  setTimeout(() => {
    addAnimations();
  }, 500);
});

// Add hover effect to navbar links
navLinks.forEach(link => {
  link.addEventListener('mouseenter', () => {
    link.style.transform = 'translateY(-2px)';
  });
  
  link.addEventListener('mouseleave', () => {
    if (!link.classList.contains('active')) {
      link.style.transform = 'translateY(0)';
    }
  });
});


// ========== PROJECT MODAL ==========

const GITHUB_PROFILE = "https://github.com/VaibhavPattanshetti";

const projectItems = document.querySelectorAll("[data-project-item]");
const projectModal = document.querySelector("[data-project-modal]");
const projectOverlay = document.querySelector("[data-project-overlay]");
const projectCloseBtn = document.querySelector("[data-project-close]");

const modalTitle = document.querySelector("[data-project-modal-title]");
const modalSubtitle = document.querySelector("[data-project-modal-subtitle]");
const modalProblem = document.querySelector("[data-project-problem]");
const modalResult = document.querySelector("[data-project-result]");
const buttonsBox = document.querySelector("[data-project-buttons]");
const techBox = document.querySelector("[data-project-tech]");
const workBox = document.querySelector("[data-project-work]");

const projects = [
  {
    title: "NeuroScan AI: Neurological Disorder Classification",
    subtitle: "Deep Learning · Explainable AI · Medical Imaging",
    problem: "Classify brain MRI scans into 8 neurological conditions across 4 clinical groups while providing visual, interpretable diagnostic evidence via Grad-CAM and LIME to eliminate black-box decision-making in clinical workflows.",
    tech: ["Python", "TensorFlow 2.15", "Keras", "ResNet50", "Grad-CAM", "LIME", "Streamlit", "scikit-learn", "scikit-image", "NumPy"],
    work: [
      "Classified 8 conditions across 4 clinical groups from 24,588 brain MRI scans: Brain Tumors (Glioma, Meningioma, Pituitary), Alzheimer’s (Very Mild, Mild, Moderate), Multiple Sclerosis, and Healthy Normal",
      "Executed two-stage transfer learning using ResNet50: Stage 1 feature extraction (20 epochs, base frozen, LR 1e-4) and Stage 2 fine-tuning top 35 layers (12 epochs, LR 1e-5)",
      "Tackled severe dataset imbalance (8,104 Normal vs. 503 Moderate Alzheimer's) using Focal Loss (γ = 2.5), computed class weights, and real-time data augmentation (rotation, zoom, contrast)",
      "Implemented dual visual explainability: gradient-based Grad-CAM heatmaps on conv5_block3_out and model-agnostic LIME superpixel perturbations (100–800 samples)",
      "Developed a dark-themed Streamlit web app featuring scan upload, full 8-class probability charts, confidence bars, class-group badges, 2nd-best predictions, and downloadable diagnostic figures"
    ],
    result: "Achieved 92.0% validation accuracy and 0.9952 validation AUC (96% train accuracy / 0.9985 train AUC), with high precision across brain tumor classes on 24,588 scans.",
    links: [
      ["View on GitHub", "https://github.com/VaibhavPattanshetti/explainable-neurological-disorder-classification"]
    ]
  },
  {
    title: "Agentic RAG Chatbot with Long-Term Memory",
    subtitle: "Agentic AI · LangGraph · FastMCP",
    problem: "Build an autonomous conversational AI agent that dynamically decides whether to answer directly or delegate tasks to external tools (PDF RAG, web search, stocks, calculator, expense tracker) while retaining persistent cross-session memory.",
    tech: ["LangGraph", "OpenAI (GPT-4.1 & 4o-mini)", "FastMCP", "FAISS", "text-embedding-3-small", "SQLite", "Tavily", "Alpha Vantage", "Streamlit", "Python"],
    work: [
      "Engineered an autonomous StateGraph agent in LangGraph: START → remember_node → chat_node ⇄ tools → END with dynamic loop routing until the final answer is reached",
      "Implemented dual-layer memory: short-term thread chat history in SQLite via SqliteSaver, and long-term memory extracting atomic user facts with gpt-4o-mini & Pydantic into SqliteStore",
      "Built PDF RAG pipeline with PyPDF, 1000-char/200-overlap chunking, text-embedding-3-small embeddings, and thread-isolated FAISS vector stores",
      "Integrated 5 tools: Tavily advanced search with source citations, Alpha Vantage real-time stock quotes, arithmetic calculator, PDF RAG retriever, and a custom FastMCP server",
      "Architected a standalone FastMCP expense tracker server over stdio with SQLite WAL mode, exposing 7 tools (add, update, delete, list, summarize) and dynamic category JSON validation",
      "Developed a Streamlit UI with token-by-token streaming, live 'Using tool_name...' execution indicators, and multi-threaded session switching from past database threads"
    ],
    result: "Successfully orchestrated autonomous multi-step reasoning, dynamic tool selection, and persistent context retention across chat sessions.",
    links: [
      ["View on GitHub", "https://github.com/VaibhavPattanshetti/Agentic-RAG-Chatbot-with-Long-Term-Memory"]
    ]
  },
  {
    title: "Employee Designation & Salary Prediction",
    subtitle: "Machine Learning · Deployed Application · Docker",
    problem: "Build an end-to-end HR analytics system that predicts an employee's annual salary (regression), classifies appropriate job designation (classification), and clusters organizational compensation tiers.",
    tech: ["Python", "Scikit-learn", "Pandas", "NumPy", "Streamlit", "Docker", "Joblib", "Plotly"],
    work: [
      "Cleaned and engineered 8,349 employee records across 17 features: mean/mode imputation, ordinal encoding (Education/Designation), one-hot encoding, and MultiLabelBinarizer for 20 skillset columns into a 40-feature matrix",
      "Preserved legitimate high-experience management outliers (IQR-detected) to ensure reliable compensation modeling across senior executive tiers",
      "Trained and evaluated 5 regression models for salary: selected LassoCV (alpha=10) achieving test R² = 0.9011 (train R² = 0.898, zero overfitting) with MAE ≈ ₹6,586 and RMSE ≈ ₹8,176",
      "Applied SelectKBest (f_classif) to isolate top 3 designation drivers (Salary, Experience, Productivity Score) and trained 4 classifiers; selected SVM (RBF) achieving 71.3% test accuracy",
      "Performed unsupervised K-Means (k=4 via elbow method) and complete-linkage hierarchical clustering with 3D Plotly visualization to identify 4 distinct compensation bands (₹25K–₹100K)",
      "Built and deployed a dual-mode Streamlit app with fail-safe rule-based fallback logic, containerized using Docker (python:3.11-slim) and published to Docker Hub"
    ],
    result: "Achieved test R² = 0.9011 with Lasso regression for salary prediction and 71.3% accuracy with SVM for designation classification; deployed live on Streamlit Cloud and Docker Hub.",
    links: [
      ["View on GitHub", "https://github.com/VaibhavPattanshetti/employee-designation-and-salary-prediction"],
      ["Live Demo", "https://employee-designation-and-salary-prediction-4dxracux9jersbac2xl.streamlit.app/"],
      ["Docker Hub", "https://hub.docker.com/r/justvaibhav/employee-predictor"]
    ]
  },
  {
    title: "Alzheimer’s Disease Detection Using Deep Learning",
    subtitle: "Deep Learning · Medical Image Analysis · ResNet50V2",
    problem: "Develop a high-recall binary deep learning classifier to detect Alzheimer’s Disease vs. Normal brain MRI scans, minimizing dangerous false negatives in medical screening.",
    tech: ["Python", "TensorFlow/Keras", "ResNet50V2", "OpenCV", "scikit-learn", "NumPy", "Pandas", "Matplotlib", "Pillow"],
    work: [
      "Curated and validated a balanced dataset of 23,422 brain MRI scans (11,190 Alzheimer’s vs. 12,232 Normal) with an 80/20 train/validation split (18,738 train / 4,684 val)",
      "Applied conservative anatomical augmentation during training (±5° rotation, 5% zoom, 5% width/height shift) to prevent cranial distortion, paired with ResNetV2 preprocessing",
      "Constructed a custom transfer-learning head atop ResNet50V2: GlobalAveragePooling2D → BatchNormalization → Dense(64, ReLU) → Dropout(0.5) → Dense(1, Sigmoid)",
      "Fine-tuned the top 66 layers of ResNet50V2 using binary cross-entropy, Adam optimizer, and balanced class weights",
      "Executed a two-phase training strategy: Phase 1 (LR 1e-4, 10 epochs, val_loss checkpoint) followed by Phase 2 (LR 1e-5, 10 epochs, checkpoint maximized on val_recall to prioritize patient safety)"
    ],
    result: "Achieved 94.58% validation accuracy, 0.9914 AUC, and 0.9182 recall (0.97 Alzheimer's precision) with zero overfitting between train and validation performance.",
    links: [
      ["View on GitHub", "https://github.com/VaibhavPattanshetti/Alzheimer-Detection-Using-Deep-Learning"]
    ]
  },
  {
    title: "Quora Question Pairs: Duplicate Question Detection",
    subtitle: "NLP · Semantic Text Similarity · XGBoost",
    problem: "Determine whether two questions asked on Quora have duplicate semantic intent or represent distinct inquiries, reducing content redundancy and enhancing search quality.",
    tech: ["Python", "XGBoost (GPU)", "Gensim (Word2Vec)", "Scikit-learn", "NLTK", "FuzzyWuzzy", "BeautifulSoup", "SciPy", "Pandas", "NumPy"],
    work: [
      "Analyzed 404,287 question pairs across 537,929 unique questions, beating the 63.1% non-duplicate majority baseline by over 26 percentage points",
      "Built a robust NLP text normalization pipeline: contraction expansions (100+ patterns), currency/symbol conversion, BeautifulSoup HTML stripping, and regex token cleaning",
      "Engineered 37 handcrafted features: token overlaps, length differences, longest common substring, and FuzzyWuzzy metrics (partial ratio, token sort/set ratios)",
      "Trained a custom 300-dimensional Word2Vec model from scratch with Gensim (20 epochs) and computed 7 pairwise distance metrics (Cosine, Euclidean, Manhattan, Chebyshev, dot product)",
      "Extracted 10,001 sublinear TF-IDF unigram/bigram features with cosine similarity, constructing a high-dimensional 10,038-feature sparse matrix",
      "Trained a GPU-accelerated XGBoost classifier (depth 6, lr 0.05, hist tree method on CUDA) with early stopping converging at 4,804 trees"
    ],
    result: "Achieved 89.47% test accuracy and a low 0.2295 log-loss (official Kaggle metric) on 81,000 held-out test question pairs.",
    links: [
      ["View on GitHub", "https://github.com/VaibhavPattanshetti/quora-question-pair-nlp"]
    ]
  },
  {
    title: "Swiggy Data Analysis and Predictions",
    subtitle: "Data Science · Exploratory Data Analysis · Regression",
    problem: "Perform end-to-end data analysis on 8,680 restaurant listings across 9 major Indian cities to discover pricing trends, model food prices and delivery times, and formulate operational business recommendations.",
    tech: ["Python", "Pandas", "NumPy", "Scikit-learn", "Matplotlib", "Seaborn", "Jupyter Notebook"],
    work: [
      "Cleaned and curated a dataset of 8,680 restaurant records across 9 cities (Kolkata, Mumbai, Chennai, Pune, Hyderabad, Bangalore, Ahmedabad, Delhi, Surat) spanning ~833 areas",
      "Handled missing values with targeted statistical imputations (mean for price, median for ratings, mode for review count) and removed non-predictive identifiers",
      "Applied sequential column-by-column IQR outlier filtering (Delivery time, Price, Total ratings) to establish a clean modeling dataset of 7,660 records (88% retained)",
      "Conducted extensive univariate, bivariate, and correlation EDA: uncovered a 0.62 correlation between Price and Avg Ratings, dominant ₹500–₹600 order brackets, and extended delivery bottlenecks in Kolkata",
      "Trained two Linear Regression models (80/20 split): built a food price predictor reaching R² = 0.878 (RMSE ≈ ₹29.18) and a delivery time predictor (R² = 0.341, RMSE ≈ 11.24 mins)",
      "Formulated data-backed business strategies: sweet-spot menu pricing (₹500–₹600), delivery fleet expansion in slower metros, and review incentive programs for low-rating clusters"
    ],
    result: "Delivered an accurate price prediction model explaining 87.8% of price variance (RMSE ≈ ₹29.18) alongside comprehensive geographic and operational insights across 9 metro markets.",
    links: [
      ["View on GitHub", "https://github.com/VaibhavPattanshetti/Swiggy-Data-Analysis-and-Predictions"]
    ]
  }
];

function openProjectModal(index) {
  const p = projects[index];
  if (!p) return;

  if (modalTitle) modalTitle.innerText = p.title;
  if (modalSubtitle) modalSubtitle.innerText = p.subtitle;
  if (modalProblem) modalProblem.innerText = p.problem;
  if (modalResult) modalResult.innerText = p.result;

  if (buttonsBox) {
    buttonsBox.innerHTML = p.links
      .map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="github-btn">${label}</a>`)
      .join("");
  }

  if (techBox) {
    techBox.innerHTML = p.tech
      .map(t => `<span>${t}</span>`)
      .join("");
  }

  if (workBox) {
    workBox.innerHTML = p.work
      .map(w => `<li>${w}</li>`)
      .join("");
  }

  if (projectModal) projectModal.classList.add("active");
  if (projectOverlay) projectOverlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeProjectModal() {
  if (projectModal) projectModal.classList.remove("active");
  if (projectOverlay) projectOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

// Attach click listeners to all project cards
projectItems.forEach((item, index) => {
  item.style.cursor = "pointer";
  item.addEventListener("click", (e) => {
    e.preventDefault();
    openProjectModal(index);
  });
});

// Close button listener
if (projectCloseBtn) {
  projectCloseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closeProjectModal();
  });
}

// Overlay click listener
if (projectOverlay) {
  projectOverlay.addEventListener("click", closeProjectModal);
}

// Backdrop click listener (outside project-modal)
if (projectModal) {
  projectModal.addEventListener("click", (e) => {
    if (e.target === projectModal) {
      closeProjectModal();
    }
  });
}

// ESC key to close modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && projectModal && projectModal.classList.contains("active")) {
    closeProjectModal();
  }
});
