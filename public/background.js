chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  const url = new URL(tab.url);
  if (
    (url.origin === "https://item.gmarket.co.kr" &&
      url.pathname.match(/^\/item?.*/)) ||
    (url.origin === "https://item.gmarket.co.kr" &&
      url.pathname.match(/^\/Item?.*/)) ||
    (url.origin === "https://www.coupang.com" &&
      url.pathname.match(/^\/vp\/products\/.*/))
  ) {
    await chrome.sidePanel.setOptions({
      tabId,
      path: "popup.html",
      enabled: true,
    });
  } else {
    // Disables the side panel on all other sites
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false,
    });
  }
});
// 크롤링 작업을 시작하는 메시지를 받는 코드
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  chrome.runtime.sendMessage({ type: "ocrInProgress" }); //OCR시작을 알림
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
    try {
      console.log("텍스트 정보 : ", request.detailTexts);
      console.log("backgound : ", request.currentURL);
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
          chrome.runtime.sendMessage({
            type: "ocrCompleted",
            currentURL: request.currentURL,
          });
        });
    } catch (error) {
      console.error("POST 요청 전송 중 오류 발생:", error);
    }
  } else {
    console.log("가져올 리스트가 없습니다.");
  }
});
