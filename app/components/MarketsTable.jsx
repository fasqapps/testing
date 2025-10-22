import { Text, Card, BlockStack, DataTable } from "@shopify/polaris";

/**
 * MarketsTable renders the markets data as a Polaris DataTable.
 * It expects markets array already shaped for the rows of the DataTable.
 */
export function MarketsTable({ markets, headings, rows }) {
  const hasMarkets = Array.isArray(markets) && markets.length > 0;

  return (
    <Card>
      <BlockStack gap="500">
        <Text as="h2" variant="headingMd">
          Markets
        </Text>
        {hasMarkets ? (
          <DataTable
            columnContentTypes={["text", "text", "text", "text"]}
            headings={headings}
            rows={rows}
          />
        ) : (
          <Text as="p" color="subdued">
            No markets available. Please ensure the app has the required permissions to read markets data.
          </Text>
        )}
      </BlockStack>
    </Card>
  );
}

export default MarketsTable;