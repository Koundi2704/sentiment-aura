// frontend/src/App.jsx
import { useRef, useState } from "react";
import AuraCanvas from "./AuraCanvas";

function App() {
  console.log("Loaded Deepgram Key:", import.meta.env.VITE_DEEPGRAM_KEY);

  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);

  const [transcript, setTranscript] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [sentiment, setSentiment] = useState(null); // { value, score }
  const [isRecording, setIsRecording] = useState(false);

  // -------------------------------------------------------------
  // SEND FINAL TEXT TO BACKEND / OPENAI
  // -------------------------------------------------------------
  const sendToAI = async (finalText) => {
    console.log("📤 Sending final text to AI:", finalText);

    try {
      const res = await fetch("http://localhost:3000/process_text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: finalText }),
      });

      const json = await res.json();
      console.log("🤖 AI result:", json);

      if (json.sentiment) {
        setSentiment({
          value: json.sentiment,
          score: json.score ?? 50,
        });
      }

      if (Array.isArray(json.keywords)) {
        setKeywords(json.keywords);
      }
    } catch (err) {
      console.error("❌ AI error:", err);
    }
  };

  // -------------------------------------------------------------
  // START RECORDING
  // -------------------------------------------------------------
  const startRecording = async () => {
    if (isRecording) return;
    setIsRecording(true);
    setTranscript("");
    setKeywords([]);
    setSentiment(null);

    console.log("🎤 Connecting to Deepgram…");

    // 1. Deepgram WebSocket
    socketRef.current = new WebSocket(
      `wss://api.deepgram.com/v1/listen?model=nova-2&encoding=linear16&sample_rate=16000`,
      ["token", import.meta.env.VITE_DEEPGRAM_KEY]
    );

    socketRef.current.onopen = () =>
      console.log("🟢 Deepgram WebSocket connected");
    socketRef.current.onerror = (err) =>
      console.error("❌ Deepgram WS error:", err);

    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const chunk = data.channel?.alternatives?.[0]?.transcript || "";
        const isFinal = data.is_final;

        if (chunk) {
          setTranscript((prev) => (prev ? prev + " " + chunk : chunk));
        }

        if (isFinal && chunk.trim().length > 0) {
          console.log("🧠 FINAL SEGMENT:", chunk);
          sendToAI(chunk);
        }
      } catch (err) {
        // Deepgram sometimes sends non-JSON messages (ping, stats, etc.)
        console.log("Non-JSON message from Deepgram:", event.data);
      }
    };

    // 2. Microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    // 3. AudioContext + Worklet
    const audioCtx = new AudioContext({ sampleRate: 16000 });
    audioCtxRef.current = audioCtx;

    console.log("🔊 Browser Sample Rate:", audioCtx.sampleRate);

    await audioCtx.audioWorklet.addModule("/processor.js");

    const source = audioCtx.createMediaStreamSource(stream);
    const pcmNode = new AudioWorkletNode(audioCtx, "pcm-processor");

    pcmNode.port.onmessage = (e) => {
      if (!e.data) return;
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)
        return;

      socketRef.current.send(e.data);
    };

    source.connect(pcmNode).connect(audioCtx.destination);
  };

  // -------------------------------------------------------------
  // STOP RECORDING
  // -------------------------------------------------------------
  const stopRecording = () => {
    console.log("🟥 Stopping recording...");
    setIsRecording(false);

    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}

    try {
      audioCtxRef.current?.close();
    } catch {}

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
  };

  const sentimentLabel = sentiment?.value ?? "neutral";
  const sentimentScore = sentiment?.score ?? 50;

  // -------------------------------------------------------------
  // UI
  // -------------------------------------------------------------
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        color: "white",
        background: "#020617",
      }}
    >
      {/* Full-screen calm-water aura */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
        }}
      >
        <AuraCanvas sentiment={sentimentLabel} score={sentimentScore} />
      </div>

      {/* Foreground UI */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "32px 40px",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <h1 style={{ margin: 0 }}>Live AI Transcription</h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "rgba(15,23,42,0.9)",
              padding: "6px 12px",
              borderRadius: 999,
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "999px",
                backgroundColor: isRecording ? "#22c55e" : "#64748b",
              }}
            ></span>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: "0.85rem",
                cursor: "pointer",
                background: isRecording ? "#fee2e2" : "#38bdf8",
                color: isRecording ? "#991b1b" : "#020617",
              }}
            >
              {isRecording ? "Stop Recording" : "Start Recording"}
            </button>
          </div>
        </div>

        {/* Content area */}
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "flex-start",
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Transcript panel */}
          <div
            style={{
              flex: 2,
              maxWidth: 600,
              background: "rgba(15,23,42,0.9)",
              borderRadius: 16,
              padding: 16,
              backdropFilter: "blur(10px)",
              boxShadow: "0 18px 45px rgba(0,0,0,0.6)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Transcript</h3>
            <div
              style={{
                background: "rgba(15,23,42,0.9)",
                padding: 12,
                minHeight: 180,
                borderRadius: 10,
                overflowY: "auto",
                fontSize: "0.95rem",
                lineHeight: 1.5,
              }}
            >
              {transcript || (
                <span style={{ opacity: 0.6 }}>
                  Start speaking to see the live transcript here…
                </span>
              )}
            </div>
          </div>

          {/* Sentiment + keywords panel */}
          <div
            style={{
              flex: 1.2,
              maxWidth: 380,
              background: "rgba(15,23,42,0.92)",
              borderRadius: 16,
              padding: 16,
              backdropFilter: "blur(10px)",
              boxShadow: "0 18px 45px rgba(0,0,0,0.6)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Sentiment</h3>
            <p style={{ marginBottom: 16, fontSize: "0.95rem" }}>
              <strong>Value:</strong> {sentimentLabel}{" "}
              <span style={{ opacity: 0.7 }}>
                (score: {Math.round(sentimentScore)})
              </span>
            </p>

            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Keywords</h3>
            {keywords.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "rgba(37,99,235,0.9)",
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: "0.8rem",
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ opacity: 0.6, fontSize: "0.9rem" }}>
                Keywords will appear here after analysis of the final segment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
