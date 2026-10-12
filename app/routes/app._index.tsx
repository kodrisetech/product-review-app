
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  return (
    <s-page heading="Product Reviews">
      <s-section>
        <s-banner tone="info">
          Welcome to KR Product Reviews &amp; UGC. Your review dashboard is
          ready to set up.
        </s-banner>
      </s-section>

      <s-grid gridTemplateColumns="repeat(4, minmax(0, 1fr))" gap="base">
        <s-grid-item>
          <s-section>
            <s-text>Total reviews</s-text>
            <s-heading>0</s-heading>
            <s-text>No reviews collected yet</s-text>
          </s-section>
        </s-grid-item>

        <s-grid-item>
          <s-section>
            <s-text>Average rating</s-text>
            <s-heading>—</s-heading>
            <s-text>Based on published reviews</s-text>
          </s-section>
        </s-grid-item>

        <s-grid-item>
          <s-section>
            <s-text>Pending reviews</s-text>
            <s-heading>0</s-heading>
            <s-text>Awaiting moderation</s-text>
          </s-section>
        </s-grid-item>

        <s-grid-item>
          <s-section>
            <s-text>Published reviews</s-text>
            <s-heading>0</s-heading>
            <s-text>Visible to shoppers</s-text>
          </s-section>
        </s-grid-item>
      </s-grid>

      <s-section heading="Recent reviews">
        <s-box padding="large" borderWidth="base" borderRadius="base">
          <s-stack direction="block" gap="base" alignItems="center">
            <s-icon type="star" size="large" />
            <s-heading>No reviews yet</s-heading>
            <s-paragraph>
              Customer reviews will appear here after shoppers submit them.
              You will be able to moderate reviews before publishing them.
            </s-paragraph>
            <s-button variant="primary" disabled>
              Review management coming soon
            </s-button>
          </s-stack>
        </s-box>
      </s-section>

      <s-section slot="aside" heading="Getting started">
        <s-unordered-list>
          <s-list-item>Configure your review form</s-list-item>
          <s-list-item>Collect customer reviews</s-list-item>
          <s-list-item>Moderate and publish reviews</s-list-item>
          <s-list-item>Display reviews on product pages</s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="Coming next">
        <s-paragraph>
          We will add review storage, moderation actions, product integration,
          and automated email requests in future milestones.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};