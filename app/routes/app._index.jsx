import { useState, useEffect, useRef } from "react";
import { useLoaderData, useSearchParams, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  DataTable,
  InlineStack,
  Modal,
  Form,
  TextField,
  Badge,
  Combobox,
  Listbox,
  Tag,
  Spinner,
  Checkbox,
  Toast,
  Frame,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { logAuthenticationDetails, parseShopDomain, extractShopifyAuthParams } from "../utils/shopify-auth";
import { AuthDebugInfo } from "../components/AuthDebugInfo";
import OnboardingComponent from "../components/OnboardingComponent";
import MarketsTable from "../components/MarketsTable";

export const loader = async ({ request }) => {
   const { session, admin } = await authenticate.admin(request);

  // Use the comprehensive logging utility
  logAuthenticationDetails(request, session, admin);
  
  // Parse shop domain for additional insights
  const shopInfo = parseShopDomain(session.shop);
  console.log('=== SHOP INFORMATION ===');
  console.log('Shop Info:', shopInfo);
  
  // Log the access token to console
  console.log('tokeeeeeeeeeeeeeeeeennnnnnnnn', session.accessToken);
  
  // Extract auth parameters for UI display
  const authParams = extractShopifyAuthParams(request);
  try {
    // GraphQL query to fetch markets data
    const response = await admin.graphql(
      `#graphql
      query Markets {
        markets(first: 50) {
          nodes {
            id
            name
            enabled
            currencySettings {
              baseCurrency {
                currencyCode
              }
            }
            regions(first: 50) {
              nodes {
                name
                ... on MarketRegionCountry {
                  code
                }
              }
            }
          }
        }
      }`
    );

    const data = await response.json();
    
    return {
      markets: data.data?.markets?.nodes || [],
      session: {
        shop: session.shop,
        id: session.id,
        state: session.state,
        scope: session.scope,
        isOnline: session.isOnline,
        expires: session.expires,
        accessToken: session.accessToken, // Exposing actual token for UI display - KEEP SECURE
        onlineAccessInfo: session.onlineAccessInfo
      },
      shopInfo,
      authParams
    };
  } catch (error) {
    console.error("Error fetching markets:", error);
    // Return empty markets array if there's a permission error
    return {
      markets: [],
      session: {
        shop: session.shop,
        id: session.id,
        state: session.state,
        scope: session.scope,
        isOnline: session.isOnline,
        expires: session.expires,
        accessToken: session.accessToken, // Exposing actual token for UI display - KEEP SECURE
        onlineAccessInfo: session.onlineAccessInfo
      },
      shopInfo,
      authParams
    };
  }

};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const actionType = formData.get("actionType");
  
  if (actionType === "delete") {
    const ruleId = formData.get("ruleId");
    const myshopifyDomain = formData.get("myshopifyDomain");
    
    try {
      const response = await fetch('http://localhost/geomarkets/src/public/geolocation/delete/rule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          myshopify_domain: myshopifyDomain,
          ruledeleteid: ruleId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP error! status: ${response.status}, message: ${errorText}`
        };
      }

      const responseData = await response.text();
      return {
        success: true,
        message: "Rule deleted successfully",
        data: responseData
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  return { success: false, error: "Invalid action" };
};

export default function Index() {
  const { markets: loadedMarkets, session, shopInfo, authParams } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [savedChargeId, setSavedChargeId] = useState(null);
  const fetcher = useFetcher();

  // Transform the loaded market data to match our table format
  const markets = loadedMarkets.map(market => {
  const countries = market.regions.nodes
    .map(region => region.name)
    .filter(Boolean)
    .join(", ");

  const currency = market.currencySettings?.baseCurrency?.currencyCode || "N/A";
  const status = market.enabled ? "Active" : "Inactive";

  return {
    name: market.name,
    currency: currency,
    countries: countries || "No regions configured",
    status: status
  };
});



  const [redirections, setRedirections] = useState([]);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [countriesByContinent, setCountriesByContinent] = useState({});
  const [isLoadingRedirections, setIsLoadingRedirections] = useState(true);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editCountries, setEditCountries] = useState('');
  const [addName, setAddName] = useState('');
  const [addUrl, setAddUrl] = useState('');
  const [addCountries, setAddCountries] = useState('');
  
  // Multi-select countries state
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [countryInputValue, setCountryInputValue] = useState('');
  const [countryListVisible, setCountryListVisible] = useState(false);
  
  // Edit modal countries state
  const [editSelectedCountries, setEditSelectedCountries] = useState([]);
  const [editCountryInputValue, setEditCountryInputValue] = useState('');
  const [editCountryListVisible, setEditCountryListVisible] = useState(false);
  
  // Refs for click outside detection
  const editCountryListRef = useRef(null);
  const addCountryListRef = useRef(null);

  const [countriesModalOpen, setCountriesModalOpen] = useState(false);
  const [modalCountries, setModalCountries] = useState([]);   

  // URL modal state
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [modalUrl, setModalUrl] = useState('');

  // URL validation error states
  const [editUrlError, setEditUrlError] = useState('');
  const [addUrlError, setAddUrlError] = useState('');

  // Toast state
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);

  // Loading state for Add operation
  const [isAddingRedirection, setIsAddingRedirection] = useState(false);
  
  // Loading state for Delete operation
  const [isDeletingRedirection, setIsDeletingRedirection] = useState(false);
  
  // Loading state for Edit operation
  const [isEditingRedirection, setIsEditingRedirection] = useState(false);

  // Market table toggle state (default: true/on)
  const [showMarketTable, setShowMarketTable] = useState(true);

  // Toast toggle function
  const toggleToast = () => setToastActive((active) => !active);

  // Show toast helper function
  const showToast = (message, isError = false) => {
    setToastMessage(message);
    setToastError(isError);
    setToastActive(true);
  };

  // URL validation function
  const validateUrl = (url) => {
    if (!url || url.trim() === '') {
      return 'URL is required';
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'URL must start with http:// or https://';
    }
    return '';
  };

  // Handle URL change with validation for Edit modal
  const handleEditUrlChange = (value) => {
    setEditUrl(value);
    if (value) {
      const error = validateUrl(value);
      setEditUrlError(error);
    } else {
      setEditUrlError('');
    }
  };

  // Handle URL change with validation for Add modal
  const handleAddUrlChange = (value) => {
    setAddUrl(value);
    if (value) {
      const error = validateUrl(value);
      setAddUrlError(error);
    } else {
      setAddUrlError('');
    }
  };

  // Handle charge_id from URL after subscription approval
  useEffect(() => {
    const chargeId = searchParams.get('charge_id');
    if (chargeId) {
      setSavedChargeId(chargeId);
      console.log('Charge ID after approving subscription:', chargeId);
      // Remove the charge_id from URL
      searchParams.delete('charge_id');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch and log redirection rules from API on mount
  useEffect(() => {
    const fetchRedirectionRules = async () => {
      setIsLoadingRedirections(true);
      try {
        // Try HTTP first to avoid SSL certificate issues
         const response = await fetch(`http://localhost/geomarkets/src/public/geolocation/redirection/rules/${session.shop}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data;
        try {
          data = await response.json();
        } catch (_) {
          data = await response.text();
        }
        console.log('Full API response:', data);
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Store available countries for multi-select from country_code structure
        let countriesData = [];
        let continentData = {};
        
        // Check if country_code data exists (organized by continents)
        if (data.data && data.data.country_code && typeof data.data.country_code === 'object') {
          console.log('Found country_code data organized by continents');
          continentData = data.data.country_code;
          
          // Transform continent-based structure into flat array
          let countryId = 1;
          Object.keys(continentData).forEach(continent => {
            const continentCountries = continentData[continent];
            Object.keys(continentCountries).forEach(countryName => {
              const countryCode = continentCountries[countryName];
              countriesData.push({
                id: countryId++,
                name: countryName,
                code: countryCode,
                continent: continent
              });
            });
          });
          
          console.log('Transformed country_code into flat array:', countriesData.length, 'countries');
          setCountriesByContinent(continentData);
          setAvailableCountries(countriesData);
        } 
        // Fallback to old countries structure if country_code is not available
        else if (data.data && data.data.countries && typeof data.data.countries === 'object') {
          // Convert the countries object to an array
          countriesData = Object.values(data.data.countries);
          console.log('Found countries as object, converting to array (fallback)');
          setAvailableCountries(countriesData);
        } else if (data.data && data.data.countries && Array.isArray(data.data.countries)) {
          countriesData = data.data.countries;
          setAvailableCountries(countriesData);
        } else if (data.countries && Array.isArray(data.countries)) {
          countriesData = data.countries;
          setAvailableCountries(countriesData);
        } else if (Array.isArray(data)) {
          countriesData = data;
          console.log('countriesDataaaaaaaaaaaaa',countriesData);
          setAvailableCountries(countriesData);
        }
        
        if (countriesData && countriesData.length > 0) {
          console.log('Setting available countries:', countriesData.length, 'countries');
          console.log('First few countries:', countriesData.slice(0, 3));
        } else {
          console.log('No countries data found in API response');
          console.log('Available keys in response:', Object.keys(data));
          if (data.data) {
            console.log('Available keys in data.data:', Object.keys(data.data));
          }
        }
        
        // Transform API data to match table format and update state
        if (data.data && data.data.rules && Array.isArray(data.data.rules)) {
          const transformedRules = data.data.rules.map(rule => {
            let countries = 'No countries specified';
            
            // Parse country_codes JSON string to extract country names
            if (rule.country_codes) {
              try {
                const countryCodesObj = JSON.parse(rule.country_codes);
                const countryNames = Object.values(countryCodesObj);
                countries = countryNames.join(', ');
              } catch (error) {
                console.error('Error parsing country_codes:', error);
                countries = rule.country_codes; // Fallback to raw value
              }
            }
            
            return {
              id: rule.id, // Store the ID for API operations
              name: rule.name || '',
              url: rule.url || '',
              countries: countries
            };
          });
          setRedirections(transformedRules);
        }
      } catch (error) {
        console.error('Failed to fetch redirection rules:', error);
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      } finally {
        setIsLoadingRedirections(false);
      }
    };

    fetchRedirectionRules();
  }, []);

  // Handle click outside to close country list for Edit modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (editCountryListRef.current && !editCountryListRef.current.contains(event.target)) {
        setEditCountryListVisible(false);
      }
    };

    // Add event listener when country list is visible
    if (editCountryListVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editCountryListVisible]);

  // Handle click outside to close country list for Add modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addCountryListRef.current && !addCountryListRef.current.contains(event.target)) {
        setCountryListVisible(false);
      }
    };

    // Add event listener when country list is visible
    if (countryListVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [countryListVisible]);

  const handleEdit = (index) => {
    setEditingIndex(index);
    const redir = redirections[index];
    setEditName(redir.name);
    setEditUrl(redir.url);
    setEditCountries(redir.countries);
    setEditUrlError(''); // Clear URL error
    
    // Parse existing countries and set them as selected
    const countryNames = redir.countries.split(', ').filter(name => name.trim() !== '' && name !== 'No countries specified');
    const matchedCountries = availableCountries.filter(country => 
      countryNames.includes(country.name)
    );
    setEditSelectedCountries(matchedCountries);
    setEditCountryInputValue('');
    setEditCountryListVisible(false); // Hide country list initially
    
    setEditModalOpen(true);
  };

  const handleDelete = (index) => {
    setDeletingIndex(index);
    setDeleteModalOpen(true);
  };

  const handleAdd = () => {
    setAddName('');
    setAddUrl('');
    setSelectedCountries([]);
    setCountryInputValue('');
    setAddUrlError(''); // Clear URL error
    setAddModalOpen(true);
  };

  const handleSaveEdit = async () => {
    // Validate URL
    const urlError = validateUrl(editUrl);
    if (urlError) {
      setEditUrlError(urlError);
      return;
    }
    setEditUrlError('');
    
    const ruleToEdit = redirections[editingIndex];
    
    // Check if rule has a valid ID
    if (!ruleToEdit.id) {
      console.error('Cannot edit rule: No ID found');
      showToast('Cannot edit this rule: No ID found.', true);
      setEditModalOpen(false);
      return;
    }
    
    // Convert selected countries to array of country codes
    const countryCodes = editSelectedCountries.map(country => country.code);
    
    console.log('Attempting to edit rule with ID:', ruleToEdit.id);
    console.log('Selected countries:', editSelectedCountries);
    console.log('Country codes:', countryCodes);
    
    setIsEditingRedirection(true);
    
    try {
      const requestData = {
        myshopify_domain: session.shop,
        url: editUrl,
        name: editName,
        rule_id: ruleToEdit.id.toString(),
        updatecountries: JSON.stringify(countryCodes)
      };

      console.log('Sending Edit POST request with data:', requestData);

      const response = await fetch('http://localhost/geomarkets/src/public/geolocation/edit/rule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edit API Error:', errorText);
        showToast(`Failed to update redirection rule: ${response.status} - ${errorText}`, true);
        setIsEditingRedirection(false);
        return;
      }

      const responseData = await response.json();
      console.log('Edit API Response:', responseData);

      // If successful, update local state and close modal
      const countriesString = editSelectedCountries.length > 0 
        ? editSelectedCountries.map(country => country.name).join(', ')
        : 'No countries specified';
        
      const newRedirections = [...redirections];
      newRedirections[editingIndex] = {
        id: ruleToEdit.id, // Preserve the original ID
        name: editName, 
        url: editUrl, 
        countries: countriesString
      };
      
      setRedirections(newRedirections);
      setEditModalOpen(false);
      
      showToast('Redirection rule updated successfully!', false);
      setIsEditingRedirection(false);
      
    } catch (error) {
      console.error('Error updating redirection rule:', error);
      showToast(`Failed to update redirection rule: ${error.message}`, true);
      setIsEditingRedirection(false);
    }
  };

  const handleSaveAdd = async () => {
    // Validate URL
    const urlError = validateUrl(addUrl);
    if (urlError) {
      setAddUrlError(urlError);
      return;
    }
    setAddUrlError('');
    
    setIsAddingRedirection(true);
    
    try {
      // Convert selected countries to array of country codes
      const countryCodes = selectedCountries.map(country => country.code);
      
      const requestData = {
        myshopify_domain: session.shop,
        url: addUrl,
        name: addName,
        addcountry: JSON.stringify(countryCodes)
      };

      console.log('Sending POST request with data:', requestData);

      const response = await fetch('http://localhost/geomarkets/src/public/geolocation/rulecreatenew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        showToast(`Failed to create redirection rule: ${response.status} - ${errorText}`, true);
        setIsAddingRedirection(false);
        return;
      }

      const responseData = await response.json();
      console.log('API Response:', responseData);

      // If successful, add to local state and close modal
      const countriesString = selectedCountries.map(country => country.name).join(', ');
      
      const newRedirection = {
        id: responseData.id || Date.now(), // Use API-provided ID or temporary ID
        name: addName, 
        url: addUrl, 
        countries: countriesString || 'No countries selected'
      };
      
      setRedirections([...redirections, newRedirection]);
      setAddModalOpen(false);
      
      // Reset form fields
      setAddName('');
      setAddUrl('');
      setSelectedCountries([]);
      setCountryInputValue('');
      
      showToast('Redirection rule created successfully!', false);
      setIsAddingRedirection(false);
      
    } catch (error) {
      console.error('Error creating redirection rule:', error);
      showToast(`Failed to create redirection rule: ${error.message}`, true);
      setIsAddingRedirection(false);
    }
  };

  const handleConfirmDelete = () => {
    const ruleToDelete = redirections[deletingIndex];
    
    // Check if rule has a valid ID
    if (!ruleToDelete.id) {
      console.error('Cannot delete rule: No ID found');
      alert('Cannot delete this rule: No ID found. This might be a newly added rule that hasn\'t been saved to the server yet.');
      setDeleteModalOpen(false);
      return;
    }
    
    console.log('Attempting to delete rule with ID:', ruleToDelete.id);
    
    setIsDeletingRedirection(true);
    
    // Use fetcher to call the server-side action
    const formData = new FormData();
    formData.append('actionType', 'delete');
    formData.append('ruleId', ruleToDelete.id.toString());
    formData.append('myshopifyDomain', session.shop);
    
    fetcher.submit(formData, { method: 'post' });
  };

  // Handle fetcher response for delete operations
  useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle') {
      setIsDeletingRedirection(false);
      if (fetcher.data.success) {
        console.log('Rule deleted successfully:', fetcher.data.message);
        // Remove from local state only if API call was successful
        setRedirections(prevRedirections => prevRedirections.filter((_, i) => i !== deletingIndex));
        setDeleteModalOpen(false);
        showToast('Rule deleted successfully!', false);
      } else {
        console.error('Failed to delete rule:', fetcher.data.error);
        showToast(`Failed to delete rule: ${fetcher.data.error}`, true);
        setDeleteModalOpen(false);
      }
    }
  }, [fetcher.data, fetcher.state, deletingIndex]);

  // Helper functions for multi-select countries
  const updateCountrySelection = (selected) => {
    const selectedValue = selected.map((option) => option.value);
    const selectedCountryObjects = availableCountries.filter(country => 
      selectedValue.includes(country.id.toString())
    );
    setSelectedCountries(selectedCountryObjects);
  };

  const removeCountryTag = (countryToRemove) => {
    const updatedSelection = selectedCountries.filter(
      (country) => country.id !== countryToRemove.id
    );
    setSelectedCountries(updatedSelection);
  };

  // Edit modal helper functions
  const removeEditCountryTag = (countryToRemove) => {
    const updatedSelection = editSelectedCountries.filter(
      (country) => country.id !== countryToRemove.id
    );
    setEditSelectedCountries(updatedSelection);
  };

  // Toggle country list visibility for edit modal
  const toggleEditCountryList = () => {
    setEditCountryListVisible((prev) => !prev);
  };

  // Handle edit country input change - open list when typing
  const handleEditCountryInputChange = (value) => {
    setEditCountryInputValue(value);
    if (!editCountryListVisible) {
      setEditCountryListVisible(true);
    }
  };

  // Toggle add country list
  const toggleAddCountryList = () => {
    setCountryListVisible((prev) => !prev);
  };

  // Handle add country input change - open list when typing
  const handleAddCountryInputChange = (value) => {
    setCountryInputValue(value);
    if (!countryListVisible) {
      setCountryListVisible(true);
    }
  };

  // Helper function to get all countries that are already used in redirections
  // For edit modal: exclude countries from other rows (not the current editing row)
  // For add modal: exclude countries from all rows
  const getUsedCountries = (excludeIndex = null) => {
    const usedCountryNames = new Set();
    
    redirections.forEach((redir, index) => {
      // Skip the current editing row when in edit modal
      if (excludeIndex !== null && index === excludeIndex) {
        return;
      }
      
      // Parse countries from the redirection row
      if (redir.countries && redir.countries !== 'No countries specified') {
        const countryNames = redir.countries.split(', ').map(name => name.trim());
        countryNames.forEach(name => {
          if (name) {
            usedCountryNames.add(name);
          }
        });
      }
    });
    
    return usedCountryNames;
  };

  // Get used countries for Add modal (exclude all used countries)
  const usedCountriesForAdd = getUsedCountries();
  
  // Filter available countries for Add modal - exclude already used countries
  const availableCountriesForAdd = availableCountries.filter(country => 
    !usedCountriesForAdd.has(country.name)
  );

  const filteredCountries = countryInputValue.trim() === '' 
    ? availableCountriesForAdd // Show all available countries when no search input
    : availableCountriesForAdd.filter((country) =>
        country.name.toLowerCase().includes(countryInputValue.toLowerCase()) ||
        (country.continent && country.continent.toLowerCase().includes(countryInputValue.toLowerCase()))
      );

  // Group countries by continent for better display
  const groupedCountries = filteredCountries.reduce((acc, country) => {
    const continent = country.continent || 'Other';
    if (!acc[continent]) {
      acc[continent] = [];
    }
    acc[continent].push(country);
    return acc;
  }, {});

  const countryOptions = filteredCountries.map((country) => ({
    value: country.id.toString(),
    label: country.continent ? `${country.name} (${country.continent})` : country.name,
  }));

  // Get used countries for Edit modal (exclude countries from other rows, not current row)
  const usedCountriesForEdit = getUsedCountries(editingIndex);
  
  // Filter available countries for Edit modal - exclude countries used in other rows
  const availableCountriesForEdit = availableCountries.filter(country => 
    !usedCountriesForEdit.has(country.name)
  );

  // Edit modal filtered countries
  const editFilteredCountries = editCountryInputValue.trim() === '' 
    ? availableCountriesForEdit // Show all available countries when no search input
    : availableCountriesForEdit.filter((country) =>
        country.name.toLowerCase().includes(editCountryInputValue.toLowerCase()) ||
        (country.continent && country.continent.toLowerCase().includes(editCountryInputValue.toLowerCase()))
      );

  // Group countries by continent for edit modal
  const editGroupedCountries = editFilteredCountries.reduce((acc, country) => {
    const continent = country.continent || 'Other';
    if (!acc[continent]) {
      acc[continent] = [];
    }
    acc[continent].push(country);
    return acc;
  }, {});

  const editCountryOptions = editFilteredCountries.map((country) => ({
    value: country.id.toString(),
    label: country.continent ? `${country.name} (${country.continent})` : country.name,
  }));

  // Market table rows
const marketRows = markets.map((market, index) => {
  const countryArr = market.countries.split(", ");
  const displayCountries = countryArr.slice(0, 3).join(", ");
  const hasMore = countryArr.length > 3;

  return [
    market.name,
    market.currency,
    <>
      {displayCountries}
      {hasMore && (
        <InlineStack gap="200">
        <Button size="slim"  onClick={() => { setModalCountries(countryArr); setCountriesModalOpen(true); }}>
          More
        </Button>
        </InlineStack>
      )}
    </>,
    <InlineStack gap="200" blockAlign="center">
      <span style={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: market.status === 'Active' ? '#00a047' : '#d72c0d'
      }} />
      <Text 
        as="span" 
        color={market.status === 'Active' ? 'success' : 'critical'}
      >
        {market.status}
      </Text>
    </InlineStack>
  ];
});


  const rows = redirections.map((redir, index) => {
    const countryArr = redir.countries.split(', ');
    const displayCountries = countryArr.slice(0, 5).join(', ');
    const hasMore = countryArr.length > 5;

    // Truncate URL if longer than 50 characters
    const maxUrlLength = 40;
    const isUrlLong = redir.url.length > maxUrlLength;
    const displayUrl = isUrlLong ? redir.url.substring(0, maxUrlLength) : redir.url;

    return [
      redir.name,
      <>
        {displayUrl}
        {isUrlLong && (
          <span 
            onClick={() => { setModalUrl(redir.url); setUrlModalOpen(true); }}
            style={{ 
              cursor: 'pointer', 
              color: '#2c6ecb',
              fontWeight: '500'
            }}
          >
            ...
          </span>
        )}
      </>,
      <>
        {displayCountries}
        {hasMore && (
          <InlineStack gap="200">
            <Button size="slim" onClick={() => { setModalCountries(countryArr); setCountriesModalOpen(true); }}>
              More
            </Button>
          </InlineStack>
        )}
      </>,
      <InlineStack gap="200">
        <Button onClick={() => handleEdit(index)}>Edit</Button>
        <Button onClick={() => handleDelete(index)} destructive>Delete</Button>
      </InlineStack>
    ];
  });

  const marketTableHeadings = ['Market Name', 'Currency', 'Countries', 'Status'].map((heading) => (
    <Text as="span" fontWeight="bold" key={heading}>
      {heading}
    </Text>
  ));

  const redirectionTableHeadings = ['Name', 'URL', 'Countries', 'Action'].map((heading) => (
    <Text as="span" fontWeight="bold" key={heading}>
      {heading}
    </Text>
  ));

  // Determine market table visibility logic
  const hasMultipleCountries = markets.length === 1 && 
    markets[0].countries && 
    markets[0].countries !== "No regions configured" && 
    markets[0].countries.includes(", ");
  
  const hasSingleCountry = markets.length === 1 && 
    markets[0].countries && 
    markets[0].countries !== "No regions configured" && 
    !markets[0].countries.includes(", ");
  
  const hasMultipleMarkets = markets.length > 1;
  
  // Show toggle button only if single market with multiple countries
  const shouldShowToggle = hasMultipleCountries;
  
  // Show market table if: multiple markets OR (single market with multiple countries AND toggle is on)
  const shouldShowMarketTable = hasMultipleMarkets || (hasMultipleCountries && showMarketTable);

  return (
    <Frame>
      <Page>
        <TitleBar title="Market & Redirection Management">
          <Button variant="primary" onClick={handleAdd}>Add Redirection</Button>
        </TitleBar>
        <BlockStack gap="500">
        
        {/* Onboarding Component */}
        <OnboardingComponent 
          onComplete={() => console.log('Onboarding completed')}
          hasRules={redirections.length > 0}
        />
        
        {/* Debug Information - Remove in production */}
        <AuthDebugInfo 
          session={session} 
          shopInfo={shopInfo} 
          authParams={authParams} 
        />
        
        {/* Show market table section with optional toggle button */}
        {(shouldShowMarketTable || shouldShowToggle) && (
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  {shouldShowToggle && (
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h2" variant="headingMd">
                        Markets
                      </Text>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        position: 'relative',
                        width: '50px',
                        height: '28px'
                      }}>
                        <input
                          type="checkbox"
                          checked={showMarketTable}
                          onChange={() => setShowMarketTable(!showMarketTable)}
                          style={{
                            display: 'none'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: '0',
                          left: '0',
                          right: '0',
                          bottom: '0',
                          backgroundColor: showMarketTable ? '#0b7285' : '#e0e0e0',
                          borderRadius: '14px',
                          transition: 'background-color 0.3s ease',
                          border: '2px solid transparent'
                        }}></div>
                        <div style={{
                          position: 'absolute',
                          content: '""',
                          height: '22px',
                          width: '22px',
                          left: showMarketTable ? '24px' : '2px',
                          bottom: '2px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          transition: 'left 0.3s ease',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                        }}></div>
                      </label>
                    </InlineStack>
                  )}
                  {!shouldShowToggle && (
                    <Text as="h2" variant="headingMd">
                      Markets
                    </Text>
                  )}
                  {shouldShowMarketTable && (
                    <MarketsTable
                      markets={markets}
                      headings={marketTableHeadings}
                      rows={marketRows}
                    />
                  )}
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        )}
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    Redirections
                  </Text>
                  <Button variant="primary" onClick={handleAdd}>
                    Add Redirection
                  </Button>
                </InlineStack>
                {isLoadingRedirections ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                    <Spinner accessibilityLabel="Loading redirections" size="large" />
                  </div>
                ) : (
                  <DataTable
                    columnContentTypes={['text', 'text', 'text', 'text']}
                    headings={redirectionTableHeadings}
                    rows={rows}
                  />
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>



      </BlockStack>
      <Modal
  open={countriesModalOpen}
  onClose={() => setCountriesModalOpen(false)}
  title="All Countries"
  primaryAction={{
    content: 'Close',
    onAction: () => setCountriesModalOpen(false)
  }}
>
  <Modal.Section>
    <BlockStack gap="200">
      {modalCountries.map((country, idx) => (
        <Text key={idx} as="p">{country}</Text>
      ))}
    </BlockStack>
  </Modal.Section>
</Modal>

      <Modal
        open={urlModalOpen}
        onClose={() => setUrlModalOpen(false)}
        title="Full URL"
        primaryAction={{
          content: 'Close',
          onAction: () => setUrlModalOpen(false)
        }}
      >
        <Modal.Section>
          <BlockStack gap="200">
            <Text as="p" breakWord>{modalUrl}</Text>
          </BlockStack>
        </Modal.Section>
      </Modal>

      <Modal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditCountryListVisible(false);
        }}
        title="Edit Redirection"
        primaryAction={{
          content: 'Save',
          onAction: handleSaveEdit,
          loading: isEditingRedirection,
          disabled: isEditingRedirection
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => {
              setEditModalOpen(false);
              setEditCountryListVisible(false);
            },
            disabled: isEditingRedirection
          }
        ]}
      >
        <Modal.Section>
          <Form>
            <BlockStack gap="400">
              <TextField
                label="Name"
                value={editName}
                onChange={setEditName}
              />
              <TextField
                label="URL"
                value={editUrl}
                onChange={handleEditUrlChange}
                error={editUrlError}
                placeholder="https://example.com/page"
                type="url"
              />
              
              
              
              {/* Multi-select Countries for Edit */}
              <div ref={editCountryListRef}>
                {/* Search Field */}
                <div style={{ position: 'relative' }}>
                  <div onClick={toggleEditCountryList}>
                    <TextField
                      label="Countries"
                      value={editCountryInputValue}
                      onChange={handleEditCountryInputChange}
                      placeholder="Click to select countries or type to search..."
                      autoComplete="off"
                    />
                  </div>
                  <div 
                    onClick={toggleEditCountryList}
                    style={{ 
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontSize: '12px',
                      color: '#6d7175',
                      pointerEvents: 'none'
                    }}
                  >
                    {editCountryListVisible ? '▲' : '▼'}
                  </div>
                </div>
                
                {/* Countries List Grouped by Continent - Initially Hidden */}
                {editCountryListVisible && (
                  <div style={{ 
                    marginTop: '12px', 
                    maxHeight: '400px', 
                    overflowY: 'auto', 
                    border: '1px solid #e1e3e5', 
                    borderRadius: '8px',
                    padding: '12px',
                    backgroundColor: '#ffffff'
                  }}>
                    {availableCountries.length > 0 ? (
                      <BlockStack gap="300">
                        {Object.keys(editGroupedCountries).sort().map((continent) => (
                          <div key={continent}>
                            {/* Continent Header */}
                            <div style={{ marginBottom: '8px' }}>
                              <Checkbox
                                label={<span style={{ fontWeight: 'bold' }}>{continent}</span>}
                                checked={editGroupedCountries[continent].every(country => 
                                  editSelectedCountries.some(sc => sc.id === country.id)
                                )}
                                onChange={(checked) => {
                                  if (checked) {
                                    // Add all countries from this continent
                                    const continentCountries = editGroupedCountries[continent];
                                    const newCountries = continentCountries.filter(country => 
                                      !editSelectedCountries.some(sc => sc.id === country.id)
                                    );
                                    setEditSelectedCountries([...editSelectedCountries, ...newCountries]);
                                  } else {
                                    // Remove all countries from this continent
                                    const continentCountryIds = editGroupedCountries[continent].map(c => c.id);
                                    setEditSelectedCountries(
                                      editSelectedCountries.filter(sc => !continentCountryIds.includes(sc.id))
                                    );
                                  }
                                }}
                              />
                            </div>
                            
                            {/* Countries under this continent */}
                            <div style={{ marginLeft: '24px' }}>
                              <BlockStack gap="200">
                                {editGroupedCountries[continent].map((country) => (
                                  <Checkbox
                                    key={country.id}
                                    label={country.name}
                                    checked={editSelectedCountries.some(sc => sc.id === country.id)}
                                    onChange={(checked) => {
                                      if (checked) {
                                        setEditSelectedCountries([...editSelectedCountries, country]);
                                      } else {
                                        setEditSelectedCountries(
                                          editSelectedCountries.filter(sc => sc.id !== country.id)
                                        );
                                      }
                                    }}
                                  />
                                ))}
                              </BlockStack>
                            </div>
                          </div>
                        ))}
                      </BlockStack>
                    ) : (
                      <Text as="p" color="subdued">
                        {availableCountries.length === 0 ? 'Loading countries...' : 'No countries found'}
                      </Text>
                    )}
                  </div>
                )}
                
                {/* Selected Countries Tags for Edit */}
                {editSelectedCountries.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Selected Countries ({editSelectedCountries.length})
                    </Text>
                    <div style={{ marginTop: '8px' }}>
                      <InlineStack gap="200" wrap>
                        {editSelectedCountries.map((country) => (
                          <Tag
                            key={country.id}
                            onRemove={() => removeEditCountryTag(country)}
                          >
                            {country.name}
                          </Tag>
                        ))}
                      </InlineStack>
                    </div>
                  </div>
                )}
                
                {/* Debug info for Edit */}
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  Available countries: {availableCountries.length}, 
                  Selected: {editSelectedCountries.length}
                </div>
              </div>
            </BlockStack>
          </Form>
          {/* Spinner Overlay for Edit */}
          {isEditingRedirection && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              borderRadius: '8px'
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '32px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}>
                <Spinner accessibilityLabel="Updating redirection rule" size="large" />
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Updating redirection rule...
                </Text>
              </div>
            </div>
          )}
        </Modal.Section>
      </Modal>

      <Modal
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setCountryListVisible(false);
        }}
        title="Add New Redirection"
        primaryAction={{
          content: 'Add',
          onAction: handleSaveAdd,
          loading: isAddingRedirection,
          disabled: isAddingRedirection
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => {
              setAddModalOpen(false);
              setCountryListVisible(false);
            },
            disabled: isAddingRedirection
          }
        ]}
      >
        <Modal.Section>
          <Form>
            <BlockStack gap="400">
              <TextField
                label="Name"
                value={addName}
                onChange={setAddName}
                placeholder="Enter redirection name"
              />
              <TextField
                label="URL"
                value={addUrl}
                onChange={handleAddUrlChange}
                error={addUrlError}
                placeholder="https://example.com/page"
                type="url"
              />
              
              {/* Multi-select Countries */}
              <div ref={addCountryListRef}>
                {/* Search Field */}
                <div style={{ position: 'relative' }}>
                  <div onClick={toggleAddCountryList}>
                    <TextField
                      label="Countries"
                      value={countryInputValue}
                      onChange={handleAddCountryInputChange}
                      placeholder="Click to select countries or type to search..."
                      autoComplete="off"
                    />
                  </div>
                  <div 
                    onClick={toggleAddCountryList}
                    style={{ 
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontSize: '12px',
                      color: '#6d7175',
                      pointerEvents: 'none'
                    }}
                  >
                    {countryListVisible ? '▲' : '▼'}
                  </div>
                </div>
                
                {/* Countries List Grouped by Continent - Initially Hidden */}
                {countryListVisible && (
                  <div style={{ 
                    marginTop: '12px', 
                    maxHeight: '400px', 
                    overflowY: 'auto', 
                    border: '1px solid #e1e3e5', 
                    borderRadius: '8px',
                    padding: '12px',
                    backgroundColor: '#ffffff'
                  }}>
                    {availableCountries.length > 0 ? (
                      <BlockStack gap="300">
                        {Object.keys(groupedCountries).sort().map((continent) => (
                          <div key={continent}>
                            {/* Continent Header */}
                            <div style={{ marginBottom: '8px' }}>
                              <Checkbox
                                label={<span style={{ fontWeight: 'bold' }}>{continent}</span>}
                                checked={groupedCountries[continent].every(country => 
                                  selectedCountries.some(sc => sc.id === country.id)
                                )}
                                onChange={(checked) => {
                                  if (checked) {
                                    // Add all countries from this continent
                                    const continentCountries = groupedCountries[continent];
                                    const newCountries = continentCountries.filter(country => 
                                      !selectedCountries.some(sc => sc.id === country.id)
                                    );
                                    setSelectedCountries([...selectedCountries, ...newCountries]);
                                  } else {
                                    // Remove all countries from this continent
                                    const continentCountryIds = groupedCountries[continent].map(c => c.id);
                                    setSelectedCountries(
                                      selectedCountries.filter(sc => !continentCountryIds.includes(sc.id))
                                    );
                                  }
                                }}
                              />
                            </div>
                            
                            {/* Countries under this continent */}
                            <div style={{ marginLeft: '24px' }}>
                              <BlockStack gap="200">
                                {groupedCountries[continent].map((country) => (
                                  <Checkbox
                                    key={country.id}
                                    label={country.name}
                                    checked={selectedCountries.some(sc => sc.id === country.id)}
                                    onChange={(checked) => {
                                      if (checked) {
                                        setSelectedCountries([...selectedCountries, country]);
                                      } else {
                                        setSelectedCountries(
                                          selectedCountries.filter(sc => sc.id !== country.id)
                                        );
                                      }
                                    }}
                                  />
                                ))}
                              </BlockStack>
                            </div>
                          </div>
                        ))}
                      </BlockStack>
                    ) : (
                      <Text as="p" color="subdued">
                        {availableCountries.length === 0 ? 'Loading countries...' : 'No countries found'}
                      </Text>
                    )}
                  </div>
                )}
                
                {/* Selected Countries Tags */}
                {selectedCountries.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Selected Countries ({selectedCountries.length})
                    </Text>
                    <div style={{ marginTop: '8px' }}>
                      <InlineStack gap="200" wrap>
                        {selectedCountries.map((country) => (
                          <Tag
                            key={country.id}
                            onRemove={() => removeCountryTag(country)}
                          >
                            {country.name}
                          </Tag>
                        ))}
                      </InlineStack>
                    </div>
                  </div>
                )}
                
                {/* Debug info */}
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  Available countries: {availableCountries.length}, 
                  Selected: {selectedCountries.length}
                </div>
              </div>
            </BlockStack>
          </Form>
          {/* Spinner Overlay */}
          {isAddingRedirection && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              borderRadius: '8px'
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '32px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}>
                <Spinner accessibilityLabel="Adding redirection rule" size="large" />
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Adding redirection rule...
                </Text>
              </div>
            </div>
          )}
        </Modal.Section>
      </Modal>
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Delete"
        primaryAction={{
          content: 'Yes',
          onAction: handleConfirmDelete,
          destructive: true,
          loading: isDeletingRedirection,
          disabled: isDeletingRedirection
        }}
        secondaryActions={[
          {
            content: 'No',
            onAction: () => setDeleteModalOpen(false),
            disabled: isDeletingRedirection
          }
        ]}
      >
        <Modal.Section>
          <Text as="p">Are you sure you want to delete this rule?</Text>
          {/* Spinner Overlay for Delete */}
          {isDeletingRedirection && (
            <div style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              borderRadius: '8px'
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '32px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}>
                <Spinner accessibilityLabel="Deleting redirection rule" size="large" />
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  Deleting redirection rule...
                </Text>
              </div>
            </div>
          )}
        </Modal.Section>
      </Modal>
      
        {toastActive && (
          <Toast
            content={toastMessage}
            onDismiss={toggleToast}
            error={toastError}
          />
        )}
      </Page>
    </Frame>
  );
}
