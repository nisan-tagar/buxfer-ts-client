import dotenv from 'dotenv';
import { format } from "date-fns";
import { BuxferApiClient } from '../client/buxferApiClient';
import { BuxferTransaction, GetTransactionsQueryParameters, AddTransactionsResponse } from '../interface';
import { filterDuplicateTransactions, getTransactionsDateRange } from '../client/transactionUtils';

dotenv.config({ path: 'src/test/.env.test' }); // Load environment variables from .env.test

const username = process.env.TEST_USERNAME;
const password = process.env.TEST_PASSWORD;

describe('BuxferApiClient', () => {
    let buxferClient: BuxferApiClient;

    beforeEach(async () => {
        expect(username).toBeDefined();
        expect(password).toBeDefined();

        buxferClient = new BuxferApiClient(username!, password!);
        await buxferClient.login();
    });

    it('should log in successfully', async () => {
        expect(buxferClient['authToken']).not.toBeNull();
    });

    it('should retrieve accounts', async () => {
        const accounts = await buxferClient.getAccounts();
        expect(accounts.length).toBeGreaterThan(0);
    });

    it('should retrieve last 100 transactions', async () => {
        const transactions = await buxferClient.getTransactions();
        expect(transactions.length).toBeGreaterThan(0);
    });

    it('should retrieve up to 100 transactions of account ID by page number', async () => {
        const accounts = await buxferClient.getAccounts();
        const queryParams = new GetTransactionsQueryParameters();
        queryParams.page = 2;
        queryParams.accountId = accounts[0].id;
        const transactions = await buxferClient.getTransactions(queryParams);
        expect(transactions.length).toBeGreaterThan(0);
    });

    it('should retrieve up to 100 transactions by date range and deduplicate', async () => {
        const queryParams = new GetTransactionsQueryParameters();
        queryParams.startDate = "2024-01-01";
        queryParams.endDate = "2024-02-01";

        const dbTransactions = await buxferClient.getTransactions(queryParams);
        expect(dbTransactions.length).toBeGreaterThan(0);

        const [earliestTrxDate, latestTrxDate] = getTransactionsDateRange(dbTransactions);

        // Validate earliest transaction date
        const expectedEarliestTransactionDate = new Date(queryParams.startDate);
        expect(expectedEarliestTransactionDate <= new Date(earliestTrxDate)).toBeTruthy();

        // Validate latest transaction date
        const expectedLatestTransactionDate = new Date(queryParams.endDate);
        expect(expectedLatestTransactionDate >= new Date(latestTrxDate)).toBeTruthy();

        // Validate deduplicate logic
        let deduplicatedTrx = filterDuplicateTransactions(dbTransactions, dbTransactions);
        expect(deduplicatedTrx.length).toBe(0);

    });

    it.only('should add deduplicate and delete a mock transaction from Buxfer DB', async () => {
        const nowDate = format(new Date(), "yyyy-MM-dd");
        const mockTrx: BuxferTransaction = {
            description: "mock",
            amount: 12345,
            date: nowDate,
            type: "income",
            status: "cleared",
            accountId: "1398435"
        }
        // Add new mock transaction to DB
        let response: AddTransactionsResponse = await buxferClient.addTransactions(new Array(mockTrx), true);
        expect(response.addedTransactionIds.length).toBe(1);
        expect(response.duplicatedTransactionIds.length).toBe(0);
        const mockTrxId = response.addedTransactionIds[0];

        // Add the same transaction a second time
        response = await buxferClient.addTransactions(new Array(mockTrx), true);
        expect(response.addedTransactionIds.length).toBe(0);
        expect(response.duplicatedTransactionIds.length).toBe(1);

        // delete mock transactions
        const deleteResponse = await buxferClient.deleteTransaction(mockTrxId);
        expect(deleteResponse).not.toBeNull;
    });

    it('should retrieve tags', async () => {
        let tags = await buxferClient.getTags();
        expect(tags.length).toBeGreaterThan(0);
    });


});
