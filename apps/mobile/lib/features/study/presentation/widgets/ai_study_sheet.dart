import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/ai/ai_locale.dart';
import '../../../../core/ai/ai_request_contract.dart';
import '../../../../core/ai/member_ai_request_guard.dart';
import '../../../../core/ai/member_ai_study_response.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../shared/utils/ai_error_messages.dart';
import '../../../../shared/widgets/ai_info_panel.dart';
import '../../../../shared/widgets/app_markdown_body.dart';
import '../../../../shared/widgets/filled_text_field.dart';
import '../../../member_auth/data/member_session_repository.dart';
import '../../data/ai_study_repository.dart';
import '../../domain/bible_book.dart';
import '../../domain/bible_translation.dart';
import '../../domain/bible_verse.dart';

class AiStudySheet extends ConsumerStatefulWidget {
  const AiStudySheet({
    super.key,
    required this.book,
    required this.chapter,
    required this.verse,
    required this.translation,
  });

  final BibleBook book;
  final int chapter;
  final BibleVerse verse;
  final BibleTranslation translation;

  @override
  ConsumerState<AiStudySheet> createState() => _AiStudySheetState();
}

class _AiStudySheetState extends ConsumerState<AiStudySheet> {
  final _questionController = TextEditingController();
  final _requestGuard = MemberAiRequestGuard();
  MemberAiStudyResponse? _response;
  Object? _error;
  bool _loading = false;
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) {
      return;
    }
    _initialized = true;
    _questionController.text = AppLocalizations.of(
      context,
    )!.aiStudyDefaultQuestion;
  }

  @override
  void dispose() {
    _requestGuard.invalidate();
    _questionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final sessionAsync = ref.watch(memberSessionProvider);
    final session = sessionAsync.maybeWhen(
      data: (session) => session,
      orElse: () => null,
    );
    if (session != null) {
      _requestGuard.seedMember(session.member.id);
    }
    ref.listen(memberSessionProvider, (_, next) {
      next.whenData(_handleMemberSession);
    });

    return SafeArea(
      top: false,
      child: DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.78,
        minChildSize: 0.5,
        maxChildSize: 0.94,
        builder: (context, controller) {
          return ListView(
            controller: controller,
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            padding: EdgeInsets.fromLTRB(20, 0, 20, 28 + bottomInset),
            children: [
              Text(
                l10n.aiStudySheetTitle,
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Text(
                _reference,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                  color: Theme.of(context).colorScheme.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 12),
              Text(widget.verse.text),
              const SizedBox(height: 18),
              AppFilledTextField(
                controller: _questionController,
                minLines: 2,
                maxLines: 4,
                maxLength: aiQuestionMaxLength,
                hintText: l10n.aiStudyQuestionLabel,
                onChanged: _handleQuestionChanged,
              ),
              const SizedBox(height: 12),
              if (sessionAsync.isLoading)
                const LinearProgressIndicator()
              else if (session == null)
                AiInfoPanel(
                  icon: Icons.lock_outline,
                  title: l10n.aiStudySignInTitle,
                  body: l10n.aiStudySignInBody,
                )
              else ...[
                FilledButton.icon(
                  onPressed: _loading || _questionController.text.trim().isEmpty
                      ? null
                      : () => _ask(session),
                  icon: _loading
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.auto_awesome),
                  label: Text(
                    _response == null
                        ? l10n.aiStudyGenerateAction
                        : l10n.aiStudyRetryAction,
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  AiInfoPanel(
                    icon: Icons.error_outline,
                    title: l10n.aiStudyErrorTitle,
                    body: aiUserFacingErrorMessage(l10n, _error!),
                    isError: true,
                  ),
                ],
                if (_response != null) ...[
                  const SizedBox(height: 18),
                  Text(
                    l10n.aiStudyResultTitle,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  AppMarkdownBody(data: _response!.markdown),
                  const SizedBox(height: 14),
                  Text(
                    _response!.safetyNotice.isEmpty
                        ? l10n.aiStudyDisclaimer
                        : _response!.safetyNotice,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ],
          );
        },
      ),
    );
  }

  Future<void> _ask(MemberSession session) async {
    final question = _questionController.text;
    if (question.trim().isEmpty) {
      return;
    }

    final serial = _requestGuard.beginRequest();
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final response = await ref
          .read(aiStudyRepositoryProvider)
          .createBibleStudyHelp(
            session: session,
            book: widget.book,
            chapter: widget.chapter,
            verse: widget.verse,
            translation: widget.translation,
            locale: aiLocaleFor(Localizations.localeOf(context)),
            question: question,
          );
      if (!mounted || !_requestGuard.isCurrentRequest(serial)) {
        return;
      }
      if (!_requestGuard.matchesQuestion(question, _questionController.text)) {
        setState(() => _loading = false);
        return;
      }
      setState(() {
        _response = response;
        _loading = false;
      });
    } catch (error) {
      if (!mounted || !_requestGuard.isCurrentRequest(serial)) {
        return;
      }
      if (!_requestGuard.matchesQuestion(question, _questionController.text)) {
        setState(() => _loading = false);
        return;
      }
      setState(() {
        _error = error;
        _loading = false;
      });
    }
  }

  void _handleQuestionChanged(String _) {
    setState(() {
      _response = null;
      _error = null;
    });
  }

  void _handleMemberSession(MemberSession? session) {
    if (!_requestGuard.observeMember(session?.member.id)) {
      return;
    }
    if (!mounted) {
      return;
    }
    setState(() {
      _response = null;
      _error = null;
      _loading = false;
    });
  }

  String get _reference {
    final bookName = widget.translation.usesEnglishNames
        ? widget.book.nameEn
        : widget.book.nameZh;
    return '$bookName ${widget.chapter}:${widget.verse.number}';
  }
}
