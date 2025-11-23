# 🔐 Chameleon Authentication Flow with ML Classification

## Overview
Both Sign-Up and Sign-In pages now integrate with the Chameleon ML classifier to detect and redirect attackers BEFORE they interact with Firebase Authentication.

---

## 🎯 User Flow

### **1. Sign-Up Page** (`/authentication/signuppage`)

#### For Normal Users (Benign Input):
1. User fills form: First Name, Last Name, Email, Password
2. Clicks "Submit"
3. **Classification happens FIRST** → Inputs sent to `/api/classify`
4. Result: `classification: "Benign"`
5. ✅ Account created in Firebase Auth
6. ✅ User data stored in Firestore `users` collection
7. ✅ Redirected to `/dashboard`
8. 📊 Logged in Firebase `attacks` collection with verdict "Benign"

#### For Attackers (Malicious Input - SQLi/XSS):
1. Attacker enters malicious payload in any field
2. Clicks "Submit"
3. **Classification happens FIRST** → Inputs sent to `/api/classify`
4. Result: `classification: "SQLi"` or `"XSS"` or `"honey trigger"`
5. 🎣 Shows message: "Creating your account..."
6. 🎣 **Redirected to `/trap`** (fake banking dashboard)
7. ❌ NO Firebase account created
8. 📊 Logged in Firebase `attacks` collection with full details (IP, GeoIP, XAI)

---

### **2. Sign-In Page** (`/authentication/signinpage`)

#### For Normal Users (Benign Input):
1. User enters email and password
2. Clicks "Submit"
3. **Classification happens FIRST** → Inputs sent to `/api/classify`
4. Result: `classification: "Benign"`
5. ✅ Firebase authentication proceeds
6. ✅ Redirected to `/dashboard` (real banking dashboard)
7. 📊 Logged in Firebase `attacks` collection with verdict "Benign"

#### For Attackers (Malicious Input):
1. Attacker enters malicious payload (e.g., `' OR 1=1 --`)
2. Clicks "Submit"
3. **Classification happens FIRST** → Inputs sent to `/api/classify`
4. Result: `classification: "SQLi"` or `"XSS"` or `"honey trigger"`
5. 🎣 Shows message: "Verifying credentials..."
6. 🎣 **Redirected to `/trap`** (honeypot)
7. ❌ Firebase authentication NEVER called
8. 📊 Logged in Firebase `attacks` collection with full details

---

## 🔄 Complete Attack Detection Flow

```
User Input → ML Classifier → Decision
                               ├─ Benign → Firebase Auth → Real Dashboard
                               └─ Malicious → Log Attack → Redirect to Trap
```

---

## 📊 What Gets Logged in Firebase

Every authentication attempt (benign or malicious) is logged in the `attacks` collection:

```javascript
{
  // Attack Details
  input: "Login: Email=attacker@test.com",
  payload: "attacker@test.com ' OR 1=1 --",
  classification: "SQLi",
  verdict: "SQLi",
  confidence: 0.95,
  
  // Detection Info
  detectedBy: "Chameleon Model (Cortex)",
  xaiExplanation: { /* XAI data */ },
  
  // Attacker Info
  ip: "103.x.x.x",
  clientIp: "103.x.x.x",
  country: "India",
  city: "Mumbai",
  latitude: 19.0760,
  longitude: 72.8777,
  
  // Request Info
  endpoint: "/authentication/signinpage",
  httpMethod: "POST",
  userAgent: "Mozilla/5.0...",
  
  // Timestamps
  timestamp: Firestore.serverTimestamp(),
  timestampISO: "2025-11-23T10:30:45.123Z"
}
```

---

## 🎣 Trap Features

Once redirected to `/trap`, attackers see:
- Fake banking dashboard (identical to real one)
- Fake balance: ₹1,250,000.50
- Transfer form that logs every attempt
- Realistic loading messages (6-second delay)
- Generic error messages (no technical details)
- All actions logged to Firebase

---

## 🧪 Testing Guide

### Test Benign Signup:
```
First Name: John
Last Name: Doe
Email: john.doe@example.com
Password: SecurePass123
```
**Expected:** Account created → Dashboard

### Test Malicious Signup:
```
First Name: John
Last Name: Doe' OR 1=1 --
Email: test@example.com
Password: password
```
**Expected:** Redirected to Trap → No account created

### Test Benign Login:
```
Email: legitimate@user.com
Password: mypassword123
```
**Expected:** Login successful → Dashboard

### Test Malicious Login:
```
Email: admin@example.com
Password: ' OR '1'='1
```
**Expected:** Redirected to Trap → Firebase auth never called

---

## 🔍 Monitoring

View all attempts in:
1. **Firebase Console**: Firestore → `attacks` collection
2. **Forensic Dashboard**: `/forensics` page (real-time monitoring)

---

## 🛡️ Security Benefits

1. ✅ **Pre-Authentication Detection**: Attackers caught BEFORE Firebase interaction
2. ✅ **No Data Pollution**: No fake accounts in Firebase Auth
3. ✅ **Complete Logging**: All attempts logged with GeoIP and XAI
4. ✅ **Seamless Deception**: Attackers think they're in real system
5. ✅ **Time Wasting**: 6-second delays per trap action
6. ✅ **Pattern Analysis**: Collect multiple attack samples from same attacker

---

## 📝 Notes

- **All attempts are logged** (benign and malicious) for audit trail
- **Malicious = anything not "Benign", "Safe", or "Unknown"**
- **Trap is persistent**: Attackers stay in honeypot for entire session
- **Real users never see trap**: Only malicious inputs trigger redirect
- **GeoIP tracking**: Country, city, coordinates logged automatically
