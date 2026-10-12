import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/secondary_app_bar.dart';
import '../data/sermon_progress_repository.dart';
import '../data/sermons_repository.dart';
import '../domain/sermon.dart';
import 'widgets/sermon_error_view.dart';
import 'widgets/sermon_detail_cards.dart';
import 'widgets/sermon_discussion_guide_section.dart';
import 'widgets/sermon_loading_view.dart';
import 'widgets/sermon_outline_list.dart';
import 'widgets/sermon_player_panel.dart';
import 'widgets/sermon_reference_list.dart';
import 'widgets/sermon_transcript_card.dart';

class SermonDetailPage extends ConsumerStatefulWidget {
  const SermonDetailPage({super.key, required this.sermonId});

  final String sermonId;

  @override
  ConsumerState<SermonDetailPage> createState() => _SermonDetailPageState();
}

class _SermonDetailPageState extends ConsumerState<SermonDetailPage> {
  double _progress = 0;
  double _speed = 1;

  @override
  void initState() {
    super.initState();
    _speed = ref.read(sermonProgressRepositoryProvider).savedSpeed();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final sermonAsync = ref.watch(sermonByIdProvider(widget.sermonId));

    return Scaffold(
      appBar: SecondaryAppBar(title: l10n.sermonDetailTitle, onBack: _goBack),
      body: sermonAsync.when(
        loading: () => const SermonLoadingView(),
        error: (error, stackTrace) => SermonErrorView(
          onRetry: () => ref.invalidate(sermonByIdProvider(widget.sermonId)),
        ),
        data: (sermon) {
          if (sermon == null) {
            return SermonErrorView(
              onRetry: () =>
                  ref.invalidate(sermonByIdProvider(widget.sermonId)),
            );
          }
          return _SermonDetailContent(
            sermon: sermon,
            progress: _effectiveProgress(sermon),
            speed: _speed,
            onProgressChanged: (value) {
              _saveProgress(sermon: sermon, progress: value);
              setState(() {
                _progress = value;
              });
            },
            onSpeedPressed: () => _showSpeedSheet(context),
            onReferenceSelected: _openReference,
          );
        },
      ),
    );
  }

  void _setSpeed(double nextSpeed) {
    setState(() {
      _speed = nextSpeed;
    });
    unawaited(ref.read(sermonProgressRepositoryProvider).saveSpeed(nextSpeed));
  }

  double _effectiveProgress(Sermon sermon) {
    if (_progress > 0) {
      return _progress;
    }
    return ref
        .read(sermonProgressRepositoryProvider)
        .savedProgress(sermonId: sermon.id, duration: sermon.duration);
  }

  void _saveProgress({required Sermon sermon, required double progress}) {
    if (!sermon.hasAudio || sermon.duration <= Duration.zero) {
      return;
    }
    final position = Duration(
      milliseconds: (sermon.duration.inMilliseconds * progress.clamp(0, 1))
          .round(),
    );
    final repository = ref.read(sermonProgressRepositoryProvider);
    if (position >= sermon.duration - const Duration(seconds: 15)) {
      unawaited(repository.clearPosition(sermon.id));
      return;
    }
    unawaited(repository.savePosition(sermonId: sermon.id, position: position));
  }

  void _openReference(SermonReference reference) {
    context.pushNamed(
      AppRouteNames.studyReader,
      pathParameters: {
        'bookId': reference.bookId,
        'chapter': '${reference.chapter}',
      },
      queryParameters: {'verseId': reference.verseId},
    );
  }

  void _showSpeedSheet(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.sermonPlaybackSpeedTitle,
                style: Theme.of(context).textTheme.titleMedium
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  for (final speed in const [1.0, 1.25, 1.5, 2.0])
                    ChoiceChip(
                      label: Text(_speedLabel(speed)),
                      selected: _speed == speed,
                      onSelected: (_) {
                        _setSpeed(speed);
                        Navigator.of(context).pop();
                      },
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _goBack() {
    if (context.canPop()) {
      context.pop();
      return;
    }
    context.goNamed(AppRouteNames.sermons);
  }
}

class _SermonDetailContent extends StatefulWidget {
  const _SermonDetailContent({
    required this.sermon,
    required this.progress,
    required this.speed,
    required this.onProgressChanged,
    required this.onSpeedPressed,
    required this.onReferenceSelected,
  });

  final Sermon sermon;
  final double progress;
  final double speed;
  final ValueChanged<double> onProgressChanged;
  final VoidCallback onSpeedPressed;
  final ValueChanged<SermonReference> onReferenceSelected;

  @override
  State<_SermonDetailContent> createState() => _SermonDetailContentState();
}

class _SermonDetailContentState extends State<_SermonDetailContent> {
  _SermonDetailSection _selectedSection = _SermonDetailSection.notes;

  @override
  Widget build(BuildContext context) {
    final sections = _availableSections(widget.sermon);
    final effectiveSection = sections.isEmpty
        ? null
        : sections.contains(_selectedSection)
        ? _selectedSection
        : sections.first;

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
            child: SermonHeaderCard(sermon: widget.sermon),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
            child: SermonPlayerPanel(
              sermon: widget.sermon,
              progress: widget.progress,
              speed: widget.speed,
              onProgressChanged: widget.onProgressChanged,
              onSpeedPressed: widget.onSpeedPressed,
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: SermonDiscussionGuideSection(sermonId: widget.sermon.id),
        ),
        if (sections.length > 1 && effectiveSection != null)
          SliverToBoxAdapter(
            child: _SermonSectionSelector(
              sections: sections,
              selectedSection: effectiveSection,
              onChanged: (section) =>
                  setState(() => _selectedSection = section),
            ),
          ),
        if (effectiveSection != null)
          ..._sectionSlivers(context, effectiveSection),
        const SliverToBoxAdapter(child: SizedBox(height: 24)),
      ],
    );
  }

  List<_SermonDetailSection> _availableSections(Sermon sermon) {
    return [
      if (sermon.summary.trim().isNotEmpty || sermon.outline.isNotEmpty)
        _SermonDetailSection.notes,
      if (sermon.references.isNotEmpty) _SermonDetailSection.references,
      if (sermon.transcript?.isNotEmpty ?? false)
        _SermonDetailSection.transcript,
    ];
  }

  List<Widget> _sectionSlivers(
    BuildContext context,
    _SermonDetailSection selectedSection,
  ) {
    switch (selectedSection) {
      case _SermonDetailSection.notes:
        return [
          if (widget.sermon.summary.trim().isNotEmpty)
            SliverToBoxAdapter(child: SermonSummaryCard(sermon: widget.sermon)),
          if (widget.sermon.outline.isNotEmpty)
            SliverToBoxAdapter(child: SermonOutlineList(sermon: widget.sermon)),
        ];
      case _SermonDetailSection.references:
        return [
          SliverToBoxAdapter(
            child: SermonReferenceList(
              sermon: widget.sermon,
              onReferenceSelected: widget.onReferenceSelected,
            ),
          ),
        ];
      case _SermonDetailSection.transcript:
        return [
          SliverToBoxAdapter(
            child: SermonTranscriptCard(sermon: widget.sermon),
          ),
        ];
    }
  }
}

enum _SermonDetailSection { notes, references, transcript }

class _SermonSectionSelector extends StatelessWidget {
  const _SermonSectionSelector({
    required this.sections,
    required this.selectedSection,
    required this.onChanged,
  });

  final List<_SermonDetailSection> sections;
  final _SermonDetailSection selectedSection;
  final ValueChanged<_SermonDetailSection> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
      child: SegmentedButton<_SermonDetailSection>(
        segments: [
          for (final section in sections)
            ButtonSegment<_SermonDetailSection>(
              value: section,
              label: Text(_sectionLabel(context, section)),
              icon: Icon(_sectionIcon(section)),
            ),
        ],
        selected: {selectedSection},
        showSelectedIcon: false,
        onSelectionChanged: (selection) {
          if (selection.isNotEmpty) {
            onChanged(selection.first);
          }
        },
      ),
    );
  }

  String _sectionLabel(BuildContext context, _SermonDetailSection section) {
    final l10n = AppLocalizations.of(context)!;
    return switch (section) {
      _SermonDetailSection.notes => l10n.sermonSectionNotesLabel,
      _SermonDetailSection.references => l10n.sermonSectionReferencesLabel,
      _SermonDetailSection.transcript => l10n.sermonSectionTranscriptLabel,
    };
  }

  IconData _sectionIcon(_SermonDetailSection section) {
    return switch (section) {
      _SermonDetailSection.notes => Icons.notes_outlined,
      _SermonDetailSection.references => Icons.menu_book_outlined,
      _SermonDetailSection.transcript => Icons.article_outlined,
    };
  }
}

String _speedLabel(double speed) {
  return '${speed.toStringAsFixed(speed == 1 ? 0 : 2)}x';
}
