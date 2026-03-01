"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatBotProps {
  className?: string;
  question?: string | null;
  onSuggestion?: (suggestion: string) => void;
  suggestion?: string | null;
  candidateInfo?: string;
  onCandidateInfo?: (info: string) => void;
  onNewQuestion?: (question: string) => void;
}

export default function ChatBot({
  className = "",
  question = null,
  onSuggestion,
  suggestion = null,
  candidateInfo = "",
  onCandidateInfo,
  onNewQuestion,
}: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [audioSource, setAudioSource] = useState<string>("system"); // 'system' or 'microphone'
  const [localCandidateInfo, setLocalCandidateInfo] = useState(candidateInfo);
  const [showCandidateForm, setShowCandidateForm] = useState(true);
  const [isListeningToInterviewer, setIsListeningToInterviewer] =
    useState(false);
  const [interviewerAudioStream, setInterviewerAudioStream] =
    useState<MediaStream | null>(null);
  const [hasProcessedAudio, setHasProcessedAudio] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Web Speech API types not in DOM lib
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Handle initial messages from InterviewerAgent
  useEffect(() => {
    if (question) {
      const newMessages = [
        {
          id: `initial-${Date.now()}`,
          role: "assistant" as const,
          content: question,
          timestamp: new Date(),
        },
      ];
      setMessages(newMessages);
    }
  }, [question]);

  // Add useEffect to watch for new question prop
  useEffect(() => {
    console.log("ChatBot: Question prop changed to:", question);

    if (question === "INTERVIEWER_SPEAKING" && !isListeningToInterviewer) {
      // InterviewerAgent is about to start speaking, start listening
      console.log("ChatBot: Starting to listen to InterviewerAgent");
      setHasProcessedAudio(false);
      setStreamingMessage(""); // Clear any previous suggestions
      startListeningToInterviewer();
      return;
    }

    if (question === "INTERVIEWER_FINISHED_SPEAKING") {
      // InterviewerAgent finished speaking, stop listening if still recording
      console.log(
        "ChatBot: InterviewerAgent finished speaking, stopping recording",
      );
      stopListeningToInterviewer();
      // Don't reset hasProcessedAudio here - let it stay true until next question
      return;
    }

    // Don't automatically generate suggestions from the question prop
    // Only generate suggestions when we complete our own transcription
    if (
      question === "INTERVIEWER_SPEAKING" ||
      question === "INTERVIEWER_FINISHED_SPEAKING"
    ) {
      setStreamingMessage("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question]);

  // Initialize speech recognition and audio capture
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Initialize speech recognition
      if ("webkitSpeechRecognition" in window) {
        const SpeechRecognition =
          (window as Window & { webkitSpeechRecognition?: new () => unknown; SpeechRecognition?: new () => unknown }).webkitSpeechRecognition ||
          (window as Window & { SpeechRecognition?: new () => unknown }).SpeechRecognition;
        if (SpeechRecognition) recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onstart = () => {
          setIsRecording(true);
          setIsListening(true);
        };

        recognitionRef.current.onresult = (event: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; length: number; [j: number]: { transcript: string } } } }) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setInputText(finalTranscript);
            setIsRecording(false);
            setIsListening(false);
            recognitionRef.current?.stop();
          }
        };

        recognitionRef.current.onerror = (event: { error: string }) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
          setIsListening(false);
        };
      }

      // Initialize speech synthesis
      synthesisRef.current = window.speechSynthesis;
    }
  }, []);

  // Function to capture system audio
  const captureSystemAudio = async () => {
    try {
      // Try to get system audio using getDisplayMedia (more reliable)
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });

      // Create audio context for processing
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);

      // Create media recorder for the system audio
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      const chunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });

        try {
          // Send audio to transcription API
          const formData = new FormData();
          formData.append("audio", audioBlob, "system-audio.webm");

          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            setInputText(result.text || "No speech detected");
          } else {
            console.error("Transcription failed");
            setInputText("Failed to transcribe audio");
          }
        } catch (error) {
          console.error("Error transcribing audio:", error);
          setInputText("Error processing audio");
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error capturing system audio:", error);

      // Try alternative method for system audio
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: "system",
            },
          } as any,
          video: false,
        });

        // Use the same recording logic as above
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(stream);

        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });

        const chunks: Blob[] = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: "audio/webm" });

          try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "system-audio.webm");

            const response = await fetch("/api/transcribe", {
              method: "POST",
              body: formData,
            });

            if (response.ok) {
              const result = await response.json();
              setInputText(result.text || "No speech detected");
            } else {
              console.error("Transcription failed");
              setInputText("Failed to transcribe audio");
            }
          } catch (error) {
            console.error("Error transcribing audio:", error);
            setInputText("Error processing audio");
          }
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (fallbackError) {
        console.error("Fallback system audio capture failed:", fallbackError);
        // Final fallback to microphone
        alert(
          "System audio capture not supported. Falling back to microphone.",
        );
        setAudioSource("microphone");
        startMicrophoneRecording();
      }
    }
  };

  // Function to start microphone recording
  const startMicrophoneRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Unable to access microphone. Please check permissions.");
    }
  };

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputText("");
      setIsLoading(true);
      setIsStreaming(true);
      setStreamingMessage("");

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              ...messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
              { role: "user", content: content.trim() },
            ],
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  setIsStreaming(false);
                  const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    content: streamingMessage,
                    timestamp: new Date(),
                  };
                  setMessages((prev) => [...prev, assistantMessage]);
                  setStreamingMessage("");
                  break;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.text) {
                    setStreamingMessage((prev) => prev + parsed.text);
                  }
                } catch (e) {
                  // Ignore parsing errors
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    [messages, streamingMessage],
  );

  const handleSendMessage = () => {
    sendMessage(inputText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      setIsRecording(false);
    } else {
      // Start recording
      setInputText("");
      if (audioSource === "system") {
        captureSystemAudio();
      } else {
        startMicrophoneRecording();
      }
    }
  };

  const toggleAudioSource = () => {
    setAudioSource((prev) => (prev === "system" ? "microphone" : "system"));
  };

  const speakMessage = (text: string) => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel(); // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      synthesisRef.current.speak(utterance);
    }
  };

  const startListeningToInterviewer = async () => {
    console.log("ChatBot: Starting to listen to audio...");
    try {
      // Use microphone to capture audio
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      console.log("ChatBot: Got microphone stream, setting up recording...");
      setInterviewerAudioStream(stream);
      setIsListeningToInterviewer(true);

      // Use MediaRecorder for proper audio capture
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      console.log(
        "ChatBot: Created MediaRecorder, setting up event handlers...",
      );
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log("ChatBot: Data available, chunk size:", event.data.size);
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("ChatBot: Finished recording, processing audio...");
        console.log("ChatBot: Total chunks collected:", chunks.length);
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        console.log("ChatBot: Audio blob size:", audioBlob.size);

        // Send audio to transcription API first
        try {
          console.log(
            "ChatBot: Sending audio chunk to transcription API, size:",
            audioBlob.size,
          );
          const formData = new FormData();
          formData.append("audio", audioBlob, "audio.webm");

          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          console.log(
            "ChatBot: Transcription API response status:",
            response.status,
          );

          if (response.ok) {
            const result = await response.json();
            console.log("ChatBot: Transcription result:", result);
            const transcribedText = result.text || "";
            console.log("ChatBot: Transcribed text:", transcribedText);
            console.log("ChatBot: Text length:", transcribedText.trim().length);
            console.log("ChatBot: Has processed audio:", hasProcessedAudio);

            if (transcribedText && transcribedText.trim().length > 5) {
              console.log("ChatBot: Conditions met, generating suggestion...");
              console.log("ChatBot: hasProcessedAudio was:", hasProcessedAudio);
              // Generate suggestion based on transcribed text
              setHasProcessedAudio(true);
              console.log("ChatBot: Making suggestion API call...");
              const suggestionResponse = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  messages: [
                    {
                      role: "system",
                      content: `You are a deep-thinking interview coach providing layered answer suggestions that start broad and get increasingly specific. 

                      Candidate Background: ${localCandidateInfo}

                      Guidelines:
                      - Provide concise, focused answer suggestions (1-2 sentences)
                      - Start with a general concept, then add one specific detail or example
                      - Use a brief "funnel" approach: broad context → specific example
                      - Begin with the "what", then quickly add the "how" with one technical detail
                      - Connect to their specific experience in a concise way
                      - Keep the layered approach but make it much shorter
                      - Show progression from concept to application in minimal words
                      - Start with the big picture, then add one specific technical detail
                      - Include both strategic thinking (general) and tactical execution (specific) in brief form
                      - Demonstrate ability to explain complex topics concisely
                      - If the question requires current information, acknowledge this limitation briefly
                      - Respond with just the suggested answer, no explanations or meta-commentary`,
                    },
                    {
                      role: "user",
                      content: `Interview question: "${transcribedText}"`,
                    },
                  ],
                  stream: false,
                  max_tokens: 150,
                  temperature: 0.7,
                }),
              });

              console.log(
                "ChatBot: Suggestion API response status:",
                suggestionResponse.status,
              );

              if (suggestionResponse.ok) {
                const suggestionResult = await suggestionResponse.json();
                console.log("ChatBot: Suggestion result:", suggestionResult);
                if (
                  suggestionResult.message &&
                  suggestionResult.message.content
                ) {
                  console.log(
                    "ChatBot: Setting suggestion:",
                    suggestionResult.message.content,
                  );
                  setStreamingMessage(suggestionResult.message.content);
                  setIsStreaming(true);
                  console.log(
                    "ChatBot: State updated - streamingMessage:",
                    suggestionResult.message.content,
                  );
                  console.log("ChatBot: State updated - isStreaming:", true);
                } else {
                  console.log(
                    "ChatBot: No message content in suggestion result",
                  );
                }
              } else {
                console.log(
                  "ChatBot: Suggestion API call failed with status:",
                  suggestionResponse.status,
                );
                const errorText = await suggestionResponse.text();
                console.log("ChatBot: Error response:", errorText);
              }
            }
          } else {
            const errorText = await response.text();
            console.error("ChatBot: Transcription API error:", errorText);
          }
        } catch (error) {
          console.error("Error processing audio:", error);
        }

        // Clear processed chunks
        chunks.length = 0;
      };

      // Start recording
      mediaRecorder.start();

      console.log("ChatBot: Started recording audio...");

      // Stop recording after 6 seconds
      setTimeout(() => {
        console.log(
          "ChatBot: Timeout reached, checking recording state:",
          mediaRecorder.state,
        );
        if (mediaRecorder.state === "recording") {
          console.log("ChatBot: Stopping recording");
          mediaRecorder.stop();
          setIsListeningToInterviewer(false);
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        } else {
          console.log(
            "ChatBot: Recording already stopped, state:",
            mediaRecorder.state,
          );
        }
      }, 6000);
    } catch (error) {
      console.error("Error setting up audio listening:", error);
    }
  };

  const generateSuggestionFromQuestion = async (question: string) => {
    console.log("ChatBot: Generating suggestions for question:", question);
    setIsLoading(true);
    setStreamingMessage("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant. Suggest a strong, concise answer to the following interview question.

Candidate Background: ${localCandidateInfo}

Guidelines:
- Use the candidate's background information to provide relevant examples
- Make suggestions that align with their experience level and skills
- Keep responses concise and professional
- Provide specific examples based on their work history, but don't be afraid to flex your technical and creative muscles`,
            },
            { role: "user", content: question },
          ],
          stream: true,
        }),
      });
      if (!response.ok) throw new Error("Failed to get suggestion");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let suggestion = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                setIsStreaming(false);
                setIsLoading(false);
                if (onSuggestion) onSuggestion(suggestion);
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  suggestion += parsed.text;
                  setStreamingMessage((prev) => prev + parsed.text);
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (error) {
      setIsLoading(false);
      setStreamingMessage("Error generating suggestion.");
    }
  };

  const stopListeningToInterviewer = () => {
    if (interviewerAudioStream) {
      interviewerAudioStream.getTracks().forEach((track) => track.stop());
      setInterviewerAudioStream(null);
      setIsListeningToInterviewer(false);
    }
  };

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-lg">
        <h1 className="text-2xl font-bold text-center">Interview Assistant</h1>
        <p className="text-center text-purple-100 mt-1">
          AI-Powered Response Suggestions
        </p>
      </div>

      {/* Candidate Information Form */}
      {showCandidateForm && (
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 border-b border-purple-200 dark:border-purple-800">
          <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">
            Your Background
          </h3>
          <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
            Please provide your experience and work history to help generate
            better response suggestions.
          </p>
          <textarea
            value={localCandidateInfo}
            onChange={(e) => {
              setLocalCandidateInfo(e.target.value);
              if (onCandidateInfo) {
                onCandidateInfo(e.target.value);
              }
            }}
            placeholder="Describe your experience, work history, skills, and background. For example: 'I'm a software engineer with 5 years of experience in React and Node.js. I've worked at companies like Google and Microsoft, focusing on frontend development and user experience.'"
            className="w-full h-[80vh] px-3 py-2 border border-purple-300 dark:border-purple-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white resize-none"
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => setShowCandidateForm(false)}
              disabled={!localCandidateInfo.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar">
        {!question && !isStreaming && !streamingMessage && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg">Waiting for InterviewerAgent to speak...</p>
            <p className="text-sm mt-2">
              I'll automatically listen and generate suggestions
            </p>
          </div>
        )}

        {isListeningToInterviewer && (
          <div className="text-center text-purple-600 mt-8">
            <p className="text-lg">Listening to InterviewerAgent...</p>
            <div className="flex justify-center mt-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse mx-1"></div>
              <div
                className="w-3 h-3 bg-purple-500 rounded-full animate-pulse mx-1"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-3 h-3 bg-purple-500 rounded-full animate-pulse mx-1"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>
        )}

        {/* InterviewerAgent's Question */}
        {question &&
          question !== "INTERVIEWER_SPEAKING" &&
          question !== "INTERVIEWER_FINISHED_SPEAKING" && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                InterviewerAgent's Question:
              </h3>
              <p className="text-blue-700 dark:text-blue-300">{question}</p>
            </div>
          )}

        {/* Response Suggestions */}
        {(streamingMessage || suggestion) && (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
              Suggested Answer:
            </h3>
            <p className="text-purple-700 dark:text-purple-300 whitespace-pre-wrap">
              {streamingMessage || suggestion}
              {isStreaming && <span className="typing-dots"></span>}
            </p>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !isStreaming && (
          <div className="flex justify-center">
            <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                  Generating suggestion...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
