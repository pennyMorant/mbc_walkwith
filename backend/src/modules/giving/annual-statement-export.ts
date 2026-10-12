import type { GivingRepository } from "./giving.repository.js";

export type StatementLike = NonNullable<
  Awaited<ReturnType<GivingRepository["getStatementById"]>>
>;
export type TransactionLike = Awaited<
  ReturnType<GivingRepository["listTransactions"]>
>[number];

export function buildStatementCsv(
  statement: StatementLike,
  transactions: TransactionLike[]
) {
  return [
    ["statementId", statement.id].map(csvCell).join(","),
    ["taxYear", statement.taxYear].map(csvCell).join(","),
    ["donorName", statement.donorName].map(csvCell).join(","),
    ["donorEmail", statement.donorEmail ?? ""].map(csvCell).join(","),
    ["currency", statement.currency].map(csvCell).join(","),
    ["totalAmountCents", statement.totalAmountCents].map(csvCell).join(","),
    "",
    [
      "transactionId",
      "givenAt",
      "category",
      "amountCents",
      "currency",
      "provider",
      "providerTransactionId"
    ].join(","),
    ...transactions.map((transaction) =>
      [
        transaction.id,
        transaction.givenAt,
        transaction.category,
        transaction.amountCents,
        transaction.currency,
        transaction.provider,
        transaction.providerTransactionId ?? ""
      ]
        .map(csvCell)
        .join(",")
    )
  ].join("\n");
}

export function buildAnnualStatementPdfBase64(
  statement: StatementLike,
  transactions: TransactionLike[]
) {
  const lines = [
    "Annual Giving Statement",
    `Tax Year: ${statement.taxYear}`,
    `Donor: ${statement.donorName || statement.userId || "All donors"}`,
    `Email: ${statement.donorEmail ?? ""}`,
    `Currency: ${statement.currency}`,
    `Total gifts: ${(statement.totalAmountCents / 100).toFixed(2)}`,
    "",
    "This statement lists gifts recorded by the church for the tax year.",
    "Please consult your tax advisor for deductibility questions.",
    "",
    "Transactions:",
    ...transactions.map(
      (transaction) =>
        `${transaction.givenAt.slice(0, 10)}  ${transaction.category}  ${(
          transaction.amountCents / 100
        ).toFixed(2)}  ${transaction.providerTransactionId ?? transaction.id}`
    )
  ];
  return Buffer.from(minimalPdf(lines)).toString("base64");
}

export function csvCell(value: string | number) {
  const text = String(value);
  if (!/[",\n]/.test(text)) {
    return text;
  }
  return `"${text.replaceAll('"', '""')}"`;
}

function minimalPdf(lines: string[]) {
  const pages = chunk(lines, 36);
  const pageObjectIds = pages.map((_, index) => 4 + index * 2);
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];
  for (const [index, pageLines] of pages.entries()) {
    const pageId = pageObjectIds[index]!;
    const contentId = pageId + 1;
    const content = pageContent(pageLines);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`,
      `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`
    );
  }
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${
    objects.length + 1
  } /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return pdf;
}

function pageContent(lines: string[]) {
  return [
    "BT",
    "/F1 10 Tf",
    "54 738 Td",
    ...lines.flatMap((line, index) => [
      index === 0 ? "" : "0 -18 Td",
      `(${pdfText(line)}) Tj`
    ]),
    "ET"
  ]
    .filter(Boolean)
    .join("\n");
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks.length > 0 ? chunks : [[]];
}

function pdfText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}
