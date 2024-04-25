import axios, { AxiosRequestConfig } from 'axios';
import { getTransactionsDateRange, deduplicateTransactions } from './transactionUtils'
import {
    BuxferTransaction, BuxferAccount, BuxferLoan,
    BuxferTag, BuxferBudget, BuxferReminder, BuxferGroup, BuxferContact,
    GetTransactionsQueryParameters
} from '../interface'

interface BuxferResponseBase {
    status: string;
}

interface LoginResponseData extends BuxferResponseBase {
    token: string;
}

interface GetTransactionsResponseData extends BuxferResponseBase {
    numTransactions: number;
    transactions: BuxferTransaction[];
}

interface GetAccountsResponseData extends BuxferResponseBase {
    accounts: BuxferAccount[];
}

interface GetLoansResponseData extends BuxferResponseBase {
    loans: BuxferLoan[];
}

interface GetTagsResponseData extends BuxferResponseBase {
    tags: BuxferTag[];
}

interface GetBudgetsResponseData extends BuxferResponseBase {
    budgets: BuxferBudget[];
}

interface GetRemindersResponseData extends BuxferResponseBase {
    reminders: BuxferReminder[];
}

interface GetGroupsResponseData extends BuxferResponseBase {
    groups: BuxferGroup[];
}

interface GetContactsResponseData extends BuxferResponseBase {
    contacts: BuxferContact[];
}

interface BuxferResponseContainer {
    response: any;
    // LoginResponseData | GetTransactionsResponseData | BuxferTransaction | GetAccountsResponseData |
    // GetLoansResponseData | GetTagsResponseData | GetBudgetsResponseData | GetRemindersResponseData | GetGroupsResponseData | GetContactsResponseData;
}


export class BuxferApiClient {
    private readonly baseUrl: string;
    private authToken: string | null = null;
    private bulkSize: number = 20; // Class variable for bulk size

    constructor(private readonly email: string, private readonly password: string) {
        this.baseUrl = 'https://www.buxfer.com/api';
    }

    public async login(): Promise<void> {
        try {
            // TODO: Implement token refresh mechanism if needed
            const response = await this.makeApiRequest<LoginResponseData>(
                'login',
                'POST',
                { email: this.email, password: this.password }
            );
            this.authToken = response.token;
            this.log(`Login successful. Token: ${this.authToken}`, "info");
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.log(`Error during login: ${error.message}`, "error");
            } else {
                this.log('Unknown error occurred', "error");
            }
            throw error;
        }
    }

    private log(msg: string, level: "info" | "error") {
        switch (level) {
            case "info":
                // todo - configure per verbosity level
                break;
            case "error":
                console.error(msg);
        }
    }

    private async makeApiRequest<T>(
        endpoint: string,
        method: 'GET' | 'POST',
        data?: Object,
        params?: Record<string, any>
    ): Promise<T> {
        const config: AxiosRequestConfig = {
            url: `${this.baseUrl}/${endpoint}`,
            method,
            headers: {
                Authorization: `Bearer ${this.authToken}`,
                'Content-Type': method === 'POST' ? 'application/json' : undefined,
            },
            params: {
                ...params,
                token: this.authToken,
            },
            data: method === 'POST' ? JSON.stringify(data) : undefined,
        };

        this.log(JSON.stringify(config), "info");
        try {
            let response = (await axios.request<BuxferResponseContainer>(config)).data;
            return response.response;
        } catch (error) {
            if (error instanceof Error) {
                this.log(`Error making ${method} API request: ${error.message}`, "error");
            } else {
                this.log("Unknown error occurred", "error");
            }
            throw error;
        }
    }

    /**
     * Send batched POST requests in parallel
     * @param transactions List of Buxfer transactions to be added
     * @param deduplicate Select if transaction deduplication is required
     * @returns successfully added transaction bulks each of size 20.
     */
    public async addTransactions(transactions: BuxferTransaction[], deduplicate: boolean): Promise<number> {
        if (!deduplicate) {
            return this.addTransactionBulks(transactions);
        }

        // Resolve transaction date range
        let [startDate, endDate] = getTransactionsDateRange(transactions);

        // Get existing transactions within the range
        let params: GetTransactionsQueryParameters = new GetTransactionsQueryParameters();
        params.startDate = startDate;
        params.endDate = endDate;
        let dbTransactions: BuxferTransaction[] = await this.getTransactions(params);

        // Deduplicate transactions
        transactions = deduplicateTransactions(transactions, dbTransactions);

        return this.addTransactionBulks(transactions);
    }

    private async addTransactionBulks<T>(bodies: BuxferTransaction[]): Promise<number> {
        // Split the bodies array into chunks of bulkSize
        let batchIndex = 0;
        let failedBatchCount = 0;
        for (let i = 0; i < bodies.length; i += this.bulkSize) {
            const batch = bodies.slice(i, i + this.bulkSize);

            // Map each body in the current batch to a POST request promise
            const promises = batch.map(body => this.makeApiRequest<T>("transaction_add", 'POST', body));

            // Wait for all POST requests in the current batch to complete
            await Promise.all(promises).then(results => {
                this.log(`Batch ${batchIndex} completed: ${results.length} transactions updated`, "info");
            }).catch(error => {
                this.log(`Error with batch: ${batchIndex} - ${error}`, "error");
                failedBatchCount++;
            });
            batchIndex++;
        }
        return failedBatchCount;
    }

    /**
     * Each call to this method returns at most 100 transactions matching the specified criteria. 
     * If there are more that 100 results, you can specify increasing values of the page parameter to page through the results.
     * @param queryParams Optional api query params for filtering the fetched transactions
     * @returns List of buxfer transactions
     */
    async getTransactions(queryParams?: Record<string, any>): Promise<BuxferTransaction[]> {
        let response = await this.makeApiRequest<GetTransactionsResponseData>("transactions", "GET", undefined, queryParams)
        return response.transactions;
    }

    /**
     * 
     * @returns List of user accounts
     */
    async getAccounts(): Promise<BuxferAccount[]> {
        let response = await this.makeApiRequest<GetAccountsResponseData>("accounts", "GET")
        return response.accounts;
    }

    /**
     * 
     * @returns list of user budgets
     */
    async getBudgets(): Promise<BuxferBudget[]> {
        let response = await this.makeApiRequest<GetBudgetsResponseData>("budgets", "GET")
        return response.budgets;
    }

    /**
     * 
     * @returns List of user tags
     */
    async getTags(): Promise<BuxferTag[]> {
        let response = await this.makeApiRequest<GetTagsResponseData>("tags", "GET")
        return response.tags;
    }

    /**
     * 
     * @returns List of user loans
     */
    async getLoans(): Promise<BuxferLoan[]> {
        let response = await this.makeApiRequest<GetLoansResponseData>("loans", "GET")
        return response.loans;
    }

    /**
     * 
     * @returns List of user reminders
     */
    async getReminders(): Promise<BuxferReminder[]> {
        let response = await this.makeApiRequest<GetRemindersResponseData>("reminders", "GET")
        return response.reminders;
    }

    /**
     * 
     * @returns List of user contacts
     */
    async getContacts(): Promise<BuxferContact[]> {
        let response = await this.makeApiRequest<GetContactsResponseData>("contacts", "GET")
        return response.contacts;
    }

    /**
    * 
    * @returns List of user groups
    */
    async getGroups(): Promise<BuxferGroup[]> {
        let response = await this.makeApiRequest<GetGroupsResponseData>("groups", "GET")
        return response.groups;
    }

}