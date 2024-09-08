import dotenv from 'dotenv';
import { format } from "date-fns";
import { BuxferApiClient } from '../client/buxferApiClient';
import { BuxferTransaction, GetTransactionsQueryParameters, AddTransactionsResponse } from '../interface';
import { getTransactionsDateRange } from '../client/transactionUtils';

dotenv.config({ path: 'src/test/.env.test' }); // Load environment variables from .env.test

const username = process.env.TEST_USERNAME;
const password = process.env.TEST_PASSWORD;
const accountId = process.env.TEST_ACCOUNT_ID;

expect(username).toBeDefined();
expect(password).toBeDefined();

describe('BuxferApiClient', () => {
    let buxferClient: BuxferApiClient = new BuxferApiClient(username!, password!);

    it('should log in successfully', async () => {
        await buxferClient.login();
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

    it('should retrieve up to 100 transactions within the requested date range', async () => {
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

    });

    it('test deduplicate and update logic, finally delete a mock transaction from Buxfer DB', async () => {
        const nowDate = format(new Date(), "yyyy-MM-dd");
        const mockTrx: BuxferTransaction = {
            "accountId": Number(accountId),
            "date": nowDate,
            "amount": 60,
            "description": "זיכוי מביט מפלוני אלמוני",
            "status": "pending",
            "type": "income",
            "tags": "buxfer-ts-client-ut-mock"
        }
        // Add new mock transaction to DB - expect new addition
        let response: AddTransactionsResponse = await buxferClient.addTransactions(new Array(mockTrx), true);
        expect(response.addedTransactionIds.length).toBe(1);
        expect(response.existingTransactionIds.length).toBe(0);
        const mockTrxId = response.addedTransactionIds[0];

        // Add the same transaction a second time - expect existing flag to signal deduplication
        response = await buxferClient.addTransactions(new Array(mockTrx), true);
        expect(response.addedTransactionIds.length).toBe(0);
        expect(response.updatedTransactionIds.length).toBe(0);
        expect(response.existingTransactionIds.length).toBe(1);

        // Change status to cleared transaction, add the updated transaction a third time with update enabled - expect an update flag
        mockTrx.status = "cleared";
        response = await buxferClient.addTransactions(new Array(mockTrx), true);
        expect(response.addedTransactionIds.length).toBe(0);
        expect(response.updatedTransactionIds.length).toBe(1);
        expect(response.existingTransactionIds.length).toBe(0);

        // delete mock transactions
        const deleteResponse = await buxferClient.deleteTransaction(mockTrxId);
        expect(deleteResponse).not.toBeNull;
    });

    it('should retrieve tags', async () => {
        let tags = await buxferClient.getTags();
        expect(tags.length).toBeGreaterThan(0);
    });


});
