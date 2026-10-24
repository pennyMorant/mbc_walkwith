import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import 'verse_annotation_header.dart';

class VerseAnnotationSheetFrame extends StatelessWidget {
  const VerseAnnotationSheetFrame({
    super.key,
    required this.verseNumber,
    required this.initialTabIndex,
    required this.myNoteTab,
    required this.churchNotesTab,
    this.onOpenLexicon,
  });

  final int verseNumber;
  final int initialTabIndex;
  final Widget myNoteTab;
  final Widget churchNotesTab;
  final VoidCallback? onOpenLexicon;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final mediaQuery = MediaQuery.of(context);
    final bottomPadding = mediaQuery.padding.bottom;
    final keyboardInset = mediaQuery.viewInsets.bottom;
    final preferredHeight = mediaQuery.size.height * 0.85;
    final availableHeight =
        (mediaQuery.size.height - keyboardInset - mediaQuery.padding.top - 8)
            .clamp(0.0, mediaQuery.size.height)
            .toDouble();
    final sheetHeight = preferredHeight.clamp(0.0, availableHeight).toDouble();

    return AnimatedPadding(
      duration: const Duration(milliseconds: 180),
      curve: Curves.easeOutCubic,
      padding: EdgeInsets.only(bottom: keyboardInset),
      child: SafeArea(
        top: false,
        child: AnimatedContainer(
          key: const ValueKey('verse-annotation-sheet-content'),
          duration: const Duration(milliseconds: 180),
          curve: Curves.easeOutCubic,
          height: sheetHeight,
          child: DefaultTabController(
            length: 2,
            initialIndex: initialTabIndex,
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, 8, 20, 20 + bottomPadding),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  VerseAnnotationHeader(
                    verseNumber: verseNumber,
                    onOpenLexicon: onOpenLexicon,
                  ),
                  const SizedBox(height: 12),
                  TabBar(
                    tabs: [
                      Tab(text: l10n.verseNotesMyNotesTab),
                      Tab(text: l10n.verseNotesChurchNotesTab),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: TabBarView(children: [myNoteTab, churchNotesTab]),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
