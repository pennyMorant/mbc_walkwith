class AppVersion {
  const AppVersion._();

  static const display = String.fromEnvironment(
    'APP_VERSION',
    defaultValue: '1.0.0',
  );
}
