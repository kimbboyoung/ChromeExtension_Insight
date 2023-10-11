// 백그라운드 스크립트에서 이미지 URL 목록을 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //console.log(request);
  if (request.images) {
    const srcList = request.images;
    const formattedSrcList = srcList.map((url) => ({ url }));

    // 백그라운드 스크립트에서 이미지 URL 목록을 처리
    console.log("백그라운드 스크립트 이미지 URL 목록:", formattedSrcList);
    // Make an HTTP POST request to your FastAPI server
    fetch("http://localhost:8000/pic_to_text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrls: formattedSrcList, // Send the list of image URLs in the request body
      }),
    }).catch((error) => {
      console.error("POST 요청 전송 중 오류 발생:", error);
    });
  }
});
