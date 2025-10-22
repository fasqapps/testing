// Debug function to clear session storage
window.clearAutoRedirectSession = function() {
  sessionStorage.removeItem('autoRedirectAttempted');
  console.log('Auto-redirect session cleared. Reload page to test again.');
};

// Preserve UTM parameters and add zappid (for metafields redirects)
function preserveUTMParameters(targetUrl) {
  try {
    const currentUrl = new URL(window.location.href);
    const targetUrlObj = new URL(targetUrl);
    
    // Check if preserve relative path setting is enabled (only for metafields redirects)
    const preserveRelativePathSetting = document.getElementById('preserveRelativePathSetting');
    const shouldPreservePath = preserveRelativePathSetting ? 
      preserveRelativePathSetting.value === 'true' : false; // Default to false
    
    if (shouldPreservePath && currentUrl.pathname !== '/' && currentUrl.pathname !== '') {
      targetUrlObj.pathname = currentUrl.pathname;
    }
    
    // Add UTM parameters
    for (const [key, value] of currentUrl.searchParams.entries()) {
      if (key.toLowerCase().startsWith('utm_')) {
        targetUrlObj.searchParams.set(key, value);
      }
    }
    
    targetUrlObj.searchParams.set('zappid', '1');
    return targetUrlObj.toString();
  } catch (error) {
    console.error('Error preserving UTM parameters:', error);
    return targetUrl;
  }
}

// Add UTM parameters to form (for localization form redirects - always preserves path)
function addUTMParametersToForm(form) {
  try {
    const currentUrl = new URL(window.location.href);
    
    // Add UTM parameters
    for (const [key, value] of currentUrl.searchParams.entries()) {
      if (key.toLowerCase().startsWith('utm_')) {
        let input = form.querySelector(`input[name="${key}"]`) || document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        if (!input.parentNode) form.appendChild(input);
      }
    }
    
    // Add zappid
    let zappidInput = form.querySelector(`input[name="zappid"]`) || document.createElement('input');
    zappidInput.type = 'hidden';
    zappidInput.name = 'zappid';
    zappidInput.value = '1';
    if (!zappidInput.parentNode) form.appendChild(zappidInput);
    
    // Add return_to (always preserve path for localization form redirects)
    let returnToInput = form.querySelector(`input[name="return_to"]`) || document.createElement('input');
    returnToInput.type = 'hidden';
    returnToInput.name = 'return_to';
    returnToInput.value = currentUrl.pathname + currentUrl.search;
    if (!returnToInput.parentNode) form.appendChild(returnToInput);
  } catch (error) {
    console.error('Error adding parameters to form:', error);
  }
}

// Parse metafields data
function parseMetafieldsData(rawValue) {
  try {
    const cleanedValue = rawValue.trim();
    
    if (cleanedValue.startsWith('{') && cleanedValue.endsWith('}') && !cleanedValue.includes('"')) {
      const pairs = cleanedValue.slice(1, -1).split(',');
      const jsonObj = {};
      pairs.forEach(pair => {
        const colonIndex = pair.indexOf(':');
        if (colonIndex > 0) {
          const key = pair.substring(0, colonIndex).trim();
          const value = pair.substring(colonIndex + 1).trim();
          if (key && value) jsonObj[key] = value;
        }
      });
      return jsonObj;
    } else if (!cleanedValue.startsWith('{') && cleanedValue.includes(':')) {
      const pairs = cleanedValue.split(',');
      const jsonObj = {};
      pairs.forEach(pair => {
        const colonIndex = pair.indexOf(':');
        if (colonIndex > 0) {
          const key = pair.substring(0, colonIndex).trim();
          const value = pair.substring(colonIndex + 1).trim();
          if (key && value) jsonObj[key] = value;
        }
      });
      return jsonObj;
    } else {
      return JSON.parse(cleanedValue);
    }
  } catch (error) {
    console.error('Error parsing metafields data:', error);
    return null;
  }
}

// Auto-detect and redirect function
async function autoDetectAndRedirect(formElement, elements) {
  try {
    if (sessionStorage.getItem('autoRedirectAttempted') === 'true') return;
    
    // Get current country
    let currentCountry = null;
    if (elements.input?.value) {
      currentCountry = elements.input.value;
    } else {
      const currentCountryLink = formElement.querySelector('.zowwARdisclosure__item a[aria-current="true"]');
      if (currentCountryLink) currentCountry = currentCountryLink.getAttribute('data-value');
    }
    
    // Fetch user's country
    const response = await fetch('https://api.country.is/');
    const data = await response.json();
    
    if (!data.country) return;
    
    // Priority 1: Check metafields
    const metafieldsInput = document.getElementById('metafiledsforautoRedirect');
    if (metafieldsInput?.value) {
      const metafieldsData = parseMetafieldsData(metafieldsInput.value);
      if (metafieldsData?.[data.country]) {
        sessionStorage.setItem('autoRedirectAttempted', 'true');
        window.location.href = preserveUTMParameters(metafieldsData[data.country]);
        return;
      }
    }
    
    // Priority 2: Check localization form
    const availableCountries = formElement.querySelectorAll('.zowwARdisclosure__item a');
    const matchingCountry = Array.from(availableCountries).find(link => 
      link.getAttribute('data-value') === data.country
    );
    
    if (matchingCountry) {
      sessionStorage.setItem('autoRedirectAttempted', 'true');
      if (elements.input) elements.input.value = data.country;
      
      const form = formElement.querySelector('form');
      if (form) {
        addUTMParametersToForm(form);
        form.submit();
      }
    }
  } catch (error) {
    console.error('Error detecting user country:', error);
  }
}

// LocalizationForm class
class LocalizationForm extends HTMLElement {
  connectedCallback() {
    this.init();
  }
  
  init() {
    this.elements = {
      input: this.querySelector('input[name="language_code"], input[name="country_code"]'),
      button: this.querySelector('.zowwARdisclosure__button'),
      panel: this.querySelector('#zowwARCountryList'),
    };
    
    if (this.elements.button && this.elements.panel) {
      this.elements.button.addEventListener('click', this.openSelector.bind(this));
      this.elements.button.addEventListener('focusout', this.closeSelector.bind(this));
      this.addEventListener('keyup', this.onContainerKeyUp.bind(this));
      this.querySelectorAll('.zowwARdisclosure__item a').forEach(item => 
        item.addEventListener('click', this.onItemClick.bind(this))
      );
      this.autoDetectAndRedirect();
    }
  }
  
  async autoDetectAndRedirect() {
    await autoDetectAndRedirect(this, this.elements);
  }
  
  openSelector() {
    this.elements.button.focus();
    const isHidden = this.elements.panel.hasAttribute('hidden');
    
    if (isHidden) {
      this.elements.panel.removeAttribute('hidden');
      this.elements.button.setAttribute('aria-expanded', 'true');
    } else {
      this.elements.panel.setAttribute('hidden', true);
      this.elements.button.setAttribute('aria-expanded', 'false');
    }
  }
  
  closeSelector(event) {
    const shouldClose = event.relatedTarget?.nodeName === 'BUTTON';
    if (event.relatedTarget === null || shouldClose) {
      this.elements.button.setAttribute('aria-expanded', 'false');
      this.elements.panel.setAttribute('hidden', true);
    }
  }
  
  onContainerKeyUp(event) {
    if (event.code.toUpperCase() === 'ESCAPE') {
      this.elements.button.setAttribute('aria-expanded', 'false');
      this.elements.panel.setAttribute('hidden', true);
      this.elements.button.focus();
    }
  }
  
  onItemClick(event) {
    event.preventDefault();
    const form = this.querySelector('form');
    if (this.elements.input) {
      this.elements.input.value = event.currentTarget.dataset.value;
    }
    if (form) form.submit();
  }
}

// Define custom element
if (!customElements.get('localization-form')) {
  customElements.define('localization-form', LocalizationForm);
}

// Fallback initialization
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('localization-form').forEach(form => {
    if (!form.hasAttribute('data-initialized')) {
      const elements = {
        input: form.querySelector('input[name="language_code"], input[name="country_code"]'),
        button: form.querySelector('.zowwARdisclosure__button'),
        panel: form.querySelector('#zowwARCountryList'),
      };
      
      if (elements.button && elements.panel) {
        // Add event listeners
        elements.button.addEventListener('click', function() {
          elements.button.focus();
          const isHidden = elements.panel.hasAttribute('hidden');
          
          if (isHidden) {
            elements.panel.removeAttribute('hidden');
            elements.button.setAttribute('aria-expanded', 'true');
          } else {
            elements.panel.setAttribute('hidden', true);
            elements.button.setAttribute('aria-expanded', 'false');
          }
        });
        
        elements.button.addEventListener('focusout', function(event) {
          const shouldClose = event.relatedTarget?.nodeName === 'BUTTON';
          if (event.relatedTarget === null || shouldClose) {
            elements.button.setAttribute('aria-expanded', 'false');
            elements.panel.setAttribute('hidden', true);
          }
        });
        
        form.addEventListener('keyup', function(event) {
          if (event.code.toUpperCase() === 'ESCAPE') {
            elements.button.setAttribute('aria-expanded', 'false');
            elements.panel.setAttribute('hidden', true);
            elements.button.focus();
          }
        });
        
        form.querySelectorAll('.zowwARdisclosure__item a').forEach(item => {
          item.addEventListener('click', function(event) {
            event.preventDefault();
            const formElement = form.querySelector('form');
            if (elements.input) {
              elements.input.value = event.currentTarget.dataset.value;
            }
            if (formElement) formElement.submit();
          });
        });
        
        autoDetectAndRedirect(form, elements);
      }
      
      form.setAttribute('data-initialized', 'true');
    }
  });
});