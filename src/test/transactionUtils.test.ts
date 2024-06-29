
import { BuxferTransaction } from '../interface';
import { transactionHash, filterDuplicateTransactions } from '../client/transactionUtils';
import fs from 'fs';


describe.only('transactionUtilsTest', () => {

    it('should create same hash for same transaction', () => {

        const mockExistingTrx: BuxferTransaction = {
            "id": 207071073,
            "description": "mock expense | some memo here might be modified",
            "date": "2024-04-26",
            "type": "expense",
            "transactionType": "expense",
            "amount": 11.43,
            "expenseAmount": 11.43,
            "accountId": 123456,
            "accountName": "buxfer account name",
            "tags": "",
            "tagNames": [],
            "status": "cleared",
            "isFutureDated": false,
            "isPending": false
        }
        const mockAddedTrx: BuxferTransaction = {
            "accountId": 123456,
            "date": "2024-04-26",
            "amount": -11.43,
            "description": "mock expense | some memo here",
            "status": "cleared",
            "type": "expense",
          }

        expect(transactionHash(mockExistingTrx)).toEqual(transactionHash(mockAddedTrx));

        const [deduplicatedTransactions, duplicateTransactions] = filterDuplicateTransactions(new Array(mockAddedTrx), new Array(mockExistingTrx));
        expect(deduplicatedTransactions.length).toBe(0);
        expect(duplicateTransactions.length).toBe(1);

    });

    it.skip('should successfully deduplicate added transactions against Buxfer DB', () => {

        let rawData = fs.readFileSync('src/test/mockAddedTrx.json', 'utf8');
        const addedTransactions: BuxferTransaction[] = JSON.parse(rawData);

        rawData = fs.readFileSync('src/test/mockDbTrx.json', 'utf8');
        const dbTransactions: BuxferTransaction[] = JSON.parse(rawData);

        const [deduplicatedTransactions, duplicateTransactions] = filterDuplicateTransactions(addedTransactions, dbTransactions);

        expect(deduplicatedTransactions.length).toBe(0);
        expect(duplicateTransactions.length).toBe(addedTransactions.length);

    });
});