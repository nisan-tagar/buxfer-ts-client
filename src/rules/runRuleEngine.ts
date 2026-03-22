import "dotenv/config";
import fs from "fs";
import path from "path";
import { format, subDays } from "date-fns";
import stripJsonComments from "strip-json-comments";
import { BuxferApiClient } from "../client/buxferApiClient";
import { BuxferRule, GetTransactionsQueryParameters } from "../interface";
import { applyRules } from "./ruleEngine";

const CONFIG_FILE = path.resolve(process.cwd(), "config.rules.jsonc");
const BUXFER_DATE_FORMAT = "yyyy-MM-dd";

interface EngineConfig {
  engine?: {
    daysBack?: number;
    rulesFile?: string;
    queryParameters?: Record<string, string>;
  };
  scraper?: {
    outputFile?: string;
  };
}

function loadConfig(): EngineConfig {
  const raw = fs.readFileSync(CONFIG_FILE, "utf8");
  return JSON.parse(stripJsonComments(raw)) as EngineConfig;
}

async function main() {
  const config = loadConfig();
  const engineCfg = config.engine ?? {};

  // Resolve date range
  const daysBack = engineCfg.daysBack ?? 20;
  const endDate = format(new Date(), BUXFER_DATE_FORMAT);
  const startDate = format(subDays(new Date(), daysBack), BUXFER_DATE_FORMAT);

  // Load rules from the scraped rules file
  const rulesFile = path.resolve(
    process.cwd(),
    engineCfg.rulesFile ?? config.scraper?.outputFile ?? ".scrapedrules.json",
  );
  const rules: BuxferRule[] = JSON.parse(fs.readFileSync(rulesFile, "utf8"));
  console.log(`Loaded ${rules.length} rules from ${rulesFile}`);

  // Build query parameters
  const queryParams = new GetTransactionsQueryParameters();
  queryParams.startDate = startDate;
  queryParams.endDate = endDate;
  const extraParams = engineCfg.queryParameters ?? {};
  for (const [key, value] of Object.entries(extraParams)) {
    (queryParams as unknown as Record<string, string>)[key] = value;
  }

  // Initialise API client and fetch transactions
  const email = process.env.BUXFER_EMAIL;
  const password = process.env.BUXFER_PASSWORD;
  if (!email || !password) {
    throw new Error("BUXFER_EMAIL and BUXFER_PASSWORD must be set in environment / .env file.");
  }

  const client = new BuxferApiClient(email, password);
  const transactions = await client.getTransactions(queryParams.getAttributesAsRecord());
  console.log(`Fetched ${transactions.length} transactions`);

  // Apply rules
  const modified = applyRules(transactions, rules);

  if (modified.length === 0) {
    console.log("No transactions matched any rules.");
    return;
  }

  const response = await client.editTransactionBulks(modified);
  console.log(
    `Edit complete — successful batches: ${response.successfulBatches}, failed: ${response.failedBatches}`,
  );
  if (response.failedBatches > 0) {
    process.exit(1);
  }

  console.log(`\n${modified.length} transaction(s) updated by rules:`);
  for (const tx of modified) {
    console.log(`  ${tx.date}  ${tx.description}  ${tx.amount}  [${tx.tags ?? ""}]`);
  }
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
