import React, { useState } from "react";
import { createRoot } from "react-dom/client";

function Popup() {
  const [audioChunks, setAudioChunks] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  //const [audioUrl, setAudioUrl] = useState(null);

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
      const ttsURL = await fetchTextToSpeech(assistantTurn.content);
      appendMessage(assistantTurn.content, false, ttsURL);
    } catch (error) {
      console.error("에러 발생:", error);
    }
  };

  const handleStartRecording = async () => {
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
      console.log("녹음을 시작합니다...");

      setTimeout(() => {
        mediaRecorder.stop();
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

  return (
    <div id="chat-container">
      <div id="input-container">
        <input
          type="text"
          id="chat-input"
          placeholder="메시지를 입력하세요"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <button id="sendText" onClick={handleSendButtonClick}>
          전송
        </button>
        <button id="startRecordingButton" onClick={handleStartRecording}>
          음성 녹음 시작
        </button>
      </div>
      <div id="messages-container">
        {messages.map((message, index) => (
          <div
            key={index}
            className={message.isUser ? "user-message" : "assistant-message"}
          >
            <strong>{message.isUser ? "사용자" : "어시스턴트"}:</strong>{" "}
            {message.content}
            <span>
              {message.isUser ? null : (
                <div>
                  <audio
                    controls
                    autoPlay
                    src={message.audioUrl}
                    //playbackRate={2.0}
                    //volume={0.5}
                  ></audio>
                </div>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

//    // 백그라운드 스크립트에서 이미지 URL 목록을 수신
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   //console.log(request);
//   if (request.images) {
//     const srcList = request.images;
//     const formattedSrcList = srcList.map(url => ({ url }));

//     // 백그라운드 스크립트에서 이미지 URL 목록을 처리
//     console.log("백그라운드 스크립트 이미지 URL 목록:",formattedSrcList
//     );
//     // Make an HTTP POST request to your FastAPI server
//   fetch('http://localhost:8000/pic_to_text', {
//       method: 'POST',
//       headers: {
//           'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//           imageUrls: formattedSrcList, // Send the list of image URLs in the request body
//       }),
//   })
//   .then(response => response.json())
//   .then(data => {
//     if (data.detail) {
//       console.error('Server returned an error:', data.detail);
//       return;
//     }
//     // Handle the response from the FastAPI server
//     console.log('Response from FastAPI server:', data);
//     // Update the HTML element with the response data
//     const responseContainer = document.getElementById('response-container');
//     if (responseContainer) {
//         responseContainer.innerHTML = `
//             <p>Summary: ${data[0].summary}</p>
//             <p>Original Response: ${data[0].original_response}</p>
//         `;
//     }
//   })

//   .catch(error => {
//       console.error('Error sending POST request:', error);
//   });
//   }
// });

createRoot(document.getElementById("react-target")).render(<Popup />);
