# buxfer-ts-client

[![License](http://img.shields.io/:license-MIT-blue.svg)](https://github.com/nissant/buxfer-ts-client/blob/main/LICENSE)
[![NPM](buxfer-ts-client)](https://nodei.co/npm/buxfer-ts-client/)

buxfer-ts-client is an easy-to-use Type Script client library to [Buxfer API](https://www.buxfer.com/help/api).

---

# Features

- Full API support
- Tested on Windows 11.

---

# Usage

```typescript
// Creating client.
let client = new BuxferApiClient("<your user>", "<your password>");

// Getting all accounts.
let accounts = await client.getAccounts();

// Getting all budgets.
let budgets = await client.getBudgets();

// Getting all contacts.
let contacts = await client.getContacts();

// Getting all groups.
let groups = await client.getGroups();

// Getting all loans.
let loans = await client.getLoans();

// Getting all reminders.
let reminders = await client.getReminders();

// Upload a statement.
-TODO;
// let statement = new Statement();
// statement.AccountId = "<account id>";
// statement.Text = "<Quicken, MS Money, OFX, QIF, QFX, Excel, CSV file content>";
// bool uploaded = client.uploadStatement(statement);

// Getting all tags.
let tags = await client.getTags();

// Getting last 100 transactions.
let lastTransactions = await client.getTransactions();

// Getting transactions by supported query parameters
let queryParams = new GetTransactionsQueryParameters();
queryParams.startDate = "2024-01-01";
queryParams.endDate = "2024-02-01";
let dbTransactions = await buxferClient.getTransactions(queryParams);

// Add a transaction.

// Populate new Buxfer transactions to be added
const nowDate = format(new Date(), "yyyy-MM-dd");
const mockTrx: BuxferTransaction = {
    description: "mock",
    amount: 12345,
    date: nowDate,
    type: "income",
    status: "cleared",
    accountId: 1398435
}
// Add new mock transaction to DB
let response: AddTransactionsResponse = await buxferClient.addTransactions(new Array(mockTrx), true);
const mockTrxId = response.addedTransactionIds[0];
```

---

## Roadmap
- Support automatic paginator to retrieve more than 100 transactions at a time by the client getter signatures
- Build on [moneyman](https://github.com/daniel-hauser/moneyman) application.

---

# FAQ

Having troubles?

- Ask on Twitter [@NissanTagar](https://twitter.com/NissanTagar)
- E-mail me [tnisan@gmail.com](tnisan@gmail.com)

---

# How to improve it?

Create a fork of [buxfer-ts-client](https://github.com/nissant/buxfer-ts-client/fork).

Did you change it? [Submit a pull request](https://github.com/nissant/buxfer-ts-client/pull/new/master).

# License

Licensed under the The MIT License (MIT).
In others words, you can use this library for development any kind of software: open source, commercial, proprietary and alien.

# Change Log

1.0.0 First version.
