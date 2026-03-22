import "dotenv/config";
import fs from "fs";
import path from "path";
import stripJsonComments from "strip-json-comments";
import { scrapeAllRules } from "./scrapeRules";

const CONFIG_FILE = path.resolve(process.cwd(), "config.rules.jsonc");

interface RulesConfig {
  scraper?: {
    outputFile?: string;
  };
}

function loadConfig(): RulesConfig {
  const raw = fs.readFileSync(CONFIG_FILE, "utf8");
  return JSON.parse(stripJsonComments(raw)) as RulesConfig;
}

const config = loadConfig();
const OUTPUT_FILE = path.resolve(
  process.cwd(),
  config.scraper?.outputFile ?? ".scrapedrules.json",
);

scrapeAllRules()
  .then((rules) => {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(rules, null, 2), "utf8");
    console.log(`Scraped ${rules.length} rules → ${OUTPUT_FILE}`);
  })
  .catch((err: Error) => {
    console.error(err.message);
    process.exit(1);
  });
