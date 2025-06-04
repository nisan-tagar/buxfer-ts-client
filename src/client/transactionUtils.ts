import { BuxferTransaction, ProcessedTransactions } from "../interface";
import { parse } from "date-fns";

export const BUXFER_DATE_FORMAT = "yyyy-MM-dd";

export function transactionHash(tx: BuxferTransaction): string {
  const parts = [
    tx.date,
    tx.accountId,
    tx.description,
    `absoluteAmount:${Math.abs(tx.amount)}`,
  ];

  return parts.map((p) => String(p ?? "").trim()).join("_");
}

export function preprocessBuxferTransactions(
  scrapedTransactions: BuxferTransaction[],
  dbTransactions: BuxferTransaction[],
  ignoreFutureTransactions: boolean,
): ProcessedTransactions {
  const processedTransactions: ProcessedTransactions = {
    deduplicatedTransactions: [],
    duplicatedTransactions: [],
    futureTransactions: [],
  };
  const now = new Date();
  for (const tx of scrapedTransactions) {
    const parsedDate = parse(tx.date, BUXFER_DATE_FORMAT, new Date());
    if (isNaN(parsedDate.getTime())) {
      continue;
    }
    if (ignoreFutureTransactions && now < parsedDate) {
      // Future transactions can't be deduplicated because Buxfer GET transactions API does not retrieve them ...
      processedTransactions.futureTransactions.push(tx);
    } else {
      const duplication = dbTransactions.find((dbTx) => isDuplicated(dbTx, tx));
      if (duplication != null) {
        // The dbTransactions also include ID's that would be returned to the callee
        processedTransactions.duplicatedTransactions.push(duplication);
      } else {
        processedTransactions.deduplicatedTransactions.push(tx);
      }
    }
  }

  return processedTransactions;
}

function isDuplicated(dbTx: BuxferTransaction, tx: BuxferTransaction): boolean {
  if (
    dbTx.type == "transfer" &&
    Math.abs(dbTx.amount) == Math.abs(tx.amount) &&
    dbTx.date == tx.date
  ) {
    // In case of transfer transactions we want to avoid the duplication hell ...
    // the two added transactions on both accounts will be considered duplicates of the same single transfer transaction
    return (
      dbTx.fromAccount?.id == tx.accountId || dbTx.toAccount?.id == tx.accountId
    );
  }
  return transactionHash(dbTx) === transactionHash(tx);
}

export function getTransactionsDateRange(
  transactions: BuxferTransaction[],
): [string, string] {
  if (transactions.length === 0) {
    throw new Error("No transactions provided.");
  }

  const sortedDates = transactions
    .map((transaction) => transaction.date)
    .sort((a, b) => a.localeCompare(b));

  const startDate = sortedDates[0];
  const endDate = sortedDates[sortedDates.length - 1];

  return [startDate, endDate];
}
