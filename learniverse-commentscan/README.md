# 🛡️ Vietnamese Comment Moderation Service

AI-powered service for detecting toxic, offensive, and hate speech in Vietnamese social media comments.

## DISCLAIMER

I vibed this. I vibed it so hard, I vibed my way out. Keep that in mind. Only thing human-made in this is the `docs` folder and this disclaimer part.

### About models used

By default (with the default requirements.txt) this should run a (really lightweight and fast) BiLSTM model that I trained. Accuracy is... acceptable, but model file is 40MB, and it can run on CPU fine.

If you want higher F1 macro accuracy, but only trained on ViHSD dataset (đồ người ta chứ tui không train con này), pass in `MODEL_TYPE=phobert` to use a pretrained model based on PhoBERT (SPhoBERT). This will download around 600MB. Also, it requires `transformers`. To use it, run:

```bash
pip install transformers
```

If you use Docker, add that to the end of step 1 build. I couldnt care enough to do so.

### CPU only or CUDA

By default also, if it finds a NVIDIA GPU on your computer (with CUDA installed) and installed `torch` supports, it will try to run with `cuda` on your GPU. If you dont need it, pass `FORCE_CPU` into the env vars. The default `Dockerfile` already install a CPU-only version of torch.

## Project Structure

```
learniverse-ai/
├── data/
│   ├── raw/                    # Raw datasets (ViHSD, ViCTSD)
│   ├── processed/              # Processed data
│   └── models/
│       └── deployment/         # Trained model files
│           ├── model_weights.pt
│           ├── config.json
│           └── vocab.json
├── notebooks/
│   └── train_bilstm.ipynb      # Training notebook (Colab compatible)
├── src/
│   ├── api/
│   │   └── main.py             # FastAPI service
│   ├── models/
│   │   ├── bilstm.py           # BiLSTM model
│   │   └── dataset.py          # Dataset utilities
│   ├── preprocessing/
│   │   └── text_preprocessor.py # Vietnamese text preprocessing
│   └── utils/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## Quick Start (for running it raw)

### 1. Install Dependencies

```bash
# Activate conda (if using conda), replace with your conda command.
source ~/miniconda3/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Prepare Data

Download the datasets and place them in `data/raw/`:

- **ViHSD**: https://github.com/sonlam1102/vihsd
- **ViCTSD**: https://github.com/tarudesu/ViCTSD

Expected files:
```
data/raw/
├── vihsd_train.csv
├── vihsd_dev.csv
├── vihsd_test.csv
├── victsd_train.csv
├── victsd_dev.csv
└── victsd_test.csv
```

### 3. Train the Model

**Option A: Local**
Ensure that you have installed the dependencies. For faster training, install CUDA too.
```bash
cd notebooks
jupyter notebook train_bilstm.ipynb
```

**Option B: Google Colab (recommended)**
1. Upload the project to Google Drive
2. Open `notebooks/train_bilstm.ipynb` in Colab
3. Run all cells
4. Download the trained model from `data/models/deployment/`

### 4. Run the API

**Option A: Direct Python**
```bash
cd src/api
python main.py
```

**Option B: Using uvicorn**
```bash
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

**Option C: Docker/Podman**
```bash
# Build
podman build -t learniverse-moderation .

# Run
podman run -p 8000:8000 -v ./data/models:/app/data/models:ro learniverse-moderation
```

**Option D: Docker Compose**
```bash
docker-compose up
```

### 5. Test the API

Open http://localhost:8000/docs for interactive API documentation.

**Example request:**
```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{"text": "Sản phẩm này tốt lắm!"}'
```

**Response:**
```json
{
  "success": true,
  "result": {
    "text": "Sản phẩm này tốt lắm!",
    "toxic_offensive": false,
    "hate_speech": false,
    "probabilities": {
      "toxic_offensive": 0.02,
      "hate_speech": 0.01
    },
    "is_flagged": false
  }
}
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service info |
| GET | `/health` | Health check |
| GET | `/labels` | Label descriptions |
| POST | `/predict` | Predict single comment |
| POST | `/predict/batch` | Predict multiple comments |

## 🔧 Configuration

### Model Configuration

Edit in `src/models/bilstm.py`:

```python
# Model sizes: 'small', 'base', 'large'
model_config = get_model_config('base')
```

| Size | Embedding | Hidden | Layers | VRAM |
|------|-----------|--------|--------|------|
| small | 128 | 64 | 1 | ~0.5GB |
| base | 256 | 128 | 2 | ~1GB |
| large | 512 | 256 | 3 | ~2GB |

### Preprocessing Options

Edit in `src/preprocessing/text_preprocessor.py`:

- `lowercase`: Convert to lowercase
- `remove_urls`: Remove URLs
- `normalize_teencode`: Convert slang to standard Vietnamese
- `word_segmentation`: Apply Vietnamese word segmentation

## Future Improvements

- [ ] Add spam detection
- [ ] Add confidence calibration
- [ ] Implement model versioning
- [ ] Add rate limiting

## 📝 License

MIT License

## Acknowledgments

- [UIT NLP Group](https://nlp.uit.edu.vn/) for Vietnamese datasets
- [VinAI](https://github.com/VinAIResearch) for PhoBERT
- [Underthesea](https://github.com/undertheseanlp) for Vietnamese NLP tools
