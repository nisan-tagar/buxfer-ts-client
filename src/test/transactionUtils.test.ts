
import { BuxferTransaction } from '../interface';
import { transactionHash, splitTransactions } from '../client/transactionUtils';
import fs from 'fs';


describe.only('transactionUtilsTest', () => {

    it('should create same hash for same transaction', () => {

        const mockFirstDbTrx: BuxferTransaction = {
            "id": 207071073,
            "description": "mock expense | some memo here",
            "date": "2024-04-26",
            "type": "expense",
            "transactionType": "expense",
            "amount": 11.43,
            "expenseAmount": 11.43,
            "accountId": 123456,
            "accountName": "buxfer account name",
            "tags": "",
            "tagNames": [],
            "status": "pending",
            "isFutureDated": false,
            "isPending": false
        }


        const mockSecondDbTrx: BuxferTransaction = {
            "id": 207071073,
            "description": "mock expense | some memo here",
            "date": "2024-01-01",
            "type": "expense",
            "transactionType": "expense",
            "amount": 22,
            "expenseAmount": 11.43,
            "accountId": 123456,
            "accountName": "buxfer account name",
            "tags": "",
            "tagNames": [],
            "status": "cleared",
            "isFutureDated": false,
            "isPending": false
        }


        const mockFirstScrappedTrx: BuxferTransaction = {
            "accountId": 123456,
            "date": "2024-04-26",
            "amount": -11.43,
            "description": "mock expense | some memo here, might be modified in status update ... ",
            "status": "cleared",
            "type": "expense",
        }

        const mockSecondScrappedTrx: BuxferTransaction = {
            "accountId": 123456,
            "date": "2024-05-01",
            "amount": 55,
            "description": "mock expense 2 | some memo here",
            "status": "cleared",
            "type": "expense",
        }

        const mockThirdScrappedTrx: BuxferTransaction = {
            "description": "mock expense | some memo here",
            "date": "2024-01-01",
            "type": "expense",
            "amount": 22,
            "accountId": 123456,
            "status": "cleared",
        }

        expect(transactionHash(mockFirstDbTrx)).toEqual(transactionHash(mockFirstScrappedTrx));

        const [newTransactions, updateRequiredTransactions, existingTransactions] = splitTransactions(
            new Array(mockFirstScrappedTrx, mockSecondScrappedTrx, mockThirdScrappedTrx),
            new Array(mockFirstDbTrx, mockSecondDbTrx));
            
        expect(newTransactions.length).toBe(1);
        expect(existingTransactions.length).toBe(1);
        expect(updateRequiredTransactions.length).toBe(1);

    });

    it.skip('should successfully deduplicate added transactions against Buxfer DB', () => {

        let rawData = fs.readFileSync('src/test/mockAddedTrx.json', 'utf8');
        const addedTransactions: BuxferTransaction[] = JSON.parse(rawData);

        rawData = fs.readFileSync('src/test/mockDbTrx.json', 'utf8');
        const dbTransactions: BuxferTransaction[] = JSON.parse(rawData);

        const [newTransactions, updateRequiredTransactions, existingTransactions] = splitTransactions(addedTransactions, dbTransactions);

        expect(newTransactions.length).toBe(0);
        expect(updateRequiredTransactions.length).toBe(0);
        expect(existingTransactions.length).toBe(addedTransactions.length);

    });
});