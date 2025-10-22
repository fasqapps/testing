const currency_convertorid = document.getElementById("currency_convertorid");
const currency_content_list = document.getElementById('currency_content_list');
let currency_convertor_metafiled = currency_convertorid.getAttribute('value');
  const currencykeyValuePairs = currency_convertor_metafiled.slice(1, -1).split(',');
  const currencyresultObject = {};
  currencykeyValuePairs.forEach((pair) => {
    const [key, ...value] = pair.split(':');
    currencyresultObject[key.trim()] = value.join(':').trim();
  });
  const currencystringJSON = JSON.stringify(currencyresultObject, null, 2);
  const currencyjsonObject = JSON.parse(currencystringJSON);
 
    // Sort the currency entries alphabetically by currency name (value)
    const sortedCurrencyEntries = Object.entries(currencyjsonObject).sort((a, b) => {
      return a[1].localeCompare(b[1]); // Sort by currency name (value)
    });

    for (const [key, value] of sortedCurrencyEntries) {
    
      const zowwcurrencyList = document.createElement("li");
      zowwcurrencyList.setAttribute("value", key);
      zowwcurrencyList.textContent = `${value}`;
      // Hover effects
      currency_content_list.appendChild(zowwcurrencyList);
    }



document.getElementById('custom-button').addEventListener('click', function () {
    var zowwcurrencyList = document.getElementById('currency-list');
    var arrowIcon = document.getElementById('arrow-icon');
    
    if (zowwcurrencyList.style.display === 'none') {
        zowwcurrencyList.style.display = 'block';
        arrowIcon.classList.add('rotated');
    } else {
        zowwcurrencyList.style.display = 'none';
        arrowIcon.classList.remove('rotated');
    }
});
var currencyCode = Shopify.currency.active || 'USD';

document.getElementById('currency-text').textContent = `${currencyCode}`;


// Function to parse price text based on currency format
function parsePrice(priceText, currencyCode) {
    let cleanedText = priceText.trim();
    
    // Remove currency symbols and letters
    cleanedText = cleanedText.replace(/[^\d.,]/g, '');
    
    // Handle different currency formats
    if (currencyCode === 'IDR') {
        // IDR uses dot as thousand separator and comma as decimal separator
        // Example: "1.600,00" should become 1600.00
        if (cleanedText.includes(',') && cleanedText.includes('.')) {
            // Format: 1.600,00 (dot for thousands, comma for decimals)
            cleanedText = cleanedText.replace(/\./g, '').replace(',', '.');
        } else if (cleanedText.includes(',')) {
            // Format: 1600,00 (comma for decimals)
            cleanedText = cleanedText.replace(',', '.');
        }
        // If only dots, treat as thousands separator: 1.600 -> 1600
        else if (cleanedText.includes('.') && !cleanedText.includes(',')) {
            // Check if it's likely a thousand separator (more than 3 digits before dot)
            const parts = cleanedText.split('.');
            if (parts.length === 2 && parts[0].length >= 1 && parts[1].length === 3) {
                cleanedText = cleanedText.replace('.', '');
            }
        }
    } else {
        // For other currencies, use standard format (dot as decimal separator)
        // Remove commas used as thousand separators
        if (cleanedText.includes(',') && cleanedText.includes('.')) {
            // Format: 1,600.00 (comma for thousands, dot for decimals)
            cleanedText = cleanedText.replace(/,/g, '');
        } else if (cleanedText.includes(',') && !cleanedText.includes('.')) {
            // Could be either thousand separator or decimal separator
            const parts = cleanedText.split(',');
            if (parts.length === 2 && parts[1].length <= 2) {
                // Likely decimal separator: 1600,50 -> 1600.50
                cleanedText = cleanedText.replace(',', '.');
            } else {
                // Likely thousand separator: 1,600 -> 1600
                cleanedText = cleanedText.replace(/,/g, '');
            }
        }
    }
    
    return parseFloat(cleanedText) || 0;
}

// Function to update prices based on selected currency
function updatePrices(selectedCurrency, exchangeRates) {
    var product_price = document.querySelectorAll('.zowwCurrency');

    product_price.forEach(function (span) {
        if (!span.hasAttribute('data-original-price')) {
            let originalPrice = parsePrice(span.textContent, currencyCode);
            span.setAttribute('data-original-price', originalPrice.toString());
        }
        let originalPrice = parseFloat(span.getAttribute('data-original-price'));
        let convertedPrice = originalPrice * exchangeRates[selectedCurrency];
        
        if (currencyElements[selectedCurrency].money_with_currency_format.includes("{{amount_with_comma_separator}}")) {
            let amountWithCommaSeparator = convertedPrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            span.textContent = `${currencyElements[selectedCurrency].currency_symbol} ${amountWithCommaSeparator} ${selectedCurrency}`;
        } else if (currencyElements[selectedCurrency].money_with_currency_format.includes("{{amount_no_decimals_with_comma_separator}}")) {
            let amountNoDecimals = Math.round(convertedPrice);
            let amountNoDecimalsWithCommaSeparator = amountNoDecimals.toLocaleString('de-DE');
            span.textContent = `${currencyElements[selectedCurrency].currency_symbol} ${amountNoDecimalsWithCommaSeparator} ${selectedCurrency}`;
        } else if (currencyElements[selectedCurrency].money_with_currency_format.includes("{{amount_no_decimals}}")) {
            let amountNoDecimals = Math.round(convertedPrice);
            span.textContent = `${currencyElements[selectedCurrency].currency_symbol} ${amountNoDecimals} ${selectedCurrency}`;
        } else {
            span.textContent = `${currencyElements[selectedCurrency].currency_symbol} ${Number(`${convertedPrice}`).toFixed(2)} ${selectedCurrency}`;
        }

    });
}

// Event listener for currency selection
document.querySelectorAll('#currency-list li').forEach(function (item) {
    item.addEventListener('click', function () {
        const selectedCurrency = item.getAttribute('value');
        document.getElementById('currency-text').textContent = `${selectedCurrency}`;
        var zowwcurrencyList = document.getElementById('currency-list');
        var arrowIcon = document.getElementById('arrow-icon');
        
        zowwcurrencyList.style.display = 'none';
        arrowIcon.classList.remove('rotated');
        localStorage.setItem('selectedCurrency', selectedCurrency); // Save currency in localStorage
        const url = `https://api.exchangerate-api.com/v4/latest/${currencyCode}`;


        fetch(url)
            .then(response => response.json())
            .then(data => {
                updatePrices(selectedCurrency, data.rates);
            })
            .catch(error => console.error('Error fetching exchange rates:', error));
    });
});

// Function to auto-detect and set currency based on user's country
function autoDetectCurrency() {
    // Check if auto currency changer is enabled
    const autoCurrencyChangerSetting = document.getElementById('auto_currency_changer_setting');
    const isAutoChangerEnabled = autoCurrencyChangerSetting && autoCurrencyChangerSetting.value === 'true';
    
    if (!isAutoChangerEnabled) {
        console.log('Auto currency changer is disabled');
        return;
    }

    // Check if user has already manually selected a currency
    const savedCurrency = localStorage.getItem('selectedCurrency');
    if (savedCurrency) {
        return; // Don't auto-detect if user has already made a choice
    }

    // Fetch user's country from IP
    fetch('https://api.country.is/')
        .then(response => response.json())
        .then(data => {
            const userCountryCode = data.country;
            
            // Check if country exists in countrydata and has a currency code
            if (countrydata[userCountryCode] && countrydata[userCountryCode].currencyCode) {
                let detectedCurrency = countrydata[userCountryCode].currencyCode;
                
                // Handle countries with multiple currencies (take the first one)
                if (Array.isArray(detectedCurrency)) {
                    detectedCurrency = detectedCurrency[0];
                }
                
                // Skip if currency code is null or undefined
                if (!detectedCurrency) {
                    console.log('No currency code available for country:', userCountryCode);
                    return;
                }
                
                // Check if the detected currency exists in both currencyElements and the actual currency list
                if (currencyElements[detectedCurrency] && currencyjsonObject[detectedCurrency]) {
                    // Update the button text to show detected currency
                    document.getElementById('currency-text').textContent = detectedCurrency;
                    
                    // Get exchange rates and update prices
                    const baseCurrencyCode = Shopify.currency.active || 'USD';
                    const url = `https://api.exchangerate-api.com/v4/latest/${baseCurrencyCode}`;
                    
                    fetch(url)
                        .then(response => response.json())
                        .then(exchangeData => {
                            updatePrices(detectedCurrency, exchangeData.rates);
                        })
                        .catch(error => console.error('Error fetching exchange rates:', error));
                } else {
                    console.log('Detected currency not available in store currency list, using default currency');
                }
            }
        })
        .catch(error => {
            console.log('Could not detect user country, using default currency');
        });
}

// Restore selected currency on page load or auto-detect
window.addEventListener('load', function () {
    const savedCurrency = localStorage.getItem('selectedCurrency');

    if (savedCurrency) {
        // User has previously selected a currency
        const currencyCode = Shopify.currency.active || 'USD';
        const url = `https://api.exchangerate-api.com/v4/latest/${currencyCode}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                updatePrices(savedCurrency, data.rates);
                document.getElementById('currency-text').textContent = savedCurrency;
            })
            .catch(error => console.error('Error fetching exchange rates:', error));
    } else {
        // Auto-detect currency based on user's country
        autoDetectCurrency();
    }
});

const currencyElements = {

    AED: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} AED",
        currency_symbol: "Dhs."
    },
    AFN: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} AFN",
        currency_symbol: "Af"
    },
    ALL: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} ALL",
        currency_symbol: "Lek"
    },
    AMD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} AMD",
        currency_symbol: "֏"
    },
    ANG: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}}",
        currency_symbol: "ƒ"
    },
    AOA: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} AOA",
        currency_symbol: "Kz"
    },
    ARS: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} ARS",
        currency_symbol: "$"
    },
    AUD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} AUD",
        currency_symbol: "$"
    },
    AWG: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} AWG",
        currency_symbol: "Afl"
    },
    AZN: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} AZN",
        currency_symbol: "₼"
    },
    BAM: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} BAM",
        currency_symbol: "KM"
    },
    BBD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} Bds",
        currency_symbol: "$"
    },
    BDT: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} BDT",
        currency_symbol: "Tk"
    },
    BGN: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} BGN",
        currency_symbol: "лв"
    },
    BHD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} BHD",
        currency_symbol: "BD"
    },
    BIF: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} BIF",
        currency_symbol: ""
    },
    BMD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} BMD",
        currency_symbol: "$"
    },
    BND: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} BND",
        currency_symbol: "$"
    },
    BOB: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} BOB",
        currency_symbol: "Bs"
    },
    BRL: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} BRL",
        currency_symbol: "R$"
    },
    BSD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} BSD",
        currency_symbol: "BS$"
    },
    BTC: {
        money_format: "{{amount_no_decimals}}",
        money_with_currency_format: "{{amount_no_decimals}} BTC",
        currency_symbol: "₿"
    },
    BTN: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} BTN",
        currency_symbol: "Nu"
    },
    BWP: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} BWP",
        currency_symbol: "P"
    },
    BYN: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} BYN",
        currency_symbol: "Br"
    },
    BZD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} BZD",
        currency_symbol: "BZ$"
    },
    CAD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} CAD",
        currency_symbol: "$"
    },
    CDF: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} CDF",
        currency_symbol: ""
    },
    CHF: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}}",
        currency_symbol: "CHF"
    },
    CLP: {
        money_format: "{{amount_no_decimals}}",
        money_with_currency_format: "{{amount_no_decimals}} CLP",
        currency_symbol: "$"
    },
    CNY: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} CNY",
        currency_symbol: "¥"
    },
    COP: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} COP",
        currency_symbol: "$"
    },
    CRC: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} CRC",
        currency_symbol: "₡"
    },
    CUC: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} CUC",
        currency_symbol: ""
    },
    CUP: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} CUP",
        currency_symbol: ""
    },
    CVE: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} CVE",
        currency_symbol: "$"
    },
    CZK: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} CZK",
        currency_symbol: "Kč"
    },
    DJF: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} DJF",
        currency_symbol: ""
    },
    DKK: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} DKK",
        currency_symbol: "kr"
    },
    DOP: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} DOP",
        currency_symbol: "RD$"
    },
    DZD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} DZD",
        currency_symbol: "DA"
    },
    EEK: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} EEK",
        currency_symbol: ""
    },
    EGP: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} EGP",
        currency_symbol: "LE"
    },
    ERN: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} ERN",
        currency_symbol: ""
    },
    ETB: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} ETB",
        currency_symbol: "Br"
    },
    EUR: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} EUR",
        currency_symbol: "€"
    },
    FJD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} FJD",
        currency_symbol: "$"
    },
    FKP: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} FKP",
        currency_symbol: "£"
    },
    GBP: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} GBP",
        currency_symbol: "£"
    },
    GEL: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} GEL",
        currency_symbol: "₾"
    },
    GGP: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} GGP",
        currency_symbol: ""
    },
    GHS: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} GHS",
        currency_symbol: "GH₵"
    },
    GIP: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} GIP",
        currency_symbol: "£"
    },
    GMD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} GMD",
        currency_symbol: "D"
    },
    GNF: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} GNF",
        currency_symbol: ""
    },
    GTQ: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} GTQ",
        currency_symbol: "Q"
    },
    GYD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} GYD",
        currency_symbol: "$"
    },
    HKD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} HKD",
        currency_symbol: "HK$"
    },
    HNL: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} HNL",
        currency_symbol: "L"
    },
    HRK: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} HRK",
        currency_symbol: "kn"
    },
    HTG: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} HTG",
        currency_symbol: "G"
    },
    HUF: {
        money_format: "{{amount_no_decimals_with_comma_separator}}",
        money_with_currency_format: "{{amount_no_decimals_with_comma_separator}} HUF",
        currency_symbol: "Ft"
    },
    IDR: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} IDR",
        currency_symbol: "Rp"
    },
    ILS: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} ILS",
        currency_symbol: "₪"
    },
    IMP: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} IMP",
        currency_symbol: ""
    },
    INR: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} INR",
        currency_symbol: "₹"
    },
    IQD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} IQD",
        currency_symbol: "ع.د"
    },
    IRR: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} IRR",
        currency_symbol: "﷼"
    },
    ISK: {
        money_format: "{{amount_no_decimals}}",
        money_with_currency_format: "{{amount_no_decimals}} ISK",
        currency_symbol: "kr"
    },
    JEP: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} JEP",
        currency_symbol: "£"
    },
    JMD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} JMD",
        currency_symbol: "$"
    },
    JOD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} JOD",
        currency_symbol: "JD"
    },
    JPY: {
        money_format: "{{amount_no_decimals}}",
        money_with_currency_format: "{{amount_no_decimals}} JPY",
        currency_symbol: "¥"
    },
    KES: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} KES",
        currency_symbol: "KSh"
    },
    KGS: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} KGS",
        currency_symbol: "лв"
    },
    KHR: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} KHR",
        currency_symbol: "KHR"
    },
    KMF: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} KMF",
        currency_symbol: "CF"
    },
    KPW: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} KPW",
        currency_symbol: "₩"
    },
    KRW: {
        money_format: "{{amount_no_decimals}}",
        money_with_currency_format: "{{amount_no_decimals}} KRW",
        currency_symbol: "₩"
    },
    KWD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} KWD",
        currency_symbol: "KD"
    },
    KYD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} KYD",
        currency_symbol: "$"
    },
    KZT: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} KZT",
        currency_symbol: "₸"
    },
    LAK: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} LAK",
        currency_symbol: "₭"
    },
    LBP: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} LBP",
        currency_symbol: "L.L."
    },
    LKR: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} LKR",
        currency_symbol: "Rs"
    },
    LRD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} LRD",
        currency_symbol: "$"
    },
    LSL: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} LSL",
        currency_symbol: "L"
    },
    LTL: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} LTL",
        currency_symbol: "Lt"
    },
    LVL: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} LVL",
        currency_symbol: "Ls"
    },
    LYD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} LYD",
        currency_symbol: "ل.د"
    },
    MAD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} MAD",
        currency_symbol: "dh"
    },
    MDL: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} MDL",
        currency_symbol: "MDL"
    },
    MGA: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} MGA",
        currency_symbol: "Ar"
    },
    MKD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} MKD",
        currency_symbol: "ден"
    },
    MMK: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} MMK",
        currency_symbol: "K"
    },
    MNT: {
        money_format: "{{amount_no_decimals}}",
        money_with_currency_format: "{{amount_no_decimals}} MNT",
        currency_symbol: "₮"
    },
    MOP: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} MOP",
        currency_symbol: "MOP$"
    },
    MRO: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} MRO",
        currency_symbol: "UM"
    },
    MUR: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} MUR",
        currency_symbol: "Rs"
    },
    MVR: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} MVR",
        currency_symbol: "Rf"
    },
    MWK: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} MWK",
        currency_symbol: "MK"
    },
    MXN: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} MXN",
        currency_symbol: "$"
    },
    MYR: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} MYR",
        currency_symbol: "RM"
    },
    MZN: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} MZN",
        currency_symbol: "Mt"
    },
    NAD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} NAD",
        currency_symbol: "N$"
    },
    NGN: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} NGN",
        currency_symbol: "₦"
    },
    NIO: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} NIO",
        currency_symbol: "C$"
    },
    NOK: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} NOK",
        currency_symbol: "kr"
    },
    NPR: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} NPR",
        currency_symbol: "Rs"
    },
    NZD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} NZD",
        currency_symbol: "$"
    },
    OMR: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} OMR",
        currency_symbol: "OMR"
    },
    PAB: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} PAB",
        currency_symbol: "B/."
    },
    PEN: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} PEN",
        currency_symbol: "S/."
    },
    PGK: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} PGK",
        currency_symbol: "K"
    },
    PHP: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} PHP",
        currency_symbol: "₱"
    },
    PKR: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} PKR",
        currency_symbol: "Rs."
    },
    PLN: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} PLN",
        currency_symbol: "zl"
    },
    PYG: {
        money_format: "{{amount_no_decimals_with_comma_separator}}",
        money_with_currency_format: "{{amount_no_decimals_with_comma_separator}} PYG",
        currency_symbol: "Gs."
    },
    QAR: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} QAR",
        currency_symbol: "QAR"
    },
    RON: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} RON",
        currency_symbol: "lei"
    },
    RSD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} RSD",
        currency_symbol: "RSD"
    },
    RUB: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} RUB",
        currency_symbol: "₽"
    },
    RWF: {
        money_format: "{{amount_no_decimals}}",
        money_with_currency_format: "{{amount_no_decimals}} RWF",
        currency_symbol: "RF"
    },
    SAR: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} SAR",
        currency_symbol: "SR"
    },
    SBD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} SBD",
        currency_symbol: "$"
    },
    SCR: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} SCR",
        currency_symbol: "₨"
    },
    SDG: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} SDG",
        currency_symbol: "£"
    },
    SEK: {
        money_format: "{{amount_no_decimals}}",
        money_with_currency_format: "{{amount_no_decimals}} SEK",
        currency_symbol: "kr"
    },
    SGD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} SGD",
        currency_symbol: "S$"
    },
    SHP: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} SHP",
        currency_symbol: "£"
    },
    SKK: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} SKK",
        currency_symbol: "SKK"
    },
    SLL: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} SLL",
        currency_symbol: "Le"
    },
    SOS: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} SOS",
        currency_symbol: "S"
    },
    SPL: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} SPL",
        currency_symbol: "SPL"
    },
    SRD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} SRD",
        currency_symbol: "$"
    },
    STD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} STD",
        currency_symbol: "Db"
    },
    SVC: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} SVC",
        currency_symbol: "$"
    },
    SYP: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} SYP",
        currency_symbol: "S£"
    },
    SZL: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} SZL",
        currency_symbol: "L"
    },
    THB: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} THB",
        currency_symbol: "฿"
    },
    TJS: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} TJS",
        currency_symbol: "TJS"
    },
    TMT: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} TMT",
        currency_symbol: "m"
    },
    TND: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} DT",
        currency_symbol: "DT"
    },
    TOP: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} TOP",
        currency_symbol: "T$"
    },
    TRY: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} TRY",
        currency_symbol: "TL"
    },
    TTD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} TTD",
        currency_symbol: "$"
    },
    TVD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} TVD",
        currency_symbol: "TVD"
    },
    TWD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} TWD",
        currency_symbol: "$"
    },
    TZS: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} TZS",
        currency_symbol: "TZS"
    },
    UAH: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} UAH",
        currency_symbol: "₴"
    },
    UGX: {
        money_format: "{{amount_no_decimals}}",
        money_with_currency_format: "{{amount_no_decimals}} UGX",
        currency_symbol: "Ush"
    },
    USD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} USD",
        currency_symbol: "$"
    },
    UYU: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} UYU",
        currency_symbol: "$"
    },
    UZS: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} UZS",
        currency_symbol: "лв"
    },
    VEF: {
        money_format: "{{amount_with_comma_separator}}",
        money_with_currency_format: "{{amount_with_comma_separator}} VEF",
        currency_symbol: "Bs."
    },
    VND: {
        money_format: "{{amount_no_decimals_with_comma_separator}}",
        money_with_currency_format: "{{amount_no_decimals_with_comma_separator}} VND",
        currency_symbol: "₫"
    },
    VUV: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} VT",
        currency_symbol: "$"
    },
    WST: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} WST",
        currency_symbol: "WS$"
    },
    XAF: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} XAF",
        currency_symbol: "FCFA"
    },
    XAG: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} XAG",
        currency_symbol: "XAG"
    },
    XAU: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} XAU",
        currency_symbol: "XAU"
    },
    XCD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} XCD",
        currency_symbol: "EC$"
    },
    XDR: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} XDR",
        currency_symbol: "XDR"
    },
    XOF: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} XOF",
        currency_symbol: "CFA"
    },
    XPD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} XPD",
        currency_symbol: "XPD"
    },
    XPF: {
        money_format: "{{amount_no_decimals_with_comma_separator}}",
        money_with_currency_format: "{{amount_no_decimals_with_comma_separator}} XPF",
        currency_symbol: "XPF"
    },
    XPT: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} XPT",
        currency_symbol: "XPT"
    },
    YER: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} YER",
        currency_symbol: "﷼"
    },
    ZAR: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} ZAR",
        currency_symbol: "R"
    },
    ZMW: {
        money_format: "{{amount_no_decimals_with_comma_separator}}",
        money_with_currency_format: "{{amount_no_decimals_with_comma_separator}} ZMW",
        currency_symbol: "K"
    },
    ZWD: {
        money_format: "{{amount}}",
        money_with_currency_format: "{{amount}} ZWD",
        currency_symbol: "ZWD"
    }
}