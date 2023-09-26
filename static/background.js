// 백그라운드 스크립트에서 이미지 URL 목록을 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    //console.log(request);
    if (request.images) {
      const srcList = request.images;
      // 백그라운드 스크립트에서 이미지 URL 목록을 처리
      console.log(
        "백그라운드 스크립트에서 이미지 URL 목록을 받았습니다:",
        srcList
      );
      // 여기에서 원하는 작업을 수행할 수 있습니다.
      // 예: 이미지 URL을 저장하거나 다른 작업을 수행
    }
  });