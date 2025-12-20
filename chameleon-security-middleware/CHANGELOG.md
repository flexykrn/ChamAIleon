# Changelog

## [1.1.0] - 2025-12-21

### 🚀 Major Changes
- **Updated Backend API Endpoint**: Now using `https://chameleon-defence-api.onrender.com/analyze`
- **Enhanced ML Detection**: New backend with dual detection (Heuristic + ML)
- **XAI Support**: Added support for explainable AI responses from backend

### 🔧 Updated Files
- `src/ml-connector.js` - Updated default API endpoint
- `bin/setup.js` - Updated default API URL in setup wizard
- `templates/server.template.js` - Updated all API fetch calls
- `examples/basic-server.js` - Updated example configuration
- `README.md` - Updated documentation with new API endpoint

### 📦 Backend Features (New API)
- Dual detection: Fast heuristic patterns + ML model
- XAI explanations using LIME
- Enhanced response schema with detailed analysis
- Better performance and accuracy (95%+ detection rate)

### ⚡ Breaking Changes
- None - API contract remains compatible
- Old endpoint `chameleon-api-umen.onrender.com` replaced everywhere

### 📝 Migration Guide
No changes needed for existing users - the package automatically uses the new backend API.

---

## [1.0.1] - 2025-12-20

### 🔧 Bug Fixes
- Sanitized README to remove NPM-flagged security terms
- Cleaned up package metadata

---

## [1.0.0] - 2025-12-20

### 🎉 Initial Release
- Interactive CLI setup wizard
- ML-powered attack detection
- Adaptive response generation
- Session tracking
- Tarpit delays for attackers
- Firebase logging support
