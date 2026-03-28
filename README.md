<img width="1897" height="783" alt="image" src="https://github.com/user-attachments/assets/8f5cf332-8cc0-4624-b540-cc07568cfb8a" />



# Coach.ai - AI Interview Intelligence

Coach.ai is a professional, high-performance interview preparation platform powered by Google's Gemini 3.1 Live API. It provides a realistic, low-latency simulation of a high-stakes interview, offering real-time feedback on both verbal content and non-verbal communication.

## 🚀 Features

- **Gemini 3.1 Live API Integration**: Experience ultra-low latency, natural voice conversations with an AI coach that can see and hear you.
- **Context-Aware Preparation**: Upload your resume (TXT) and specify your target role. The AI analyzes your background to ask highly relevant, industry-specific questions.
- **Real-time Visual Analysis**: Receive immediate feedback on your posture, eye contact, and facial expressions during the session.
- **Audio Intelligence**: Track your speaking clarity, confidence levels, and engagement in real-time.
- **Performance Analytics**: At the end of every session, receive a comprehensive Markdown report including:
  - Overall Performance Score (0-100)
  - Key Strengths and Weaknesses
  - Specific areas for improvement
  - Behavioral and technical depth analysis
- **Privacy-First Design**: All audio and video streams are processed ephemerally. No media is stored on servers.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS 4, Lucide Icons
- **Animations**: Motion (Framer Motion)
- **AI Engine**: `@google/genai` (Gemini 3.1 Flash Live)
- **Audio**: Web Audio API (PCM 16-bit / 16kHz)

## 📋 Prerequisites

- Node.js (v18 or higher)
- A Google Gemini API Key (Get one at [Google AI Studio](https://aistudio.google.com/))

## ⚙️ Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd coach-ai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open the application**:
   Navigate to `http://localhost:3000` in your browser.

## 📖 How to Use

1. **Preparation**:
   - Go to the **Preparation** tab.
   - Paste or upload your resume text.
   - Enter the job title and company you are interviewing for.
2. **Start Interview**:
   - Click "Begin Interview Session".
   - Grant camera and microphone permissions when prompted.
3. **The Session**:
   - The AI Coach will introduce itself and ask the first question.
   - Speak naturally. Watch the sidebar for real-time metrics on your delivery.
4. **Review**:
   - Click "End Session" to conclude.
   - A detailed **Performance Report** will automatically be generated based on the transcript and visual data.

## 📄 License

This project is licensed under the Apache-2.0 License.
