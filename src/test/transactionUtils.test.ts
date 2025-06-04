import { BuxferTransaction, ProcessedTransactions } from "../interface";
import {
  transactionHash,
  preprocessBuxferTransactions,
  BUXFER_DATE_FORMAT,
} from "../client/transactionUtils";
import { addDays, format } from "date-fns";
import fs from "fs";

describe.only("transactionUtilsTest", () => {
  it("should create same hash for same transaction", () => {
    const mockExistingTrx: BuxferTransaction = {
      id: 207071073,
      description: "mock expense",
      date: "2024-04-26",
      type: "expense",
      transactionType: "expense",
      amount: 11.43,
      expenseAmount: 11.43,
      accountId: 123456,
      accountName: "buxfer account name",
      tags: "",
      tagNames: [],
      status: "cleared",
      isFutureDated: false,
      isPending: false,
    };
    const mockAddedTrx: BuxferTransaction = {
      accountId: 123456,
      date: "2024-04-26",
      amount: -11.43,
      description: "mock expense",
      status: "cleared",
      type: "expense",
    };

    expect(transactionHash(mockExistingTrx)).toEqual(
      transactionHash(mockAddedTrx),
    );

    const container: ProcessedTransactions = preprocessBuxferTransactions(
      new Array(mockAddedTrx),
      new Array(mockExistingTrx),
      true,
    );
    expect(container.deduplicatedTransactions.length).toBe(0);
    expect(container.duplicatedTransactions.length).toBe(1);
  });

  it("should detect future transactions that can not be deduplicated", () => {
    const sevenDaysLater: Date = addDays(new Date(), 7);
    const sevenDaysLaterFormatStr = format(
      sevenDaysLater,
      BUXFER_DATE_FORMAT,
      {},
    );

    const mockAddedTrx: BuxferTransaction = {
      accountId: 123456,
      date: sevenDaysLaterFormatStr,
      amount: -11.43,
      description: "mock expense",
      status: "cleared",
      type: "expense",
    };

    const container: ProcessedTransactions = preprocessBuxferTransactions(
      new Array(mockAddedTrx),
      new Array(),
      true,
    );
    expect(container.deduplicatedTransactions.length).toBe(0);
    expect(container.duplicatedTransactions.length).toBe(0);
    expect(container.futureTransactions.length).toBe(1);
  });

  it.skip("should successfully deduplicate added transactions against Buxfer DB", () => {
    let rawData = fs.readFileSync("src/test/mockAddedTrx.json", "utf8");
    const addedTransactions: BuxferTransaction[] = JSON.parse(rawData);

    rawData = fs.readFileSync("src/test/mockDbTrx.json", "utf8");
    const dbTransactions: BuxferTransaction[] = JSON.parse(rawData);

    const container: ProcessedTransactions = preprocessBuxferTransactions(
      addedTransactions,
      dbTransactions,
      true,
    );

    expect(container.deduplicatedTransactions.length).toBe(0);
    expect(container.deduplicatedTransactions.length).toBe(
      addedTransactions.length,
    );
  });
});
