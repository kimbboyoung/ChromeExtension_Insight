// 백그라운드 스크립트에서 이미지 URL 목록을 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    //console.log(request);
    if (request.images) {
      const srcList = request.images;
      const formattedSrcList = srcList.map(url => ({ url }));

      // 백그라운드 스크립트에서 이미지 URL 목록을 처리
      console.log("백그라운드 스크립트 이미지 URL 목록:",formattedSrcList
      );
      // Make an HTTP POST request to your FastAPI server
    fetch('http://127.0.0.1:8000/pic_to_text', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            imageUrls: formattedSrcList, // Send the list of image URLs in the request body
        }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.detail) {
        console.error('Server returned an error:', data.detail);
        return;
      }
      // Handle the response from the FastAPI server
      console.log('Response from FastAPI server:', data);
      // <p>Summary: ${data[0].summary}</p>
      // Update the HTML element with the response data
      const responseContainer = document.getElementById('response-container');
      if (responseContainer) {
          responseContainer.innerHTML = `
              <p>Original Response: ${data[0].original_response}</p>
          `;
      }
    })
    
    .catch(error => {
        console.error('Error sending POST request:', error);
    });
    }
  });