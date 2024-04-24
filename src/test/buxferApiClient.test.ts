import { BuxferApiClient } from '../client/buxferApiClient';
import { GetTransactionsQueryParameters } from '../interface';
import dotenv from 'dotenv';
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
        let accounts = await buxferClient.getAccounts();
        expect(accounts.length).toBeGreaterThan(0);
        //console.log(`Accounts: ${accounts}`)
    });

    it('should retrieve last 100 transactions', async () => {
        let transactions = await buxferClient.getTransactions();
        expect(transactions.length).toBeGreaterThan(0);
        //console.log(`First 100 transactions: ${transactions}`)
    });

    it('should retrieve 100 transactions of account ID by page', async () => {
        let accounts = await buxferClient.getAccounts();
        let queryParams = new GetTransactionsQueryParameters();
        queryParams.page = 2;
        queryParams.accountId = accounts[0].id;
        let transactions = await buxferClient.getTransactions(queryParams);
        expect(transactions.length).toBeGreaterThan(0);
        //console.log(`Queried transactions: ${transactions}`)
    });

    it('should retrieve tags', async () => {
        let tags = await buxferClient.getTags();
        expect(tags.length).toBeGreaterThan(0);
        //console.log(`Tags: ${tags}`)
    });


});
