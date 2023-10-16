// 지마켓 이미지 URL을 가져오는 부분
let srcList = [];
// 쿠팡 이미지 URL을 가져오는 부분
let coupangList = [];
let combinedText = "";
let dataCollected = false; // 크롤링 데이터를 수집한지 여부를 나타내는 플래그

const getAllCoupangImages = () => {
  if (dataCollected) {
    // 이미 데이터를 수집한 경우 다시 크롤링하지 않도록 반환
    return;
  }

  const iframes = document?.querySelectorAll("iframe");
  console.log("지마켓 크롤링");

  if (iframes.length > 0) {
    for (let i = 0; i < iframes.length; i++) {
      const iframe = iframes[i];
      try {
        const contentDoc = iframe.contentDocument;
        if (contentDoc) {
          // "basic_detail_html" ID를 가진 요소 선택
          const basicDetailHtmlElement =
            contentDoc.querySelector("#basic_detail_html");
          if (basicDetailHtmlElement) {
            // "basic_detail_html" ID를 가진 요소 아래에 있는 img 태그 선택
            const innerImages = basicDetailHtmlElement.querySelectorAll("img");
            console.log("innerImages: " + innerImages.length);
            innerImages.forEach((img) => {
              if (!img.src.endsWith(".gif")) {
                srcList.push(img.src);
              }
            });
            console.log("srcList: " + srcList.length);
            // 작업이 완료되면 반복문 종료
            break;
          }
        }
      } catch (e) {
        console.warn("Error accessing iframe contents:", e);
      }
    }
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
        innerImages.forEach((img) => {
          if (!img.src.endsWith(".gif")) {
            coupangList.push(img.src);
          }
        });
      } catch (e) {
        console.warn("Error accessing iframe contents:", e);
      }
    });
  }
  // 1. "prod-buy" 태그 선택
  const prodBuyElement = document.querySelector(".prod-buy");

  if (prodBuyElement) {
    // 2. h2 태그 내의 텍스트 추출
    const h2Element = prodBuyElement.querySelector("h2");
    const h2Text = h2Element.textContent.trim();

    // 3. "total-price", "prod-shipping-fee-message", "prod-reward-cash-container" 클래스를 가진 하위 요소 선택
    const totalPriceElement = prodBuyElement.querySelector(".total-price");
    const shippingFeeElement = prodBuyElement.querySelector(
      ".prod-shipping-fee-message"
    );
    const rewardCashContainerElement =
      prodBuyElement.querySelector(".prod-reward-cash");
    const rewards = rewardCashContainerElement.querySelectorAll("p");
    const rewardsTextArray = Array.from(rewards).map((reward) =>
      reward.textContent.trim()
    );
    const combinedRewardsText = rewardsTextArray.join("\n");

    // 텍스트 추출
    const totalPriceText = totalPriceElement.textContent.trim();
    const shippingFeeText = shippingFeeElement.textContent.trim();
    //const rewardCashText = combinedRewardsText.textContent.trim();

    // 이제 h2Text, totalPriceText, shippingFeeText, rewardCashText에 원하는 텍스트가 들어있습니다.
    console.log("h2Text:", h2Text);
    console.log("totalPriceText:", totalPriceText);
    console.log("shippingFeeText:", shippingFeeText);
    console.log("combinedRewardsText:", combinedRewardsText);

    // 텍스트를 줄바꿈 문자('\n')로 연결
    combinedText = [
      h2Text,
      totalPriceText,
      shippingFeeText,
      combinedRewardsText,
    ].join("\n");
    console.log("combinedText:", combinedText);
  }

  // 크롤링 데이터를 수집한 후 플래그를 설정
  dataCollected = true;
};

// 현재 페이지의 URL 가져오기
const currentURL = window.location.href;

console.log("현재 페이지 URL:", currentURL);

// content.js

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "performTask") {
//페이지 로딩이 완료된 후 작업을 수행합니다.
// 페이지 로딩이 완료된 후 크롤링 함수 실행

//window.addEventListener("load", getAllCoupangImages);
setTimeout(() => {
  // 크롤링 작업을 한 번만 수행
  getAllCoupangImages();

  //console.log("Loading 끝");
  //console.log("지마켓 이미지 URL", srcList);
  //console.log("쿠팡 이미지 URL", coupangList);

  // 메시지를 보내기
  sendCrawledDataToBackground();
}, 2000);

// 메시지를 백그라운드 스크립트로 보내는 함수
const sendCrawledDataToBackground = () => {
  // 이미지 URL과 텍스트 정보를 가지고 메시지를 보냅니다
  chrome.runtime.sendMessage({
    action: "performTask",
    images: srcList,
    coupangs: coupangList,
    currentURL: currentURL,
    detailTexts: combinedText,
  });
};
//   }
// });
