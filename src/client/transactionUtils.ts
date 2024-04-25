import { BuxferTransaction } from '../interface'

function transactionHash(tx: BuxferTransaction): string {
    const parts = [
        tx.accountId,
        tx.date,
        tx.type,
        tx.amount,
        tx.description,
    ];

    return parts.map((p) => String(p ?? "")).join("_");
}

export function deduplicateTransactions(transactions: BuxferTransaction[], dbTransactions: BuxferTransaction[]): BuxferTransaction[] {
    // Create a Set of existing transaction hashes from the database
    const existingHashes = new Set(dbTransactions.map(transactionHash));

    // Filter out transactions that have hash values already in the database
    const deduplicatedTransactions = transactions.filter(tx => !existingHashes.has(transactionHash(tx)));

    return deduplicatedTransactions;
}

export function getTransactionsDateRange(transactions: BuxferTransaction[]): [string, string] {
    if (transactions.length === 0) {
        throw new Error('No transactions provided.');
    }

    const sortedDates = transactions
        .map(transaction => transaction.date)
        .sort((a, b) => a.localeCompare(b));

    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];

    return [startDate, endDate];
}