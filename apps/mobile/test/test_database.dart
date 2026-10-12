import 'package:drift/drift.dart';
import 'package:drift_sqflite/drift_sqflite.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

bool _isSqfliteFfiReady = false;

QueryExecutor openTestDatabaseConnection() {
  if (!_isSqfliteFfiReady) {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
    _isSqfliteFfiReady = true;
  }
  return SqfliteQueryExecutor(
    path: inMemoryDatabasePath,
    singleInstance: false,
  );
}
