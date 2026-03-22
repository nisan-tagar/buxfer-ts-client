# buxfer-ts-client

[![License](http://img.shields.io/:license-MIT-blue.svg)](https://github.com/nissant/buxfer-ts-client/blob/main/LICENSE)
[![NPM](buxfer-ts-client)](https://nodei.co/npm/buxfer-ts-client/)

buxfer-ts-client is an easy-to-use TypeScript client library for the [Buxfer API](https://www.buxfer.com/help/api), with a built-in rule engine that scrapes your Buxfer rules and applies them to transactions in bulk.

---

# Features

- Full Buxfer REST API support
- Automatic transaction deduplication when adding transactions
- **Rule engine** — scrape your Buxfer rules and apply them to transactions programmatically
- **Rule scraper** — exports all your Buxfer rules to a local JSON file via web scraping
- Integrated with [moneyman](https://github.com/daniel-hauser/moneyman)
- Tested on Windows 11 (WSL2)

---

# Setup

## 1. Install dependencies

```bash
npm install
```

## 2. Configure credentials

Create a `.env` file in the project root (it is gitignored):

```
BUXFER_EMAIL=your@email.com
BUXFER_PASSWORD=your_password
```

These credentials are used both by the API client and the rule scraper to authenticate with Buxfer.

## 3. Configure the rule engine

Create a `config.rules.jsonc` file in the project root (it is gitignored). A full example:

```jsonc
{
    "engine": {
        // Number of days back from today to fetch and process transactions (default: 20)
        "daysBack": 20,

        // Path to the scraped rules file (relative to project root)
        "rulesFile": ".scrapedrules.json",

        // Optional: additional query filters passed to getTransactions.
        // Keys map to GetTransactionsQueryParameters fields.
        // Default: only the date range is applied.
        "queryParameters": {
            "tagName": "added-by-moneyman-etl"
        }
    },
    "scraper": {
        // Output path for the scraped rules JSON file (relative to project root)
        "outputFile": ".scrapedrules.json"
    }
}
```

### `engine.queryParameters` supported keys

These map directly to [Buxfer GET /transactions](https://www.buxfer.com/help/api#transactions) query parameters:

| Key | Description |
|---|---|
| `tagName` | Filter by tag name |
| `tagId` | Filter by tag ID |
| `accountId` | Filter by account ID |
| `accountName` | Filter by account name |
| `status` | `cleared` \| `pending` \| `reconciled` |

---

# Rule Engine

The rule engine applies your Buxfer rules to transactions fetched from the API and commits the changes back via `transaction_edit`.

## Scrape your rules

Exports all rules from your Buxfer account to `.scrapedrules.json` (or the path configured in `scraper.outputFile`):

```bash
npm run scrape:rules
```

This logs in to the Buxfer web UI using your `.env` credentials and scrapes all rule pages.

## Run the rule engine

Fetches transactions for the configured date range, applies matching rules, and edits the updated transactions in Buxfer:

```bash
npm run run:rules
```

Output example:
```
Loaded 247 rules from /path/to/.scrapedrules.json
Fetched 12 transactions
Edit complete — successful batches: 1, failed: 0

12 transaction(s) updated by rules:
  2026-03-18  Supermarket purchase  54.90  [Groceries, Food]
  2026-03-17  Monthly subscription  9.99   [Entertainment]
```

### How rules are applied

- All filters on a rule must match (AND logic)
- Multiple rules can match one transaction — all are applied in order
- Only transactions matched by at least one rule are edited

### Supported filter fields and operators

| Field | Operators |
|---|---|
| `description` | `contains`, `contains_phrase`, `equals`, `starts_with`, `matches_wildcard` |
| `amount` | `equals`, `lt`, `gt`, `lte`, `gte` |
| `date` | `equals`, `lt`, `gt` |
| `account` | `equals`, `contains` |
| `type` | `equals`, `contains` |

### Supported actions

| Action | Effect |
|---|---|
| `add_tags` | Appends tags to the transaction (comma-separated) |
| `set_description` | Replaces the description |
| `remove_words_from_description` | Strips specified words from the description |
| `set_type` | Sets the transaction type |
| `set_status` | Sets the transaction status |
| `set_transfer_source_account` | Sets `fromAccountId` |
| `set_transfer_destination_account` | Sets `toAccountId` |

---

# API Client Usage

```typescript
import { BuxferApiClient, GetTransactionsQueryParameters, BuxferTransaction, AddTransactionsResponse } from "buxfer-ts-client";

// Creating client
const client = new BuxferApiClient("<your email>", "<your password>");

// Getting all accounts
const accounts = await client.getAccounts();

// Getting all tags
const tags = await client.getTags();

// Getting last 100 transactions
const transactions = await client.getTransactions();

// Getting transactions by date range and tag
const queryParams = new GetTransactionsQueryParameters();
queryParams.startDate = "2024-01-01";
queryParams.endDate = "2024-02-01";
queryParams.tagName = "my-tag";
const filtered = await client.getTransactions(queryParams.getAttributesAsRecord());

// Add transactions (with automatic deduplication)
const mockTrx: BuxferTransaction = {
  description: "Paycheck",
  amount: 4000,
  date: "2024-01-15",
  type: "income",
  status: "cleared",
  accountId: 1398435,
};
const response: AddTransactionsResponse = await client.addTransactions([mockTrx]);

// Edit transactions in bulk
await client.editTransactionBulks([{ ...mockTrx, id: 12345, tags: "salary" }]);

// Delete a transaction
await client.deleteTransaction("12345");
```

---

## Roadmap

- Support automatic pagination to retrieve more than 100 transactions at a time

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

Licensed under the MIT License. You can use this library for any kind of software: open source, commercial, proprietary.

# Change Log

1.1.4 Rule engine, rule scraper, bulk edit support.
1.0.0 First version.
