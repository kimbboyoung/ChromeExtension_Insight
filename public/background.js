chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  let formattedSrcList = [];
  if (request.coupangs.length > 0) {
    const coupangs = request.coupangs;
    formattedSrcList = formattedSrcList.concat(
      coupangs.map((url) => ({ url }))
    );
    console.log("쿠팡 이미지 URL 목록:", formattedSrcList);
    console.log("백그라운드에서 현재 url : ", request.currentURL);
    console.log("백그라운드에서 현재 productTexts : ", request.detailTexts);
  }

  if (request.images.length > 0) {
    const srcList = request.images;
    formattedSrcList = formattedSrcList.concat(srcList.map((url) => ({ url })));
    console.log("Gmarket 이미지 URL 목록:", formattedSrcList);
  }
  //console.log("백그라운드 스크립트 이미지 URL 목록:", formattedSrcList);
  //console.log("백그라운드에서 현재 url : ", request.currentURL);
  if (formattedSrcList.length > 0) {
    chrome.runtime.sendMessage({ type: "ocrInProgress" }); //OCR시작을 알림
    try {
      const response = await fetch("http://localhost:8000/pic_to_text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrls: formattedSrcList,
          productTexts: request.detailTexts,
          siteUrls: request.currentURL,
        }),
      })
        //ocr완료 확인용
        .then((response) => {
          console.log("OCR STATUS : ", response.statusText);
          chrome.runtime.sendMessage({ type: "ocrCompleted" });
        });
    } catch (error) {
      console.error("POST 요청 전송 중 오류 발생:", error);
    }
  } else {
    console.log("가져올 리스트가 없습니다.");
  }
});
