import axios from "axios";
import { JSDOM } from "jsdom";
import {
  BuxferRule,
  RuleFilter,
  RuleAction,
  RuleFilterField,
  RuleFilterOperator,
  RuleActionType,
} from "../interface";

const RULES_PAGE_SIZE = 10;

// Maps the label text rendered in the HTML to structured filter field + operator
const FILTER_LABEL_MAP: Record<string, { field: RuleFilterField; operator: RuleFilterOperator }> = {
  "description contains phrase":  { field: "description", operator: "contains_phrase" },
  "description contains":         { field: "description", operator: "contains" },
  "description equals":           { field: "description", operator: "equals" },
  "description starts with":      { field: "description", operator: "starts_with" },
  "description matches wildcard": { field: "description", operator: "matches_wildcard" },
  "amount <":                     { field: "amount",      operator: "lt" },
  "amount >":                     { field: "amount",      operator: "gt" },
  "amount <=":                    { field: "amount",      operator: "lte" },
  "amount >=":                    { field: "amount",      operator: "gte" },
  "amount =":                     { field: "amount",      operator: "equals" },
  "date <":                       { field: "date",        operator: "lt" },
  "date >":                       { field: "date",        operator: "gt" },
  "date =":                       { field: "date",        operator: "equals" },
  "account =":                    { field: "account",     operator: "equals" },
  "account contains":             { field: "account",     operator: "contains" },
  "type =":                       { field: "type",        operator: "equals" },
  "type contains":                { field: "type",        operator: "contains" },
};

const ACTION_LABEL_MAP: Record<string, RuleActionType> = {
  "add tags":                         "add_tags",
  "set description":                  "set_description",
  "remove words from description":    "remove_words_from_description",
  "set type":                         "set_type",
  "set status":                       "set_status",
  "set transfer source account":      "set_transfer_source_account",
  "set transfer destination account": "set_transfer_destination_account",
};

function parseFilterLabel(label: string): { field: RuleFilterField; operator: RuleFilterOperator } | null {
  const key = label.trim().toLowerCase();
  return FILTER_LABEL_MAP[key] ?? null;
}

function parseActionLabel(label: string): RuleActionType | null {
  const key = label.trim().toLowerCase();
  return ACTION_LABEL_MAP[key] ?? null;
}

function getTextValue(block: Element): string {
  return Array.from(block.childNodes)
    .filter((n) => n.nodeType === 3 /* TEXT_NODE */)
    .map((n) => n.textContent?.trim() ?? "")
    .join(" ")
    .trim();
}

function parseRuleRow(row: Element): BuxferRule | null {
  // Extract rule ID from the edit or delete action link
  const editLink = row.querySelector<HTMLAnchorElement>("a.editAction");
  const deleteLink = row.querySelector<HTMLAnchorElement>("a.deleteAction");
  const idMatch =
    editLink?.getAttribute("href")?.match(/[?&]id=(\d+)/) ??
    deleteLink?.getAttribute("href")?.match(/[?&]id=(\d+)/);

  if (!idMatch) return null;
  const id = idMatch[1];

  // Parse filters from column 1
  const filters: RuleFilter[] = [];
  const filterCol = row.querySelector("td:first-child");
  if (filterCol) {
    for (const block of filterCol.querySelectorAll("div > div")) {
      const keywordEl = block.querySelector(".ruleKeyword");
      if (!keywordEl) continue;
      const parsed = parseFilterLabel(keywordEl.textContent ?? "");
      if (!parsed) continue;
      filters.push({ field: parsed.field, operator: parsed.operator, value: getTextValue(block) });
    }
  }

  // Parse actions from column 2
  const actions: RuleAction[] = [];
  const actionCol = row.querySelector("td:nth-child(2)");
  if (actionCol) {
    for (const block of actionCol.querySelectorAll("div > div")) {
      const keywordEl = block.querySelector(".ruleKeyword");
      if (!keywordEl) continue;
      const actionType = parseActionLabel(keywordEl.textContent ?? "");
      if (!actionType) continue;
      actions.push({ type: actionType, value: getTextValue(block) });
    }
  }

  return { id, filters, actions };
}

function parseRulesPage(html: string): BuxferRule[] {
  const { window } = new JSDOM(html);
  const rules: BuxferRule[] = [];

  // Skip the header row; each subsequent <tr> is a rule
  const rows = window.document.querySelectorAll(
    ".UIRuleList table.UIItemList tr:not(.tableHeaderRow)",
  );
  for (const row of rows) {
    const rule = parseRuleRow(row);
    if (rule) rules.push(rule);
  }

  return rules;
}

const BASE_HEADERS = {
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
};

/**
 * Logs in via the Buxfer web UI and returns the session cookie string.
 * Reads BUXFER_EMAIL and BUXFER_PASSWORD from environment variables (e.g. via .env).
 */
async function webLogin(email: string, password: string): Promise<string> {
  // Step 1: GET the login page to extract the __authToken hidden field
  const loginPageResponse = await axios.get<string>("https://www.buxfer.com/login", {
    headers: BASE_HEADERS,
    responseType: "text",
    maxRedirects: 0,
    validateStatus: (s) => s < 400,
  });

  const { window } = new JSDOM(loginPageResponse.data);
  const doc = window.document;

  // Extract all hidden fields from the login form so none are missed
  const hiddenFields: Record<string, string> = {};
  for (const el of doc.querySelectorAll<HTMLInputElement>('form input[type="hidden"]')) {
    if (el.name) hiddenFields[el.name] = el.value;
  }

  // Collect any cookies set on the login page (e.g. PHPSESSID)
  const initialCookies = (loginPageResponse.headers["set-cookie"] ?? [])
    .map((c: string) => c.split(";")[0])
    .join("; ");

  // Step 2: POST credentials to the login form action (/w/login)
  const params = new URLSearchParams({
    email,
    password,
    ...hiddenFields,
  });

  const loginResponse = await axios.post<string>(
    "https://www.buxfer.com/w/login",
    params.toString(),
    {
      headers: {
        ...BASE_HEADERS,
        "content-type": "application/x-www-form-urlencoded",
        cookie: initialCookies,
      },
      responseType: "text",
      maxRedirects: 0,
      validateStatus: (s) => s < 400,
    },
  );

  // Step 3: Collect all Set-Cookie values from the login response
  const sessionCookies = (loginResponse.headers["set-cookie"] ?? [])
    .map((c: string) => c.split(";")[0])
    .join("; ");

  const cookies = [initialCookies, sessionCookies].filter(Boolean).join("; ");

  if (loginResponse.headers["location"] !== "/dashboard") {
    throw new Error("Buxfer web login failed — unexpected redirect. Check credentials.");
  }

  return cookies;
}

/**
 * Logs in to Buxfer using credentials from environment variables and scrapes all rules.
 * Requires BUXFER_EMAIL and BUXFER_PASSWORD to be set (e.g. in a .env file loaded via dotenv).
 */
export async function scrapeAllRules(): Promise<BuxferRule[]> {
  const email = process.env.BUXFER_EMAIL;
  const password = process.env.BUXFER_PASSWORD;

  if (!email || !password) {
    throw new Error("BUXFER_EMAIL and BUXFER_PASSWORD must be set in environment / .env file.");
  }

  const cookies = await webLogin(email, password);

  const allRules: BuxferRule[] = [];
  let navStart = 1;

  while (true) {
    const response = await axios.get<string>(
      `https://www.buxfer.com/rules?navStart=${navStart}`,
      {
        headers: { ...BASE_HEADERS, cookie: cookies },
        responseType: "text",
      },
    );

    const pageRules = parseRulesPage(response.data);
    allRules.push(...pageRules);

    if (pageRules.length < RULES_PAGE_SIZE) break;
    navStart += RULES_PAGE_SIZE;
  }

  return allRules;
}
