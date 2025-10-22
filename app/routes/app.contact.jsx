import {
  Box,
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  InlineStack,
  TextField,
  Button,
  Icon,
  Link,
  Divider,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { EmailIcon, PhoneIcon, GlobeIcon } from "@shopify/polaris-icons";
import { useEffect, useState } from "react";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  try {
    // Query the shop's primary contact email
    const response = await admin.graphql(
      `#graphql
      query ShopContactEmail {
        shop {
          email
          contactEmail
        }
      }
    `
    );

    const payload = await response.json();
    const graphqlErrors = payload?.errors?.length ? payload.errors : payload?.data?.errors;
    if (graphqlErrors?.length) {
      graphqlErrors.forEach((err) => console.error("GraphQL error fetching store email:", err));
    }

    const fallbackEmail = "support@zeomarket.com";
    const ownerEmail =
      payload?.data?.shop?.email || payload?.data?.shop?.contactEmail || null;

    return json({
      ownerEmail: ownerEmail ?? fallbackEmail,
      errors: graphqlErrors ?? [],
      myshopifyDomain: session?.shop ?? null,
    });
  } catch (error) {
    console.error("Failed to fetch store email:", error);
    return json({
      ownerEmail: null,
      errors: [{ message: error.message ?? "Unknown error" }],
      myshopifyDomain: session?.shop ?? null,
    });
  }
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const message = formData.get("message");
  const myshopifyDomain = formData.get("myshopifyDomain");

  if (!name || !email || !message || !myshopifyDomain) {
    return json(
      {
        success: false,
        message: "Missing required fields. Please check your inputs and try again.",
      },
      { status: 400 }
    );
  }

  try {
    const response = await fetch("https://localhost/geomarket/src/public/geolocation/send/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        myshopify_domain: myshopifyDomain,
        email,
        message,
        name,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send contact message:", errorText);
      return json(
        {
          success: false,
          message: "We couldn't send your message. Please try again later.",
        },
        { status: response.status }
      );
    }

    let responsePayload;
    try {
      responsePayload = await response.json();
    } catch (parseError) {
      responsePayload = await response.text();
    }

    const successMessage =
      typeof responsePayload === "string"
        ? responsePayload || "Thank you for your message! We'll get back to you soon."
        : responsePayload?.message || "Thank you for your message! We'll get back to you soon.";

    return json({
      success: true,
      message: successMessage,
    });
  } catch (error) {
    console.error("Unexpected error sending contact message:", error);
    return json(
      {
        success: false,
        message: "Something went wrong while sending your message. Please try again.",
      },
      { status: 500 }
    );
  }
};

export default function ContactPage() {
  const loaderData = useLoaderData();
  const ownerEmail = loaderData?.ownerEmail ?? null;
  const loaderErrors = loaderData?.errors ?? [];
  const myshopifyDomain = loaderData?.myshopifyDomain ?? "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState(ownerEmail || "");
  const [message, setMessage] = useState("");
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    // Keep local state in sync if loader provides a new email
    if (ownerEmail && ownerEmail !== email) {
      setEmail(ownerEmail);
    }
  }, [ownerEmail, email]);

  useEffect(() => {
    if (loaderErrors.length) {
      loaderErrors.forEach((error) => console.error("Loader error", error));
    }
  }, [loaderErrors]);

  useEffect(() => {
    if (ownerEmail) {
      console.log("Store contact email:", ownerEmail);
    }
  }, [ownerEmail]);

  const handleSubmit = () => {
    const payload = {
      name,
      email,
      message,
      myshopifyDomain,
    };

    console.log("Submitting contact message payload:", payload);
    console.log("Submitting contact message payload (JSON):", JSON.stringify(payload));

    // Form will be submitted automatically by Remix
    // Reset form after submission
    if (actionData?.success) {
      setName("");
      setEmail(ownerEmail || "");
      setMessage("");
    }
  };

  return (
    <Page>
      <TitleBar title="Contact Us" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Get in Touch
              </Text>
              <Text as="p" variant="bodyMd">
                We'd love to hear from you! Send us a message and we'll respond as soon as possible.
              </Text>

              {actionData?.success && (
                <Box
                  padding="400"
                  background="bg-surface-success"
                  borderRadius="200"
                  borderWidth="025"
                  borderColor="border-success"
                >
                  <Text as="p" variant="bodyMd" tone="success">
                    {actionData.message}
                  </Text>
                </Box>
              )}

              <Form method="post" onSubmit={handleSubmit}>
                <input type="hidden" name="myshopifyDomain" value={myshopifyDomain} />
                <BlockStack gap="400">
                  <TextField
                    label="Your Name"
                    name="name"
                    value={name}
                    onChange={setName}
                    placeholder="Enter your full name"
                    requiredIndicator
                    autoComplete="name"
                  />

                  <TextField
                    label="Your Email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="Enter your email address"
                    requiredIndicator
                    autoComplete="email"
                  />

                  <TextField
                    label="Your Message"
                    name="message"
                    value={message}
                    onChange={setMessage}
                    placeholder="Tell us how we can help you..."
                    multiline={6}
                    requiredIndicator
                  />

                  <InlineStack align="end">
                    <Button
                      variant="primary"
                      submit
                      loading={isSubmitting}
                      disabled={!name || !email || !message}
                    >
                      Send Message
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Form>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Contact Information
              </Text>
              <Text as="p" variant="bodyMd">
                Reach out to us through any of these channels:
              </Text>

              <Divider />

              <BlockStack gap="300">
                {/* Email Handle */}
                <InlineStack gap="300" align="start">
                  <Box>
                    <Icon source={EmailIcon} tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text as="h3" variant="headingSm">
                      Email
                    </Text>
                    <Link
                      url={ownerEmail ? `mailto:${ownerEmail}` : undefined}
                      target="_blank"
                      removeUnderline
                    >
                      <Text as="p" variant="bodyMd" tone="subdued">
                        {ownerEmail || "Email unavailable"}
                      </Text>
                    </Link>
                  </BlockStack>
                </InlineStack>

                {/* Google Meet Handle */}
                <InlineStack gap="300" align="start">
                  <Box>
                    <Icon source={PhoneIcon} tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text as="h3" variant="headingSm">
                      Google Meet
                    </Text>
                    <Link
                      url="https://meet.google.com/new"
                      target="_blank"
                      removeUnderline
                    >
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Schedule a meeting
                      </Text>
                    </Link>
                  </BlockStack>
                </InlineStack>

                {/* Website Handle */}
                <InlineStack gap="300" align="start">
                  <Box>
                    <Icon source={GlobeIcon} tone="base" />
                  </Box>
                  <BlockStack gap="100">
                    <Text as="h3" variant="headingSm">
                      Website
                    </Text>
                    <Link
                      url="https://www.zeomarket.com"
                      target="_blank"
                      removeUnderline
                    >
                      <Text as="p" variant="bodyMd" tone="subdued">
                        www.zeomarket.com
                      </Text>
                    </Link>
                  </BlockStack>
                </InlineStack>
              </BlockStack>

              <Divider />

              <Text as="p" variant="bodySm" tone="subdued">
                We typically respond within 24 hours during business days.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}