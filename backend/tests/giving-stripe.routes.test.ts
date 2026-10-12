import {
  givingCheckoutSessionResponseSchema,
  givingReconciliationResponseSchema,
  givingTransactionListResponseSchema,
  givingWebhookAckResponseSchema,
  paymentProviderEventListResponseSchema
} from "@mbc/api-contracts";
import { describe, expect, it } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login, loginMember } from "./route_test_harness.js";

describe("giving Stripe routes", () => {
  it("creates Stripe giving checkout sessions and records webhook success", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken: adminAccessToken } = await login(app);
    const { accessToken } = await loginMember(app, {
      email: "stripe-giver@example.com",
      displayName: "Stripe Giver"
    });

    const checkoutResponse = await app.inject({
      method: "POST",
      url: "/v1/member/giving/checkout-sessions",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        amountCents: 2500,
        currency: "USD",
        category: "offering",
        donorName: "Stripe Giver",
        donorEmail: "stripe-giver@example.com"
      }
    });
    expect(checkoutResponse.statusCode).toBe(200);
    const checkout = expectResponseData(
      checkoutResponse,
      givingCheckoutSessionResponseSchema,
      "member giving checkout session"
    );
    expect(checkout.provider).toBe("stripe");
    expect(checkout.checkoutUrl).toContain("checkout.stripe.test");
    const checkoutSessionId = checkout.checkoutSessionId;
    const transactionId = checkout.transactionId;

    const clientRedirectResponse = await app.inject({
      method: "POST",
      url: "/v1/member/giving/checkout-sessions",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        amountCents: 2500,
        category: "offering",
        successUrl: "https://untrusted.example/checkout-success"
      }
    });
    expect(clientRedirectResponse.statusCode).toBe(400);

    const pendingResponse = await app.inject({
      method: "GET",
      url: "/v1/member/giving/transactions?status=pending&limit=50",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(pendingResponse.statusCode).toBe(200);
    const pending = expectResponseData(
      pendingResponse,
      givingTransactionListResponseSchema,
      "member giving pending transactions"
    );
    expect(
      pending.items.map((transaction: { id: string }) => transaction.id)
    ).toContain(transactionId);

    const webhookResponse = await app.inject({
      method: "POST",
      url: "/v1/webhooks/giving/stripe",
      headers: {
        "content-type": "application/json"
      },
      payload: JSON.stringify({
        id: "evt_test_checkout_completed",
        type: "checkout.session.completed",
        created: 1770000000,
        data: {
          object: {
            id: checkoutSessionId,
            payment_intent: "pi_test_giving",
            payment_status: "paid",
            amount_total: 2500,
            currency: "usd",
            customer_email: "stripe-giver@example.com",
            customer_details: {
              name: "Stripe Giver",
              email: "stripe-giver@example.com"
            },
            metadata: {
              category: "offering"
            }
          }
        }
      })
    });
    expect(webhookResponse.statusCode).toBe(200);
    const webhook = expectResponseData(
      webhookResponse,
      givingWebhookAckResponseSchema,
      "giving checkout webhook"
    );
    expect(webhook.handled).toBe(true);

    const succeededResponse = await app.inject({
      method: "GET",
      url: "/v1/member/giving/transactions?status=succeeded&limit=50",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(succeededResponse.statusCode).toBe(200);
    const succeeded = expectResponseData(
      succeededResponse,
      givingTransactionListResponseSchema,
      "member giving succeeded transactions"
    );
    const transaction = succeeded.items.find(
      (item: { id: string }) => item.id === transactionId
    );
    expect(transaction).toBeDefined();
    if (!transaction) {
      throw new Error("expected succeeded giving transaction");
    }
    expect(transaction.status).toBe("succeeded");
    expect(transaction.providerTransactionId).toBe("pi_test_giving");
    expect(transaction.providerCheckoutSessionId).toBe(checkoutSessionId);

    const chargeSucceededResponse = await app.inject({
      method: "POST",
      url: "/v1/webhooks/giving/stripe",
      headers: {
        "content-type": "application/json"
      },
      payload: JSON.stringify({
        id: "evt_test_charge_succeeded",
        type: "charge.succeeded",
        created: 1770000050,
        data: {
          object: {
            id: "ch_test_giving",
            payment_intent: "pi_test_giving",
            amount: 2500,
            amount_captured: 2500,
            currency: "usd",
            balance_transaction: {
              id: "txn_test_giving",
              amount: 2500,
              currency: "usd",
              fee: 103,
              net: 2397,
              available_on: 1770086400
            }
          }
        }
      })
    });
    expect(chargeSucceededResponse.statusCode).toBe(200);
    const chargeSucceeded = expectResponseData(
      chargeSucceededResponse,
      givingWebhookAckResponseSchema,
      "giving charge succeeded webhook"
    );
    expect(chargeSucceeded.handled).toBe(true);

    const payoutResponse = await app.inject({
      method: "POST",
      url: "/v1/webhooks/giving/stripe",
      headers: {
        "content-type": "application/json"
      },
      payload: JSON.stringify({
        id: "evt_test_payout_reconciled",
        type: "payout.reconciliation_completed",
        created: 1770000060,
        data: {
          object: {
            id: "po_test_giving",
            charge_ids: ["ch_test_giving"]
          }
        }
      })
    });
    expect(payoutResponse.statusCode).toBe(200);
    expect(
      expectResponseData(
        payoutResponse,
        givingWebhookAckResponseSchema,
        "giving payout reconciliation webhook"
      ).handled
    ).toBe(true);

    const reconciledResponse = await app.inject({
      method: "GET",
      url: "/v1/member/giving/transactions?status=succeeded&limit=50",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(reconciledResponse.statusCode).toBe(200);
    const reconciled = expectResponseData(
      reconciledResponse,
      givingTransactionListResponseSchema,
      "member giving reconciled transactions"
    );
    const reconciledTransaction = reconciled.items.find(
      (item: { id: string }) => item.id === transactionId
    );
    expect(reconciledTransaction).toBeDefined();
    if (!reconciledTransaction) {
      throw new Error("expected reconciled giving transaction");
    }
    expect(reconciledTransaction.feeCents).toBe(103);
    expect(reconciledTransaction.netAmountCents).toBe(2397);
    expect(reconciledTransaction.reconciliationStatus).toBe("reconciled");
    expect(reconciledTransaction.payoutId).toBe("po_test_giving");

    const disputeResponse = await app.inject({
      method: "POST",
      url: "/v1/webhooks/giving/stripe",
      headers: {
        "content-type": "application/json"
      },
      payload: JSON.stringify({
        id: "evt_test_dispute_created",
        type: "charge.dispute.created",
        created: 1770000075,
        data: {
          object: {
            id: "dp_test_giving",
            payment_intent: "pi_test_giving",
            amount: 2500,
            status: "needs_response"
          }
        }
      })
    });
    expect(disputeResponse.statusCode).toBe(200);
    const dispute = expectResponseData(
      disputeResponse,
      givingWebhookAckResponseSchema,
      "giving dispute webhook"
    );
    expect(dispute.handled).toBe(true);

    const reconciliationResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/giving/reconciliation?year=2026&provider=stripe",
      headers: {
        authorization: `Bearer ${adminAccessToken}`
      }
    });
    expect(reconciliationResponse.statusCode).toBe(200);
    const reconciliation = expectResponseData(
      reconciliationResponse,
      givingReconciliationResponseSchema,
      "admin giving reconciliation"
    );
    expect(reconciliation.feeCents).toBeGreaterThanOrEqual(103);
    expect(reconciliation.netAmountCents).toBeGreaterThanOrEqual(2397);
    expect(reconciliation.disputedAmountCents).toBeGreaterThanOrEqual(2500);
    expect(reconciliation.needsReviewCount).toBeGreaterThanOrEqual(1);

    const duplicateWebhookResponse = await app.inject({
      method: "POST",
      url: "/v1/webhooks/giving/stripe",
      headers: {
        "content-type": "application/json"
      },
      payload: JSON.stringify({
        id: "evt_test_checkout_completed",
        type: "checkout.session.completed",
        created: 1770000000,
        data: {
          object: {
            id: checkoutSessionId,
            payment_intent: "pi_test_giving",
            payment_status: "paid",
            amount_total: 2500,
            currency: "usd",
            customer_email: "stripe-giver@example.com",
            customer_details: {
              name: "Stripe Giver",
              email: "stripe-giver@example.com"
            },
            metadata: {
              category: "offering"
            }
          }
        }
      })
    });
    expect(duplicateWebhookResponse.statusCode).toBe(200);
    const duplicateWebhook = expectResponseData(
      duplicateWebhookResponse,
      givingWebhookAckResponseSchema,
      "giving duplicate webhook"
    );
    expect(duplicateWebhook.duplicate).toBe(true);

    const refundWebhookResponse = await app.inject({
      method: "POST",
      url: "/v1/webhooks/giving/stripe",
      headers: {
        "content-type": "application/json"
      },
      payload: JSON.stringify({
        id: "evt_test_charge_refunded",
        type: "charge.refunded",
        created: 1770000100,
        data: {
          object: {
            id: "ch_test_giving",
            payment_intent: "pi_test_giving",
            amount: 2500,
            currency: "usd",
            amount_refunded: 2500,
            refunded: true
          }
        }
      })
    });
    expect(refundWebhookResponse.statusCode).toBe(200);
    const refundWebhook = expectResponseData(
      refundWebhookResponse,
      givingWebhookAckResponseSchema,
      "giving refund webhook"
    );
    expect(refundWebhook.handled).toBe(true);

    const refundedResponse = await app.inject({
      method: "GET",
      url: "/v1/member/giving/transactions?status=refunded&limit=50",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(refundedResponse.statusCode).toBe(200);
    const refunded = expectResponseData(
      refundedResponse,
      givingTransactionListResponseSchema,
      "member giving refunded transactions"
    );
    expect(
      refunded.items.map((item: { id: string }) => item.id)
    ).toContain(transactionId);
    const refundedTransaction = refunded.items.find(
      (item: { id: string }) => item.id === transactionId
    );
    expect(refundedTransaction).toBeDefined();
    if (!refundedTransaction) {
      throw new Error("expected refunded giving transaction");
    }
    expect(refundedTransaction.refundedAmountCents).toBe(2500);
    expect(refundedTransaction.reconciliationStatus).toBe("needs_review");

    const providerEventsResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/giving/provider-events?provider=stripe&limit=50",
      headers: {
        authorization: `Bearer ${adminAccessToken}`
      }
    });
    expect(providerEventsResponse.statusCode).toBe(200);
    const providerEvents = expectResponseData(
      providerEventsResponse,
      paymentProviderEventListResponseSchema,
      "admin payment provider events"
    ).items;
    expect(providerEvents.map((event) => event.providerEventId)).toContain(
      "evt_test_checkout_completed"
    );
    expect(providerEvents.map((event) => event.providerEventId)).toContain(
      "evt_test_charge_refunded"
    );
    expect(providerEvents.map((event) => event.providerEventId)).toContain(
      "evt_test_charge_succeeded"
    );
    expect(providerEvents.map((event) => event.providerEventId)).toContain(
      "evt_test_dispute_created"
    );
    expect(
      providerEvents.find(
        (event) => event.providerEventId === "evt_test_checkout_completed"
      )?.status
    ).toBe("processed");
    await harness.close();
  });

  it("fails unmatched Stripe provider events and retries failed event replays", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken: adminAccessToken } = await login(app);
    const { accessToken } = await loginMember(app, {
      email: "stripe-replay@example.com",
      displayName: "Stripe Replay"
    });

    const checkoutResponse = await app.inject({
      method: "POST",
      url: "/v1/member/giving/checkout-sessions",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        amountCents: 3000,
        currency: "USD",
        category: "missions",
        donorName: "Stripe Replay",
        donorEmail: "stripe-replay@example.com"
      }
    });
    expect(checkoutResponse.statusCode).toBe(200);
    const checkout = expectResponseData(
      checkoutResponse,
      givingCheckoutSessionResponseSchema,
      "member giving replay checkout session"
    );
    const checkoutSessionId = checkout.checkoutSessionId;
    const transactionId = checkout.transactionId;

    const earlyChargePayload = {
      id: "evt_test_charge_before_checkout",
      type: "charge.succeeded",
      created: 1770000200,
      data: {
        object: {
          id: "ch_test_replay",
          payment_intent: "pi_test_replay",
          amount: 3000,
          amount_captured: 3000,
          currency: "usd",
          balance_transaction: {
            id: "txn_test_replay",
            amount: 3000,
            currency: "usd",
            fee: 117,
            net: 2883,
            available_on: 1770086400
          }
        }
      }
    };
    const earlyChargeResponse = await app.inject({
      method: "POST",
      url: "/v1/webhooks/giving/stripe",
      headers: {
        "content-type": "application/json"
      },
      payload: JSON.stringify(earlyChargePayload)
    });
    expect(earlyChargeResponse.statusCode).toBe(409);
    expect(earlyChargeResponse.json().error).toMatchObject({
      code: "provider_event_unhandled",
      category: "state_conflict",
      sourceLayer: "feature",
      nextAction: "inspect_provider_event",
      evidence: {
        provider: "stripe",
        providerEventId: "evt_test_charge_before_checkout",
        eventType: "charge.succeeded",
        paymentIntentId: "pi_test_replay"
      }
    });

    const failedEventsResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/giving/provider-events?provider=stripe&status=failed&limit=50",
      headers: {
        authorization: `Bearer ${adminAccessToken}`
      }
    });
    expect(failedEventsResponse.statusCode).toBe(200);
    const failedEvents = expectResponseData(
      failedEventsResponse,
      paymentProviderEventListResponseSchema,
      "admin failed payment provider events"
    ).items;
    expect(
      failedEvents.map(
        (event: { providerEventId: string }) => event.providerEventId
      )
    ).toContain("evt_test_charge_before_checkout");

    const checkoutCompletedResponse = await app.inject({
      method: "POST",
      url: "/v1/webhooks/giving/stripe",
      headers: {
        "content-type": "application/json"
      },
      payload: JSON.stringify({
        id: "evt_test_replay_checkout_completed",
        type: "checkout.session.completed",
        created: 1770000210,
        data: {
          object: {
            id: checkoutSessionId,
            payment_intent: "pi_test_replay",
            payment_status: "paid",
            amount_total: 3000,
            currency: "usd",
            customer_email: "stripe-replay@example.com",
            customer_details: {
              name: "Stripe Replay",
              email: "stripe-replay@example.com"
            },
            metadata: {
              category: "missions"
            }
          }
        }
      })
    });
    expect(checkoutCompletedResponse.statusCode).toBe(200);
    const checkoutCompleted = expectResponseData(
      checkoutCompletedResponse,
      givingWebhookAckResponseSchema,
      "giving replay checkout webhook"
    );
    expect(checkoutCompleted.handled).toBe(true);

    const replayChargeResponse = await app.inject({
      method: "POST",
      url: "/v1/webhooks/giving/stripe",
      headers: {
        "content-type": "application/json"
      },
      payload: JSON.stringify(earlyChargePayload)
    });
    expect(replayChargeResponse.statusCode).toBe(200);
    const replayCharge = expectResponseData(
      replayChargeResponse,
      givingWebhookAckResponseSchema,
      "giving replay charge webhook"
    );
    expect(replayCharge.handled).toBe(true);

    const succeededResponse = await app.inject({
      method: "GET",
      url: "/v1/member/giving/transactions?status=succeeded&limit=50",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(succeededResponse.statusCode).toBe(200);
    const succeeded = expectResponseData(
      succeededResponse,
      givingTransactionListResponseSchema,
      "member giving replay succeeded transactions"
    );
    const transaction = succeeded.items.find(
      (item: { id: string }) => item.id === transactionId
    );
    expect(transaction).toBeDefined();
    if (!transaction) {
      throw new Error("expected replayed giving transaction");
    }
    expect(transaction.feeCents).toBe(117);
    expect(transaction.netAmountCents).toBe(2883);
    expect(transaction.payoutId).toBeNull();

    const providerEventsResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/giving/provider-events?provider=stripe&limit=50",
      headers: {
        authorization: `Bearer ${adminAccessToken}`
      }
    });
    expect(providerEventsResponse.statusCode).toBe(200);
    const providerEvents = expectResponseData(
      providerEventsResponse,
      paymentProviderEventListResponseSchema,
      "admin replay payment provider events"
    ).items;
    expect(
      providerEvents.find(
        (event: { providerEventId: string }) =>
          event.providerEventId === "evt_test_charge_before_checkout"
      )?.status
    ).toBe("processed");

    await harness.close();
  });

  it("keeps asynchronous Stripe payments pending until async success", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await loginMember(app, {
      email: "ach-giver@example.com",
      displayName: "ACH Giver"
    });

    const checkoutResponse = await app.inject({
      method: "POST",
      url: "/v1/member/giving/checkout-sessions",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        amountCents: 7500,
        currency: "USD",
        category: "missions",
        donorName: "ACH Giver",
        donorEmail: "ach-giver@example.com"
      }
    });
    expect(checkoutResponse.statusCode).toBe(200);
    const checkout = expectResponseData(
      checkoutResponse,
      givingCheckoutSessionResponseSchema,
      "member giving async checkout session"
    );
    const checkoutSessionId = checkout.checkoutSessionId;
    const transactionId = checkout.transactionId;

    const completedResponse = await app.inject({
      method: "POST",
      url: "/v1/webhooks/giving/stripe",
      headers: {
        "content-type": "application/json"
      },
      payload: JSON.stringify({
        id: "evt_test_async_checkout_completed",
        type: "checkout.session.completed",
        created: 1770000200,
        data: {
          object: {
            id: checkoutSessionId,
            payment_intent: "pi_test_ach_giving",
            payment_status: "unpaid",
            amount_total: 7500,
            currency: "usd",
            customer_email: "ach-giver@example.com",
            customer_details: {
              name: "ACH Giver",
              email: "ach-giver@example.com"
            },
            metadata: {
              category: "missions"
            }
          }
        }
      })
    });
    expect(completedResponse.statusCode).toBe(200);
    const completed = expectResponseData(
      completedResponse,
      givingWebhookAckResponseSchema,
      "giving async checkout webhook"
    );
    expect(completed.pending).toBe(true);

    const stillPendingResponse = await app.inject({
      method: "GET",
      url: "/v1/member/giving/transactions?status=pending&limit=50",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(stillPendingResponse.statusCode).toBe(200);
    const stillPending = expectResponseData(
      stillPendingResponse,
      givingTransactionListResponseSchema,
      "member giving async pending transactions"
    );
    expect(
      stillPending.items.map((item: { id: string }) => item.id)
    ).toContain(transactionId);

    const asyncSuccessResponse = await app.inject({
      method: "POST",
      url: "/v1/webhooks/giving/stripe",
      headers: {
        "content-type": "application/json"
      },
      payload: JSON.stringify({
        id: "evt_test_async_payment_succeeded",
        type: "checkout.session.async_payment_succeeded",
        created: 1770000300,
        data: {
          object: {
            id: checkoutSessionId,
            payment_intent: "pi_test_ach_giving",
            payment_status: "paid",
            amount_total: 7500,
            currency: "usd",
            customer_email: "ach-giver@example.com",
            customer_details: {
              name: "ACH Giver",
              email: "ach-giver@example.com"
            },
            metadata: {
              category: "missions"
            }
          }
        }
      })
    });
    expect(asyncSuccessResponse.statusCode).toBe(200);
    const asyncSuccess = expectResponseData(
      asyncSuccessResponse,
      givingWebhookAckResponseSchema,
      "giving async success webhook"
    );
    expect(asyncSuccess.handled).toBe(true);

    const succeededResponse = await app.inject({
      method: "GET",
      url: "/v1/member/giving/transactions?status=succeeded&limit=50",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(succeededResponse.statusCode).toBe(200);
    const succeeded = expectResponseData(
      succeededResponse,
      givingTransactionListResponseSchema,
      "member giving async succeeded transactions"
    );
    expect(
      succeeded.items.map((item: { id: string }) => item.id)
    ).toContain(transactionId);
    await harness.close();
  });

  it("marks pending Stripe payment intents as failed", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await loginMember(app, {
      email: "failed-ach@example.com",
      displayName: "Failed ACH"
    });

    const checkoutResponse = await app.inject({
      method: "POST",
      url: "/v1/member/giving/checkout-sessions",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        amountCents: 4200,
        currency: "USD",
        category: "missions",
        donorName: "Failed ACH",
        donorEmail: "failed-ach@example.com"
      }
    });
    expect(checkoutResponse.statusCode).toBe(200);
    const checkout = expectResponseData(
      checkoutResponse,
      givingCheckoutSessionResponseSchema,
      "member giving failed checkout session"
    );
    const checkoutSessionId = checkout.checkoutSessionId;
    const transactionId = checkout.transactionId;

    const completedResponse = await app.inject({
      method: "POST",
      url: "/v1/webhooks/giving/stripe",
      headers: {
        "content-type": "application/json"
      },
      payload: JSON.stringify({
        id: "evt_test_failed_checkout_completed",
        type: "checkout.session.completed",
        created: 1770000400,
        data: {
          object: {
            id: checkoutSessionId,
            payment_intent: "pi_test_failed_ach",
            payment_status: "unpaid",
            amount_total: 4200,
            currency: "usd",
            customer_email: "failed-ach@example.com",
            customer_details: {
              name: "Failed ACH",
              email: "failed-ach@example.com"
            },
            metadata: {
              category: "missions"
            }
          }
        }
      })
    });
    expect(completedResponse.statusCode).toBe(200);

    const paymentFailedResponse = await app.inject({
      method: "POST",
      url: "/v1/webhooks/giving/stripe",
      headers: {
        "content-type": "application/json"
      },
      payload: JSON.stringify({
        id: "evt_test_payment_intent_failed",
        type: "payment_intent.payment_failed",
        created: 1770000410,
        data: {
          object: {
            id: "pi_test_failed_ach"
          }
        }
      })
    });
    expect(paymentFailedResponse.statusCode).toBe(200);
    const paymentFailed = expectResponseData(
      paymentFailedResponse,
      givingWebhookAckResponseSchema,
      "giving payment intent failed webhook"
    );
    expect(paymentFailed.handled).toBe(true);

    const failedResponse = await app.inject({
      method: "GET",
      url: "/v1/member/giving/transactions?status=failed&limit=50",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(failedResponse.statusCode).toBe(200);
    const failed = expectResponseData(
      failedResponse,
      givingTransactionListResponseSchema,
      "member giving failed transactions"
    );
    expect(failed.items.map((item: { id: string }) => item.id)).toContain(
      transactionId
    );
    await harness.close();
  });

  it("rejects Stripe webhook payloads with invalid signatures", async () => {
    const harness = await buildTestApp({
      stripeSecretKey: "sk_test_invalid_signature",
      stripeWebhookSecret: "whsec_test_invalid_signature"
    });
    const { app } = harness;

    const response = await app.inject({
      method: "POST",
      url: "/v1/webhooks/giving/stripe",
      headers: {
        "content-type": "application/json",
        "stripe-signature": `t=1770000000,v1=${"0".repeat(64)}`
      },
      payload: JSON.stringify({
        id: "evt_test_invalid_signature",
        type: "checkout.session.completed",
        created: 1770000000,
        data: {
          object: {
            id: "cs_test_invalid_signature",
            payment_intent: "pi_test_invalid_signature",
            payment_status: "paid",
            amount_total: 1000,
            currency: "usd"
          }
        }
      })
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toMatchObject({
      code: "webhook_signature_invalid",
      category: "validation_error",
      sourceLayer: "external",
      recoverable: false,
      retryable: false,
      evidence: { provider: "stripe" },
      nextAction: "check_provider_signature"
    });
    await harness.close();
  });
});
