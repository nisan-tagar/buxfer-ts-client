import { BuxferTransaction } from '../interface'

export function transactionHash(tx: BuxferTransaction): string {
    const parts = [
        tx.date,
        tx.accountId,
        tx.description,
        `absoluteAmount:${Math.abs(tx.amount)}`,
    ];

    return parts.map((p) => String(p ?? "").trim()).join("_");
}

export function filterDuplicateTransactions(
    addedTransactions: BuxferTransaction[],
    dbTransactions: BuxferTransaction[]
): [BuxferTransaction[], BuxferTransaction[]] {

    const deduplicatedTransactions: BuxferTransaction[] = [];
    const duplicateTransactions: BuxferTransaction[] = [];

    for (const tx of addedTransactions) {
        const duplication = dbTransactions.find(dbTx => isDuplicated(dbTx, tx));
        if (duplication != null) {
            // The dbTransactions also include ID's that would be returned to the callee
            duplicateTransactions.push(duplication);
        } else {
            deduplicatedTransactions.push(tx);
        }
    }

    return [deduplicatedTransactions, duplicateTransactions];
}

function isDuplicated(dbTx: BuxferTransaction, tx: BuxferTransaction): boolean {
    if (dbTx.type == "transfer"
        && Math.abs(dbTx.amount) == Math.abs(tx.amount)
        && dbTx.date == tx.date) {
        // In case of transfer transactions we want to avoid the duplication hell ...
        // the two added transactions on both accounts will be considered duplicates of the same single transfer transaction
        return dbTx.fromAccount?.id == tx.accountId || dbTx.toAccount?.id == tx.accountId;
    }
    return transactionHash(dbTx) === transactionHash(tx);
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