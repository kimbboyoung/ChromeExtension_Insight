import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import Switch from "@mui/material/Switch";
import CircularProgress from "@mui/material/CircularProgress";

function Popup() {
  const [audioChunks, setAudioChunks] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  //const [audioUrl, setAudioUrl] = useState(null);
  const [isOn, setIsOn] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false); // 프로그레스 바 숨기기
  const toggleSwitch = () => {
    setIsOn(!isOn);
  };

  const appendMessage = (content, isUser, audioUrl) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { content, isUser, audioUrl },
    ]);
  };

  const handleSendButtonClick = async () => {
    setMessages([]); // 메시지 목록 초기화
    if (userInput.trim() === "") return;

    // Append user message to messages
    appendMessage(userInput, true);

    try {
      // const chatResponse = await fetch("http://localhost:8000/chat", {
      const chatResponse = await fetch("http://localhost:8000/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userInput }],
        }),
      });
      const assistantTurn = await chatResponse.json();
      // 구글 tts
      const ttsURL = await fetchTextToSpeech(userInput + assistantTurn.content);
      appendMessage(assistantTurn.content, false, ttsURL);
    } catch (error) {
      console.error("에러 발생:", error);
    }
  };

  const handleStartRecording = async () => {
    setMessages([]);

    const updatedAudioChunks = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          updatedAudioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        sendAudioToPython(updatedAudioChunks);
      };

      mediaRecorder.start();
      setShowProgress(true); // 프로그레스 바 표시
      setProgress(0); // 프로그레스 바 표시
      console.log("녹음을 시작합니다...");

      // 프로그레스 바 증가 로직
      const interval = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + 100 / (5000 / 20);
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100; // 끝났을 때 100으로 설정
          }
          return newProgress;
        });
      }, 0); // 프로그레스 바 갱신 간격

      setTimeout(() => {
        mediaRecorder.stop();
        setShowProgress(false); // 프로그레스 바 숨기기
        console.log("녹음이 중지되었습니다.");
      }, 5000); // 5초 후에 녹음 중지
    } catch (error) {
      console.error("녹음 시작 중 오류발생:", error);
    }
  };

  const sendAudioToPython = async (audioChunks) => {
    const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "audio.wav");
    try {
      const transcribeResponse = await fetch(
        "http://localhost:8000/transcribe",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await transcribeResponse.json();
      const text = data.text;

      appendMessage(text, true);

      const chatResponse = await fetch("http://localhost:8000/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: text }] }),
      });
      const assistantTurn = await chatResponse.json();
      // Fetch and play audio
      const ttsURL = await fetchTextToSpeech(assistantTurn.content);
      appendMessage(assistantTurn.content, false, ttsURL);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // 프론트엔드에서 백엔드 엔드포인트로 POST 요청 보내기
  const fetchTextToSpeech = async (gptText) => {
    try {
      const response = await fetch("http://localhost:8000/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: gptText }),
      });

      if (response.ok) {
        // 클라이언트에서 오디오 재생
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        return audioUrl;
        //setAudioUrl(audioUrl);
      } else {
        console.error("오디오 생성 요청에 실패했습니다.");
      }
    } catch (error) {
      console.error("에러 발생:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // 기본 엔터 동작 방지
      handleSendButtonClick();
      setUserInput(""); // 검색 후 userInput 비우기
    }
  };

  return (
    <div id="chat-container">
      <div id="input-container">
        <input
          type="text"
          id="chat-input"
          placeholder="메시지를 입력하세요"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button id="startRecordingButton" onClick={handleStartRecording}>
          <img src="free-icon-mic-772150.png" alt="음성 검색" id="mic_img" />
          {showProgress && (
            <CircularProgress variant="determinate" value={progress} />
          )}
        </button>
        <button id="sendText" onClick={handleSendButtonClick}>
          검색
        </button>
      </div>
      <div id="messages-container">
        <div>
          <span>{isOn ? "음성 답변 켜기" : "음성 답변 끄기"}</span>
          <Switch
            checked={isOn}
            onChange={toggleSwitch}
            color="primary"
            name="toggle-switch"
            inputProps={{ "aria-label": "toggle switch" }}
          />
        </div>
        {messages.map((message, index) => (
          <div
            key={index}
            className={message.isUser ? "user-message" : "assistant-message"}
          >
            <strong>{message.isUser ? "사용자" : "어시스턴트"}:</strong>{" "}
            {message.content}
            <span>
              {message.isUser || !isOn ? null : (
                <div>
                  <audio controls autoPlay src={message.audioUrl}></audio>
                </div>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

createRoot(document.getElementById("react-target")).render(<Popup />);
