import 'dart:async';

import 'package:dynamic_color/dynamic_color.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/settings/app_text_scale_provider.dart';
import '../features/life/presentation/push_notifications_controller.dart';
import '../l10n/app_localizations.dart';
import '../theme/app_theme.dart';
import '../theme/theme_provider.dart';
import 'app_router.dart';

class WalkWithApp extends ConsumerStatefulWidget {
  const WalkWithApp({super.key});

  @override
  ConsumerState<WalkWithApp> createState() => _WalkWithAppState();
}

class _WalkWithAppState extends ConsumerState<WalkWithApp>
    with WidgetsBindingObserver {
  final _router = createAppRouter();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(
        ref.read(pushNotificationsControllerProvider.notifier).start(_router),
      );
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      unawaited(
        ref
            .read(pushNotificationsControllerProvider.notifier)
            .refreshPermissionAndSync(),
      );
    }
  }

  @override
  void didChangeLocales(List<Locale>? locales) {
    super.didChangeLocales(locales);
    unawaited(
      ref
          .read(pushNotificationsControllerProvider.notifier)
          .syncCurrentSession(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeModeProvider);
    final textScale = ref.watch(appTextScaleProvider);

    return DynamicColorBuilder(
      builder: (lightDynamic, darkDynamic) {
        return MaterialApp.router(
          title: 'MBCG',
          debugShowCheckedModeBanner: false,
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(lightDynamic, Brightness.light),
          darkTheme: AppTheme.build(darkDynamic, Brightness.dark),
          themeMode: themeMode,
          routerConfig: _router,
          builder: (context, child) {
            final mediaQuery = MediaQuery.of(context);
            return MediaQuery(
              data: mediaQuery.copyWith(
                textScaler: textScalerForPreference(
                  textScale,
                  mediaQuery.textScaler,
                ),
              ),
              child: child ?? const SizedBox.shrink(),
            );
          },
        );
      },
    );
  }
}
