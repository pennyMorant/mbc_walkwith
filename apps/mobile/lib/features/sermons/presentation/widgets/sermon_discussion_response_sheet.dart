import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/filled_text_field.dart';
import '../../data/sermon_discussion_guide_repository.dart';
import '../../domain/sermon_discussion_guide.dart';

class SermonDiscussionResponseSheet extends ConsumerStatefulWidget {
  const SermonDiscussionResponseSheet({super.key, required this.guide});

  final SermonDiscussionGuide guide;

  @override
  ConsumerState<SermonDiscussionResponseSheet> createState() {
    return _SermonDiscussionResponseSheetState();
  }
}

class _SermonDiscussionResponseSheetState
    extends ConsumerState<SermonDiscussionResponseSheet> {
  final _controller = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    return SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, 0, 20, 20 + bottomInset),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.sermonDiscussionResponseTitle,
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              l10n.sermonDiscussionResponsePrivateNote,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 14),
            AppFilledTextField(
              controller: _controller,
              maxLines: 5,
              minLines: 3,
              hintText: l10n.sermonDiscussionResponseHint,
            ),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerRight,
              child: AppButton(
                label: l10n.sermonDiscussionSubmitAction,
                icon: Icons.send_outlined,
                loading: _submitting,
                variant: AppButtonVariant.filled,
                onPressed: _submit,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (_submitting) {
      return;
    }
    final content = _controller.text.trim();
    if (content.isEmpty) {
      return;
    }
    setState(() => _submitting = true);
    try {
      final identity = await readSermonDiscussionIdentity(ref);
      await ref
          .read(sermonDiscussionGuideRepositoryProvider)
          .createResponse(
            guideId: widget.guide.id,
            identity: identity,
            content: content,
          );
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              AppLocalizations.of(context)!.sermonDiscussionSubmitted,
            ),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context)!.sermonDiscussionError),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }
}
