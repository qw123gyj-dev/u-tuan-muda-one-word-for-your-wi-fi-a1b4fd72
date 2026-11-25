// One Word for Your Wi-Fi — program/v1, Node 22, standard library only.
//
// The entry is one word describing my Wi-Fi. This program checks the
// word against the competition gate, writes it to
// $MAKEFUN_OUTPUT_DIR/entry.txt (or /output/entry.txt when the variable
// is unset), then reads the file back and proves it is byte-for-byte
// the word it meant to write.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The entry: my Wi-Fi shows full bars while nothing loads, then insists
// the problem is me. It never drops out — it lies to my face.
const ENTRY = "gaslighting";

// The gate: UTF-8 text of 1 to 20 characters, not only white space.
// The word must also be a single word: letters only, no spaces,
// no punctuation, nothing for the judge to trip over.
const MIN_CHARS = 1;
const MAX_CHARS = 20;
const SINGLE_WORD = /^[A-Za-z]+$/;

function fail(message: string): never {
  throw new Error(`entry rejected: ${message}`);
}

function validateEntry(word: string): void {
  if (word.trim().length === 0) {
    fail("must not be only white space");
  }

  if (word.length < MIN_CHARS || word.length > MAX_CHARS) {
    fail(`must be ${MIN_CHARS} to ${MAX_CHARS} characters, got ${word.length}`);
  }

  if (!SINGLE_WORD.test(word)) {
    fail("must be a single word of letters only, no spaces or punctuation");
  }

  // The gate counts characters; the leaderboard counts bytes. For this
  // plain-ASCII word they are the same number — assert it, so a future
  // edit that sneaks in a multibyte character fails loudly here instead
  // of silently changing the entry's size on the board.
  const bytes = Buffer.byteLength(word, "utf8");
  if (bytes !== word.length) {
    fail(`byte length ${bytes} differs from character length ${word.length}`);
  }
}

function resolveOutputDir(): string {
  return process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
}

function verifyWritten(target: string, expected: string): void {
  // String comparison first: what the judge reads must be what we wrote.
  const readBack = readFileSync(target, "utf8");
  if (readBack !== expected) {
    fail(`${target} does not match the entry`);
  }

  // The file on disk must pass the gate on its own merits, not just
  // match the constant — a stray byte added by the write path would
  // otherwise slip through unnoticed.
  validateEntry(readBack);

  // Then the raw bytes: no stray newline, no BOM, no trailing space
  // hiding at the end of the file.
  const onDisk = readFileSync(target);
  if (!onDisk.equals(Buffer.from(expected, "utf8"))) {
    fail(`${target} bytes do not match the entry`);
  }
}

function main(): void {
  validateEntry(ENTRY);
  console.log(`entry "${ENTRY}" is ${ENTRY.length} characters, inside the gate`);

  const folder = resolveOutputDir();
  mkdirSync(folder, { recursive: true });
  const target = join(folder, "entry.txt");
  writeFileSync(target, ENTRY, "utf8");

  verifyWritten(target, ENTRY);
  console.log(`wrote ${target} (${ENTRY.length} characters, verified)`);
  console.log(ENTRY);
}

main();
