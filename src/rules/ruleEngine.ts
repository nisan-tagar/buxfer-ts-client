import {
  BuxferTransaction,
  BuxferRule,
  RuleFilter,
  RuleAction,
  RuleFilterField,
} from "../interface";

// --- Filter matching ---

function getFieldValue(tx: BuxferTransaction, field: RuleFilterField): string {
  switch (field) {
    case "description": return tx.description;
    case "amount":      return String(Math.abs(tx.amount));
    case "date":        return tx.date;
    case "account":     return tx.accountName ?? "";
    case "type":        return tx.type;
  }
}

function wildcardToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const regexStr = escaped.replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${regexStr}$`, "i");
}

function matchesFilter(tx: BuxferTransaction, filter: RuleFilter): boolean {
  const fieldValue = getFieldValue(tx, filter.field).toLowerCase();
  const filterValue = filter.value.toLowerCase().trim();

  switch (filter.operator) {
    case "contains":
      return filterValue.split(/\s+/).every((word) => fieldValue.includes(word));
    case "contains_phrase":
      return fieldValue.includes(filterValue);
    case "equals":
      return fieldValue === filterValue;
    case "starts_with":
      return fieldValue.startsWith(filterValue);
    case "matches_wildcard":
      return wildcardToRegex(filter.value).test(getFieldValue(tx, filter.field));
    case "lt":
      return parseFloat(getFieldValue(tx, filter.field)) < parseFloat(filter.value);
    case "gt":
      return parseFloat(getFieldValue(tx, filter.field)) > parseFloat(filter.value);
    case "lte":
      return parseFloat(getFieldValue(tx, filter.field)) <= parseFloat(filter.value);
    case "gte":
      return parseFloat(getFieldValue(tx, filter.field)) >= parseFloat(filter.value);
  }
}

function matchesRule(tx: BuxferTransaction, rule: BuxferRule): boolean {
  return rule.filters.every((filter) => matchesFilter(tx, filter));
}

// --- Action application ---

function applyAction(tx: BuxferTransaction, action: RuleAction): BuxferTransaction {
  switch (action.type) {
    case "add_tags": {
      const newTags = action.value.split(",").map((t) => t.trim()).filter(Boolean);
      const existingTags = tx.tagNames ?? (tx.tags ? tx.tags.split(",").map((t) => t.trim()) : []);
      const merged = Array.from(new Set([...existingTags, ...newTags]));
      return { ...tx, tagNames: merged, tags: merged.join(", ") };
    }
    case "set_description":
      return { ...tx, description: action.value };
    case "remove_words_from_description": {
      const words = action.value.split(",").map((w) => w.trim()).filter(Boolean);
      const regex = new RegExp(words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "gi");
      return { ...tx, description: tx.description.replace(regex, "").replace(/\s{2,}/g, " ").trim() };
    }
    case "set_type":
      return { ...tx, type: action.value.toLowerCase() as BuxferTransaction["type"] };
    case "set_status":
      return { ...tx, status: action.value.toLowerCase() as BuxferTransaction["status"] };
    case "set_transfer_source_account":
      return { ...tx, fromAccountId: action.value };
    case "set_transfer_destination_account":
      return { ...tx, toAccountId: action.value };
  }
}

function applyRule(tx: BuxferTransaction, rule: BuxferRule): BuxferTransaction {
  return rule.actions.reduce((updated, action) => applyAction(updated, action), tx);
}

// --- Public API ---

/**
 * Applies a list of Buxfer rules to a list of transactions.
 * All filters on a rule must match (AND logic) for the rule to apply.
 * Multiple matching rules are applied in order.
 * Returns only transactions that were matched and modified by at least one rule.
 */
export function applyRules(
  transactions: BuxferTransaction[],
  rules: BuxferRule[],
): BuxferTransaction[] {
  const result: BuxferTransaction[] = [];

  for (const tx of transactions) {
    const matchingRules = rules.filter((rule) => matchesRule(tx, rule));
    if (matchingRules.length === 0) continue;
    const updated = matchingRules.reduce((t, rule) => applyRule(t, rule), tx);
    result.push(updated);
  }

  return result;
}
