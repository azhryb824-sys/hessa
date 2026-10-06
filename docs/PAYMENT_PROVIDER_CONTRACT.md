# Payment provider contract

Hessa core does not store card PAN, CVV or raw payment credentials.

A provider adapter must implement:
- createCheckout(userId, plan)
- verifyWebhook(rawBody, signature)
- normalize event to PAID / RENEWED / CANCELED / FAILED / REFUNDED
- map provider customer/subscription IDs to Hessa Subscription
- idempotency by provider event ID

Entitlement changes occur only from a verified server-to-server payment event or an explicit admin action. Browser redirects never activate paid access by themselves.

Before launch, select a Saudi-compatible provider based on current commercial terms, mada/Apple Pay support where needed, recurring-payment support, webhook security, settlement, VAT/invoicing needs and business eligibility.
