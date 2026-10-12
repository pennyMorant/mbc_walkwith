// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'reader_assist_settings_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(ReaderAssistSettingsNotifier)
final readerAssistSettingsProvider = ReaderAssistSettingsNotifierProvider._();

final class ReaderAssistSettingsNotifierProvider
    extends
        $NotifierProvider<ReaderAssistSettingsNotifier, ReaderAssistSettings> {
  ReaderAssistSettingsNotifierProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'readerAssistSettingsProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$readerAssistSettingsNotifierHash();

  @$internal
  @override
  ReaderAssistSettingsNotifier create() => ReaderAssistSettingsNotifier();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ReaderAssistSettings value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ReaderAssistSettings>(value),
    );
  }
}

String _$readerAssistSettingsNotifierHash() =>
    r'd4596d3d7503b51123800226abfa6c27b4cc999b';

abstract class _$ReaderAssistSettingsNotifier
    extends $Notifier<ReaderAssistSettings> {
  ReaderAssistSettings build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<ReaderAssistSettings, ReaderAssistSettings>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<ReaderAssistSettings, ReaderAssistSettings>,
              ReaderAssistSettings,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
