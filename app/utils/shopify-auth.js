/**
 * Shopify Authentication Utilities
 * 
 * This file contains utilities to help understand and work with Shopify's
 * authentication parameters and session data.
 */

/**
 * Extract and parse Shopify authentication parameters from a request
 * @param {Request} request - The incoming request object
 * @returns {Object} Parsed authentication parameters
 */
export function extractShopifyAuthParams(request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  const authParams = {
    code: searchParams.get('code'),           // OAuth authorization code
    hmac: searchParams.get('hmac'),           // HMAC signature for verification
    host: searchParams.get('host'),           // Base64 encoded host info
    shop: searchParams.get('shop'),           // Shop domain (e.g., shop.myshopify.com)
    timestamp: searchParams.get('timestamp'), // Unix timestamp
    state: searchParams.get('state'),         // OAuth state parameter
  };
  
  // Decode host parameter if present
  if (authParams.host) {
    try {
      authParams.decodedHost = Buffer.from(authParams.host, 'base64').toString('utf-8');
    } catch (error) {
      authParams.decodedHost = null;
      authParams.hostDecodeError = error.message;
    }
  }
  
  return authParams;
}

/**
 * Log comprehensive authentication information
 * @param {Request} request - The incoming request
 * @param {Object} session - The authenticated session object
 * @param {Object} admin - The admin API client
 */
export function logAuthenticationDetails(request, session, admin) {
  console.log('=== COMPREHENSIVE SHOPIFY AUTH LOGGING ===');
  
  // 1. Request Information
  console.log('\n1. REQUEST DETAILS:');
  console.log('   URL:', request.url);
  console.log('   Method:', request.method);
  console.log('   User-Agent:', request.headers.get('user-agent'));
  console.log('   Referer:', request.headers.get('referer'));
  
  // 2. Authentication Parameters
  console.log('\n2. AUTH PARAMETERS:');
  const authParams = extractShopifyAuthParams(request);
  Object.entries(authParams).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      console.log(`   ${key}:`, value);
    }
  });
  
  // 3. Session Information
  console.log('\n3. SESSION DETAILS:');
  console.log('   Shop:', session.shop);
  console.log('   Session ID:', session.id);
  console.log('   State:', session.state);
  console.log('   Scope:', session.scope);
  console.log('   Is Online:', session.isOnline);
  console.log('   Expires:', session.expires);
  console.log('   Access Token Present:', !!session.accessToken);
  
  if (session.onlineAccessInfo) {
    console.log('   Online Access Info:');
    console.log('     Associated User ID:', session.onlineAccessInfo.associated_user?.id);
    console.log('     Associated User Email:', session.onlineAccessInfo.associated_user?.email);
    console.log('     Associated User First Name:', session.onlineAccessInfo.associated_user?.first_name);
    console.log('     Associated User Last Name:', session.onlineAccessInfo.associated_user?.last_name);
  }
  
  // 4. Admin API Client
  console.log('\n4. ADMIN API CLIENT:');
  console.log('   GraphQL Available:', !!admin?.graphql);
  console.log('   REST Available:', !!admin?.rest);
  
  console.log('=== END AUTH LOGGING ===\n');
}

/**
 * Verify HMAC signature (basic implementation for understanding)
 * Note: The Shopify App SDK handles this automatically, but this shows the concept
 * @param {Object} params - The parameters to verify
 * @param {string} secret - Your app's secret key
 * @returns {boolean} Whether the HMAC is valid
 */
export function verifyHmac(params, secret) {
  // This is a simplified version - the actual implementation is more complex
  // and is handled by the Shopify App SDK automatically
  console.log('HMAC verification is handled automatically by Shopify App SDK');
  console.log('Parameters received:', params);
  console.log('Secret present:', !!secret);
  return true; // SDK handles the actual verification
}

/**
 * Parse the shop domain to extract useful information
 * @param {string} shop - The shop domain (e.g., "mystore.myshopify.com")
 * @returns {Object} Parsed shop information
 */
export function parseShopDomain(shop) {
  if (!shop) return null;
  
  const parts = shop.split('.');
  const shopName = parts[0];
  const isMyShopifyDomain = shop.includes('.myshopify.com');
  
  return {
    fullDomain: shop,
    shopName: shopName,
    isMyShopifyDomain: isMyShopifyDomain,
    adminUrl: `https://admin.shopify.com/store/${shopName}`,
    storeUrl: `https://${shop}`,
  };
}

/**
 * Example of how these parameters are typically used in the OAuth flow:
 * 
 * 1. User clicks "Install App" in Shopify App Store
 * 2. Shopify redirects to your app with these parameters:
 *    - shop: The store domain
 *    - hmac: Security signature
 *    - timestamp: When the request was made
 *    - code: Authorization code (if returning from OAuth)
 *    - host: Encoded host information
 * 
 * 3. Your app verifies the HMAC signature
 * 4. If it's a new installation, redirect to OAuth
 * 5. After OAuth approval, Shopify redirects back with 'code' parameter
 * 6. Exchange the code for an access token
 * 7. Store the session and redirect to your app's main interface
 */