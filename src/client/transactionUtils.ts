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

export function filterDuplicateTransactions(
    addedTransactions: BuxferTransaction[],
    dbTransactions: BuxferTransaction[]
): [BuxferTransaction[], BuxferTransaction[]] {
    const existingHashes = new Set(dbTransactions.map(transactionHash));

    const deduplicatedTransactions: BuxferTransaction[] = [];
    const duplicateTransactions: BuxferTransaction[] = [];

    for (const tx of addedTransactions) {
        if (existingHashes.has(transactionHash(tx))) {
            // The dbTransactions also include ID's that would be returned to the callee
            duplicateTransactions.push(dbTransactions.find(dbTx => transactionHash(dbTx) === transactionHash(tx))!);
        } else {
            deduplicatedTransactions.push(tx);
        }
    }

    return [deduplicatedTransactions, duplicateTransactions];
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