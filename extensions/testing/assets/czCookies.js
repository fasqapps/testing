// document.addEventListener("DOMContentLoaded", () => {
//   const saModelOverlay = document.querySelector(".sa-popup-overlay");
//   const saCloseIcon = document.querySelector(".sa-modal-close-icon");
//   const saCountriesSelect = document.querySelector("#saCountryList");
//   const saLanguagesSelect = document.querySelector("#saLanguageList");
//   const saSubmitBtn = document.querySelector("#primaryMarketCard_0008_submit");
//   const saCurrentCountry = Shopify.country;
  
//   // Function to get cookie value
//   const getCookieValue = (name) =>
//     document.cookie.match(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`)?.pop() || "";
  
//   // Function to create cookie
//   const createCookie = ({ name, value, minutes, path = "/" }) => {
//     const date = new Date();
//     date.setTime(date.getTime() + minutes * 60 * 3000);
//     const expires = `expires=${date.toUTCString()}`;
//     document.cookie = `${name}=${value};${expires};path=${path}`;
//   };
  
//   // Function to hide popup
//   const hidePopup = () => {
//     saModelOverlay.style.display = "none";
//   };
  
//   // Function to show popup
//   const showPopup = () => {
//     saModelOverlay.style.display = "block";
//   };
  
//   // Function to handle submit button click
//   const handleSubmitClick = (event) => {
//     event.preventDefault();
//     const saSelectedCountry = saCountriesSelect.value.toLowerCase();
//     const saSelectedLanguage = saLanguagesSelect.value;
//     createCookie({
//       name: "saMarketLocale",
//       value: `${saSelectedLanguage}-${saSelectedCountry}`,
//       minutes: 30,
//     });
//     hidePopup();
//   };
  
//   // Add event listeners
//   saSubmitBtn.addEventListener("click", handleSubmitClick);
//   saCloseIcon.addEventListener("click", () => {
//     createCookie({ name: "saClose", value: "popUpClose", minutes: 30 });
//     hidePopup();
//   });
  
//   // Check cookie value on page load
//   const saMarketLocaleCookie = getCookieValue("saMarketLocale");
//   if (saCurrentCountry !== 'US' && !saMarketLocaleCookie && getCookieValue("saClose") !== "popUpClose") {
//     showPopup();
//   } else {
//     hidePopup();
//   }
// });
