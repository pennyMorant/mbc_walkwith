import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../app/app_routes.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/utils/date_period.dart';
import '../../../shared/widgets/filled_text_field.dart';
import '../../../shared/widgets/period_picker_button.dart';
import '../../shell/widgets/shell_app_bar.dart';
import '../data/player/sermon_player_session_provider.dart';
import '../data/sermons_repository.dart';
import '../data/sermon_progress_repository.dart';
import '../domain/sermon.dart';
import '../domain/sermon_list_request.dart';
import 'sermon_filter_sheet.dart';
import 'widgets/sermon_card.dart';
import 'widgets/sermon_empty_view.dart';
import 'widgets/sermon_error_view.dart';
import 'widgets/sermon_loading_view.dart';

// Discovery remains implemented but is intentionally not exposed in the App yet.
const _showSermonDiscoveryControls = bool.fromEnvironment(
  'SHOW_SERMON_DISCOVERY_CONTROLS',
  defaultValue: false,
);

class SermonsTab extends ConsumerStatefulWidget {
  const SermonsTab({
    super.key,
    this.showDiscoveryControls = _showSermonDiscoveryControls,
  });

  final bool showDiscoveryControls;

  @override
  ConsumerState<SermonsTab> createState() => _SermonsTabState();
}

class _SermonsTabState extends ConsumerState<SermonsTab> {
  final _searchController = TextEditingController();
  Timer? _searchDebounce;
  bool _showSearch = false;
  String _searchQuery = '';
  DatePeriod _monthPeriod = DatePeriod.current(DatePeriodMode.month);
  SermonFilterSelection _filters = const SermonFilterSelection();

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  SermonListRequest get _request {
    return SermonListRequest(
      query: _searchQuery,
      speaker: _filters.speaker,
      series: _filters.series,
      topic: _filters.topic,
      from: _monthPeriod.queryFrom,
      to: _monthPeriod.queryTo,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final request = _request;
    final sermonsAsync = ref.watch(sermonsProvider(request));
    final isDiscoveryFacetsLoading =
        widget.showDiscoveryControls &&
        ref.watch(sermonDiscoveryFacetsProvider).isLoading;
    final recentPlayedSermonId = ref.watch(recentPlayedSermonIdProvider);
    final playerSession = ref.read(sermonPlayerSessionProvider);
    final selectedSermonId = playerSession.isPlaying
        ? playerSession.currentSermonId
        : recentPlayedSermonId;

    return Scaffold(
      appBar: ShellAppBar(
        title: l10n.sermonsTitle,
        actions: [
          if (widget.showDiscoveryControls) ...[
            IconButton(
              tooltip: l10n.sermonFilterTooltip,
              onPressed: isDiscoveryFacetsLoading ? null : _showFilters,
              icon: Badge.count(
                count: _filters.activeCount,
                isLabelVisible: !_filters.isEmpty,
                child: const Icon(Icons.tune),
              ),
            ),
            IconButton(
              tooltip: l10n.searchSermonsTooltip,
              onPressed: _toggleSearch,
              icon: Icon(_showSearch ? Icons.close : Icons.search),
            ),
          ],
          PeriodPickerButton(
            period: _monthPeriod,
            onChanged: _changeMonth,
            labelBuilder: _sermonMonthLabel,
          ),
        ],
      ),
      body: Column(
        children: [
          if (widget.showDiscoveryControls && _showSearch)
            _SermonSearchField(
              controller: _searchController,
              label: l10n.searchSermonsTooltip,
              onChanged: _scheduleSearch,
              onSubmitted: _applySearch,
              onClear: _clearSearch,
            ),
          if (widget.showDiscoveryControls && !_filters.isEmpty)
            SermonActiveFiltersBar(
              selection: _filters,
              onChanged: (filters) => setState(() => _filters = filters),
            ),
          Expanded(
            child: sermonsAsync.when(
              loading: () => const SermonLoadingView(),
              error: (error, stackTrace) => SermonErrorView(
                onRetry: () => ref.invalidate(sermonsProvider(request)),
              ),
              data: (sermons) {
                return _SermonsContent(
                  sermons: sermons,
                  selectedSermonId: selectedSermonId,
                  onRefresh: () => _refreshSermons(request),
                  onSermonSelected: _openSermonDetail,
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _changeMonth(DatePeriod period) {
    setState(() {
      _monthPeriod = period;
    });
  }

  void _toggleSearch() {
    setState(() {
      _showSearch = !_showSearch;
      if (!_showSearch) {
        _searchDebounce?.cancel();
        _searchController.clear();
        _searchQuery = '';
      }
    });
  }

  void _scheduleSearch(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), () {
      if (mounted) {
        _applySearch(value);
      }
    });
  }

  void _applySearch(String value) {
    final cleanQuery = value.trim();
    if (cleanQuery == _searchQuery) {
      return;
    }
    setState(() {
      _searchQuery = cleanQuery;
    });
  }

  void _clearSearch() {
    _searchDebounce?.cancel();
    _searchController.clear();
    _applySearch('');
  }

  Future<void> _showFilters() async {
    final l10n = AppLocalizations.of(context)!;
    try {
      final facets = await ref.read(sermonDiscoveryFacetsProvider.future);
      if (!mounted) {
        return;
      }
      final selection = await showSermonFilterSheet(
        context,
        facets: facets,
        initialSelection: _filters,
      );
      if (selection != null && mounted) {
        setState(() => _filters = selection);
      }
    } catch (_) {
      if (mounted) {
        ref.invalidate(sermonDiscoveryFacetsProvider);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(l10n.sermonFilterLoadError)));
      }
    }
  }

  Future<void> _refreshSermons(SermonListRequest request) async {
    ref.invalidate(sermonsProvider(request));
    await ref.read(sermonsProvider(request).future);
  }

  void _openSermonDetail(Sermon sermon) {
    context.pushNamed(
      AppRouteNames.sermonDetail,
      pathParameters: {'sermonId': sermon.id},
    );
  }
}

String _sermonMonthLabel(BuildContext context, DatePeriod period) {
  final locale = Localizations.localeOf(context).toLanguageTag();
  return DateFormat.MMM(locale).format(period.start);
}

class _SermonSearchField extends StatelessWidget {
  const _SermonSearchField({
    required this.controller,
    required this.label,
    required this.onChanged,
    required this.onSubmitted,
    required this.onClear,
  });

  final TextEditingController controller;
  final String label;
  final ValueChanged<String> onChanged;
  final ValueChanged<String> onSubmitted;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
      child: TextField(
        controller: controller,
        autofocus: true,
        textInputAction: TextInputAction.search,
        decoration: appFilledInputDecoration(
          context,
          hintText: label,
          prefixIcon: const Icon(Icons.search),
          suffixIcon: IconButton(
            tooltip: MaterialLocalizations.of(context).deleteButtonTooltip,
            onPressed: onClear,
            icon: const Icon(Icons.close),
          ),
        ),
        onChanged: onChanged,
        onSubmitted: onSubmitted,
      ),
    );
  }
}

class _SermonsContent extends StatelessWidget {
  const _SermonsContent({
    required this.sermons,
    required this.selectedSermonId,
    required this.onRefresh,
    required this.onSermonSelected,
  });

  final List<Sermon> sermons;
  final String? selectedSermonId;
  final Future<void> Function() onRefresh;
  final ValueChanged<Sermon> onSermonSelected;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator.adaptive(
      onRefresh: onRefresh,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          if (sermons.isEmpty)
            const SliverFillRemaining(
              hasScrollBody: false,
              child: SermonEmptyView(),
            )
          else
            _SermonList(
              sermons: sermons,
              selectedSermonId: selectedSermonId,
              onSermonSelected: onSermonSelected,
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }
}

class _SermonList extends StatelessWidget {
  const _SermonList({
    required this.sermons,
    required this.selectedSermonId,
    required this.onSermonSelected,
  });

  final List<Sermon> sermons;
  final String? selectedSermonId;
  final ValueChanged<Sermon> onSermonSelected;

  @override
  Widget build(BuildContext context) {
    return SliverList.separated(
      itemCount: sermons.length,
      separatorBuilder: (context, index) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: SermonCard(
            sermon: sermons[index],
            selected: sermons[index].id == selectedSermonId,
            onTap: () => onSermonSelected(sermons[index]),
            savedPosition: context.readSermonSavedPosition(sermons[index].id),
          ),
        );
      },
    );
  }
}

extension _SermonProgressContext on BuildContext {
  Duration readSermonSavedPosition(String sermonId) {
    final container = ProviderScope.containerOf(this, listen: false);
    return container
        .read(sermonProgressRepositoryProvider)
        .savedPosition(sermonId);
  }
}
