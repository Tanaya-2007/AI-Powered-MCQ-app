# 🎯 QuizMaster - Interactive Quiz Platform UI

## 📋 Table of Contents

- [About](#-about)
- [Developer's Note](#-developers-note)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Contact](#-contact)

---

## 🚀 About

**QuizMaster** is a fully responsive, modern UI for a quiz platform. This project showcases a complete frontend implementation with beautiful animations, smooth transitions, and an intuitive user experience for both quiz creators and participants.

> **⚠️ Current Status:** This project currently features a **complete, production-ready frontend**. Backend integration with Socket.io for real-time features is in active development and will be added soon!

### 🎯 What Works Now

- ✅ Full quiz creation and management UI
- ✅ Interactive quiz-taking experience
- ✅ Simulated real-time features (using mock data)
- ✅ Complete responsive design
- ✅ All animations and transitions
- ✅ Question preview and editing system
- ✅ Custom modals and popups

### 🚀 Coming Soon

- 🔄 Socket.io real-time integration
- 🔄 Backend API with Node.js/Express
- 🔄 Database integration (MongoDB)
- 🔄 User authentication (JWT based)
- 🔄 Actual quiz generation logic

---

## ✨ Features

### 🎨 UI Components

- **Landing Page** - Attractive hero section with mode selection
- **Quiz Creation Interface** - Material upload UI with multiple input methods
- **Question Editor** - Full CRUD operations for quiz questions
- **Quiz Lobby** - Participant management and real-time updates simulation
- **Live Quiz Session** - Question display with timer and answer selection
- **Result Pages** - Question-wise results and final leaderboard
- **Responsive Design** - Works seamlessly on mobile, tablet, and desktop

### 🎯 Interactive Elements

- ✅ **Custom Modals** - Beautiful popups for confirmations and previews
- ✅ **Toast Notifications** - Success/error messages with animations
- ✅ **Progress Bars** - Visual score representation
- ✅ **Keyboard Shortcuts** - A, B, C, D keys for answer selection
- ✅ **Smooth Animations** - Fade-ins, slide-ins, and confetti effects
- ✅ **Loading States** - Quiz generation spinners

### 🏆 Key UI Screens

- ✅ **Mode Selection** - Solo vs Collaborative mode
- ✅ **Create Quiz** - Upload materials and configure settings
- ✅ **Preview & Edit** - Review generated questions with edit/delete options
- ✅ **Quiz Lobby** - Waiting room with participant list and activity feed
- ✅ **Question Card** - Timer, options, and answer locking
- ✅ **Question Results** - Answer breakdown and mini leaderboard
- ✅ **Final Leaderboard** - Podium display with search and filters

---

## 🛠️ Tech Stack

### Frontend Framework

- **React 18** - Component-based UI library
- **React Router v6** - Client-side routing and navigation
- **Create React App** - React project setup and build tool

### Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Custom CSS Animations** - Keyframes and transitions
- **Responsive Design** - Mobile-first approach

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Start the development server**
```bash
npm start
# or
yarn start
```

4. **Open your browser**

The app will automatically open at `http://localhost:3000`

### Available Scripts

In the project directory, you can run:

#### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

#### `npm test`
Launches the test runner in interactive watch mode

#### `npm run build`
Builds the app for production to the `build` folder

#### `npm run eject`
**Note: this is a one-way operation. Once you eject, you can't go back!**

---

## 📖 Usage

### Navigation Flow

1. **Landing Page** → Choose Solo or Collaborative mode
2. **Create Quiz** → Upload materials and configure settings
3. **Preview & Edit** → Review and customize questions
4. **Quiz Lobby** → Wait for participants (collaborative mode)
5. **Quiz Session** → Answer questions with timer
6. **Results** → View question results and final leaderboard

### Mock Data

The project includes mock data for demonstration:
- Sample questions with multiple choice options
- Simulated participants with avatars
- Random scores and answer distributions
- Generated quiz codes (6-character alphanumeric)
- Simulated real-time events (join/leave)

---


## 🎨 UI Components Overview

### CreateQuiz.jsx
- **Multi-tab Material Upload** - Text, Image, PDF, Voice input options
- **Quiz Settings** - Difficulty, question count (1-100), time per question (30s-5min)
- **Question Preview Modal** - Scrollable list of all generated questions
- **Question Editor** - Full edit capability with real-time change detection
- **Custom Delete Popup** - Beautiful confirmation with question preview
- **Success Popup** - Quiz code display with copy and share options
- **Smart Save Button** - Disabled when no changes are detected

### QuizLobby.jsx
- **Real-time Participant List** - Simulated with setTimeout animations
- **Quiz Code Display** - Large, copyable quiz code
- **Activity Feed** - Live join/leave notifications
- **Host Controls** - Start Quiz button (visible to host only)
- **Participant Avatars** - Crown icon for host identification
- **Share Functionality** - Native share API or clipboard copy

### CollabQuizSession.jsx
- **Question Display** - Clean card design with question number
- **Countdown Timer** - Visual timer with color changes 
- **Answer Selection** - Touch-friendly multiple choice buttons
- **Answer Locking** - Visual confirmation after selection
- **Live Mini Leaderboard** - Top 5 players sidebar
- **Host Controls** - Show Results, Next Question, End Quiz buttons

### QuestionResultPage.jsx
- **Correct Answer Reveal** - Green highlight on correct option
- **Answer Distribution** - Visual representation of participant answers
- **Updated Leaderboard** - Score changes highlighted
- **Confetti Animation** - Celebration effect
- **Auto-redirect** - Countdown to next question (5 seconds)


### FinalLeaderboardPage.jsx
- **Top 3 Podium** - Medal display (🥇🥈🥉) with elevated winner
- **Searchable List** - Filter participants by name
- **Score Progress Bars** - Visual representation of scores
- **Responsive Grid** - Adapts to screen size
- **Confetti Celebration** - Continuous animation

---
---

## 🎯 Key Features Showcase

### 🎨 Custom Modals
- **Delete Confirmation** - Shows question preview before deletion with warning icon
- **Question Editor** - Full edit capability with validation and save state
- **Save Button State** - Automatically disabled when no changes detected
- **Success Popup** - Quiz code display with copy and share options
- **Beautiful Animations** - Fade-in and scale effects


### 📱 Responsive Design
- **Mobile First** - Optimized for screens 375px and up
- **Tablet Layouts** - Adjusted spacing and columns for medium screens
- **Desktop View** - Multi-column layouts for large screens
- **Touch Friendly** - Large tap targets (44px minimum) for mobile
- **Adaptive Text** - Font sizes adjust by breakpoint 
- **Flexible Grids** - CSS Grid and Flexbox for layouts


### ⌨️ Keyboard Shortcuts
- **A, B, C, D Keys** - Quick answer selection during quiz
- **Visual Feedback** - Keys highlighted on screen when pressed
- **Active Only** - Works only during active quiz session
- **Desktop Optimized** - Mobile shows large tap-friendly buttons instead
- **Accessibility** - Focus states for keyboard navigation

---

<div align="center">
**Made with ❤️ by Tanaya**
</div>