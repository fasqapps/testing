import { useMemo } from 'react';
import { Card, Layout, Page, Text } from '@shopify/polaris';

const faqSections = [
  {
    title: 'Getting Started',
    items: [
      {
        question: 'What is Geo Market?',
        answer:
          'Geo Market helps you showcase localized product recommendations tailored to each visitor based on their region.',
      },
      {
        question: 'Do I need coding knowledge to use Geo Market?',
        answer:
          'No. The app guides you through setup with prebuilt templates so you can launch without touching any code.',
      },
    ],
  },
  {
    title: 'Integrations',
    items: [
      {
        question: 'Can I connect my Instagram feed?',
        answer:
          'Yes. Connect Instagram from the Integrations tab to automatically pull your latest lifestyle content.',
      },
      {
        question: 'Does Geo Market support multiple storefronts?',
        answer:
          'You can manage multiple storefronts from a single dashboard. Set region-specific content for each storefront individually.',
      },
    ],
  },
  {
    title: 'Billing & Support',
    items: [
      {
        question: 'Is there a free trial?',
        answer:
          'Geo Market includes a 14-day free trial so you can explore every feature before committing to a plan.',
      },
      {
        question: 'How do I contact support?',
        answer:
          'Reach out through the Help Center chat inside the app or email support@geomarket.app for priority assistance.',
      },
    ],
  },
];

export default function FAQPage() {
  const sections = useMemo(() => faqSections, []);

  return (
    <Page title="FAQ">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Text as="h2" variant="headingLg">
              Frequently Asked Questions
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              Find quick answers to the most common questions about launching and managing your Geo Market experience.
            </Text>
          </Card>
        </Layout.Section>

        {sections.map((section) => (
          <Layout.Section key={section.title}>
            <Card title={section.title} sectioned>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {section.items.map((item) => (
                  <div key={item.question}>
                    <Text as="h3" variant="headingMd">
                      {item.question}
                    </Text>
                    <Text as="p" variant="bodyMd">
                      {item.answer}
                    </Text>
                  </div>
                ))}
              </div>
            </Card>
          </Layout.Section>
        ))}
      </Layout>
    </Page>
  );
}




