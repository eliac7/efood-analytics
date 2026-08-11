import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fetchAllOrders } from "../services/orderService.js";

interface CliOptions {
  sessionId?: string;
  outputPath?: string;
  force: boolean;
}

function readOptions(args: string[]): CliOptions {
  const options: CliOptions = { force: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--session") {
      options.sessionId = args[index + 1];
      index += 1;
    } else if (arg === "--out") {
      options.outputPath = args[index + 1];
      index += 1;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage:\n  EFOOD_SESSION_ID=<session-id> npm run download:orders --prefix backend\n\nOptions:\n  --session <id>  Session ID (prefer EFOOD_SESSION_ID instead)\n  --out <path>    Output path; defaults to data/orders-<timestamp>.json\n  --force         Allow replacing an existing output file`);
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const options = readOptions(process.argv.slice(2));
  const sessionId = options.sessionId ?? process.env.EFOOD_SESSION_ID;

  if (!sessionId) {
    throw new Error("Missing session ID. Set EFOOD_SESSION_ID or pass --session <id>.");
  }

  const defaultFilename = `orders-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const outputPath = resolve(options.outputPath ?? `data/${defaultFilename}`);

  if (!options.force && (await fileExists(outputPath))) {
    throw new Error(`Refusing to overwrite ${outputPath}. Choose another --out path or add --force.`);
  }

  console.log("Downloading order history from e-food...");
  const orders = await fetchAllOrders(sessionId.trim());

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(orders, null, 2)}\n`, "utf8");

  console.log(`Saved ${orders.length} raw orders to ${outputPath}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Could not download orders: ${message}`);
  process.exitCode = 1;
});
