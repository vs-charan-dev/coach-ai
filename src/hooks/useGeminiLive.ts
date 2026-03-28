/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { useEffect, useRef, useState, useCallback } from "react";
import { float32ToPcm16, pcm16ToFloat32, AudioPlayer } from "../lib/audio-utils";

export interface TranscriptItem {
  role: "user" | "model";
  text: string;
  timestamp: number;
}

export interface SessionContext {
  resumeText: string;
  jobDescription: string;
}

export function useGeminiLive() {
  const [isActive, setIsActive] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<string | null>(null);
  
  const sessionRef = useRef<any>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const videoIntervalRef = useRef<number | null>(null);

  const stopSession = useCallback(async () => {
    setIsActive(false);
    
    if (videoIntervalRef.current) {
      window.clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }

    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop();
      audioPlayerRef.current = null;
    }

    // Generate analytics if we have a transcript
    if (transcripts.length > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const transcriptText = transcripts.map(t => `${t.role}: ${t.text}`).join("\n");
        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-preview",
          contents: `Analyze this interview transcript and provide a detailed performance report. 
          Include: (1) Overall Score (0-100), (2) Strengths, (3) Weaknesses, (4) Specific areas to work on.
          Format the response in clear Markdown.
          
          Transcript:
          ${transcriptText}`,
        });
        setAnalytics(response.text || "No analytics generated.");
      } catch (err) {
        console.error("Failed to generate analytics:", err);
      }
    }
  }, [transcripts]);

  const startSession = useCallback(async (context: SessionContext, videoElement: HTMLVideoElement) => {
    try {
      setError(null);
      setAnalytics(null);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      audioPlayerRef.current = new AudioPlayer(24000);

      const systemInstruction = `You are an expert AI interview coach. 
      You have access to the user's video feed and their resume/job context.
      
      User's Resume: ${context.resumeText || "Not provided"}
      Applying for: ${context.jobDescription || "Not provided"}
      
      Listen carefully and watch the user. After each answer, give clear and concise feedback on: 
      (1) the content of their answer (relevance to resume/job), 
      (2) their delivery (confidence, filler words, clarity), 
      (3) their body language/visual presence,
      (4) one specific suggestion to improve. 
      
      Keep your tone encouraging but honest. Ask relevant follow-up questions based on their resume and the job they want.`;

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            startMedia();
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.find(p => p.inlineData)?.inlineData?.data;
            if (base64Audio && audioPlayerRef.current) {
              const samples = pcm16ToFloat32(base64Audio);
              audioPlayerRef.current.play(samples);
            }

            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.text) {
                const text = part.text;
                setTranscripts(prev => {
                  const last = prev[prev.length - 1];
                  if (last && last.role === "model" && (Date.now() - last.timestamp < 1000)) {
                    return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                  }
                  return [...prev, { role: "model", text, timestamp: Date.now() }];
                });
              }
            }
          },
          onclose: () => stopSession(),
          onerror: (err) => {
            console.error("Gemini Live Error:", err);
            setError("Connection error. Please try again.");
            stopSession();
          },
        },
      });

      sessionRef.current = await sessionPromise;

      async function startMedia() {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: { width: 640, height: 480, frameRate: 15 } 
        });
        mediaStreamRef.current = stream;
        videoElement.srcObject = stream;

        // Audio Processing
        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (!sessionRef.current) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = float32ToPcm16(inputData);
          sessionRef.current.sendRealtimeInput({
            audio: { data: pcmData, mimeType: "audio/pcm;rate=16000" }
          });
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        // Video Processing (Send frame every 1 second)
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        videoIntervalRef.current = window.setInterval(() => {
          if (!sessionRef.current || !videoElement || !ctx) return;
          canvas.width = 320;
          canvas.height = 240;
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const base64Image = canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
          sessionRef.current.sendRealtimeInput({
            video: { data: base64Image, mimeType: "image/jpeg" }
          });
        }, 1000);
      }

    } catch (err) {
      console.error("Failed to start session:", err);
      setError("Failed to access media or connect to AI.");
      stopSession();
    }
  }, [stopSession]);

  return {
    isActive,
    transcripts,
    error,
    analytics,
    startSession,
    stopSession
  };
}
