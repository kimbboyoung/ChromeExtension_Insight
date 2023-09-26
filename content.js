//gmarket은 iframe으로 가져옴.
let srcList = [];
const iframes = document.querySelectorAll("iframe");

// 모든 iframe에 대해 순회
if (iframes.length > 0) {
  iframes?.forEach((iframe) => {
    try {
      // Check if contentDocument is available and not null
      const contentDoc = iframe.contentDocument;
      if (contentDoc) {
        const innerImages = contentDoc.querySelectorAll("img");
        srcList.push(...Array.from(innerImages).map((img) => img.src));
      }
    } catch (e) {
      console.warn("Error accessing iframe contents:", e);
    }
  });

  // 백그라운드 스크립트로 이미지 URL 목록 전송
  chrome.runtime.sendMessage({ images: srcList }, (response) => {
    console.log("이미지 URL 목록이 백그라운드 스크립트로 전송되었습니다.");
  });
}