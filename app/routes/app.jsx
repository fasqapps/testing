import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  // Log the incoming request details before authentication
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  console.log('=== APP.JSX - INCOMING REQUEST ===');
  console.log('Request URL:', request.url);
  console.log('Request Method:', request.method);
  console.log('Request Headers:', Object.fromEntries(request.headers.entries()));
  
  // Log URL parameters
  const urlParams = {
    code: searchParams.get('code'),
    hmac: searchParams.get('hmac'),
    host: searchParams.get('host'),
    shop: searchParams.get('shop'),
    timestamp: searchParams.get('timestamp'),
    state: searchParams.get('state'),
  };
  console.log('URL Parameters:', urlParams);

  const { billing, redirect, session } = await authenticate.admin(request);

  const appHandle = "dev market local"; // Replace with your actual app handle from the App Store

  const { hasActivePayment } = await billing.check();

  const shop = session.shop;
  const storeHandle = shop.replace('.myshopify.com', '');

  if (!hasActivePayment) {
    return redirect(`https://admin.shopify.com/store/${storeHandle}/charges/${appHandle}/pricing_plans`, {
      target: "_top",
    });
  }

  console.log('=== APP.JSX - POST AUTHENTICATION ===');
  console.log("Full Session Object:", JSON.stringify(session, null, 2));
  console.log("Shop Domain:", session.shop);
  console.log("Session ID:", session.id);
  console.log("Access Token Present:", !!session.accessToken);

  return { 
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shop: session.shop,
    sessionId: session.id
  };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Redirection Management
        </Link>
        <Link to="/app/FAQ">FAQ page</Link>
        <Link to="/app/contact">Contact Us</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
