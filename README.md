# Speech Emotion Recognition (SER) Platform

A full-stack application that classifies human emotion directly from speech audio using deep learning. Supports CNN, LSTM, and CNN-LSTM hybrid architectures with optional NVIDIA LLM-powered natural language insights.

![React](https://img.shields.io/badge/React-18-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green) ![TensorFlow](https://img.shields.io/badge/TensorFlow-2.17-orange) ![Three.js](https://img.shields.io/badge/Three.js-168-black)

---

## 🎯 Features

- **Multi-Architecture Support**: CNN, BiLSTM, and CNN-LSTM hybrid with self-attention
- **Real-Time Emotion Classification**: 8 emotion classes (neutral, calm, happy, sad, angry, fearful, disgust, surprised)
- **NVIDIA LLM Integration**: Natural language explanations of acoustic cues driving predictions
- **Interactive 3D Landing Page**: Three.js particle visualization with emotion-reactive visuals
- **Live Demo**: Record audio or upload files with waveform display and confidence visualization
- **Multi-Dataset Support**: RAVDESS, TESS, and EMO-DB with unified label mapping

---

## 📁 Project Structure

```
speech-emotion-recognition/
├── backend/                    # Python ML pipeline + FastAPI service
│   ├── app/
│   │   ├── config.py          # Environment-based configuration
│   │   ├── main.py            # FastAPI application entry
│   │   ├── data_pipeline.py   # Dataset download & preprocessing
│   │   ├── training.py        # Model training pipeline
│   │   ├── models/            # CNN, LSTM, CNN-LSTM architectures
│   │   ├── routers/           # REST API endpoints
│   │   ├── services/          # Prediction & LLM services
│   │   └── utils/             # Audio processing, feature extraction
│   ├── data/                  # Raw datasets & extracted features
│   ├── saved_models/          # Trained model checkpoints
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/                   # React + Three.js landing page & demo UI
│   ├── src/
│   │   ├── components/        # UI components (Hero, Demo, Architecture, etc.)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Store, API client, utilities
│   │   └── App.jsx
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── docs/                       # Documentation
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- NVIDIA API key (optional, for LLM insights)
- Kaggle API credentials (for dataset download)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your NVIDIA_API_KEY

# Download and preprocess datasets
python -m app.data_pipeline --download --extract

# Train models
python -m app.training

# Start API server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Services:
# - Backend API: http://localhost:8000
# - Frontend: http://localhost:80
# - API Docs: http://localhost:8000/docs
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API information |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/models` | List available models |
| `POST` | `/api/predict` | Predict emotion from audio |
| `POST` | `/api/predict/insight` | Predict with LLM explanation |

### Example: Predict Emotion

```bash
curl -X POST http://localhost:8000/api/predict \
  -F "file=@sample_audio.wav" \
  -F "architecture=production"
```

### Response

```json
{
  "emotion": "angry",
  "confidence": 0.87,
  "per_class_scores": {
    "neutral": 0.02,
    "calm": 0.01,
    "happy": 0.03,
    "sad": 0.02,
    "angry": 0.87,
    "fearful": 0.02,
    "disgust": 0.01,
    "surprised": 0.02
  },
  "model_architecture": "production",
  "processing_time_ms": 156.4,
  "insight": "The elevated pitch and rapid speech rate indicate frustration."
}
```

---

## 🧠 Model Architectures

### CNN (Spectrogram-as-Image)

Input: 128×128 log-mel spectrogram

- Conv2D × 3 with BatchNorm + MaxPool
- GlobalAveragePooling → Dense(256) → Dropout(0.4)
- Softmax(8)

### BiLSTM (Sequential MFCCs)

Input: MFCC sequence (T × features)

- Bidirectional LSTM(128) → BatchNorm → Dropout
- Bidirectional LSTM(64) → BatchNorm → Dropout
- Dense(128) → Dropout(0.3) → Softmax(8)

### CNN-LSTM Hybrid (Primary Candidate)

Input: MFCC sequence (T × features)

- TimeDistributed Conv1D blocks for local spectral patterns
- Bidirectional LSTM(128) for temporal dependencies
- Multi-head self-attention layer
- Dense(128) → Dropout(0.3) → Softmax(8)

---

## 📊 Datasets

| Dataset | Speakers | Emotions | Language | Size |
|---------|----------|----------|----------|------|
| **RAVDESS** | 24 actors | 8 classes | English | ~1,440 files |
| **TESS** | 2 actresses | 7 classes | English | ~2,800 files |
| **EMO-DB** | 10 actors | 7 classes | German | ~535 files |

All datasets are unified to 8 emotion classes:
`neutral, calm, happy, sad, angry, fearful, disgust, surprised`

---

## 🛠️ Tech Stack

### Machine Learning

- **Libraries**: librosa, TensorFlow/Keras, scikit-learn, NumPy
- **Features**: MFCC, mel-spectrogram, chroma, ZCR, RMS energy
- **Training**: Class-weighted loss, early stopping, learning rate scheduling

### Backend

- **Framework**: FastAPI + Uvicorn
- **Validation**: Pydantic
- **LLM**: OpenAI-compatible client (NVIDIA NIM)

### Frontend

- **Framework**: React 18 + Vite
- **3D**: Three.js + React Three Fiber
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Audio**: WaveSurfer.js

---

## 🔐 Security

- API keys stored in environment variables (never hardcoded)
- File upload validation (type and size limits)
- CORS restricted to configured origins
- Rate limiting on prediction endpoints (recommended for production)

---

## 📈 Performance Targets

| Metric | Target |
|--------|--------|
| Classification accuracy | ≥ 85% |
| Macro F1-score | ≥ 0.80 |
| Inference latency (CPU) | < 800ms |
| Inference latency (GPU) | < 150ms |
| Lighthouse score | ≥ 90 |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [RAVDESS Dataset](https://zenodo.org/record/1188976)
- [TESS Dataset](https://www.kaggle.com/datasets/ejlok1/toronto-emotional-speech-set-tess)
- [EMO-DB Dataset](https://www.kaggle.com/datasets/piyushagni5/berlin-database-of-emotional-speech-emodb)
- [NVIDIA NIM](https://build.nvidia.com/) for LLM inference
- [Three.js](https://threejs.org/) for 3D visualization
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/) for React integration

---

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with ❤️ for the speech emotion recognition research community**
