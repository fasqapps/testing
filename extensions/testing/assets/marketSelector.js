/* marketSelector.js */


var langForm = document.getElementsByClassName("lng_form")[0];
var form = langForm.querySelector("form");


var languageList = document.getElementById("customSelectorlanguageList");
const selectorcountrySearchBar = document.getElementById(
  "selector_countrySearchBar"
);

const dropdownLinks = Array.from(
  document.querySelectorAll("#zeom_dropdownContent a")
);

// Console log all values of the dropdown links
console.log("=== Dropdown Links Values ===");
dropdownLinks.forEach((link, index) => {
  const value = link.getAttribute("value");
  const countryName = link.querySelector(".zeom_countryNameDropMenu")?.textContent || "N/A";
  const currencyCode = link.querySelector(".dropdown_currency_code")?.textContent || "N/A";
  const currencySymbol = link.querySelector(".dropdown_currency_symbol")?.textContent || "N/A";
  
  console.log(`Link ${index + 1}:`, {
    value: value,
    countryName: countryName.trim(),
    currencyCode: currencyCode.trim(),
    currencySymbol: currencySymbol.trim(),
    element: link
  });
});

var object_lng = {
  input: form.querySelector('input[name="language_code"]'),
  button: form.querySelector("button"),
  panel: form.querySelector("ul"),
};
object_lng.button.addEventListener("click", () => {
  if (languageList.style.display === "none") {
    languageList.style.display = "block";
    zeom_dropdownContent.style.display = "none";
  } else {
    languageList.style.display = "none";
  }
});

var languageChoices = document.querySelectorAll(
  ".customSelectorlanguageChoice"
);
languageChoices.forEach(function (choice) {
  choice.addEventListener("click", function (event) {
    event.preventDefault();
    var selectedLanguageData =
      this.querySelector("a").getAttribute("data-value");
    object_lng.input.value = `${selectedLanguageData}`;
    if (form) form.submit();
    languageList.style.display = "none";
  });
});

function hideDropdownContent() {
  const zeom_dropdownContent = document.getElementById("zeom_dropdownContent");
  zeom_dropdownContent.style.display = "none";
}

const zeom_dropdown = document.getElementById("zeom_dropdown");
var spanElement = document.querySelector(".zowwShowPopupBtnText");

if (spanElement.textContent == "true") {
  zeom_dropdown.addEventListener("click", () => {
    document.getElementById("zeom_dropdownContent").style.display = "none";
    let modalCountry = document.getElementById("sa-modal-country");
    modalCountry.style.display = "block";
  });
} else {
  zeom_dropdown.addEventListener("click", () => {
    const zeom_dropdownContent = document.getElementById(
      "zeom_dropdownContent"
    );
    const zeom_currentDisplay = window
      .getComputedStyle(zeom_dropdownContent)
      .getPropertyValue("display");
    function rotateIcon() {
      var icon1 = document.querySelector(".icon-dropdown");
      if (icon1.style.transform === "rotate(180deg)") {
        icon1.style.transform = "rotate(0deg)";
      } else {
        icon1.style.transform = "rotate(180deg)";
      }
    }
    rotateIcon();
    if (zeom_currentDisplay === "block") {
      zeom_dropdownContent.style.display = "none";
    } else {
      zeom_dropdownContent.style.display = "block";
      languageList.style.display = "none";
    }
  });
}

// Function to filter dropdown links based on metafield data
function filterDropdownLinks() {
  // Check if PinstaMarket is set to 0
  const marketDataSpan = document.querySelector(".market_data_Presence_selector");
  const shouldFilter = marketDataSpan && marketDataSpan.getAttribute("data-value") === "{PinstaMarket:0}";
  
  if (shouldFilter) {
    let mymetafeildurl = document.querySelector("#metafeildurl");
    if (mymetafeildurl && mymetafeildurl.value) {
      let inputStringMetafeild = mymetafeildurl.value;
      console.log('Filtering - meta field:', inputStringMetafeild);
      
      const keyValuePairs = inputStringMetafeild.slice(1, -1).split(",");
      const resultObject = {};
      
      keyValuePairs.forEach((pair) => {
        const [key, ...value] = pair.split(":");
        resultObject[key.trim()] = value.join(":").trim();
      });
      
      console.log('Filter result object:', resultObject);
      
      // Hide/show dropdown links based on resultObject keys
      dropdownLinks.forEach((link) => {
        const linkValue = link.getAttribute("value");
        if (resultObject.hasOwnProperty(linkValue)) {
          link.style.display = ""; // Show the link
        } else {
          link.style.display = "none"; // Hide the link
        }
      });
    }
  }
}

// Call the filter function when page loads
filterDropdownLinks();

const zeom_dropdownContent = document.getElementById("zeom_dropdownContent");
zeom_dropdownContent.addEventListener("click", (event) => {
  let mymetafeildurl = document.querySelector("#metafeildurl");
  let inputStringMetafeild = mymetafeildurl.value;
  console.log('meta filed',inputStringMetafeild);
  const keyValuePairs = inputStringMetafeild.slice(1, -1).split(",");
  const resultObject = {};
  console.log('result object');
  keyValuePairs.forEach((pair) => {
    const [key, ...value] = pair.split(":");
    resultObject[key.trim()] = value.join(":").trim();
  });
  const stringJSON = JSON.stringify(resultObject, null, 2);
  const jsonObject = JSON.parse(stringJSON);
  const zeom_selectedOption = event.target.closest("a");
  
  if (zeom_selectedOption) {
    const zeom_selectedCountryIsoCode =
      zeom_selectedOption.getAttribute("value");

    if (jsonObject.hasOwnProperty(zeom_selectedCountryIsoCode)) {
      const redirectToURL = jsonObject[zeom_selectedCountryIsoCode];
      if (redirectToURL) {
        let newUrl = new URL(redirectToURL);
        window.location.href = newUrl + "?zappid=1";
      }
      hideDropdownContent();
    } else {
      var mainURL = "?country=" + zeom_selectedCountryIsoCode;
      mainURL += "&zappid=1";
      window.location.replace(mainURL);
    }
  }
});

if (selectorcountrySearchBar) {
  selectorcountrySearchBar.addEventListener("input", (event) => {
    const searchTerm = event.target.value.toLowerCase();
    dropdownLinks.forEach((link) => {
      const countryName =
        link
          .querySelector(".zeom_countryNameDropMenu")
          ?.textContent.toLowerCase() || "";
      const matchesSearch = countryName.includes(searchTerm);
      
      // Check if the link was already hidden by filterDropdownLinks
      const linkValue = link.getAttribute("value");
      const marketDataSpan = document.querySelector(".market_data_Presence_selector");
      const shouldFilter = marketDataSpan && marketDataSpan.getAttribute("data-value") === "{PinstaMarket:0}";
      
      let isAllowedByFilter = true;
      if (shouldFilter) {
        // If filtering is active, check if this country exists in the metafield data
        let mymetafeildurl = document.querySelector("#metafeildurl");
        if (mymetafeildurl && mymetafeildurl.value) {
          let inputStringMetafeild = mymetafeildurl.value;
          const keyValuePairs = inputStringMetafeild.slice(1, -1).split(",");
          const resultObject = {};
          
          keyValuePairs.forEach((pair) => {
            const [key, ...value] = pair.split(":");
            resultObject[key.trim()] = value.join(":").trim();
          });
          
          // Only show links that exist in resultObject
          isAllowedByFilter = resultObject.hasOwnProperty(linkValue);
        }
      }
      
      // Show link only if it matches search AND is allowed by the filter
      const isVisible = matchesSearch && isAllowedByFilter;
      link.style.display = isVisible ? "" : "none";
    });
  });
}

selectorcountrySearchBar.addEventListener("click", (event) => {
  event.stopPropagation(); 
});

function rotateIconLng() {
  var icon2 = document.querySelector(".icon-lng");
  if (icon2.style.transform === "rotate(180deg)") {
    icon2.style.transform = "rotate(0deg)";
  } else {
    icon2.style.transform = "rotate(180deg)";
  }
}

var Lang_element = document.querySelector(".lng_isShow");
if (Lang_element) {
  if (Lang_element.textContent.trim() === "true") {
    document.querySelector("#customLanguageSelectorBtn").style.display =
      "block";
  } else {
    document.querySelector("#customLanguageSelectorBtn").style.display = "none";
  }
}
const zeom_flagNotAvailable = document.getElementById("zeom_blockSelectorID");
zeom_flagNotAvailable.addEventListener("error", () => {
  zeom_flagNotAvailable.src =
    "https://cdn.shopify.com/extensions/0aee3fc1-57c8-407b-9a33-865e53488212/geomarkets-297/assets/zowwselectoracta.png";
});
