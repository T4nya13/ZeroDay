# 🔐 ZeroDay - Behavior based authentication and live face recognition.


## 📌 Overview

<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; color: white;">

**ZeroDay** is a full-stack biometric authentication platform. It uses face recognition for user login, handles secure credential storage, and includes features like SIM swap detection and login anomaly detection.
</div>

## ✨ What It Does

- 🎭 **Face-based login** and user enrollment
- 🔐 **Secure authentication** behavior based authentication by tracking user mousepad and keyboard.  
- 🚨 **SIM swap & anomaly detection** for suspicious activity
- 📊 **Dashboard** for monitoring logins
- 🔌 **REST API** for all core features
- 🗄️ **PostgreSQL database** for user data

## 🏗️ How It's Built

**Frontend:** React | **Backend:** Flask + DeepFace | **Database:** PostgreSQL (Supabase)

```
       React Frontend
            ↓ (HTTPS)
      Flask Backend API
            ↓ (SQL)
    PostgreSQL Database
```

---

## 🚀 Getting Started

### Backend Setup

```bash
cd Backend
pip install -r requirements.txt
```

**Create `.env` file:**
```env
FLASK_ENV=development
DATABASE_URL=your_supabase_url
JWT_SECRET=your_secret_key
```

**Initialize database:**
```bash
psql -U postgres -d your_db < database_schema.sql
```

**Run the server:**
```bash
python app.py
```


### Frontend Setup

```bash
cd Frontend
npm install
```

**Create `.env` file:**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_key
```

**Start dev server:**
```bash
npm start
```


## 💡 Core Features

### 🎯 What You Can Do

- ✅ Register with face enrollment
- ✅ Login using face recognition  
- ✅ View your authentication history
- ✅ See login analytics on dashboard
- ✅ Get alerted on unusual activity



## 📂 Project Structure

```
ZeroDay/
│
├── 🎨 Frontend/
│   ├── src/
│   │   ├── components/        (React UI components)
│   │   ├── services/          (API integration)
│   │   ├── config/            (App configuration)
│   │   └── styles/            (CSS files)
│   └── public/                (Static assets)
│
├── ⚙️ Backend/
│   ├── app.py                 (Flask main app)
│   ├── face_recognition_core.py
│   ├── face_recognition_api.py
│   ├── database_schema.sql
│   └── requirements.txt
│
└── 📖 README.md
```


## 🌍 Production Deployment

### Build Frontend
```bash
cd Frontend
npm run build  # Creates optimized build/
```

### Production Backend
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```


## 📋 Tech Stack at a Glance

```
┌─────────────────────────────────────────┐
│  React 19 + Supabase (Frontend)         │
├─────────────────────────────────────────┤
│  Flask + DeepFace + OpenCV (Backend)    │
├─────────────────────────────────────────┤
│  PostgreSQL + JWT + bcrypt (Security)   │
├─────────────────────────────────────────┤
│  TensorFlow (Face Recognition Model)    │
└─────────────────────────────────────────┘
```

## 📜 License

- **Frontend & Backend:** MIT License
- **Dependencies:** See individual package licenses
- **AI Models:** TensorFlow, DeepFace (open source)
- **Database:** PostgreSQL License

---



## 📅 Version History

| Version | Date | Notes |
|---------|------|-------|
| **v1.0** | August 2025 | Initial prototype release |

---

<div style="text-align: center; padding: 20px; background: #f0f4ff; border-radius: 8px; margin-top: 30px;">

**Made with ❤️ for secure biometric authentication**

⭐ If you find this useful, consider starring the repo!

</div>
