class StudyVerseAnnotation {
  const StudyVerseAnnotation({
    required this.verseId,
    this.noteText,
    this.highlightColor,
    this.isBookmarked = false,
  });

  final String verseId;
  final String? noteText;
  final String? highlightColor;
  final bool isBookmarked;

  bool get hasNote => noteText != null && noteText!.trim().isNotEmpty;
  bool get hasHighlight => highlightColor != null && highlightColor!.isNotEmpty;

  StudyVerseAnnotation copyWith({
    String? noteText,
    String? highlightColor,
    bool? isBookmarked,
    bool clearNote = false,
    bool clearHighlight = false,
  }) {
    return StudyVerseAnnotation(
      verseId: verseId,
      noteText: clearNote ? null : noteText ?? this.noteText,
      highlightColor: clearHighlight
          ? null
          : highlightColor ?? this.highlightColor,
      isBookmarked: isBookmarked ?? this.isBookmarked,
    );
  }
}
