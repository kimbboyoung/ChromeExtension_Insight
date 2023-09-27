let audioChunks = [];
const chatContainer = document.getElementById('chat-container');
const messagesContainer = document.getElementById('messages-container');
const startRecordingButton = document.getElementById('startRecordingButton');
const sendButton = document.getElementById('sendText');

//메시지를 메시지 컨테이너에 추가하는 함수
function appendMessage(content, isUser) {
  const messageDiv = document.createElement('div');
  messageDiv.className = isUser ? 'user-message' : 'assistant-message';
  messageDiv.textContent = content;
  messagesContainer.appendChild(messageDiv);
}

//html에서 받아온 입력받은 text로 검색하는 이벤트리스너
sendButton.addEventListener('click', async () => {
  const userInput = document.getElementById('chat-input').value;
  
      //대화가 1번만 나오게 하기 위해 메시지 컨테이너를 비워줌
      messagesContainer.innerHTML = '';
      //사용자가 입력한 메시지를 메시지 컨테이너에 추가
      appendMessage(userInput, false);
      //사용자가 입력한 메시지를 파이썬 서버로 보내고 응답을 받는 함수
      try {
        const chatResponse_text = await fetch('http://localhost:8000/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: userInput }] })
        });
        const assistantTurn = await chatResponse_text.json();
        appendMessage(assistantTurn.content, false);
      } catch (error) {
        console.error('에러 발생:', error);
      }
      });


//html에서 음성검색 레코딩시작하는 이벤트리스너
startRecordingButton.addEventListener('click', startRecording);
async function startRecording() {
  
    //대화가 1번만 나오게 하기 위해 메시지 컨테이너를 비워줌
    messagesContainer.innerHTML = '';
    //오디오 청크도 비워줌
    audioChunks = [];
    //미디어 레코더를 이용해서 녹음을 시작하는 함수
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        sendAudioToPython(audioChunks);
      };

      mediaRecorder.start();
      console.log('녹음을 시작합니다...');

      setTimeout(() => {
        mediaRecorder.stop();
        console.log('녹음이 중지되었습니다.');
      }, 5000);  // 5초 후에 녹음 중지
    } catch (error) {
      console.error('녹음 시작 중 오류발생:', error);
    }
  }
//오디오청크를 블랍으로 만들고 그걸 폼데이터에 넣어서 위스퍼,gpt 서버로 보내는 함수
async function sendAudioToPython(audioChunks) {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'audio.wav');
    try {
      const transcribeResponse = await fetch('http://localhost:8000/transcribe', {
        method: 'POST',
        body: formData
      });
      const data = await transcribeResponse.json();
      const text = data.text;
      appendMessage(text, false);

      const chatResponse = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: text }] })
      });
      const assistantTurn = await chatResponse.json();
      appendMessage(assistantTurn.content, false);
    } catch (error) {
      console.error('Error:', error);
    }
}
