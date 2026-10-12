
import {
  Form,
  Link,
  redirect,
  useLoaderData,
} from "react-router";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "react-router";

import { authenticate } from "../shopify.server";
import db from "../db.server";

const REVIEW_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const url = new URL(request.url);
  const requestedStatus = url.searchParams.get("status");

  const status = REVIEW_STATUSES.includes(
    requestedStatus as (typeof REVIEW_STATUSES)[number],
  )
    ? requestedStatus!
    : null;

  const where = {
    shop: session.shop,
    ...(status ? { status } : {}),
  };

  const [reviews, total, pending, approved, rejected, rating] =
    await Promise.all([
      db.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      db.review.count({ where: { shop: session.shop } }),
      db.review.count({
        where: { shop: session.shop, status: "PENDING" },
      }),
      db.review.count({
        where: { shop: session.shop, status: "APPROVED" },
      }),
      db.review.count({
        where: { shop: session.shop, status: "REJECTED" },
      }),
      db.review.aggregate({
        where: { shop: session.shop, status: "APPROVED" },
        _avg: { rating: true },
      }),
    ]);

  return {
    reviews,
    status,
    stats: {
      total,
      pending,
      approved,
      rejected,
      averageRating: rating._avg.rating ?? 0,
    },
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const reviewId = formData.get("reviewId");
  const intent = formData.get("intent");

  if (
    typeof reviewId !== "string" ||
    !reviewId ||
    (intent !== "approve" && intent !== "reject")
  ) {
    throw new Response("Invalid review action", { status: 400 });
  }

  const result = await db.review.updateMany({
    where: {
      id: reviewId,
      shop: session.shop,
      status: "PENDING",
    },
    data: {
      status: intent === "approve" ? "APPROVED" : "REJECTED",
    },
  });

  if (result.count === 0) {
    throw new Response(
      "Review not found, or it has already been moderated.",
      { status: 404 },
    );
  }

  return redirect("/app/reviews");
}

export default function ReviewsPage() {
  const { reviews, status, stats } = useLoaderData<typeof loader>();

  const filters = [
    { label: "All", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  return (
    <s-page heading="Product Reviews">
      <s-button slot="primary-action" href="/app">
        Dashboard
      </s-button>

      <s-section heading="Review overview">
        <s-grid gridTemplateColumns="repeat(2, minmax(0, 1fr))" gap="base">
          <s-grid-item>
            <s-box border="base" padding="base" borderRadius="base">
              <s-text color="subdued">Total reviews</s-text>
              <s-heading>{stats.total}</s-heading>
            </s-box>
          </s-grid-item>
          <s-grid-item>
            <s-box border="base" padding="base" borderRadius="base">
              <s-text color="subdued">Pending reviews</s-text>
              <s-heading>{stats.pending}</s-heading>
            </s-box>
          </s-grid-item>
          <s-grid-item>
            <s-box border="base" padding="base" borderRadius="base">
              <s-text color="subdued">Published reviews</s-text>
              <s-heading>{stats.approved}</s-heading>
            </s-box>
          </s-grid-item>
          <s-grid-item>
            <s-box border="base" padding="base" borderRadius="base">
              <s-text color="subdued">Average rating</s-text>
              <s-heading>
                {stats.averageRating.toFixed(1)} / 5
              </s-heading>
            </s-box>
          </s-grid-item>
        </s-grid>
      </s-section>

      <s-section heading="Manage reviews">
        <s-stack direction="inline" gap="small">
          {filters.map((filter) => (
            <s-button
              key={filter.value}
              href={
                filter.value
                  ? `/app/reviews?status=${filter.value}`
                  : "/app/reviews"
              }
              variant={
                status === filter.value ||
                (!status && !filter.value)
                  ? "primary"
                  : "secondary"
              }
            >
              {filter.label}
            </s-button>
          ))}
        </s-stack>

        {reviews.length === 0 ? (
          <s-box padding="large">
            <s-text>
              No reviews found in this category. Once reviews are submitted,
              they will appear here for moderation.
            </s-text>
          </s-box>
        ) : (
          <s-stack gap="base">
            {reviews.map((review) => (
              <s-box
                key={review.id}
                border="base"
                borderRadius="base"
                padding="base"
              >
                <s-stack gap="small">
                  <s-heading>
                    {review.title || "Product review"}
                  </s-heading>

                  <s-text>
                    {review.productTitle || `Product ${review.productId}`}
                  </s-text>

                  <s-text>
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)} · {review.rating}/5
                  </s-text>

                  <s-text>{review.body}</s-text>

                  <s-text color="subdued">
                    By {review.reviewerName}
                    {review.reviewerEmail
                      ? ` · ${review.reviewerEmail}`
                      : ""}
                  </s-text>

                  <s-text color="subdued">
                    {new Date(review.createdAt).toLocaleDateString()} ·{" "}
                    {review.status}
                  </s-text>

                  {review.status === "PENDING" && (
                    <s-stack direction="inline" gap="small">
                      <Form method="post">
                        <input
                          type="hidden"
                          name="reviewId"
                          value={review.id}
                        />
                        <input
                          type="hidden"
                          name="intent"
                          value="approve"
                        />
                        <s-button type="submit" variant="primary">
                          Approve
                        </s-button>
                      </Form>

                      <Form method="post">
                        <input
                          type="hidden"
                          name="reviewId"
                          value={review.id}
                        />
                        <input
                          type="hidden"
                          name="intent"
                          value="reject"
                        />
                        <s-button type="submit" variant="secondary">
                          Reject
                        </s-button>
                      </Form>
                    </s-stack>
                  )}
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>
    </s-page>
  );
}
