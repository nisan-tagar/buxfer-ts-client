# buxfer-ts-client

[![License](http://img.shields.io/:license-MIT-blue.svg)](https://github.com/nissant/buxfer-ts-client/blob/main/LICENSE)
[![NPM](https://nodei.co/npm/israeli-bank-scrapers.png)](https://nodei.co/npm/buxfer-ts-client/)

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

// Getting last transactions from page 2.
let queryParams = new GetTransactionsQueryParameters();
queryParams.page = 2;
queryParams.accountId = accounts[0].id;
let transactions = await buxferClient.getTransactions(queryParams);

// Add a transaction.
let transactions: BuxferTransaction[];
// Populate new Buxfer transactions to be added
let batchesAddedSuccessfully: number =
  await client.sendBulkAddedTransactions(transactions);
```

---

## Roadmap

- Create and publish Node package.
- Build on [moneyman](https://github.com/daniel-hauser/moneyman) application.

---

# FAQ

Having troubles?

- Ask on Twitter [@NissanTagar](https://twitter.com/NissanTagar)

---

# How to improve it?

Create a fork of [buxfer-ts-client](https://github.com/nissant/buxfer-ts-client/fork).

Did you change it? [Submit a pull request](https://github.com/nissant/buxfer-ts-client/pull/new/master).

# License

Licensed under the The MIT License (MIT).
In others words, you can use this library for development any kind of software: open source, commercial, proprietary and alien.

# Change Log

1.0.0 First version.
