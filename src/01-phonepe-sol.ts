type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

type BankTransferResult = {
    success: boolean;
    bankReference?: string;
    failureReason?: string;
}

class BankAccount {
    constructor(
        public readonly id: string,
        public readonly bankCode: string,
        public readonly userId: string,
        public readonly upiId: string
    ) {}
}

class Payment {
    public status: PaymentStatus = "PENDING";
    public bankReference?: string;
    public failureReason?: string;

    constructor(
        public readonly id: string,
        public readonly amount: number,
        public readonly sender: BankAccount,
        public readonly recipient: BankAccount,
        public readonly idempotencyKey: string
    ) {}

    markSuccess(bankReference: string) {
        if (this.status !== "PENDING") {
            throw new Error("Payment can only be marked as success if it is in PENDING state.");
        }
        this.status = "SUCCESS";
        this.bankReference = bankReference;
    }

    markFailed(failureReason: string) {
        if (this.status !== "PENDING") {
            throw new Error("Payment can only be marked as failed if it is in PENDING state.");
        }
        this.status = "FAILED";
        this.failureReason = failureReason;
    }
}

// Create BankGateway interface
interface BankGateway {
    transfer(
        amountPaise: number,
        senderUpiId: string,
        recipientUpiId: string,
        paymentId: string
    ): Promise<BankTransferResult>;
}

class MockBankGateway implements BankGateway {
    async transfer(
        amountPaise: number,
        senderUpiId: string,
        recipientUpiId: string,
        paymentId: string
    ): Promise<BankTransferResult> {
        console.log(`Transferring ${amountPaise} paise from ${senderUpiId} to ${recipientUpiId} for payment ID: ${paymentId}`);
        // Simulate a successful transfer for demonstration purposes with a delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
            success: true,
            bankReference: `BANK_REF_${paymentId}`
        };
        
    }
}


// Create PaymentService class

class PaymentService {
  private accounts = new Map<string, BankAccount>();
  private payments = new Map<string, Payment>();

  // Maps an idempotency key to its original payment.
  private idempotency = new Map<string, Payment>();

  constructor(private readonly bank: BankGateway) {}

  registerAccount(account: BankAccount): void {
    if (this.accounts.has(account.id)) {
      throw new Error("Account already registered");
    }

    const duplicateUpi = [...this.accounts.values()].some(
      a => a.upiId.toLowerCase() === account.upiId.toLowerCase()
    );

    if (duplicateUpi) {
      throw new Error("UPI ID already registered");
    }

    this.accounts.set(account.id, account);
  }

  async sendMoney(
    senderId: string,
    recipientUpiId: string,
    amountPaise: number,
    idempotencyKey: string
  ): Promise<Payment> {
    if (!idempotencyKey.trim()) {
      throw new Error("Idempotency key is required");
    }

    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      throw new Error("Amount must be a positive integer in paise");
    }

    // Return the original result for a repeated request.
    const existing = this.idempotency.get(idempotencyKey);

    if (existing) {
      const sameRequest =
        existing.senderAccountId === senderId &&
        existing.amountPaise === amountPaise &&
        this.accounts.get(existing.recipientAccountId)?.upiId
          .toLowerCase() === recipientUpiId.toLowerCase();

      if (!sameRequest) {
        throw new Error(
          "Idempotency key reused for a different request"
        );
      }

      return existing;
    }

    const sender = this.accounts.get(senderId);

    const recipient = [...this.accounts.values()].find(
      a => a.upiId.toLowerCase() === recipientUpiId.toLowerCase()
    );

    if (!sender) {
      throw new Error("Sender account not found");
    }

    if (!recipient) {
      throw new Error("Recipient UPI ID not found");
    }

    if (sender.id === recipient.id) {
      throw new Error("Cannot transfer to the same account");
    }

    const payment = new Payment(
      `PAY-${crypto.randomUUID()}`,
      sender.id,
      recipient.id,
      amountPaise,
      idempotencyKey
    );

    // Reserve the key before starting the bank request.
    this.payments.set(payment.id, payment);
    this.idempotency.set(idempotencyKey, payment);

    try {
      const result = await this.bank.transfer(
        sender,
        recipient,
        amountPaise,
        payment.id
      );

      if (result.success) {
        payment.markSuccess(result.reference ?? payment.id);
      } else {
        payment.markFailed(result.reason ?? "Bank declined payment");
      }
    } catch {
      // Simplified demo behavior; a real timeout can be ambiguous.
      payment.markFailed("Bank request failed");
    }

    return payment;
  }

  getStatus(paymentId: string): PaymentStatus {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      throw new Error("Payment not found");
    }

    return payment.status;
  }
}


// Run the example

async function main() {
  const bank = new MockBankGateway();
  const service = new PaymentService(bank);

  service.registerAccount(
    new BankAccount("ACC-1", "USER-1", "alice@bank", "BANK-A")
  );

  service.registerAccount(
    new BankAccount("ACC-2", "USER-2", "bob@bank", "BANK-B")
  );

  const payment = await service.sendMoney(
    "ACC-1",
    "bob@bank",
    10_000, // ₹100 in paise
    "request-123"
  );

  console.log("Payment ID:", payment.id);
  console.log("Status:", service.getStatus(payment.id));
}

main().catch(console.error);
