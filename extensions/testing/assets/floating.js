
var langForm = document.getElementsByClassName('lng_form_floating')[0];
var floatingform = langForm.querySelector('form');
var floatinglanguageList = document.getElementById('floatingSelectorlanguageList');
var floating_country_hidden = document.getElementById('floating_country_hidden').getAttribute('value');


let floatingmymetafeildurl = document.querySelector('#floatingmetafeildurl');
  let floatinginputStringMetafeild = floatingmymetafeildurl.value;
  const floatingkeyValuePairs = floatinginputStringMetafeild.slice(1, -1).split(',');
  const floatingresultObject = {};
  floatingkeyValuePairs.forEach((pair) => {
    const [key, ...value] = pair.split(':');
    floatingresultObject[key.trim()] = value.join(':').trim();
  });
  const floatingstringJSON = JSON.stringify(floatingresultObject, null, 2);
  const floatingjsonObject = JSON.parse(floatingstringJSON);
  console.log('floating object',floatingjsonObject);

    const dropdownContent22 = document.getElementById("floating_dropdownContent");
    console.log('dropdown content',dropdownContent22)

// Function to filter floating dropdown links based on metafield data
function filterFloatingDropdownLinks() {
  // Check if PinstaMarket is set to 0
  const floatingMarketDataSpan = document.querySelector(".market_data_Presence_floating");
  const shouldFilter = floatingMarketDataSpan && floatingMarketDataSpan.getAttribute("data-value") === "{PinstaMarket:0}";
  
  console.log('Floating filter check:', {
    span: floatingMarketDataSpan,
    dataValue: floatingMarketDataSpan?.getAttribute("data-value"),
    shouldFilter: shouldFilter
  });
  
  if (shouldFilter) {
    // Get all floating dropdown links
    const floatingdropdownLinks = Array.from(document.querySelectorAll('#floating_dropdownContent a'));
    
    console.log('Filtering floating dropdown links based on metafield data');
    console.log('Available keys in floatingresultObject:', Object.keys(floatingresultObject));
    
    // Hide/show dropdown links based on floatingresultObject keys
    floatingdropdownLinks.forEach((link) => {
      const linkValue = link.getAttribute("value");
      if (floatingresultObject.hasOwnProperty(linkValue)) {
        link.style.display = ""; // Show the link
      } else {
        link.style.display = "none"; // Hide the link
      }
    });
  } else {
    // If PinstaMarket:1, show all countries
    const floatingdropdownLinks = Array.from(document.querySelectorAll('#floating_dropdownContent a'));
    floatingdropdownLinks.forEach((link) => {
      link.style.display = ""; // Show all links
    });
  }
}

// Call the filter function when page loads
filterFloatingDropdownLinks();

    // for (const [key, value] of Object.entries(floatingjsonObject)) {
    //     const countryName23 = countrydata[key]?.country || key;
    //   const anchor = document.createElement("a");
    //   anchor.setAttribute("value", key);
    //   anchor.setAttribute("href", value);
    //   anchor.textContent = `Visit ${countryName23}`;
    //   anchor.style.color = "{{ block.settings.dropdown_font_color_floating }}";
    //   anchor.style.cursor = "pointer";

    //   // Hover effects
    //   anchor.onmouseover = function () {
    //     this.style.color = "{{ block.settings.dropdown_hover_color_floating }}";
    //   };
    //   anchor.onmouseout = function () {
    //     this.style.color = "{{ block.settings.dropdown_font_color_floating }}";
    //   };

    //   dropdownContent22.appendChild(anchor);
    // }



if (floating_country_hidden) {
  const floatingcountrySearchBar = document.getElementById('floating_countrySearchBar');
  const floatingdropdownLinks = Array.from(document.querySelectorAll('#floating_dropdownContent a'));
  if (floatingcountrySearchBar) {
    floatingcountrySearchBar.addEventListener('input', (event) => {
      const floatingsearchTerm = event.target.value.toLowerCase();
      floatingdropdownLinks.forEach((link) => {
        const floatingcountryName =
          link.querySelector('.zeom_countryNameDropFloating')?.textContent.toLowerCase() || '';
        const floatingmatchesSearch = floatingcountryName.includes(floatingsearchTerm);
        
        // Check if the link was already hidden by filterFloatingDropdownLinks
        const linkValue = link.getAttribute("value");
        const floatingMarketDataSpan = document.querySelector(".market_data_Presence_floating");
        const shouldFilter = floatingMarketDataSpan && floatingMarketDataSpan.getAttribute("data-value") === "{PinstaMarket:0}";
        
        let floatingisAllowedByFilter = true;
        if (shouldFilter) {
          // If filtering is active, only show links that exist in floatingresultObject
          floatingisAllowedByFilter = floatingresultObject.hasOwnProperty(linkValue);
        }
        
        // Show link only if it matches search AND is allowed by the filter
        const floatingisVisible = floatingmatchesSearch && floatingisAllowedByFilter;
        link.style.display = floatingisVisible ? '' : 'none';
      });
    });
  }
  floatingcountrySearchBar.addEventListener('click', (event) => {
    event.stopPropagation();
  });
}

var floating_object_lng = {
  input: floatingform.querySelector('input[name="language_code"]'),
  button: floatingform.querySelector('button'),
  panel: floatingform.querySelector('ul'),
};

floating_object_lng.button.addEventListener('click', () => {
  // Close the dropdown content if it is open
  if (floating_dropdownContent.classList.contains('active')) {
    floating_dropdownContent.classList.remove('active');
    floating_dropdownContent.style.opacity = '0';
    floating_dropdownContent.style.visibility = 'hidden';
    floating_dropdownContent.style.transform = 'translateY(-20px) scale(0.95)';

    // Reset menu item styles
    const menuItems = floating_dropdownContent.querySelectorAll('a');
    menuItems.forEach((item) => {
      item.style.transitionDelay = '0s';
      item.style.opacity = '0';
      item.style.transform = 'translateX(-20px)';
    });
  }

  // Toggle the language list
  if (floatinglanguageList.style.display === 'none' || floatinglanguageList.style.display === '') {
    setTimeout(function () {
      floatinglanguageList.style.display = 'block';
    }, 400);
    floatinglanguageList.classList.add('open');
  } else {
    floatinglanguageList.classList.remove('open');
    setTimeout(function () {
      floatinglanguageList.style.display = 'none';
    }, 300);
  }
});

var floatinglanguageChoices = document.querySelectorAll('.floatingSelectorlanguageChoice');
floatinglanguageChoices.forEach(function (choice) {
  choice.addEventListener('click', function (event) {
    event.preventDefault();
    var floatingselectedLanguageData = this.querySelector('a').getAttribute('data-value');
    floating_object_lng.input.value = `${floatingselectedLanguageData}`;
    if (floatingform) floatingform.submit();
    floatinglanguageList.style.display = 'none';
  });
});

function floatinghideDropdownContent() {
  const floating_dropdownContent = document.getElementById('floating_dropdownContent');
  floating_dropdownContent.style.display = 'none';
}

const floating_dropdown = document.getElementById('floating_dropdown');
const floating_dropdownContent = document.getElementById('floating_dropdownContent');

// Rotate the dropdown icon
function rotateIcon() {
  const icon1 = document.querySelector('.icon-dropdown-floating');
  if (icon1) {
    if (icon1.style.transform === 'rotate(180deg)') {
      icon1.style.transform = 'rotate(0deg)';
    } else {
      icon1.style.transform = 'rotate(180deg)';
    }
  }
}

// Dropdown click event
floating_dropdown.addEventListener('click', () => {
  // Close the language list if it is open
  if (floatinglanguageList.classList.contains('open')) {
    floatinglanguageList.classList.remove('open');
    setTimeout(function () {
      floatinglanguageList.style.display = 'none';
    }, 300);
  }

  // Toggle the dropdown content
  const menuItems = floating_dropdownContent.querySelectorAll('a');
  floating_dropdownContent.classList.toggle('active');

  if (floating_dropdownContent.classList.contains('active')) {
    // Animate dropdown content
    floating_dropdownContent.style.opacity = '1';
    floating_dropdownContent.style.visibility = 'visible';
    floating_dropdownContent.style.transform = 'translateY(0) scale(1)';

    // Animate menu items with staggered transitions
    menuItems.forEach((item, index) => {
      item.style.transitionDelay = `${(index + 1) * 0.1}s`;
      item.style.opacity = '1';
      item.style.transform = 'translateX(0)';
    });
  } else {
    // Reverse animation for dropdown content
    floating_dropdownContent.style.opacity = '0';
    floating_dropdownContent.style.visibility = 'hidden';
    floating_dropdownContent.style.transform = 'translateY(-20px) scale(0.95)';

    // Reset menu item styles
    menuItems.forEach((item) => {
      item.style.transitionDelay = '0s';
      item.style.opacity = '0';
      item.style.transform = 'translateX(-20px)';
    });
  }

  // Rotate the icon
  rotateIcon();
});

// Dropdown item click handler
floating_dropdownContent.addEventListener('click', (event) => {
  
  const floatingzeom_selectedOption = event.target.closest('a');
  if (floatingzeom_selectedOption) {
    const floatingzeom_selectedCountryIsoCode = floatingzeom_selectedOption.getAttribute('value');
    if (floatingjsonObject.hasOwnProperty(floatingzeom_selectedCountryIsoCode)) {
      const floatingredirectToURL = floatingjsonObject[floatingzeom_selectedCountryIsoCode];
      if (floatingredirectToURL) {
        let floatingnewUrl = new URL(floatingredirectToURL);
        window.location.href = floatingnewUrl + '?zappid=1';
      }
      floatinghideDropdownContent();
    } else {
      var mainURL = '?country=' + floatingzeom_selectedCountryIsoCode;
      mainURL += '&zappid=1';
      window.location.replace(mainURL);
    }
  }
});

function floatingrotateIconLng() {
  var floatingicon2 = document.querySelector('.floating-icon-lng');
  if (floatingicon2.style.transform === 'rotate(180deg)') {
    floatingicon2.style.transform = 'rotate(0deg)';
  } else {
    floatingicon2.style.transform = 'rotate(180deg)';
  }
}

const floatingzeom_flagNotAvailable = document.getElementById('zeom_blockFloatingID');
floatingzeom_flagNotAvailable.addEventListener('error', () => {
  floatingzeom_flagNotAvailable.src =
    'https://cdn.shopify.com/extensions/0aee3fc1-57c8-407b-9a33-865e53488212/geomarkets-297/assets/zowwselectoracta.png';
});