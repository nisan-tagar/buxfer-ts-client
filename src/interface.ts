export interface BuxferAccount {
    id: string;
    name?: string;
    balance?: number;
    bank?: string; // New property for the bank name
    // Additional properties related to accounts (e.g., currency, etc.)
    type?: "CREDIT CARD" | "CHECKING" | "SAVINGS" | "INVESTMENT" | "LOAN";
    lastSynced?: string;
    // ...
}

export class GetTransactionsQueryParameters {
    accountId!: string;
    accountName!: string;
    tagId!: string;
    // startDate AND endDate OR month: date can be specified as "10 feb 2008", or "2008-02-10". month can be specified as "feb08", "feb 08", or "feb 2008".
    startDate!: string;
    endDate!: string;
    month!: string;
    // budgetId OR budgetName
    budgetId!: string;
    budgetName!: string;
    // contactId OR contactName
    contactId!: string;
    contactName!: string;
    // groupId OR groupName
    groupId!: string;
    groupName!: string;
    status!: "pending" | "reconciled" | "cleared";
    page!: number;

    // Method to return a Record<string, any> from populated attributes
    getAttributesAsRecord(): Record<string, any> {
        return {
            accountId: this.accountId,
            accountName: this.accountName,
            tagId: this.tagId,
            startDate: this.startDate,
            endDate: this.endDate,
            month: this.month,
            budgetId: this.budgetId,
            budgetName: this.budgetName,
            contactId: this.contactId,
            contactName: this.contactName,
            groupId: this.groupId,
            groupName: this.groupName,
            status: this.status,
            page: this.page,
        };
    }
}

export interface AddTransactionsResponse {
    addedTransactionIds: string[];
    duplicatedTransactionIds: string[];
    transactionBatchSize: number;
    successfulBatches: number;
    failedBatches: number;
}

export interface BuxferTransaction {
    id?: number;
    description: string;
    amount: number;
    accountId: string;
    fromAccountId?: string;
    toAccountId?: string;
    date: string; // Format: "YYYY-MM-DD"
    tags?: string; // Comma-separated tag names
    type: 'expense' | 'income' | 'refund' | 'transfer' | 'investment_buy' | 'investment_sell' | 'capital_gain' | 'capital_loss' | 'sharedBill' | 'paidForFriend' | 'settlement';
    status: 'cleared' | 'pending';
    // Parameters for type = sharedBill
    payers?: [{
        email: string;
        amount: number;
    }];
    sharers?: [{
        email: string;
        amount: number;
    }];
    isEvenSplit?: boolean;
    // Parameters for type = loan
    loanedBy?: 'uid' | 'email';
    borrowedBy?: 'uid' | 'email';
    //Parameters for type = paidForFriend
    paidBy?: 'uid' | 'email';
    paidFor?: 'uid' | 'email';
}

export interface BuxferTag {
    id: string;
    name: string;
    parentId: string;
}

export interface BuxferBudget {
    id: string;
    name: string;
    limit: string;
    remaining: number;
    period: string;
    currentPeriod: string;
    tags: string;
    keywords: string[];
}

export interface BuxferLoan {
    entity: string;
    type: string;
    balance: number;
    description: string;
}

export interface BuxferReminder {
    id: string;
    name: string;
    startDate: string;
    period: string;
    amount: number;
    accountId: string;
}

export interface BuxferGroup {
    id: string;
    name: string;
    consolidated: boolean;
    members: BuxferContact[];
}

export interface BuxferContact {
    id: string;
    name: string;
    email: boolean;
    balance: number;
}

