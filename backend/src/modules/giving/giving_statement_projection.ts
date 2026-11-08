import type {
  GivingStatement,
  GivingStatementView
} from "@mbc/api-contracts";

export function toGivingStatementView(
  statement: GivingStatement
): GivingStatementView {
  const { pdfObjectKey: _pdfObjectKey, downloadUrl: _downloadUrl, ...safe } =
    statement;
  return {
    ...safe,
    downloadAvailable: ["ready", "sent"].includes(statement.status)
  };
}
