import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import Switch from "@mui/material/Switch";
import MuiSlider, { SliderThumb } from "@mui/material/Slider";
import CircularProgress from "@mui/material/CircularProgress";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import { alpha, styled, withStyles } from "@mui/material/styles";
import { brown } from "@mui/material/colors"; // 갈색색상 추가
import { BeatLoader, GridLoader } from "react-spinners";

function Popup() {
  const [audioChunks, setAudioChunks] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  //const [audioUrl, setAudioUrl] = useState(null);
  const [isOn, setIsOn] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false); // 프로그레스 바 숨기기
  //소리 크기, 속도 조절
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0); // 초기값으로 50 설정
  const [audioSpeed, setAudioSpeed] = useState(1.25); // 초기값으로 1 설정
  const [isOcrInProgress, setIsOcrInProgress] = useState(false);
  const [ocrCompleted, setOcrCompleted] = useState(false);
  const [loading, setLoading] = useState(false); // 로딩 상태를 관리하는 state
  //답변 보낼 때 보낼 url
  const [currentUrl, setCurrentUrl] = useState("");
  const toggleSettings = () => {
    setIsSettingsOpen((prevOpen) => !prevOpen);
  };
  const toggleSwitch = () => {
    setIsOn(!isOn);
  };

  //Mui 스위치 갈색으로 변경
  const BrownSwitch = styled(Switch)(({ theme }) => ({
    "& .MuiSwitch-switchBase.Mui-checked": {
      color: brown[400], // 갈색색상
      "&:hover": {
        backgroundColor: alpha(brown[400], theme.palette.action.hoverOpacity),
      },
    },
    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
      backgroundColor: brown[400], // 갈색색상
    },
  }));

  // Mui Slider 갈색으로 변경
  const BrownSlider = styled(Slider)(({ theme }) => ({
    "& .MuiSlider-track": {
      border: "none",
      backgroundColor: brown[400],
    },
    "& .MuiSlider-thumb": {
      backgroundColor: brown[400],
      "&:hover": {
        backgroundColor: "#F7EEE2", // hover 시 원하는 색상으로 변경
      },
    },
    // 기본 슬라이더 색상 변경
    "& .MuiSlider-rail": {
      backgroundColor: "#F7EEE2", // 기본 색상으로 변경
    },
  }));

  const appendMessage = (content, isUser, audioUrl) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { content, isUser, audioUrl },
    ]);
  };

  //음성 답변 크기, 속도 조절하기
  const handleVolumeChange = (event, newValue) => {
    setAudioVolume(newValue);
  };

  const handleSpeedChange = (event, newValue) => {
    setAudioSpeed(newValue);
  };

  //OCR시작시 알림음실행
  useEffect(() => {
    let waitnotificationSound = null;
    let notificationSound = null;

    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "ocrInProgress") {
        setIsOcrInProgress(true);
        waitnotificationSound = new Audio("OCR_start.mp3");
        waitnotificationSound.play();
      } else if (message.type === "ocrCompleted") {
        setIsOcrInProgress(false);
        setOcrCompleted(true);
        if (waitnotificationSound) {
          // OCR 시작 사운드를 중지하고 제거
          waitnotificationSound.pause();
        }
        notificationSound = new Audio("20231016064020111.mp3");
        notificationSound.play();
      }
    });

    // 컴포넌트가 언마운트되면 사운드 관련 리소스 정리
    return () => {
      if (waitnotificationSound) {
        waitnotificationSound.pause();
      }
      if (notificationSound) {
        notificationSound.pause();
      }
    };
  }, []);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((url) => {
      if (url.currentURL) {
        setCurrentUrl(url?.currentURL);
      }
    });
  }, []);

  const handleSendButtonClick = async () => {
    setMessages([]); // 메시지 목록 초기화
    if (userInput.trim() === "") return;
    setUserInput(""); // 검색 후 userInput 비우기
    // Append user message to messages
    appendMessage(userInput, true);
    setLoading(true);
    try {
      // const chatResponse = await fetch("http://localhost:8000/chat", {
      const chatResponse = await fetch("http://localhost:8000/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userInput }],
          siteUrls: currentUrl,
        }),
      });
      const assistantTurn = await chatResponse.json();

      // 구글 tts
      const ttsURL = await fetchTextToSpeech(assistantTurn.content, userInput);
      setLoading(false);
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
          const newProgress = prevProgress + 100 / (5000 / 100);
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100; // 끝났을 때 100으로 설정
          }
          return newProgress;
        });
      }, 100); // 프로그레스 바 갱신 간격

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
      setLoading(true);
      const chatResponse = await fetch("http://localhost:8000/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: text }],
          siteUrls: currentUrl,
        }),
      });
      const assistantTurn = await chatResponse.json();
      // Fetch and play audio
      const ttsURL = await fetchTextToSpeech(assistantTurn.content, "");
      setLoading(false);
      appendMessage(assistantTurn.content, false, ttsURL);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // 프론트엔드에서 백엔드 엔드포인트로 POST 요청 보내기
  const fetchTextToSpeech = async (gptText, userText) => {
    try {
      const response = await fetch("http://localhost:8000/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text_request: {
            assistant: gptText,
            user: userText,
          },
          audio_config: {
            volume: audioVolume,
            speed: audioSpeed,
          },
        }),
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
      if (e.nativeEvent.isComposing) {
        return;
      }
      handleSendButtonClick();
      setUserInput(""); // 검색 후 userInput 비우기
    }
  };
  return (
    <div id="chat-container">
      {isOcrInProgress && !ocrCompleted && (
        <div>
          <h2>이미지를 분석 중입니다.</h2>
          <h2>잠시만 기다려주세요.</h2>
          <h2> </h2>
          <div className="loader-container">
            <GridLoader color="#ffffff" margin={6} size={20} />
          </div>
        </div>
      )}
      {ocrCompleted && (
        <div>
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
              {showProgress && (
                <CircularProgress
                  variant="determinate"
                  value={progress}
                  style={{
                    position: "absolute",
                    left: "0",
                    width: "22px",
                    height: "22px",
                  }}
                />
              )}
              <img
                src="free-icon-mic-772150.png"
                alt="음성 검색"
                id="mic_img"
              />
            </button>
            <button id="sendText" onClick={handleSendButtonClick}>
              검색
            </button>
          </div>
          <div id="messages-container">
            <div>
              <span>{isOn ? "음성 답변 켜기" : "음성 답변 끄기"}</span>
              <BrownSwitch
                checked={isOn}
                onChange={toggleSwitch}
                name="toggle-switch"
                inputProps={{ "aria-label": "toggle switch" }}
              />
              <span id="settingIcon" onClick={toggleSettings}>
                <img src="settingIcon.png" alt="음성 설정" />
              </span>
              {isSettingsOpen && (
                <div className="setting-container">
                  <div className="sound-controller">
                    <Typography id="audio-volume-slider" gutterBottom>
                      음성 답변 소리 조절
                    </Typography>
                    <BrownSlider
                      value={audioVolume}
                      onChange={handleVolumeChange}
                      aria-labelledby="audio-volume-slider"
                      valueLabelDisplay="auto"
                      step={3}
                      marks
                      min={-9}
                      max={9}
                    />
                  </div>
                  <div className="speed-controller">
                    <Typography id="audio-speed-slider" gutterBottom>
                      음성 답변 속도 조절
                    </Typography>
                    <BrownSlider
                      value={audioSpeed}
                      onChange={handleSpeedChange}
                      aria-labelledby="audio-speed-slider"
                      valueLabelDisplay="auto"
                      step={0.25}
                      marks
                      min={0.5}
                      max={3.0}
                    />
                  </div>
                </div>
              )}
            </div>
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.isUser ? "user-message" : "assistant-message"
                }
              >
                <strong>{message.isUser ? "사용자" : "어시스턴트"}:</strong>{" "}
                {message.content}
                <span>
                  {message.isUser || !isOn ? null : (
                    <div>
                      <audio
                        controls
                        autoPlay
                        speed={audioSpeed}
                        soundLevel={audioVolume}
                        src={message.audioUrl}
                      ></audio>
                    </div>
                  )}
                </span>
              </div>
            ))}
            {loading ? ( // 사용자 메시지일 때만 로딩 표시
              <div className="loader">
                <BeatLoader color="#ffffff" loading={loading} />
                <audio controls autoPlay loop>
                  <source src="loadingSound.mp3" type="audio/mpeg" />
                </audio>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("react-target")).render(<Popup />);
