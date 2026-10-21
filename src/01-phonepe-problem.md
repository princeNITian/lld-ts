## Design a UPI Payment System

You are required to design a simplified UPI payment system similar to PhonePe using TypeScript.

The system should allow users to register their bank accounts, link a UPI ID, send money to another user, and check transaction status.

Functional requirements

1. A user can have one or more linked bank accounts.
2. Each bank account is associated with a UPI ID.
3. A user can transfer money to another user's UPI ID.
4. The system should validate the amount, sender account, and recipient.
5. Every payment should have a unique transaction ID and a status: `PENDING`, `SUCCESS`, or `FAILED`.
6. The system should support payment failures and transaction-status lookup.
7. Repeated requests with the same idempotency key must not create duplicate payments.

Non-functional requirements

- Keep the design modular and extensible.
- Use interfaces to decouple payment processing from bank-specific implementations.
- Maintain consistent transaction state.
- Make the design testable and easy to extend.

Interview constraint: Focus on the object model and in-memory implementation first. Do not design the entire distributed UPI infrastructure.

### What the interviewer expects

You should be able to explain:

- Which classes and interfaces are needed?
- Who owns payment validation?
- How do you add another bank or payment provider without rewriting the service?
- How do you prevent duplicate payments?
- What happens if a bank request fails?

