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

    markAsSuccess(bankReference: string) {
        if (this.status !== "PENDING") {
            throw new Error("Payment can only be marked as success if it is in PENDING state.");
        }
        this.status = "SUCCESS";
        this.bankReference = bankReference;
    }

    markAsFailed(failureReason: string) {
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