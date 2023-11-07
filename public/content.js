// 지마켓 이미지 URL을 가져오는 부분
let imageList = [];
// 쿠팡 이미지 URL을 가져오는 부분
//let coupangList = [];
let combinedText = "";
let dataCollected = false; // 크롤링 데이터를 수집한지 여부를 나타내는 플래그

const getAllCoupangImages = () => {
  if (dataCollected) {
    // 이미 데이터를 수집한 경우 다시 크롤링하지 않도록 반환
    return;
  }

  // imageList 초기화
  imageList = [];

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
            imageList.push(img.src);
          }
        });
      } catch (e) {
        console.warn("Error accessing iframe contents:", e);
      }
    });
    const prodBuyElement = document.querySelector(".prod-buy");

    if (prodBuyElement) {
      const h2Element = prodBuyElement.querySelector("h2");
      console.log("h2Element : ", h2Element);
      let h2Text = "";
      if (h2Element) {
        console.log("h2Element.textContent : ", h2Element.textContent.trim());
        h2Text = h2Element.textContent.trim().replace(/\t/g, "");
      }
      const totalPriceElement = prodBuyElement.querySelector(".total-price");
      let totalPriceText = "";
      if (totalPriceElement) {
        totalPriceText = totalPriceElement.textContent
          .trim()
          .replace(/\t/g, "");
      }
      const shippingFeeElement = prodBuyElement.querySelector(
        ".prod-shipping-fee-message"
      );
      let shippingFeeText = "";
      if (shippingFeeElement) {
        shippingFeeText = shippingFeeElement.textContent
          .trim()
          .replace(/\t/g, "");
      }
      const rewardCashContainerElement =
        prodBuyElement.querySelector(".prod-reward-cash");
      let combinedRewardsText = "";
      if (rewardCashContainerElement) {
        const rewards = rewardCashContainerElement.querySelectorAll("p");
        if (rewards) {
          const rewardsTextArray = Array.from(rewards).map((reward) =>
            reward.textContent.trim().replace(/\t/g, "")
          );
          combinedRewardsText = rewardsTextArray.join("\n");
        }
      }

      // 텍스트 추출

      // 텍스트를 줄바꿈 문자('\n')로 연결
      combinedText = [
        h2Text,
        totalPriceText,
        shippingFeeText,
        combinedRewardsText,
      ]
        .join("\n")
        .replace(/\t/g, "");
      //console.log("combinedText:", combinedText);
    }
  }

  // 크롤링 데이터를 수집한 후 플래그를 설정
  dataCollected = true;
  console.log("combinedText : ", combinedText);
};

const getAllGmarketImages = () => {
  if (dataCollected) {
    // 이미 데이터를 수집한 경우 다시 크롤링하지 않도록 반환
    return;
  }
  // imageList 초기화
  imageList = [];
  // 지마켓
  const iframes = document?.querySelectorAll("iframe");
  console.log("지마켓 크롤링");

  const itemTopInfo = document?.querySelector(".item-topinfo");
  if (itemTopInfo) {
    //상품 제목
    const h1Element = itemTopInfo.querySelector("h1");
    let h1Text = "";
    if (h1Element) {
      h1Text = h1Element.textContent.trim().replace(/\t/g, "");
    }

    //원산지
    const itemInfo = itemTopInfo.querySelector(".box__item-made");
    let itemMade = "";
    if (itemInfo) {
      itemMade = itemInfo.textContent.trim().replace(/\t/g, "");
    }

    //가격 정보
    const priceTextArray = [];
    const priceDivs = itemTopInfo.querySelector(".price"); // "price" 클래스를 가진 div 요소들 선택
    let priceTexts = "";
    if (priceDivs) {
      const priceSubElements = priceDivs.querySelectorAll("span"); // 해당 div의 모든 하위 태그 선택
      if (priceSubElements) {
        priceSubElements.forEach((subElement) => {
          const text = subElement.textContent.trim().replace(/\t/g, ""); // 각 하위 태그의 텍스트 추출하고 공백 제거
          priceTextArray.push(text);
        });
        priceTexts = priceTextArray.join(" ").trim().replace(/\t/g, "");
      }
    }

    //배송 정보
    const shipTextArray = [];
    const shippingFeeElements =
      itemTopInfo.querySelectorAll(".box__information");
    shippingFeeElements.forEach((shippingFeeElement) => {
      const shippingInforms = shippingFeeElement.querySelectorAll("span");
      shippingInforms.forEach((subElement) => {
        const text = subElement.textContent.trim().replace(/\t/g, ""); // 각 하위 태그의 텍스트 추출하고 공백 제거
        shipTextArray.push(text);
      });
    });

    const shippingTexts = shipTextArray.join(" ").trim().replace(/\t/g, "");
    //console.log("shippingTexts:", shippingTexts);

    // 텍스트를 줄바꿈 문자('\n')로 연결
    combinedText = [itemMade, h1Text, priceTexts, shippingTexts]
      .join("\n")
      .trim();
    //console.log("combinedText:", combinedText);
  }

  if (iframes.length > 0) {
    for (let i = 0; i < iframes.length; i++) {
      const iframe = iframes[i];
      //console.log("iframe : ", iframe);
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
                imageList.push(img.src);
              }
            });
            console.log("imageList: " + imageList.length);

            const spanTexts = basicDetailHtmlElement.querySelectorAll("span");
            const spanTextArray = [];

            spanTexts.forEach((span) => {
              const text = span.textContent.trim(); // span 태그 안의 텍스트 추출하고 공백 제거
              spanTextArray.push(text);
            });

            combinedText += spanTextArray.join("\n");

            const textsInIframe = basicDetailHtmlElement.querySelectorAll("P");
            textsInIframe.forEach((text) => {
              combinedText += text.textContent.trim().replace(/\t/g, "");
            });
            // 작업이 완료되면 반복문 종료
            break;
          }
        }
      } catch (e) {
        console.warn("Error accessing iframe contents:", e);
      }
    }
  }
};

// 메시지를 백그라운드 스크립트로 보내는 함수
const sendCrawledDataToBackground = () => {
  // 이미지 URL과 텍스트 정보를 가지고 메시지를 보냅니다
  chrome.runtime.sendMessage({
    //action: "performTask",
    images: imageList,
    //coupangs: coupangList,
    currentURL: currentURL,
    detailTexts: combinedText,
  });
};

// 현재 페이지의 URL 가져오기
const currentURL = window.location.href;

setTimeout(() => {
  console.log(currentURL);
  if (currentURL.startsWith("https://item.gmarket.co.kr")) {
    console.log(currentURL);
    getAllGmarketImages();
  } else if (currentURL.startsWith("https://www.coupang.com/vp/products")) {
    console.log(currentURL);
    getAllCoupangImages();
  }
  // background.js에 크롤링 정보 메시지 보내기
  sendCrawledDataToBackground();
}, 2000);
