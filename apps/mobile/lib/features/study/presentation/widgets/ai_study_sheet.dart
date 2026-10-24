import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/ai/ai_locale.dart';
import '../../../../core/ai/member_ai_request_guard.dart';
import '../../../../core/ai/member_ai_study_response.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../member_auth/data/member_session_repository.dart';
import '../../data/ai_study_repository.dart';
import '../../domain/bible_book.dart';
import '../../domain/bible_translation.dart';
import '../../domain/bible_verse.dart';
import 'ai_study_sheet_content.dart';

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
    _questionController.text = AppLocalizations.of(context)!
        .aiStudyDefaultQuestion;
  }

  @override
  void dispose() {
    _requestGuard.invalidate();
    _questionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
          return AiStudySheetContent(
            scrollController: controller,
            questionController: _questionController,
            reference: _reference,
            verseText: widget.verse.text,
            sessionLoading: sessionAsync.isLoading,
            signedIn: session != null,
            loading: _loading,
            response: _response,
            error: _error,
            onQuestionChanged: _handleQuestionChanged,
            onSubmit: session == null ? null : () => _ask(session),
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
