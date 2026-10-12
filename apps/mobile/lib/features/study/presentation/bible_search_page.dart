import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_skeleton.dart';
import '../../../shared/widgets/filled_text_field.dart';
import '../../../shared/widgets/secondary_app_bar.dart';
import '../data/study_repository.dart';
import '../domain/bible_search_result.dart';
import '../domain/bible_translation.dart';

class BibleSearchPage extends ConsumerStatefulWidget {
  const BibleSearchPage({super.key});

  @override
  ConsumerState<BibleSearchPage> createState() => _BibleSearchPageState();
}

class _BibleSearchPageState extends ConsumerState<BibleSearchPage> {
  final _controller = TextEditingController();
  Timer? _debounceTimer;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _controller.addListener(_scheduleSearch);
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final translation = BibleTranslation.fromLocale(
      Localizations.localeOf(context),
    );
    final searchQuery = _query.trim();
    final resultsAsync = searchQuery.length >= 2
        ? ref.watch(
            bibleSearchProvider(
              BibleSearchRequest(
                query: searchQuery,
                translationId: translation.id,
              ),
            ),
          )
        : null;

    return Scaffold(
      appBar: SecondaryAppBar(title: l10n.bibleSearchTitle),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
            child: TextField(
              controller: _controller,
              autofocus: true,
              textInputAction: TextInputAction.search,
              decoration: appFilledInputDecoration(
                context,
                hintText: l10n.bibleSearchHint,
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _controller.text.isEmpty
                    ? null
                    : IconButton(
                        tooltip: MaterialLocalizations.of(
                          context,
                        ).deleteButtonTooltip,
                        onPressed: _controller.clear,
                        icon: const Icon(Icons.close),
                      ),
              ),
            ),
          ),
          Expanded(
            child: _SearchResultsView(
              query: searchQuery,
              resultsAsync: resultsAsync,
              onResultSelected: _openResult,
            ),
          ),
        ],
      ),
    );
  }

  void _scheduleSearch() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 240), () {
      if (!mounted) {
        return;
      }
      setState(() {
        _query = _controller.text;
      });
    });
  }

  void _openResult(BibleSearchResult result) {
    context.pushNamed(
      AppRouteNames.studyReader,
      pathParameters: {'bookId': result.bookId, 'chapter': '${result.chapter}'},
      queryParameters: {'verseId': result.verseId},
    );
  }
}

class _SearchResultsView extends StatelessWidget {
  const _SearchResultsView({
    required this.query,
    required this.resultsAsync,
    required this.onResultSelected,
  });

  final String query;
  final AsyncValue<List<BibleSearchResult>>? resultsAsync;
  final ValueChanged<BibleSearchResult> onResultSelected;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    if (query.length < 2) {
      return _SearchInfoView(
        icon: Icons.manage_search,
        title: l10n.bibleSearchStartTitle,
        body: l10n.bibleSearchStartBody,
      );
    }

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      layoutBuilder: (currentChild, previousChildren) {
        return currentChild ?? const SizedBox.shrink();
      },
      child: resultsAsync!.when(
        loading: () =>
            const _SearchLoadingList(key: ValueKey('search-loading')),
        error: (error, stackTrace) => _SearchInfoView(
          key: const ValueKey('search-error'),
          icon: Icons.search_off,
          title: l10n.bibleSearchErrorTitle,
          body: '$error',
        ),
        data: (results) {
          if (results.isEmpty) {
            return _SearchInfoView(
              key: const ValueKey('search-empty'),
              icon: Icons.search_off,
              title: l10n.bibleSearchNoResultsTitle,
              body: l10n.bibleSearchNoResultsBody,
            );
          }

          return ListView.separated(
            key: const ValueKey('search-results'),
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
            itemBuilder: (context, index) {
              final result = results[index];
              return _SearchResultTile(
                result: result,
                onTap: () => onResultSelected(result),
              );
            },
            separatorBuilder: (context, index) => const SizedBox(height: 8),
            itemCount: results.length,
          );
        },
      ),
    );
  }
}

class _SearchLoadingList extends StatelessWidget {
  const _SearchLoadingList({super.key});

  @override
  Widget build(BuildContext context) {
    return AppSkeletonGroup(
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
        itemBuilder: (context, index) => const _SearchResultSkeleton(),
        separatorBuilder: (context, index) => const SizedBox(height: 8),
        itemCount: 7,
      ),
    );
  }
}

class _SearchResultSkeleton extends StatelessWidget {
  const _SearchResultSkeleton();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Material(
      color: colorScheme.surfaceContainerHighest,
      borderRadius: BorderRadius.circular(18),
      child: const Padding(
        padding: EdgeInsets.fromLTRB(14, 12, 14, 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AppSkeletonBox(width: 96, height: 18, borderRadius: 8),
            SizedBox(height: 12),
            AppSkeletonBox(width: double.infinity, height: 16, borderRadius: 8),
            SizedBox(height: 8),
            AppSkeletonBox(width: 230, height: 16, borderRadius: 8),
          ],
        ),
      ),
    );
  }
}

class _SearchResultTile extends StatelessWidget {
  const _SearchResultTile({required this.result, required this.onTap});

  final BibleSearchResult result;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Material(
      color: colorScheme.surfaceContainerHighest,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                result.reference,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: colorScheme.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                result.text,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(height: 1.45),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SearchInfoView extends StatelessWidget {
  const _SearchInfoView({
    super.key,
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 38, color: colorScheme.onSurfaceVariant),
            const SizedBox(height: 14),
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              body,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
