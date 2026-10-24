import 'package:flutter/material.dart';

import '../../../../core/ai/ai_request_contract.dart';
import '../../../../core/ai/member_ai_study_response.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../shared/utils/ai_error_messages.dart';
import '../../../../shared/widgets/ai_info_panel.dart';
import '../../../../shared/widgets/app_markdown_body.dart';
import '../../../../shared/widgets/filled_text_field.dart';

class AiStudySheetContent extends StatelessWidget {
  const AiStudySheetContent({
    super.key,
    required this.scrollController,
    required this.questionController,
    required this.reference,
    required this.verseText,
    required this.sessionLoading,
    required this.signedIn,
    required this.loading,
    required this.response,
    required this.error,
    required this.onQuestionChanged,
    required this.onSubmit,
  });

  final ScrollController scrollController;
  final TextEditingController questionController;
  final String reference;
  final String verseText;
  final bool sessionLoading;
  final bool signedIn;
  final bool loading;
  final MemberAiStudyResponse? response;
  final Object? error;
  final ValueChanged<String> onQuestionChanged;
  final VoidCallback? onSubmit;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return ListView(
      controller: scrollController,
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
      padding: EdgeInsets.fromLTRB(20, 0, 20, 28 + bottomInset),
      children: [
        Text(
          l10n.aiStudySheetTitle,
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          reference,
          style: theme.textTheme.labelLarge?.copyWith(
            color: theme.colorScheme.primary,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 12),
        Text(verseText),
        const SizedBox(height: 18),
        AppFilledTextField(
          controller: questionController,
          minLines: 2,
          maxLines: 4,
          maxLength: aiQuestionMaxLength,
          hintText: l10n.aiStudyQuestionLabel,
          onChanged: onQuestionChanged,
        ),
        const SizedBox(height: 12),
        if (sessionLoading)
          const LinearProgressIndicator()
        else if (!signedIn)
          AiInfoPanel(
            icon: Icons.lock_outline,
            title: l10n.aiStudySignInTitle,
            body: l10n.aiStudySignInBody,
          )
        else ...[
          FilledButton.icon(
            onPressed: loading || questionController.text.trim().isEmpty
                ? null
                : onSubmit,
            icon: loading
                ? const SizedBox.square(
                    dimension: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.auto_awesome),
            label: Text(
              response == null
                  ? l10n.aiStudyGenerateAction
                  : l10n.aiStudyRetryAction,
            ),
          ),
          if (error != null) ...[
            const SizedBox(height: 12),
            AiInfoPanel(
              icon: Icons.error_outline,
              title: l10n.aiStudyErrorTitle,
              body: aiUserFacingErrorMessage(l10n, error!),
              isError: true,
            ),
          ],
          if (response != null) ...[
            const SizedBox(height: 18),
            Text(
              l10n.aiStudyResultTitle,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            AppMarkdownBody(data: response!.markdown),
            const SizedBox(height: 14),
            Text(
              response!.safetyNotice.isEmpty
                  ? l10n.aiStudyDisclaimer
                  : response!.safetyNotice,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ],
    );
  }
}
