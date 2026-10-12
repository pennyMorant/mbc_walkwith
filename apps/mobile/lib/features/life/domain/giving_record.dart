class GivingTransaction {
  const GivingTransaction({
    required this.id,
    required this.amountCents,
    required this.currency,
    required this.category,
    required this.status,
    required this.givenAt,
  });

  final String id;
  final int amountCents;
  final String currency;
  final String category;
  final String status;
  final DateTime givenAt;
}

class GivingStatement {
  const GivingStatement({
    required this.id,
    required this.taxYear,
    required this.totalAmountCents,
    required this.currency,
    required this.status,
    required this.generatedAt,
  });

  final String id;
  final int taxYear;
  final int totalAmountCents;
  final String currency;
  final String status;
  final DateTime? generatedAt;
}

class GivingSummary {
  const GivingSummary({
    required this.year,
    required this.totalAmountCents,
    required this.transactionCount,
    required this.currency,
  });

  final int year;
  final int totalAmountCents;
  final int transactionCount;
  final String currency;
}

class GivingOverview {
  const GivingOverview({
    required this.transactions,
    required this.summary,
    required this.statements,
  });

  final List<GivingTransaction> transactions;
  final GivingSummary summary;
  final List<GivingStatement> statements;
}

class GivingFund {
  const GivingFund({
    required this.id,
    required this.code,
    required this.name,
    required this.description,
    required this.status,
    required this.targetAmountCents,
    required this.displayOrder,
  });

  final String id;
  final String code;
  final String name;
  final String description;
  final String status;
  final int? targetAmountCents;
  final int displayOrder;
}

class GivingCheckoutSession {
  const GivingCheckoutSession({
    required this.checkoutSessionId,
    required this.checkoutUrl,
    required this.transactionId,
  });

  final String checkoutSessionId;
  final String checkoutUrl;
  final String transactionId;
}

class GivingStatementExport {
  const GivingStatementExport({
    required this.filename,
    required this.contentType,
    required this.csv,
    this.pdfBase64,
  });

  final String filename;
  final String contentType;
  final String csv;
  final String? pdfBase64;
}
