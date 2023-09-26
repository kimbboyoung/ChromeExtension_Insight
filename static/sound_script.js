let audioChunks = [];
const chatContainer = document.getElementById('chat-container');
const messagesContainer = document.getElementById('messages-container');
const startRecordingButton = document.getElementById('startRecordingButton');
//메시지를 추가하는 함수

startRecordingButton.addEventListener('click', startRecording);

function appendMessage(content, isUser) {
  const messageDiv = document.createElement('div');
  messageDiv.className = isUser ? 'user-message' : 'assistant-message';
  messageDiv.textContent = content;
  messagesContainer.appendChild(messageDiv);
}
//오디오청크를 블랍으로 만들고 그걸 폼데이터에 넣어서 보내는 함수
async function sendAudioToPython(audioChunks) {
  const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
  const formData = new FormData();
  formData.append('audio_file', audioBlob, 'audio.wav');
//파이썬 서버로 오디오 파일을 보내고 응답을 받는 함수
  try {
    const transcribeResponse = await fetch('http://192.168.0.31:8000/transcribe', {
      method: 'POST',
      body: formData
    });
    const data = await transcribeResponse.json();
    const text = data.text;
    appendMessage(text, false);

    const chatResponse = await fetch('http://192.168.0.31:8000/chat', {
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

async function startRecording() {
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