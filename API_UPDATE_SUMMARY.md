# Backend API Update Summary

## ✅ Updated Backend Endpoint

**New API URL**: `https://chameleon-defence-api.onrender.com/analyze`
**Old API URL**: `https://chameleon-api-umen.onrender.com/analyze` (replaced everywhere)

---

## 📦 Backend Structure Analysis

### New Backend Files:
- ✅ `classify_api.py` - FastAPI server with enhanced response schema
- ✅ `chameleon_engine.py` - ML engine with heuristic reflex patterns
- ✅ `chameleon_xai.py` - Explainable AI using LIME
- ✅ `chameleon_brain.pkl` - Trained ML model
- ✅ `render.yaml` - Render deployment config
- ✅ `requirements.txt` - Python dependencies

### New API Response Schema:
```json
{
  "status": 200,
  "message": "Processed",
  "client_ip": "1.2.3.4",
  "timestamp": "2025-12-21T00:00:00",
  "endpoint": "/analyze",
  "http_method": "POST",
  "payload": "input text",
  "analysis": {
    "verdict": "SQLi | XSS | Benign",
    "confidence": 0.95,
    "detected_by": "ML Model | Heuristic",
    "xai_explanation": {
      "target_class": "SQLi",
      "contributors": [
        {
          "feature": "union",
          "impact": 0.8,
          "type": "positive"
        }
      ]
    }
  }
}
```

---

## 🔄 Files Updated

### Main Application (`chameleon/`)
1. ✅ `app/api/classify/route.js` - Main classification endpoint
2. ✅ `app/test-classify/page.jsx` - Test page UI

### Security Middleware (`chameleon-security-middleware/`)
1. ✅ `bin/setup.js` - Interactive setup wizard
2. ✅ `src/ml-connector.js` - ML API connector
3. ✅ `examples/basic-server.js` - Example server
4. ✅ `templates/server.template.js` - Generated server template
5. ✅ `README.md` - Documentation

### Documentation
1. ✅ `README.md` - Main repository README

---

## 🎯 API Features

### Request Format:
```json
{
  "payload": "user input to analyze"
}
```

### Detection Methods:
1. **Heuristic Reflex** (Fast, regex-based):
   - SQLi patterns: `union select`, `OR 1=1`, `--`, `/**/`
   - XSS patterns: `<script>`, `javascript:`, `onerror=`, `alert()`

2. **ML Classification** (Accurate, model-based):
   - Random Forest Classifier
   - TF-IDF feature extraction
   - 95%+ accuracy

3. **XAI Explanation** (LIME):
   - Feature importance
   - Impact scores
   - Interpretability

---

## 🚀 Deployment

### Backend Deployment:
- **Platform**: Render.com
- **Runtime**: Python 3.10+
- **Command**: `uvicorn classify_api:app --host 0.0.0.0 --port $PORT`
- **Health Check**: `https://chameleon-defence-api.onrender.com/health`

### Frontend Integration:
All frontend applications now use the new API endpoint automatically.

---

## ✅ Verification Checklist

- [x] Updated all API references in frontend
- [x] Updated middleware package
- [x] Updated documentation
- [x] New backend deployed
- [x] Enhanced response schema with XAI
- [x] Heuristic + ML dual detection

---

## 🔧 Testing

To test the new API:

```bash
# Test health check
curl https://chameleon-defence-api.onrender.com/health

# Test classification
curl -X POST https://chameleon-defence-api.onrender.com/analyze \
  -H "Content-Type: application/json" \
  -d '{"payload": "SELECT * FROM users WHERE id=1 OR 1=1"}'
```

Expected response:
```json
{
  "status": 200,
  "message": "Threat detected",
  "analysis": {
    "verdict": "SQLi",
    "confidence": 0.98,
    "detected_by": "Heuristic",
    "xai_explanation": { ... }
  }
}
```

---

## 📝 Notes

- The new backend includes **XAI explanations** for better attack understanding
- **Dual detection**: Fast heuristic + accurate ML model
- **Enhanced logging**: Includes endpoint, HTTP method, timestamp
- All old references to `chameleon-api-umen` have been removed
- The API is backward compatible with existing frontend code

---

**Last Updated**: December 21, 2025
**API Version**: 2.0
**Backend Stack**: FastAPI + scikit-learn + LIME
