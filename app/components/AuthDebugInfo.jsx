import { useEffect, useRef } from 'react';

/**
 * AuthDebugInfo Component
 * 
 * Logs Shopify authentication information to console in JSON format.
 * This should only be used in development environments.
 */
export function AuthDebugInfo({ session, shopInfo, authParams }) {
  // Use a ref to track if we've already logged
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    // Only log once when component mounts
    if (!session || hasLoggedRef.current) return;
    
    hasLoggedRef.current = true;

    // Create JSON object with all authentication information
    const authDebugData = {
      // userInfo: session.onlineAccessInfo?.associated_user ? {
      //   userId: session.onlineAccessInfo.associated_user.id,
      //   email: session.onlineAccessInfo.associated_user.email,
      //   firstName: session.onlineAccessInfo.associated_user.first_name,
      //   lastName: session.onlineAccessInfo.associated_user.last_name
      // } : null,
      
      urlParameters: authParams ? {
        code: authParams.code || null,
        hmac: authParams.hmac || null,
        host: authParams.host || null,
        shop: authParams.shop || null,
        timestamp: authParams.timestamp || null, // Keep as encoded Unix timestamp
        state: authParams.state || null
      } : null
    };

    // Debug: Log the entire session object to see its structure
    console.log('🔍 Full Session Object:', JSON.stringify(session, null, 2));
    
    // Debug: Check what type of value accessToken actually is
    console.log('🔍 session.accessToken value:', session.accessToken);
    
    // Console log the JSON data
    console.log('🔧 Authentication Debug Data (JSON):', JSON.stringify(authDebugData, null, 2));

    //   const callbackURL = `https://localhost/geomarkets/src/public/Auth/Shopify/Callback?shop=${authDebugData.urlParameters.shop}&code=${authDebugData.urlParameters.code}&hmac=${authDebugData.urlParameters.hmac}&timestamp=${authDebugData.urlParameters.timestamp}`
    //   console.log(`Callback URL: ${callbackURL}`);
  }, []); // Empty dependency array means this runs only once on mount

  // Return null to render nothing in the UI
  return null;
}