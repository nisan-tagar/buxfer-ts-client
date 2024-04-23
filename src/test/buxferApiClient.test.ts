import { BuxferApiClient } from '../client/buxferApiClient';
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

    it('should retrieve transactions', async () => {
        let transactions = await buxferClient.getTransactions();
        expect(transactions.length).toBeGreaterThan(0);
        //console.log(`First 100 transactions: ${transactions}`)
    });

    it('should retrieve tags', async () => {
        let tags = await buxferClient.getTags();
        expect(tags.length).toBeGreaterThan(0);
        //console.log(`Tags: ${tags}`)
    });


});
