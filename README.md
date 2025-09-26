# 🎯 Live Staff MVP

Ein modernes Staff-Management System für Tablets, optimiert für Live-Updates und faire Mitarbeiterverteilung.

## ✨ Features

- **👥 Mitarbeiterverwaltung** - Mitarbeiter anlegen, bearbeiten, Status setzen
- **🏢 Bereichsverwaltung** - Verschiedene Arbeitsbereiche mit Kapazitätslimits
- **🎯 Faire Verteilung** - Intelligenter Algorithmus für automatische Zuweisung
- **⚡ Live-Updates** - Real-time Synchronisation zwischen allen Geräten
- **📱 Tablet-optimiert** - Kompaktes Design für Touch-Bedienung
- **🔒 Authentifizierung** - Sicheres Login-System

## 🚀 Deployment

### Railway (Empfohlen)

1. Fork/Clone dieses Repository
2. Gehe zu [Railway.app](https://railway.app)
3. Verbinde mit GitHub und wähle dieses Repository
4. Railway deployed automatisch!

### Lokale Entwicklung

```bash
# Backend starten
cd server
npm install
npm run dev

# Frontend starten (neues Terminal)
cd web  
npm install
npm run dev
```

## 🔧 Konfiguration

### Standard Login
- **Username:** admin
- **Password:** admin123

### Bereiche
- UG (Kapazität: 1)
- UG_ZG (Kapazität: 2)  
- EG (Kapazität: 1)
- EG_ZG (Kapazität: 2)
- 1_OG (Kapazität: 1)
- 1_OG_ZG (Kapazität: 2)
- 2_OG (Kapazität: 1)

## 📚 Tech Stack

- **Backend:** Node.js, Express, Socket.IO, SQLite
- **Frontend:** React, Vite, Tailwind CSS
- **Real-time:** WebSockets für Live-Updates
- **Database:** SQLite (Railway kompatibel)

## 🎮 Verwendung

1. **Login** mit admin/admin123
2. **Mitarbeiter anlegen** über das Eingabefeld
3. **Bereiche verwalten** - Kapazitäten einstellen
4. **Fair verteilen** - Automatische Zuweisung per Klick
5. **Live-Updates** - Alle Tablets sehen Änderungen sofort

---

*Entwickelt für optimales Staff-Management auf Tablets* 🚀
# Railway Deployment Fix - Fri Sep 26 23:26:05 CEST 2025
