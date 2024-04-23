# buxfer-ts-client

[![License](http://img.shields.io/:license-MIT-blue.svg)](https://github.com/nissant/buxfer-ts-client/blob/main/LICENSE)

buxfer-ts-client is an easy-to-use Type Script client library to [Buxfer API](https://www.buxfer.com/help/api).

---

# Features

- Full API support
- Tested on Windows 11.

---

# Usage

```typescript
// Creating client.
var client = new BuxferApiClient("<your user>", "<your password>");

// Getting all accounts.
var accounts = client.getAccounts();

// Getting all budgets.
var budgets = client.getBudgets();

// Getting all contacts.
var contacts = client.getContacts();

// Getting all groups.
var groups = client.getGroups();

// Getting all loans.
var loans = client.getLoans();

// Getting all reminders.
var reminders = client.getReminders();

// Upload a statement.
-TODO;
// var statement = new Statement();
// statement.AccountId = "<account id>";
// statement.Text = "<Quicken, MS Money, OFX, QIF, QFX, Excel, CSV file content>";
// bool uploaded = client.uploadStatement(statement);

// Getting all tags.
var tags = client.getTags();

// Getting last 100 transactions.
var lastTransactions = client.getTransactions();

// Getting last transactions from page 2.
-TODO;

// Add a transaction.

var transactions: BuxferTransaction[];

// Populate new Buxfer transactions to be added
var batchesAddedSuccessfully: number =
  client.sendBulkAddedTransactions(transactions);
```

---

## Roadmap

- Create and publish Node package.
- Build on [moneyman](https://github.com/daniel-hauser/moneyman) application.

---

# FAQ

Having troubles?

- Ask on Twitter [@ogiacomelli](http://twitter.com/ogiacomelli)
- Ask on [Stack Overflow](http://stackoverflow.com/search?q=BuxferSharp)

---

# How to improve it?

Create a fork of [buxfer-ts-client](https://github.com/nissant/buxfer-ts-client/fork).

Did you change it? [Submit a pull request](https://github.com/nissant/buxfer-ts-client/pull/new/master).

# License

Licensed under the The MIT License (MIT).
In others words, you can use this library for developement any kind of software: open source, commercial, proprietary and alien.

# Change Log

0.5.0 First version.
