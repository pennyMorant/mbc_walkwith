import 'dart:async';

import 'package:flutter/material.dart';

import '../domain/bible_verse.dart';

class BibleReaderScrollSession extends ChangeNotifier {
  BibleReaderScrollSession({
    required this.isMounted,
    required this.contextProvider,
    required this.readOffset,
    required this.saveOffset,
  }) {
    controller.addListener(_scheduleSaveScrollOffset);
  }

  static const _scrollOffsetKeyPrefix = 'reader_scroll_offset';

  final bool Function() isMounted;
  final BuildContext Function() contextProvider;
  final double? Function(String key) readOffset;
  final Future<void> Function(String key, double offset) saveOffset;

  final ScrollController controller = ScrollController();
  final _verseKeys = <String, GlobalKey>{};
  Timer? _saveScrollOffsetTimer;
  Timer? _clearHighlightTimer;
  String? _activeScrollOffsetKey;
  String? _restoredScrollOffsetKey;
  String? _scrolledTargetVerseId;

  String? highlightedVerseId;

  GlobalKey verseKey(String verseId) {
    return _verseKeys.putIfAbsent(verseId, GlobalKey.new);
  }

  void resetRouteState() {
    _restoredScrollOffsetKey = null;
    _scrolledTargetVerseId = null;
    highlightedVerseId = null;
    _notify();
  }

  void syncScrollOffsetKey({
    required String translationId,
    required String bookId,
    required int chapter,
  }) {
    final nextKey = '$_scrollOffsetKeyPrefix:$translationId:$bookId:$chapter';
    if (_activeScrollOffsetKey == nextKey) {
      return;
    }

    unawaited(saveCurrentScrollOffset());
    _activeScrollOffsetKey = nextKey;
    _restoredScrollOffsetKey = null;
  }

  void restoreScrollOffsetIfNeeded({
    required bool restoreScrollOffset,
    required String? targetVerseId,
  }) {
    if (!restoreScrollOffset || targetVerseId != null) {
      return;
    }

    final key = _activeScrollOffsetKey;
    if (key == null || _restoredScrollOffsetKey == key) {
      return;
    }

    _restoredScrollOffsetKey = key;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!isMounted() || !controller.hasClients) {
        return;
      }

      final savedOffset = readOffset(key);
      if (savedOffset == null || savedOffset <= 0) {
        return;
      }

      final maxOffset = controller.position.maxScrollExtent;
      final targetOffset = savedOffset.clamp(0, maxOffset).toDouble();
      if (targetOffset <= 0) {
        return;
      }

      controller.jumpTo(targetOffset);
    });
  }

  void scrollToTargetVerseIfNeeded({
    required String? targetVerseId,
    required List<BibleVerse> verses,
  }) {
    if (targetVerseId == null || _scrolledTargetVerseId == targetVerseId) {
      return;
    }

    final verseIds = verses.map((verse) => verse.id).toSet();
    _verseKeys.removeWhere((verseId, _) => !verseIds.contains(verseId));
    if (!verseIds.contains(targetVerseId)) {
      return;
    }

    _scrolledTargetVerseId = targetVerseId;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(scrollToTargetVerse(targetVerseId));
    });
  }

  Future<void> scrollToTargetVerse(String verseId) async {
    if (!isMounted()) {
      return;
    }

    final targetContext = _verseKeys[verseId]?.currentContext;
    if (targetContext == null) {
      return;
    }

    await Scrollable.ensureVisible(
      targetContext,
      duration: const Duration(milliseconds: 360),
      curve: Curves.easeOutCubic,
      alignment: 0.18,
    );

    if (!isMounted()) {
      return;
    }

    _clearHighlightTimer?.cancel();
    highlightedVerseId = verseId;
    _notify();
    _clearHighlightTimer = Timer(const Duration(seconds: 3), () {
      if (!isMounted()) {
        return;
      }
      highlightedVerseId = null;
      _notify();
    });
  }

  Future<void> saveCurrentScrollOffset() async {
    final key = _activeScrollOffsetKey;
    if (key == null || !controller.hasClients) {
      return;
    }

    await saveOffset(key, controller.offset);
  }

  int? firstVisibleVerseIndex(List<BibleVerse> verses) {
    if (!isMounted()) {
      return null;
    }

    final context = contextProvider();
    final screenHeight = MediaQuery.sizeOf(context).height;
    final topEdge = MediaQuery.paddingOf(context).top + kToolbarHeight;
    const bottomInset = 24.0;

    for (var index = 0; index < verses.length; index += 1) {
      final verseContext = _verseKeys[verses[index].id]?.currentContext;
      final renderObject = verseContext?.findRenderObject();
      if (renderObject is! RenderBox || !renderObject.hasSize) {
        continue;
      }

      final top = renderObject.localToGlobal(Offset.zero).dy;
      final bottom = top + renderObject.size.height;
      if (bottom > topEdge && top < screenHeight - bottomInset) {
        return index;
      }
    }

    return null;
  }

  Future<void> bringVerseIntoView(String verseId) async {
    if (!isMounted()) {
      return;
    }
    final targetContext = _verseKeys[verseId]?.currentContext;
    if (targetContext == null) {
      return;
    }

    await Scrollable.ensureVisible(
      targetContext,
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
      alignment: 0.28,
    );
  }

  @override
  void dispose() {
    unawaited(saveCurrentScrollOffset());
    _saveScrollOffsetTimer?.cancel();
    _clearHighlightTimer?.cancel();
    controller.dispose();
    super.dispose();
  }

  void _scheduleSaveScrollOffset() {
    _saveScrollOffsetTimer?.cancel();
    _saveScrollOffsetTimer = Timer(
      const Duration(milliseconds: 300),
      () => unawaited(saveCurrentScrollOffset()),
    );
  }

  void _notify() {
    if (isMounted()) {
      notifyListeners();
    }
  }
}
