// 지마켓 이미지 URL을 가져오는 부분
let srcList = [];
// 쿠팡 이미지 URL을 가져오는 부분
let coupangList = [];

const getAllCoupangImages = () => {
  const iframes = document?.querySelectorAll("iframe");

  if (iframes.length > 0) {
    iframes.forEach((iframe) => {
      try {
        const contentDoc = iframe.contentDocument;
        if (contentDoc) {
          const innerImages = contentDoc.querySelectorAll("img");
          srcList.push(...Array.from(innerImages).map((img) => img.src));
        }
      } catch (e) {
        console.warn("Error accessing iframe contents:", e);
      }
    });
  }

  coupangList = []; // coupangList 초기화
  //const coupangImgBoxs = document.querySelectorAll(".subType-IMAGE");
  const coupangImgBoxs = document.querySelectorAll(
    ".product-detail-content-inside"
  );

  if (coupangImgBoxs.length > 0) {
    //console.log("coupangImgBoxs", coupangImgBoxs);
    coupangImgBoxs?.forEach((imgBox) => {
      try {
        const innerImages = imgBox.querySelectorAll("img");
        coupangList.push(...Array.from(innerImages).map((img) => img.src));
      } catch (e) {
        console.warn("Error accessing iframe contents:", e);
      }
    });
  }
};

// content.js

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "performTask") {
// 페이지 로딩이 완료된 후 작업을 수행합니다.
setTimeout(() => {
  getAllCoupangImages();
  //console.log("Loading 끝");
  //console.log("지마켓 이미지 URL", srcList);
  //console.log("쿠팡 이미지 URL", coupangList);

  // 이미지를 보내는 메시지를 전송
  chrome.runtime.sendMessage(
    { images: srcList, coupangs: coupangList },
    (response) => {}
  );
}, 2000);
//   }
// });
