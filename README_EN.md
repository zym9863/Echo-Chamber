# Echo Chamber

[中文](./README.md) | **English**

A mental health-focused emotion recording and time mail application that helps users record their moods, manage emotions, and communicate with their future selves.

## ✨ Features

### 🕰️ Time Mail
- Seal current emotions and words to your future self
- Set specific dates to unlock, letting time heal and settle emotions
- Support text content, with voice and image support coming soon
- View all mail statuses: sealed, openable, opened

### 🧩 Mood Jigsaw
- Record daily emotions through colors and imagery cards
- Set emotion intensity and mood notes
- View emotion history and statistics
- Generate unique emotion puzzle patterns to understand emotional patterns

### 📊 Data Statistics
- Display total time mails and openable mail count
- Emotion record statistics and analysis
- Average emotion intensity calculation
- Primary emotion type analysis

## 🛠️ Tech Stack

- **Frontend Framework**: Vue 3 + TypeScript
- **Build Tool**: Vite
- **UI Component Library**: Element Plus
- **State Management**: Pinia
- **Routing**: Vue Router
- **Local Storage**: Dexie (IndexedDB)
- **Date Processing**: Day.js
- **Icons**: Element Plus Icons

## 📁 Project Structure

```
src/
├── components/          # Common components
│   └── HelloWorld.vue  # Example component
├── views/              # Page components
│   ├── Home.vue        # Home page
│   ├── TimeMail.vue    # Time mail page
│   └── MoodJigsaw.vue  # Mood jigsaw page
├── services/           # Business logic services
│   └── database.ts     # Database operation services
├── stores/             # State management
│   └── main.ts         # Main state store
├── router/             # Router configuration
│   └── index.ts        # Route definitions
├── db/                 # Database configuration
│   └── index.ts        # Dexie database configuration
├── assets/             # Static assets
└── App.vue             # Root component
```

## 🚀 Quick Start

### Requirements
- Node.js >= 16
- pnpm (recommended) or npm

### Install Dependencies
```bash
pnpm install
```

### Development
```bash
pnpm dev
```

### Build for Production
```bash
pnpm build
```

### Preview Production Build
```bash
pnpm preview
```

## 🗄️ Data Structure

### Time Mail (TimeMail)
- Title, content, type (text/voice/image)
- Create time, open time
- Open status

### Mood Record (MoodRecord)
- Date, color, emotion type
- Image card, emotion intensity
- Mood notes

### Configuration Data
- Mood Color: Preset emotion colors and categories
- Emotion Card: Icons and names for emotion expression

## 🎯 Future Plans

- [ ] Voice recording support
- [ ] Image upload functionality
- [ ] Emotion analysis and suggestions
- [ ] Data export functionality
- [ ] Theme customization
- [ ] Mobile adaptation optimization

## 📄 License

This project is for learning and personal use only.