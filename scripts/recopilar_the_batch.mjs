#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const THE_BATCH_URL = "https://www.deeplearning.ai/the-batch";

const ISSUE_RE = /^issue-(\d+)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function issueNumber(post) {
  const candidates = [post.slug, ...(post.tags || []).map((tag) => tag.slug)];
  for (const candidate of candidates) {
    const match = ISSUE_RE.exec(candidate || "");
    if (match) return Number(match[1]);
  }
  return null;
}

export function parseTheBatchHomepage(html) {
  const match = html.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!match) {
    throw new Error("La portada no contiene el bloque estructurado __NEXT_DATA__");
  }

  const pageData = JSON.parse(match[1]);
  const posts = pageData?.props?.pageProps?.posts;
  if (!Array.isArray(posts)) {
    throw new Error("__NEXT_DATA__ no contiene props.pageProps.posts");
  }

  const issues = posts.flatMap((post) => {
    const number = issueNumber(post);
    const publishedAt = Date.parse(post.published_at);
    if (!number || !post.slug || !post.title || !Number.isFinite(publishedAt)) return [];
    return [
      {
        issue: number,
        title: post.title,
        url: new URL(`/the-batch/${post.slug}`, THE_BATCH_URL).href,
        published_at: new Date(publishedAt).toISOString(),
        publication_date: new Date(publishedAt).toISOString().slice(0, 10),
      },
    ];
  });

  if (issues.length === 0) {
    throw new Error("La portada no enumera ediciones válidas de The Batch");
  }
  return issues;
}

function utcDay(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function evaluateTheBatch(issues, { asOf, maxAgeDays = 14 }) {
  if (!DATE_RE.test(asOf)) throw new Error("asOf debe usar YYYY-MM-DD");
  if (!Number.isInteger(maxAgeDays) || maxAgeDays < 0) {
    throw new Error("maxAgeDays debe ser un entero no negativo");
  }

  const ordered = [...issues].sort(
    (left, right) =>
      Date.parse(right.published_at) - Date.parse(left.published_at) ||
      right.issue - left.issue,
  );
  const latest = ordered[0];
  const cutoff = new Date(`${asOf}T00:00:00.000Z`);
  const publication = new Date(`${latest.publication_date}T00:00:00.000Z`);
  const ageDays = Math.round((utcDay(cutoff) - utcDay(publication)) / 86_400_000);
  const highestIssue = Math.max(...ordered.map((issue) => issue.issue));
  const duplicatedIssueWithDifferentDates = ordered.some((issue, index) =>
    ordered.some(
      (other, otherIndex) =>
        otherIndex !== index &&
        other.issue === issue.issue &&
        other.publication_date !== issue.publication_date,
    ),
  );
  const inconsistent =
    ageDays < 0 || highestIssue !== latest.issue || duplicatedIssueWithDifferentDates;
  const status = inconsistent
    ? "inconsistente"
    : ageDays > maxAgeDays
      ? "desactualizada"
      : "actualizada";

  return {
    source: "The Batch",
    mechanism: "portada canónica → __NEXT_DATA__.props.pageProps.posts",
    canonical_url: THE_BATCH_URL,
    cutoff_date: asOf,
    max_age_days: maxAgeDays,
    status,
    eligible_for_signal: status === "actualizada",
    latest: { ...latest, age_days: ageDays },
    evidence: {
      issues_considered: ordered.length,
      highest_issue: highestIssue,
      issue_numbers: ordered.map((issue) => issue.issue),
    },
  };
}

function parseArguments(argv) {
  const options = {
    input: null,
    asOf: new Date().toISOString().slice(0, 10),
    maxAgeDays: 14,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--input") options.input = argv[++index];
    else if (argument === "--as-of") options.asOf = argv[++index];
    else if (argument === "--max-age-days") options.maxAgeDays = Number(argv[++index]);
    else throw new Error(`Argumento desconocido: ${argument}`);
  }
  return options;
}

async function loadHomepage(input) {
  if (input) return readFile(input, "utf8");
  const response = await fetch(THE_BATCH_URL, {
    headers: { accept: "text/html", "user-agent": "AI-Radar/1.0" },
  });
  if (!response.ok) {
    throw new Error(`The Batch respondió HTTP ${response.status}`);
  }
  return response.text();
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    const issues = parseTheBatchHomepage(await loadHomepage(options.input));
    const result = evaluateTheBatch(issues, options);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" })}\n`,
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
