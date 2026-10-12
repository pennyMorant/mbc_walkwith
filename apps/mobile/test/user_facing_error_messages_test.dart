import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_error.dart';
import 'package:mbc_walkwith/features/life/presentation/event_check_in_error_message.dart';
import 'package:mbc_walkwith/l10n/app_localizations_en.dart';
import 'package:mbc_walkwith/shared/utils/ai_error_messages.dart';

void main() {
  final l10n = AppLocalizationsEn();

  test('event check-in errors do not expose raw exception strings', () {
    expect(
      eventCheckInErrorMessage(l10n, StateError('scanner failed')),
      l10n.eventRegistrationUnavailable,
    );
    expect(
      eventCheckInErrorMessage(l10n, StateError('scanner failed')),
      isNot(contains('StateError')),
    );
  });

  test('event check-in API errors keep mapped user-facing messages', () {
    expect(
      eventCheckInErrorMessage(
        l10n,
        const ApiError(
          message: 'Raw backend message',
          code: 'event_check_in_code_invalid',
        ),
      ),
      l10n.eventCheckInQrInvalid,
    );
  });

  test('AI errors do not expose raw exception strings', () {
    expect(
      aiUserFacingErrorMessage(l10n, StateError('provider crashed')),
      l10n.aiStudyProviderFailed,
    );
    expect(
      aiUserFacingErrorMessage(l10n, StateError('provider crashed')),
      isNot(contains('StateError')),
    );
  });

  test('AI API errors keep mapped user-facing messages', () {
    expect(
      aiUserFacingErrorMessage(
        l10n,
        const ApiError(message: 'Too many requests', code: 'ai_rate_limited'),
      ),
      l10n.aiStudyRateLimited,
    );
  });
}
