import { BuxferTransaction } from '../interface'

export function splitTransactions(
    scrapedTransactions: BuxferTransaction[],
    dbTransactions: BuxferTransaction[]
): [BuxferTransaction[], BuxferTransaction[], BuxferTransaction[]] {

    const newTransactions: BuxferTransaction[] = [];
    const updateRequiredTransactions: BuxferTransaction[] = [];
    const existingTransactions: BuxferTransaction[] = [];

    for (const tx of scrapedTransactions) {
        const existingTrx = dbTransactions.find(dbTx => isExistingTrx(dbTx, tx));
        if (existingTrx != null) {
            if (existingTrx.type != "transfer" && updateRequired(existingTrx, tx)) {
                updateRequiredTransactions.push(existingTrx);
            }
            else {
                existingTransactions.push(existingTrx);
            }

        } else {
            newTransactions.push(tx);
        }
    }

    return [newTransactions, updateRequiredTransactions, existingTransactions];
}

function updateRequired(dbTx: BuxferTransaction, scrappedTrx: BuxferTransaction): boolean {
    // Same transaction can change description and status
    let updateRequired: boolean = false;
    if (dbTx.status != scrappedTrx.status) {
        dbTx.status = scrappedTrx.status;
        updateRequired = true;
    }

    if (getSanitizedDescriptionHash(dbTx) != getSanitizedDescriptionHash(scrappedTrx)) {
        dbTx.description = scrappedTrx.description;
        updateRequired = true;
    }
    return updateRequired;
}

function isExistingTrx(dbTx: BuxferTransaction, tx: BuxferTransaction): boolean {
    if (dbTx.type == "transfer"
        && Math.abs(dbTx.amount) == Math.abs(tx.amount)
        && dbTx.date == tx.date) {
        // In case of transfer transactions we want to avoid the duplication hell ...
        // the two added transactions on both accounts will be considered duplicates of the same single transfer transaction
        return dbTx.fromAccount?.id == tx.accountId || dbTx.toAccount?.id == tx.accountId;
    }
    return transactionHash(dbTx) === transactionHash(tx);
}

export function transactionHash(tx: BuxferTransaction): string {
    const parts = [
        tx.date,
        tx.accountId,
        // getSanitizedDescriptionHash(tx),
        `absoluteAmount:${Math.abs(tx.amount)}`
    ];

    return parts.map((p) => String(p ?? "").trim()).join("_");
}

function getSanitizedDescriptionHash(tx: BuxferTransaction): string {
    let desc = tx.description;
    return desc.split("|")[0].replaceAll(" ", "");
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