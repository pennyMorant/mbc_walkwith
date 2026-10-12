import {
  auditLogListResponseSchema,
  givingCheckoutSessionResponseSchema,
  givingFundListResponseSchema,
  givingFundSchema,
  givingTransactionListResponseSchema,
  givingWebhookAckResponseSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login, loginMember } from "./route_test_harness.js";

describe("giving funds routes", () => {
  it("enforces fund identity, availability, allocation, and audit history", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken: adminToken } = await login(app);
    const { accessToken: memberToken } = await loginMember(app, {
      email: "fund-giver@example.com",
      displayName: "Fund Giver"
    });

    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/giving/funds",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        code: "community_care",
        name: "Community Care",
        description: "Local care and mercy ministry.",
        status: "active",
        targetAmountCents: 250000,
        displayOrder: 15
      }
    });
    expect(createResponse.statusCode).toBe(200);
    const fund = expectResponseData(
      createResponse,
      givingFundSchema,
      "giving fund create"
    );

    const duplicateResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/giving/funds",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {
        code: "community_care",
        name: "Duplicate Community Care"
      }
    });
    expect(duplicateResponse.statusCode).toBe(409);
    expect(duplicateResponse.json().error).toMatchObject({
      code: "giving_fund_code_conflict",
      category: "state_conflict",
      sourceLayer: "feature",
      nextAction: "choose_another_code",
      evidence: { code: "community_care" }
    });

    const emptyUpdateResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/giving/funds/${fund.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: {}
    });
    expect(emptyUpdateResponse.statusCode).toBe(400);

    const invalidCodeResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/giving/funds/${fund.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { code: "Community Care" }
    });
    expect(invalidCodeResponse.statusCode).toBe(400);

    const overflowingTargetResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/giving/funds/${fund.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { targetAmountCents: 2_147_483_648 }
    });
    expect(overflowingTargetResponse.statusCode).toBe(400);

    const memberFundsResponse = await app.inject({
      method: "GET",
      url: "/v1/member/giving/funds",
      headers: { authorization: `Bearer ${memberToken}` }
    });
    expect(memberFundsResponse.statusCode).toBe(200);
    const activeFunds = expectResponseData(
      memberFundsResponse,
      givingFundListResponseSchema,
      "active member giving funds"
    );
    expect(activeFunds.items.map((item) => item.id)).toContain(fund.id);

    const checkoutResponse = await app.inject({
      method: "POST",
      url: "/v1/member/giving/checkout-sessions",
      headers: { authorization: `Bearer ${memberToken}` },
      payload: {
        amountCents: 3500,
        currency: "USD",
        category: "client_value_is_not_canonical",
        fundId: fund.id
      }
    });
    expect(checkoutResponse.statusCode).toBe(200);
    const checkout = expectResponseData(
      checkoutResponse,
      givingCheckoutSessionResponseSchema,
      "giving fund checkout"
    );

    const pauseResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/giving/funds/${fund.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { status: "paused" }
    });
    expect(pauseResponse.statusCode).toBe(200);
    const pausedFund = expectResponseData(
      pauseResponse,
      givingFundSchema,
      "paused giving fund"
    );
    expect(pausedFund.status).toBe("paused");

    const inactiveCheckoutResponse = await app.inject({
      method: "POST",
      url: "/v1/member/giving/checkout-sessions",
      headers: { authorization: `Bearer ${memberToken}` },
      payload: {
        amountCents: 3500,
        currency: "USD",
        category: "community_care",
        fundId: fund.id
      }
    });
    expect(inactiveCheckoutResponse.statusCode).toBe(409);
    expect(inactiveCheckoutResponse.json().error).toMatchObject({
      code: "giving_fund_inactive",
      evidence: { fundId: fund.id, status: "paused" }
    });

    const refreshedFundsResponse = await app.inject({
      method: "GET",
      url: "/v1/member/giving/funds",
      headers: { authorization: `Bearer ${memberToken}` }
    });
    const refreshedFunds = expectResponseData(
      refreshedFundsResponse,
      givingFundListResponseSchema,
      "active member giving funds after pause"
    );
    expect(refreshedFunds.items.map((item) => item.id)).not.toContain(fund.id);

    const webhookResponse = await app.inject({
      method: "POST",
      url: "/v1/webhooks/giving/stripe",
      headers: { "content-type": "application/json" },
      payload: JSON.stringify({
        id: "evt_fund_checkout_completed",
        type: "checkout.session.completed",
        created: 1770000000,
        data: {
          object: {
            id: checkout.checkoutSessionId,
            payment_intent: "pi_fund_checkout",
            payment_status: "paid",
            amount_total: 3500,
            currency: "usd",
            metadata: { category: "community_care" }
          }
        }
      })
    });
    expect(webhookResponse.statusCode).toBe(200);
    expectResponseData(
      webhookResponse,
      givingWebhookAckResponseSchema,
      "giving fund webhook"
    );

    const transactionsResponse = await app.inject({
      method: "GET",
      url: "/v1/member/giving/transactions?status=succeeded&limit=50",
      headers: { authorization: `Bearer ${memberToken}` }
    });
    const transactions = expectResponseData(
      transactionsResponse,
      givingTransactionListResponseSchema,
      "giving fund member transactions"
    );
    const transaction = transactions.items.find(
      (item) => item.id === checkout.transactionId
    );
    expect(transaction).toMatchObject({
      fundId: fund.id,
      category: "community_care",
      status: "succeeded"
    });

    const immutableCodeResponse = await app.inject({
      method: "PATCH",
      url: `/v1/admin/giving/funds/${fund.id}`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { code: "offering" }
    });
    expect(immutableCodeResponse.statusCode).toBe(400);

    const auditResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/audit-logs?action=giving.fund.update&resourceType=giving_fund&resourceId=${fund.id}&limit=20`,
      headers: { authorization: `Bearer ${adminToken}` }
    });
    expect(auditResponse.statusCode).toBe(200);
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "giving fund update audit"
    );
    expect(audit.items).toHaveLength(1);
    expect(audit.items[0]?.beforeJson).toMatchObject({
      id: fund.id,
      status: "active"
    });
    expect(audit.items[0]?.afterJson).toMatchObject({
      id: fund.id,
      status: "paused"
    });

    await harness.close();
  });
});
