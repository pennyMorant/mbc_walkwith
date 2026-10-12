import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/player/sermon_player_session.dart';
import '../../data/player/sermon_player_session_provider.dart';
import '../../domain/sermon.dart';
import 'sermon_player_view.dart';

class SermonPlayerPanel extends ConsumerStatefulWidget {
  const SermonPlayerPanel({
    super.key,
    required this.sermon,
    required this.progress,
    required this.speed,
    required this.onProgressChanged,
    required this.onSpeedPressed,
  });

  final Sermon sermon;
  final double progress;
  final double speed;
  final ValueChanged<double> onProgressChanged;
  final VoidCallback onSpeedPressed;

  @override
  ConsumerState<SermonPlayerPanel> createState() => _SermonPlayerPanelState();
}

class _SermonPlayerPanelState extends ConsumerState<SermonPlayerPanel> {
  late final SermonPlayerSession _session;

  @override
  void initState() {
    super.initState();
    _session = ref.read(sermonPlayerSessionProvider)
      ..addListener(_handleSessionChanged);
    _syncSession();
  }

  @override
  void didUpdateWidget(covariant SermonPlayerPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.sermon.audioUrl != widget.sermon.audioUrl ||
        oldWidget.sermon.id != widget.sermon.id) {
      _syncSession();
    }
    if (oldWidget.speed != widget.speed) {
      _syncSession();
    }
  }

  @override
  void dispose() {
    _session.removeListener(_handleSessionChanged);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SermonPlayerView(
      sermon: widget.sermon,
      progress: widget.progress,
      speed: widget.speed,
      position: _session.position,
      duration: _session.effectiveDuration(widget.sermon),
      loadedUrl: _session.loadedUrl,
      loadError: _session.loadError,
      isPlaying: _session.isPlaying,
      isBuffering: _session.isBuffering,
      isLoadingSource: _session.isLoadingSource,
      onProgressChanged: widget.onProgressChanged,
      onSeekToProgress: _session.seekToProgress,
      onRetryLoad: () => _syncSession(reloadSource: true),
      onRewind: () => _session.seekRelative(const Duration(seconds: -15)),
      onForward: () => _session.seekRelative(const Duration(seconds: 30)),
      onTogglePlayback: _session.togglePlayback,
      onSpeedPressed: widget.onSpeedPressed,
    );
  }

  void _syncSession({bool reloadSource = false}) {
    Future.microtask(() {
      if (!mounted) {
        return null;
      }
      return _session.update(
        sermon: widget.sermon,
        speed: widget.speed,
        reloadSource: reloadSource,
      );
    });
  }

  void _handleSessionChanged() {
    if (mounted) {
      setState(() {});
    }
  }
}
