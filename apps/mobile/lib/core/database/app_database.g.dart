// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $LocalBibleBooksTable extends LocalBibleBooks
    with TableInfo<$LocalBibleBooksTable, LocalBibleBook> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalBibleBooksTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _testamentMeta = const VerificationMeta(
    'testament',
  );
  @override
  late final GeneratedColumn<String> testament = GeneratedColumn<String>(
    'testament',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _categoryMeta = const VerificationMeta(
    'category',
  );
  @override
  late final GeneratedColumn<String> category = GeneratedColumn<String>(
    'category',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant(''),
  );
  static const VerificationMeta _nameZhMeta = const VerificationMeta('nameZh');
  @override
  late final GeneratedColumn<String> nameZh = GeneratedColumn<String>(
    'name_zh',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameZhHantMeta = const VerificationMeta(
    'nameZhHant',
  );
  @override
  late final GeneratedColumn<String> nameZhHant = GeneratedColumn<String>(
    'name_zh_hant',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant(''),
  );
  static const VerificationMeta _nameEnMeta = const VerificationMeta('nameEn');
  @override
  late final GeneratedColumn<String> nameEn = GeneratedColumn<String>(
    'name_en',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _abbreviationZhMeta = const VerificationMeta(
    'abbreviationZh',
  );
  @override
  late final GeneratedColumn<String> abbreviationZh = GeneratedColumn<String>(
    'abbreviation_zh',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant(''),
  );
  static const VerificationMeta _abbreviationZhHantMeta =
      const VerificationMeta('abbreviationZhHant');
  @override
  late final GeneratedColumn<String> abbreviationZhHant =
      GeneratedColumn<String>(
        'abbreviation_zh_hant',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
        defaultValue: const Constant(''),
      );
  static const VerificationMeta _abbreviationEnMeta = const VerificationMeta(
    'abbreviationEn',
  );
  @override
  late final GeneratedColumn<String> abbreviationEn = GeneratedColumn<String>(
    'abbreviation_en',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant(''),
  );
  static const VerificationMeta _chapterCountMeta = const VerificationMeta(
    'chapterCount',
  );
  @override
  late final GeneratedColumn<int> chapterCount = GeneratedColumn<int>(
    'chapter_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sortOrderMeta = const VerificationMeta(
    'sortOrder',
  );
  @override
  late final GeneratedColumn<int> sortOrder = GeneratedColumn<int>(
    'sort_order',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    testament,
    category,
    nameZh,
    nameZhHant,
    nameEn,
    abbreviationZh,
    abbreviationZhHant,
    abbreviationEn,
    chapterCount,
    sortOrder,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_bible_books';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalBibleBook> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('testament')) {
      context.handle(
        _testamentMeta,
        testament.isAcceptableOrUnknown(data['testament']!, _testamentMeta),
      );
    } else if (isInserting) {
      context.missing(_testamentMeta);
    }
    if (data.containsKey('category')) {
      context.handle(
        _categoryMeta,
        category.isAcceptableOrUnknown(data['category']!, _categoryMeta),
      );
    }
    if (data.containsKey('name_zh')) {
      context.handle(
        _nameZhMeta,
        nameZh.isAcceptableOrUnknown(data['name_zh']!, _nameZhMeta),
      );
    } else if (isInserting) {
      context.missing(_nameZhMeta);
    }
    if (data.containsKey('name_zh_hant')) {
      context.handle(
        _nameZhHantMeta,
        nameZhHant.isAcceptableOrUnknown(
          data['name_zh_hant']!,
          _nameZhHantMeta,
        ),
      );
    }
    if (data.containsKey('name_en')) {
      context.handle(
        _nameEnMeta,
        nameEn.isAcceptableOrUnknown(data['name_en']!, _nameEnMeta),
      );
    } else if (isInserting) {
      context.missing(_nameEnMeta);
    }
    if (data.containsKey('abbreviation_zh')) {
      context.handle(
        _abbreviationZhMeta,
        abbreviationZh.isAcceptableOrUnknown(
          data['abbreviation_zh']!,
          _abbreviationZhMeta,
        ),
      );
    }
    if (data.containsKey('abbreviation_zh_hant')) {
      context.handle(
        _abbreviationZhHantMeta,
        abbreviationZhHant.isAcceptableOrUnknown(
          data['abbreviation_zh_hant']!,
          _abbreviationZhHantMeta,
        ),
      );
    }
    if (data.containsKey('abbreviation_en')) {
      context.handle(
        _abbreviationEnMeta,
        abbreviationEn.isAcceptableOrUnknown(
          data['abbreviation_en']!,
          _abbreviationEnMeta,
        ),
      );
    }
    if (data.containsKey('chapter_count')) {
      context.handle(
        _chapterCountMeta,
        chapterCount.isAcceptableOrUnknown(
          data['chapter_count']!,
          _chapterCountMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_chapterCountMeta);
    }
    if (data.containsKey('sort_order')) {
      context.handle(
        _sortOrderMeta,
        sortOrder.isAcceptableOrUnknown(data['sort_order']!, _sortOrderMeta),
      );
    } else if (isInserting) {
      context.missing(_sortOrderMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalBibleBook map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalBibleBook(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      testament: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}testament'],
      )!,
      category: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}category'],
      )!,
      nameZh: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name_zh'],
      )!,
      nameZhHant: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name_zh_hant'],
      )!,
      nameEn: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name_en'],
      )!,
      abbreviationZh: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}abbreviation_zh'],
      )!,
      abbreviationZhHant: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}abbreviation_zh_hant'],
      )!,
      abbreviationEn: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}abbreviation_en'],
      )!,
      chapterCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}chapter_count'],
      )!,
      sortOrder: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}sort_order'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $LocalBibleBooksTable createAlias(String alias) {
    return $LocalBibleBooksTable(attachedDatabase, alias);
  }
}

class LocalBibleBook extends DataClass implements Insertable<LocalBibleBook> {
  final String id;
  final String testament;
  final String category;
  final String nameZh;
  final String nameZhHant;
  final String nameEn;
  final String abbreviationZh;
  final String abbreviationZhHant;
  final String abbreviationEn;
  final int chapterCount;
  final int sortOrder;
  final DateTime updatedAt;
  const LocalBibleBook({
    required this.id,
    required this.testament,
    required this.category,
    required this.nameZh,
    required this.nameZhHant,
    required this.nameEn,
    required this.abbreviationZh,
    required this.abbreviationZhHant,
    required this.abbreviationEn,
    required this.chapterCount,
    required this.sortOrder,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['testament'] = Variable<String>(testament);
    map['category'] = Variable<String>(category);
    map['name_zh'] = Variable<String>(nameZh);
    map['name_zh_hant'] = Variable<String>(nameZhHant);
    map['name_en'] = Variable<String>(nameEn);
    map['abbreviation_zh'] = Variable<String>(abbreviationZh);
    map['abbreviation_zh_hant'] = Variable<String>(abbreviationZhHant);
    map['abbreviation_en'] = Variable<String>(abbreviationEn);
    map['chapter_count'] = Variable<int>(chapterCount);
    map['sort_order'] = Variable<int>(sortOrder);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  LocalBibleBooksCompanion toCompanion(bool nullToAbsent) {
    return LocalBibleBooksCompanion(
      id: Value(id),
      testament: Value(testament),
      category: Value(category),
      nameZh: Value(nameZh),
      nameZhHant: Value(nameZhHant),
      nameEn: Value(nameEn),
      abbreviationZh: Value(abbreviationZh),
      abbreviationZhHant: Value(abbreviationZhHant),
      abbreviationEn: Value(abbreviationEn),
      chapterCount: Value(chapterCount),
      sortOrder: Value(sortOrder),
      updatedAt: Value(updatedAt),
    );
  }

  factory LocalBibleBook.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalBibleBook(
      id: serializer.fromJson<String>(json['id']),
      testament: serializer.fromJson<String>(json['testament']),
      category: serializer.fromJson<String>(json['category']),
      nameZh: serializer.fromJson<String>(json['nameZh']),
      nameZhHant: serializer.fromJson<String>(json['nameZhHant']),
      nameEn: serializer.fromJson<String>(json['nameEn']),
      abbreviationZh: serializer.fromJson<String>(json['abbreviationZh']),
      abbreviationZhHant: serializer.fromJson<String>(
        json['abbreviationZhHant'],
      ),
      abbreviationEn: serializer.fromJson<String>(json['abbreviationEn']),
      chapterCount: serializer.fromJson<int>(json['chapterCount']),
      sortOrder: serializer.fromJson<int>(json['sortOrder']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'testament': serializer.toJson<String>(testament),
      'category': serializer.toJson<String>(category),
      'nameZh': serializer.toJson<String>(nameZh),
      'nameZhHant': serializer.toJson<String>(nameZhHant),
      'nameEn': serializer.toJson<String>(nameEn),
      'abbreviationZh': serializer.toJson<String>(abbreviationZh),
      'abbreviationZhHant': serializer.toJson<String>(abbreviationZhHant),
      'abbreviationEn': serializer.toJson<String>(abbreviationEn),
      'chapterCount': serializer.toJson<int>(chapterCount),
      'sortOrder': serializer.toJson<int>(sortOrder),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  LocalBibleBook copyWith({
    String? id,
    String? testament,
    String? category,
    String? nameZh,
    String? nameZhHant,
    String? nameEn,
    String? abbreviationZh,
    String? abbreviationZhHant,
    String? abbreviationEn,
    int? chapterCount,
    int? sortOrder,
    DateTime? updatedAt,
  }) => LocalBibleBook(
    id: id ?? this.id,
    testament: testament ?? this.testament,
    category: category ?? this.category,
    nameZh: nameZh ?? this.nameZh,
    nameZhHant: nameZhHant ?? this.nameZhHant,
    nameEn: nameEn ?? this.nameEn,
    abbreviationZh: abbreviationZh ?? this.abbreviationZh,
    abbreviationZhHant: abbreviationZhHant ?? this.abbreviationZhHant,
    abbreviationEn: abbreviationEn ?? this.abbreviationEn,
    chapterCount: chapterCount ?? this.chapterCount,
    sortOrder: sortOrder ?? this.sortOrder,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  LocalBibleBook copyWithCompanion(LocalBibleBooksCompanion data) {
    return LocalBibleBook(
      id: data.id.present ? data.id.value : this.id,
      testament: data.testament.present ? data.testament.value : this.testament,
      category: data.category.present ? data.category.value : this.category,
      nameZh: data.nameZh.present ? data.nameZh.value : this.nameZh,
      nameZhHant: data.nameZhHant.present
          ? data.nameZhHant.value
          : this.nameZhHant,
      nameEn: data.nameEn.present ? data.nameEn.value : this.nameEn,
      abbreviationZh: data.abbreviationZh.present
          ? data.abbreviationZh.value
          : this.abbreviationZh,
      abbreviationZhHant: data.abbreviationZhHant.present
          ? data.abbreviationZhHant.value
          : this.abbreviationZhHant,
      abbreviationEn: data.abbreviationEn.present
          ? data.abbreviationEn.value
          : this.abbreviationEn,
      chapterCount: data.chapterCount.present
          ? data.chapterCount.value
          : this.chapterCount,
      sortOrder: data.sortOrder.present ? data.sortOrder.value : this.sortOrder,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalBibleBook(')
          ..write('id: $id, ')
          ..write('testament: $testament, ')
          ..write('category: $category, ')
          ..write('nameZh: $nameZh, ')
          ..write('nameZhHant: $nameZhHant, ')
          ..write('nameEn: $nameEn, ')
          ..write('abbreviationZh: $abbreviationZh, ')
          ..write('abbreviationZhHant: $abbreviationZhHant, ')
          ..write('abbreviationEn: $abbreviationEn, ')
          ..write('chapterCount: $chapterCount, ')
          ..write('sortOrder: $sortOrder, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    testament,
    category,
    nameZh,
    nameZhHant,
    nameEn,
    abbreviationZh,
    abbreviationZhHant,
    abbreviationEn,
    chapterCount,
    sortOrder,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalBibleBook &&
          other.id == this.id &&
          other.testament == this.testament &&
          other.category == this.category &&
          other.nameZh == this.nameZh &&
          other.nameZhHant == this.nameZhHant &&
          other.nameEn == this.nameEn &&
          other.abbreviationZh == this.abbreviationZh &&
          other.abbreviationZhHant == this.abbreviationZhHant &&
          other.abbreviationEn == this.abbreviationEn &&
          other.chapterCount == this.chapterCount &&
          other.sortOrder == this.sortOrder &&
          other.updatedAt == this.updatedAt);
}

class LocalBibleBooksCompanion extends UpdateCompanion<LocalBibleBook> {
  final Value<String> id;
  final Value<String> testament;
  final Value<String> category;
  final Value<String> nameZh;
  final Value<String> nameZhHant;
  final Value<String> nameEn;
  final Value<String> abbreviationZh;
  final Value<String> abbreviationZhHant;
  final Value<String> abbreviationEn;
  final Value<int> chapterCount;
  final Value<int> sortOrder;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const LocalBibleBooksCompanion({
    this.id = const Value.absent(),
    this.testament = const Value.absent(),
    this.category = const Value.absent(),
    this.nameZh = const Value.absent(),
    this.nameZhHant = const Value.absent(),
    this.nameEn = const Value.absent(),
    this.abbreviationZh = const Value.absent(),
    this.abbreviationZhHant = const Value.absent(),
    this.abbreviationEn = const Value.absent(),
    this.chapterCount = const Value.absent(),
    this.sortOrder = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalBibleBooksCompanion.insert({
    required String id,
    required String testament,
    this.category = const Value.absent(),
    required String nameZh,
    this.nameZhHant = const Value.absent(),
    required String nameEn,
    this.abbreviationZh = const Value.absent(),
    this.abbreviationZhHant = const Value.absent(),
    this.abbreviationEn = const Value.absent(),
    required int chapterCount,
    required int sortOrder,
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       testament = Value(testament),
       nameZh = Value(nameZh),
       nameEn = Value(nameEn),
       chapterCount = Value(chapterCount),
       sortOrder = Value(sortOrder),
       updatedAt = Value(updatedAt);
  static Insertable<LocalBibleBook> custom({
    Expression<String>? id,
    Expression<String>? testament,
    Expression<String>? category,
    Expression<String>? nameZh,
    Expression<String>? nameZhHant,
    Expression<String>? nameEn,
    Expression<String>? abbreviationZh,
    Expression<String>? abbreviationZhHant,
    Expression<String>? abbreviationEn,
    Expression<int>? chapterCount,
    Expression<int>? sortOrder,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (testament != null) 'testament': testament,
      if (category != null) 'category': category,
      if (nameZh != null) 'name_zh': nameZh,
      if (nameZhHant != null) 'name_zh_hant': nameZhHant,
      if (nameEn != null) 'name_en': nameEn,
      if (abbreviationZh != null) 'abbreviation_zh': abbreviationZh,
      if (abbreviationZhHant != null)
        'abbreviation_zh_hant': abbreviationZhHant,
      if (abbreviationEn != null) 'abbreviation_en': abbreviationEn,
      if (chapterCount != null) 'chapter_count': chapterCount,
      if (sortOrder != null) 'sort_order': sortOrder,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalBibleBooksCompanion copyWith({
    Value<String>? id,
    Value<String>? testament,
    Value<String>? category,
    Value<String>? nameZh,
    Value<String>? nameZhHant,
    Value<String>? nameEn,
    Value<String>? abbreviationZh,
    Value<String>? abbreviationZhHant,
    Value<String>? abbreviationEn,
    Value<int>? chapterCount,
    Value<int>? sortOrder,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return LocalBibleBooksCompanion(
      id: id ?? this.id,
      testament: testament ?? this.testament,
      category: category ?? this.category,
      nameZh: nameZh ?? this.nameZh,
      nameZhHant: nameZhHant ?? this.nameZhHant,
      nameEn: nameEn ?? this.nameEn,
      abbreviationZh: abbreviationZh ?? this.abbreviationZh,
      abbreviationZhHant: abbreviationZhHant ?? this.abbreviationZhHant,
      abbreviationEn: abbreviationEn ?? this.abbreviationEn,
      chapterCount: chapterCount ?? this.chapterCount,
      sortOrder: sortOrder ?? this.sortOrder,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (testament.present) {
      map['testament'] = Variable<String>(testament.value);
    }
    if (category.present) {
      map['category'] = Variable<String>(category.value);
    }
    if (nameZh.present) {
      map['name_zh'] = Variable<String>(nameZh.value);
    }
    if (nameZhHant.present) {
      map['name_zh_hant'] = Variable<String>(nameZhHant.value);
    }
    if (nameEn.present) {
      map['name_en'] = Variable<String>(nameEn.value);
    }
    if (abbreviationZh.present) {
      map['abbreviation_zh'] = Variable<String>(abbreviationZh.value);
    }
    if (abbreviationZhHant.present) {
      map['abbreviation_zh_hant'] = Variable<String>(abbreviationZhHant.value);
    }
    if (abbreviationEn.present) {
      map['abbreviation_en'] = Variable<String>(abbreviationEn.value);
    }
    if (chapterCount.present) {
      map['chapter_count'] = Variable<int>(chapterCount.value);
    }
    if (sortOrder.present) {
      map['sort_order'] = Variable<int>(sortOrder.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalBibleBooksCompanion(')
          ..write('id: $id, ')
          ..write('testament: $testament, ')
          ..write('category: $category, ')
          ..write('nameZh: $nameZh, ')
          ..write('nameZhHant: $nameZhHant, ')
          ..write('nameEn: $nameEn, ')
          ..write('abbreviationZh: $abbreviationZh, ')
          ..write('abbreviationZhHant: $abbreviationZhHant, ')
          ..write('abbreviationEn: $abbreviationEn, ')
          ..write('chapterCount: $chapterCount, ')
          ..write('sortOrder: $sortOrder, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalBibleTranslationsTable extends LocalBibleTranslations
    with TableInfo<$LocalBibleTranslationsTable, LocalBibleTranslation> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalBibleTranslationsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _localeCodeMeta = const VerificationMeta(
    'localeCode',
  );
  @override
  late final GeneratedColumn<String> localeCode = GeneratedColumn<String>(
    'locale_code',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _abbreviationMeta = const VerificationMeta(
    'abbreviation',
  );
  @override
  late final GeneratedColumn<String> abbreviation = GeneratedColumn<String>(
    'abbreviation',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _copyrightStatusMeta = const VerificationMeta(
    'copyrightStatus',
  );
  @override
  late final GeneratedColumn<String> copyrightStatus = GeneratedColumn<String>(
    'copyright_status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sourceUrlMeta = const VerificationMeta(
    'sourceUrl',
  );
  @override
  late final GeneratedColumn<String> sourceUrl = GeneratedColumn<String>(
    'source_url',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    localeCode,
    name,
    abbreviation,
    copyrightStatus,
    sourceUrl,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_bible_translations';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalBibleTranslation> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('locale_code')) {
      context.handle(
        _localeCodeMeta,
        localeCode.isAcceptableOrUnknown(data['locale_code']!, _localeCodeMeta),
      );
    } else if (isInserting) {
      context.missing(_localeCodeMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('abbreviation')) {
      context.handle(
        _abbreviationMeta,
        abbreviation.isAcceptableOrUnknown(
          data['abbreviation']!,
          _abbreviationMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_abbreviationMeta);
    }
    if (data.containsKey('copyright_status')) {
      context.handle(
        _copyrightStatusMeta,
        copyrightStatus.isAcceptableOrUnknown(
          data['copyright_status']!,
          _copyrightStatusMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_copyrightStatusMeta);
    }
    if (data.containsKey('source_url')) {
      context.handle(
        _sourceUrlMeta,
        sourceUrl.isAcceptableOrUnknown(data['source_url']!, _sourceUrlMeta),
      );
    } else if (isInserting) {
      context.missing(_sourceUrlMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalBibleTranslation map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalBibleTranslation(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      localeCode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}locale_code'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      )!,
      abbreviation: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}abbreviation'],
      )!,
      copyrightStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}copyright_status'],
      )!,
      sourceUrl: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}source_url'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $LocalBibleTranslationsTable createAlias(String alias) {
    return $LocalBibleTranslationsTable(attachedDatabase, alias);
  }
}

class LocalBibleTranslation extends DataClass
    implements Insertable<LocalBibleTranslation> {
  final String id;
  final String localeCode;
  final String name;
  final String abbreviation;
  final String copyrightStatus;
  final String sourceUrl;
  final DateTime updatedAt;
  const LocalBibleTranslation({
    required this.id,
    required this.localeCode,
    required this.name,
    required this.abbreviation,
    required this.copyrightStatus,
    required this.sourceUrl,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['locale_code'] = Variable<String>(localeCode);
    map['name'] = Variable<String>(name);
    map['abbreviation'] = Variable<String>(abbreviation);
    map['copyright_status'] = Variable<String>(copyrightStatus);
    map['source_url'] = Variable<String>(sourceUrl);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  LocalBibleTranslationsCompanion toCompanion(bool nullToAbsent) {
    return LocalBibleTranslationsCompanion(
      id: Value(id),
      localeCode: Value(localeCode),
      name: Value(name),
      abbreviation: Value(abbreviation),
      copyrightStatus: Value(copyrightStatus),
      sourceUrl: Value(sourceUrl),
      updatedAt: Value(updatedAt),
    );
  }

  factory LocalBibleTranslation.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalBibleTranslation(
      id: serializer.fromJson<String>(json['id']),
      localeCode: serializer.fromJson<String>(json['localeCode']),
      name: serializer.fromJson<String>(json['name']),
      abbreviation: serializer.fromJson<String>(json['abbreviation']),
      copyrightStatus: serializer.fromJson<String>(json['copyrightStatus']),
      sourceUrl: serializer.fromJson<String>(json['sourceUrl']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'localeCode': serializer.toJson<String>(localeCode),
      'name': serializer.toJson<String>(name),
      'abbreviation': serializer.toJson<String>(abbreviation),
      'copyrightStatus': serializer.toJson<String>(copyrightStatus),
      'sourceUrl': serializer.toJson<String>(sourceUrl),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  LocalBibleTranslation copyWith({
    String? id,
    String? localeCode,
    String? name,
    String? abbreviation,
    String? copyrightStatus,
    String? sourceUrl,
    DateTime? updatedAt,
  }) => LocalBibleTranslation(
    id: id ?? this.id,
    localeCode: localeCode ?? this.localeCode,
    name: name ?? this.name,
    abbreviation: abbreviation ?? this.abbreviation,
    copyrightStatus: copyrightStatus ?? this.copyrightStatus,
    sourceUrl: sourceUrl ?? this.sourceUrl,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  LocalBibleTranslation copyWithCompanion(
    LocalBibleTranslationsCompanion data,
  ) {
    return LocalBibleTranslation(
      id: data.id.present ? data.id.value : this.id,
      localeCode: data.localeCode.present
          ? data.localeCode.value
          : this.localeCode,
      name: data.name.present ? data.name.value : this.name,
      abbreviation: data.abbreviation.present
          ? data.abbreviation.value
          : this.abbreviation,
      copyrightStatus: data.copyrightStatus.present
          ? data.copyrightStatus.value
          : this.copyrightStatus,
      sourceUrl: data.sourceUrl.present ? data.sourceUrl.value : this.sourceUrl,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalBibleTranslation(')
          ..write('id: $id, ')
          ..write('localeCode: $localeCode, ')
          ..write('name: $name, ')
          ..write('abbreviation: $abbreviation, ')
          ..write('copyrightStatus: $copyrightStatus, ')
          ..write('sourceUrl: $sourceUrl, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    localeCode,
    name,
    abbreviation,
    copyrightStatus,
    sourceUrl,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalBibleTranslation &&
          other.id == this.id &&
          other.localeCode == this.localeCode &&
          other.name == this.name &&
          other.abbreviation == this.abbreviation &&
          other.copyrightStatus == this.copyrightStatus &&
          other.sourceUrl == this.sourceUrl &&
          other.updatedAt == this.updatedAt);
}

class LocalBibleTranslationsCompanion
    extends UpdateCompanion<LocalBibleTranslation> {
  final Value<String> id;
  final Value<String> localeCode;
  final Value<String> name;
  final Value<String> abbreviation;
  final Value<String> copyrightStatus;
  final Value<String> sourceUrl;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const LocalBibleTranslationsCompanion({
    this.id = const Value.absent(),
    this.localeCode = const Value.absent(),
    this.name = const Value.absent(),
    this.abbreviation = const Value.absent(),
    this.copyrightStatus = const Value.absent(),
    this.sourceUrl = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalBibleTranslationsCompanion.insert({
    required String id,
    required String localeCode,
    required String name,
    required String abbreviation,
    required String copyrightStatus,
    required String sourceUrl,
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       localeCode = Value(localeCode),
       name = Value(name),
       abbreviation = Value(abbreviation),
       copyrightStatus = Value(copyrightStatus),
       sourceUrl = Value(sourceUrl),
       updatedAt = Value(updatedAt);
  static Insertable<LocalBibleTranslation> custom({
    Expression<String>? id,
    Expression<String>? localeCode,
    Expression<String>? name,
    Expression<String>? abbreviation,
    Expression<String>? copyrightStatus,
    Expression<String>? sourceUrl,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (localeCode != null) 'locale_code': localeCode,
      if (name != null) 'name': name,
      if (abbreviation != null) 'abbreviation': abbreviation,
      if (copyrightStatus != null) 'copyright_status': copyrightStatus,
      if (sourceUrl != null) 'source_url': sourceUrl,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalBibleTranslationsCompanion copyWith({
    Value<String>? id,
    Value<String>? localeCode,
    Value<String>? name,
    Value<String>? abbreviation,
    Value<String>? copyrightStatus,
    Value<String>? sourceUrl,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return LocalBibleTranslationsCompanion(
      id: id ?? this.id,
      localeCode: localeCode ?? this.localeCode,
      name: name ?? this.name,
      abbreviation: abbreviation ?? this.abbreviation,
      copyrightStatus: copyrightStatus ?? this.copyrightStatus,
      sourceUrl: sourceUrl ?? this.sourceUrl,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (localeCode.present) {
      map['locale_code'] = Variable<String>(localeCode.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (abbreviation.present) {
      map['abbreviation'] = Variable<String>(abbreviation.value);
    }
    if (copyrightStatus.present) {
      map['copyright_status'] = Variable<String>(copyrightStatus.value);
    }
    if (sourceUrl.present) {
      map['source_url'] = Variable<String>(sourceUrl.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalBibleTranslationsCompanion(')
          ..write('id: $id, ')
          ..write('localeCode: $localeCode, ')
          ..write('name: $name, ')
          ..write('abbreviation: $abbreviation, ')
          ..write('copyrightStatus: $copyrightStatus, ')
          ..write('sourceUrl: $sourceUrl, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalBibleVersesTable extends LocalBibleVerses
    with TableInfo<$LocalBibleVersesTable, LocalBibleVerse> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalBibleVersesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _bookIdMeta = const VerificationMeta('bookId');
  @override
  late final GeneratedColumn<String> bookId = GeneratedColumn<String>(
    'book_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES local_bible_books (id)',
    ),
  );
  static const VerificationMeta _chapterMeta = const VerificationMeta(
    'chapter',
  );
  @override
  late final GeneratedColumn<int> chapter = GeneratedColumn<int>(
    'chapter',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _verseMeta = const VerificationMeta('verse');
  @override
  late final GeneratedColumn<int> verse = GeneratedColumn<int>(
    'verse',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _textZhMeta = const VerificationMeta('textZh');
  @override
  late final GeneratedColumn<String> textZh = GeneratedColumn<String>(
    'text_zh',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _textEnMeta = const VerificationMeta('textEn');
  @override
  late final GeneratedColumn<String> textEn = GeneratedColumn<String>(
    'text_en',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _hasLexiconMeta = const VerificationMeta(
    'hasLexicon',
  );
  @override
  late final GeneratedColumn<bool> hasLexicon = GeneratedColumn<bool>(
    'has_lexicon',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("has_lexicon" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    bookId,
    chapter,
    verse,
    textZh,
    textEn,
    hasLexicon,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_bible_verses';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalBibleVerse> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('book_id')) {
      context.handle(
        _bookIdMeta,
        bookId.isAcceptableOrUnknown(data['book_id']!, _bookIdMeta),
      );
    } else if (isInserting) {
      context.missing(_bookIdMeta);
    }
    if (data.containsKey('chapter')) {
      context.handle(
        _chapterMeta,
        chapter.isAcceptableOrUnknown(data['chapter']!, _chapterMeta),
      );
    } else if (isInserting) {
      context.missing(_chapterMeta);
    }
    if (data.containsKey('verse')) {
      context.handle(
        _verseMeta,
        verse.isAcceptableOrUnknown(data['verse']!, _verseMeta),
      );
    } else if (isInserting) {
      context.missing(_verseMeta);
    }
    if (data.containsKey('text_zh')) {
      context.handle(
        _textZhMeta,
        textZh.isAcceptableOrUnknown(data['text_zh']!, _textZhMeta),
      );
    } else if (isInserting) {
      context.missing(_textZhMeta);
    }
    if (data.containsKey('text_en')) {
      context.handle(
        _textEnMeta,
        textEn.isAcceptableOrUnknown(data['text_en']!, _textEnMeta),
      );
    }
    if (data.containsKey('has_lexicon')) {
      context.handle(
        _hasLexiconMeta,
        hasLexicon.isAcceptableOrUnknown(data['has_lexicon']!, _hasLexiconMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalBibleVerse map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalBibleVerse(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      bookId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}book_id'],
      )!,
      chapter: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}chapter'],
      )!,
      verse: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}verse'],
      )!,
      textZh: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}text_zh'],
      )!,
      textEn: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}text_en'],
      ),
      hasLexicon: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}has_lexicon'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $LocalBibleVersesTable createAlias(String alias) {
    return $LocalBibleVersesTable(attachedDatabase, alias);
  }
}

class LocalBibleVerse extends DataClass implements Insertable<LocalBibleVerse> {
  final String id;
  final String bookId;
  final int chapter;
  final int verse;
  final String textZh;
  final String? textEn;
  final bool hasLexicon;
  final DateTime updatedAt;
  const LocalBibleVerse({
    required this.id,
    required this.bookId,
    required this.chapter,
    required this.verse,
    required this.textZh,
    this.textEn,
    required this.hasLexicon,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['book_id'] = Variable<String>(bookId);
    map['chapter'] = Variable<int>(chapter);
    map['verse'] = Variable<int>(verse);
    map['text_zh'] = Variable<String>(textZh);
    if (!nullToAbsent || textEn != null) {
      map['text_en'] = Variable<String>(textEn);
    }
    map['has_lexicon'] = Variable<bool>(hasLexicon);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  LocalBibleVersesCompanion toCompanion(bool nullToAbsent) {
    return LocalBibleVersesCompanion(
      id: Value(id),
      bookId: Value(bookId),
      chapter: Value(chapter),
      verse: Value(verse),
      textZh: Value(textZh),
      textEn: textEn == null && nullToAbsent
          ? const Value.absent()
          : Value(textEn),
      hasLexicon: Value(hasLexicon),
      updatedAt: Value(updatedAt),
    );
  }

  factory LocalBibleVerse.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalBibleVerse(
      id: serializer.fromJson<String>(json['id']),
      bookId: serializer.fromJson<String>(json['bookId']),
      chapter: serializer.fromJson<int>(json['chapter']),
      verse: serializer.fromJson<int>(json['verse']),
      textZh: serializer.fromJson<String>(json['textZh']),
      textEn: serializer.fromJson<String?>(json['textEn']),
      hasLexicon: serializer.fromJson<bool>(json['hasLexicon']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'bookId': serializer.toJson<String>(bookId),
      'chapter': serializer.toJson<int>(chapter),
      'verse': serializer.toJson<int>(verse),
      'textZh': serializer.toJson<String>(textZh),
      'textEn': serializer.toJson<String?>(textEn),
      'hasLexicon': serializer.toJson<bool>(hasLexicon),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  LocalBibleVerse copyWith({
    String? id,
    String? bookId,
    int? chapter,
    int? verse,
    String? textZh,
    Value<String?> textEn = const Value.absent(),
    bool? hasLexicon,
    DateTime? updatedAt,
  }) => LocalBibleVerse(
    id: id ?? this.id,
    bookId: bookId ?? this.bookId,
    chapter: chapter ?? this.chapter,
    verse: verse ?? this.verse,
    textZh: textZh ?? this.textZh,
    textEn: textEn.present ? textEn.value : this.textEn,
    hasLexicon: hasLexicon ?? this.hasLexicon,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  LocalBibleVerse copyWithCompanion(LocalBibleVersesCompanion data) {
    return LocalBibleVerse(
      id: data.id.present ? data.id.value : this.id,
      bookId: data.bookId.present ? data.bookId.value : this.bookId,
      chapter: data.chapter.present ? data.chapter.value : this.chapter,
      verse: data.verse.present ? data.verse.value : this.verse,
      textZh: data.textZh.present ? data.textZh.value : this.textZh,
      textEn: data.textEn.present ? data.textEn.value : this.textEn,
      hasLexicon: data.hasLexicon.present
          ? data.hasLexicon.value
          : this.hasLexicon,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalBibleVerse(')
          ..write('id: $id, ')
          ..write('bookId: $bookId, ')
          ..write('chapter: $chapter, ')
          ..write('verse: $verse, ')
          ..write('textZh: $textZh, ')
          ..write('textEn: $textEn, ')
          ..write('hasLexicon: $hasLexicon, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    bookId,
    chapter,
    verse,
    textZh,
    textEn,
    hasLexicon,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalBibleVerse &&
          other.id == this.id &&
          other.bookId == this.bookId &&
          other.chapter == this.chapter &&
          other.verse == this.verse &&
          other.textZh == this.textZh &&
          other.textEn == this.textEn &&
          other.hasLexicon == this.hasLexicon &&
          other.updatedAt == this.updatedAt);
}

class LocalBibleVersesCompanion extends UpdateCompanion<LocalBibleVerse> {
  final Value<String> id;
  final Value<String> bookId;
  final Value<int> chapter;
  final Value<int> verse;
  final Value<String> textZh;
  final Value<String?> textEn;
  final Value<bool> hasLexicon;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const LocalBibleVersesCompanion({
    this.id = const Value.absent(),
    this.bookId = const Value.absent(),
    this.chapter = const Value.absent(),
    this.verse = const Value.absent(),
    this.textZh = const Value.absent(),
    this.textEn = const Value.absent(),
    this.hasLexicon = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalBibleVersesCompanion.insert({
    required String id,
    required String bookId,
    required int chapter,
    required int verse,
    required String textZh,
    this.textEn = const Value.absent(),
    this.hasLexicon = const Value.absent(),
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       bookId = Value(bookId),
       chapter = Value(chapter),
       verse = Value(verse),
       textZh = Value(textZh),
       updatedAt = Value(updatedAt);
  static Insertable<LocalBibleVerse> custom({
    Expression<String>? id,
    Expression<String>? bookId,
    Expression<int>? chapter,
    Expression<int>? verse,
    Expression<String>? textZh,
    Expression<String>? textEn,
    Expression<bool>? hasLexicon,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (bookId != null) 'book_id': bookId,
      if (chapter != null) 'chapter': chapter,
      if (verse != null) 'verse': verse,
      if (textZh != null) 'text_zh': textZh,
      if (textEn != null) 'text_en': textEn,
      if (hasLexicon != null) 'has_lexicon': hasLexicon,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalBibleVersesCompanion copyWith({
    Value<String>? id,
    Value<String>? bookId,
    Value<int>? chapter,
    Value<int>? verse,
    Value<String>? textZh,
    Value<String?>? textEn,
    Value<bool>? hasLexicon,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return LocalBibleVersesCompanion(
      id: id ?? this.id,
      bookId: bookId ?? this.bookId,
      chapter: chapter ?? this.chapter,
      verse: verse ?? this.verse,
      textZh: textZh ?? this.textZh,
      textEn: textEn ?? this.textEn,
      hasLexicon: hasLexicon ?? this.hasLexicon,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (bookId.present) {
      map['book_id'] = Variable<String>(bookId.value);
    }
    if (chapter.present) {
      map['chapter'] = Variable<int>(chapter.value);
    }
    if (verse.present) {
      map['verse'] = Variable<int>(verse.value);
    }
    if (textZh.present) {
      map['text_zh'] = Variable<String>(textZh.value);
    }
    if (textEn.present) {
      map['text_en'] = Variable<String>(textEn.value);
    }
    if (hasLexicon.present) {
      map['has_lexicon'] = Variable<bool>(hasLexicon.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalBibleVersesCompanion(')
          ..write('id: $id, ')
          ..write('bookId: $bookId, ')
          ..write('chapter: $chapter, ')
          ..write('verse: $verse, ')
          ..write('textZh: $textZh, ')
          ..write('textEn: $textEn, ')
          ..write('hasLexicon: $hasLexicon, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalBibleVerseTextsTable extends LocalBibleVerseTexts
    with TableInfo<$LocalBibleVerseTextsTable, LocalBibleVerseText> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalBibleVerseTextsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _versionIdMeta = const VerificationMeta(
    'versionId',
  );
  @override
  late final GeneratedColumn<String> versionId = GeneratedColumn<String>(
    'version_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _verseIdMeta = const VerificationMeta(
    'verseId',
  );
  @override
  late final GeneratedColumn<String> verseId = GeneratedColumn<String>(
    'verse_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _bookIdMeta = const VerificationMeta('bookId');
  @override
  late final GeneratedColumn<String> bookId = GeneratedColumn<String>(
    'book_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _chapterMeta = const VerificationMeta(
    'chapter',
  );
  @override
  late final GeneratedColumn<int> chapter = GeneratedColumn<int>(
    'chapter',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _verseMeta = const VerificationMeta('verse');
  @override
  late final GeneratedColumn<int> verse = GeneratedColumn<int>(
    'verse',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _verseTextMeta = const VerificationMeta(
    'verseText',
  );
  @override
  late final GeneratedColumn<String> verseText = GeneratedColumn<String>(
    'text',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    versionId,
    verseId,
    bookId,
    chapter,
    verse,
    verseText,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_bible_verse_texts';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalBibleVerseText> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('version_id')) {
      context.handle(
        _versionIdMeta,
        versionId.isAcceptableOrUnknown(data['version_id']!, _versionIdMeta),
      );
    } else if (isInserting) {
      context.missing(_versionIdMeta);
    }
    if (data.containsKey('verse_id')) {
      context.handle(
        _verseIdMeta,
        verseId.isAcceptableOrUnknown(data['verse_id']!, _verseIdMeta),
      );
    } else if (isInserting) {
      context.missing(_verseIdMeta);
    }
    if (data.containsKey('book_id')) {
      context.handle(
        _bookIdMeta,
        bookId.isAcceptableOrUnknown(data['book_id']!, _bookIdMeta),
      );
    } else if (isInserting) {
      context.missing(_bookIdMeta);
    }
    if (data.containsKey('chapter')) {
      context.handle(
        _chapterMeta,
        chapter.isAcceptableOrUnknown(data['chapter']!, _chapterMeta),
      );
    } else if (isInserting) {
      context.missing(_chapterMeta);
    }
    if (data.containsKey('verse')) {
      context.handle(
        _verseMeta,
        verse.isAcceptableOrUnknown(data['verse']!, _verseMeta),
      );
    } else if (isInserting) {
      context.missing(_verseMeta);
    }
    if (data.containsKey('text')) {
      context.handle(
        _verseTextMeta,
        verseText.isAcceptableOrUnknown(data['text']!, _verseTextMeta),
      );
    } else if (isInserting) {
      context.missing(_verseTextMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalBibleVerseText map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalBibleVerseText(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      versionId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}version_id'],
      )!,
      verseId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}verse_id'],
      )!,
      bookId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}book_id'],
      )!,
      chapter: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}chapter'],
      )!,
      verse: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}verse'],
      )!,
      verseText: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}text'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $LocalBibleVerseTextsTable createAlias(String alias) {
    return $LocalBibleVerseTextsTable(attachedDatabase, alias);
  }
}

class LocalBibleVerseText extends DataClass
    implements Insertable<LocalBibleVerseText> {
  final String id;
  final String versionId;
  final String verseId;
  final String bookId;
  final int chapter;
  final int verse;
  final String verseText;
  final DateTime updatedAt;
  const LocalBibleVerseText({
    required this.id,
    required this.versionId,
    required this.verseId,
    required this.bookId,
    required this.chapter,
    required this.verse,
    required this.verseText,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['version_id'] = Variable<String>(versionId);
    map['verse_id'] = Variable<String>(verseId);
    map['book_id'] = Variable<String>(bookId);
    map['chapter'] = Variable<int>(chapter);
    map['verse'] = Variable<int>(verse);
    map['text'] = Variable<String>(verseText);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  LocalBibleVerseTextsCompanion toCompanion(bool nullToAbsent) {
    return LocalBibleVerseTextsCompanion(
      id: Value(id),
      versionId: Value(versionId),
      verseId: Value(verseId),
      bookId: Value(bookId),
      chapter: Value(chapter),
      verse: Value(verse),
      verseText: Value(verseText),
      updatedAt: Value(updatedAt),
    );
  }

  factory LocalBibleVerseText.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalBibleVerseText(
      id: serializer.fromJson<String>(json['id']),
      versionId: serializer.fromJson<String>(json['versionId']),
      verseId: serializer.fromJson<String>(json['verseId']),
      bookId: serializer.fromJson<String>(json['bookId']),
      chapter: serializer.fromJson<int>(json['chapter']),
      verse: serializer.fromJson<int>(json['verse']),
      verseText: serializer.fromJson<String>(json['verseText']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'versionId': serializer.toJson<String>(versionId),
      'verseId': serializer.toJson<String>(verseId),
      'bookId': serializer.toJson<String>(bookId),
      'chapter': serializer.toJson<int>(chapter),
      'verse': serializer.toJson<int>(verse),
      'verseText': serializer.toJson<String>(verseText),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  LocalBibleVerseText copyWith({
    String? id,
    String? versionId,
    String? verseId,
    String? bookId,
    int? chapter,
    int? verse,
    String? verseText,
    DateTime? updatedAt,
  }) => LocalBibleVerseText(
    id: id ?? this.id,
    versionId: versionId ?? this.versionId,
    verseId: verseId ?? this.verseId,
    bookId: bookId ?? this.bookId,
    chapter: chapter ?? this.chapter,
    verse: verse ?? this.verse,
    verseText: verseText ?? this.verseText,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  LocalBibleVerseText copyWithCompanion(LocalBibleVerseTextsCompanion data) {
    return LocalBibleVerseText(
      id: data.id.present ? data.id.value : this.id,
      versionId: data.versionId.present ? data.versionId.value : this.versionId,
      verseId: data.verseId.present ? data.verseId.value : this.verseId,
      bookId: data.bookId.present ? data.bookId.value : this.bookId,
      chapter: data.chapter.present ? data.chapter.value : this.chapter,
      verse: data.verse.present ? data.verse.value : this.verse,
      verseText: data.verseText.present ? data.verseText.value : this.verseText,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalBibleVerseText(')
          ..write('id: $id, ')
          ..write('versionId: $versionId, ')
          ..write('verseId: $verseId, ')
          ..write('bookId: $bookId, ')
          ..write('chapter: $chapter, ')
          ..write('verse: $verse, ')
          ..write('verseText: $verseText, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    versionId,
    verseId,
    bookId,
    chapter,
    verse,
    verseText,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalBibleVerseText &&
          other.id == this.id &&
          other.versionId == this.versionId &&
          other.verseId == this.verseId &&
          other.bookId == this.bookId &&
          other.chapter == this.chapter &&
          other.verse == this.verse &&
          other.verseText == this.verseText &&
          other.updatedAt == this.updatedAt);
}

class LocalBibleVerseTextsCompanion
    extends UpdateCompanion<LocalBibleVerseText> {
  final Value<String> id;
  final Value<String> versionId;
  final Value<String> verseId;
  final Value<String> bookId;
  final Value<int> chapter;
  final Value<int> verse;
  final Value<String> verseText;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const LocalBibleVerseTextsCompanion({
    this.id = const Value.absent(),
    this.versionId = const Value.absent(),
    this.verseId = const Value.absent(),
    this.bookId = const Value.absent(),
    this.chapter = const Value.absent(),
    this.verse = const Value.absent(),
    this.verseText = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalBibleVerseTextsCompanion.insert({
    required String id,
    required String versionId,
    required String verseId,
    required String bookId,
    required int chapter,
    required int verse,
    required String verseText,
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       versionId = Value(versionId),
       verseId = Value(verseId),
       bookId = Value(bookId),
       chapter = Value(chapter),
       verse = Value(verse),
       verseText = Value(verseText),
       updatedAt = Value(updatedAt);
  static Insertable<LocalBibleVerseText> custom({
    Expression<String>? id,
    Expression<String>? versionId,
    Expression<String>? verseId,
    Expression<String>? bookId,
    Expression<int>? chapter,
    Expression<int>? verse,
    Expression<String>? verseText,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (versionId != null) 'version_id': versionId,
      if (verseId != null) 'verse_id': verseId,
      if (bookId != null) 'book_id': bookId,
      if (chapter != null) 'chapter': chapter,
      if (verse != null) 'verse': verse,
      if (verseText != null) 'text': verseText,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalBibleVerseTextsCompanion copyWith({
    Value<String>? id,
    Value<String>? versionId,
    Value<String>? verseId,
    Value<String>? bookId,
    Value<int>? chapter,
    Value<int>? verse,
    Value<String>? verseText,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return LocalBibleVerseTextsCompanion(
      id: id ?? this.id,
      versionId: versionId ?? this.versionId,
      verseId: verseId ?? this.verseId,
      bookId: bookId ?? this.bookId,
      chapter: chapter ?? this.chapter,
      verse: verse ?? this.verse,
      verseText: verseText ?? this.verseText,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (versionId.present) {
      map['version_id'] = Variable<String>(versionId.value);
    }
    if (verseId.present) {
      map['verse_id'] = Variable<String>(verseId.value);
    }
    if (bookId.present) {
      map['book_id'] = Variable<String>(bookId.value);
    }
    if (chapter.present) {
      map['chapter'] = Variable<int>(chapter.value);
    }
    if (verse.present) {
      map['verse'] = Variable<int>(verse.value);
    }
    if (verseText.present) {
      map['text'] = Variable<String>(verseText.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalBibleVerseTextsCompanion(')
          ..write('id: $id, ')
          ..write('versionId: $versionId, ')
          ..write('verseId: $verseId, ')
          ..write('bookId: $bookId, ')
          ..write('chapter: $chapter, ')
          ..write('verse: $verse, ')
          ..write('verseText: $verseText, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalSermonsTable extends LocalSermons
    with TableInfo<$LocalSermonsTable, LocalSermon> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalSermonsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
    'title',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _speakerMeta = const VerificationMeta(
    'speaker',
  );
  @override
  late final GeneratedColumn<String> speaker = GeneratedColumn<String>(
    'speaker',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sermonDateMeta = const VerificationMeta(
    'sermonDate',
  );
  @override
  late final GeneratedColumn<DateTime> sermonDate = GeneratedColumn<DateTime>(
    'sermon_date',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _seriesMeta = const VerificationMeta('series');
  @override
  late final GeneratedColumn<String> series = GeneratedColumn<String>(
    'series',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _primaryReferenceMeta = const VerificationMeta(
    'primaryReference',
  );
  @override
  late final GeneratedColumn<String> primaryReference = GeneratedColumn<String>(
    'primary_reference',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _durationSecondsMeta = const VerificationMeta(
    'durationSeconds',
  );
  @override
  late final GeneratedColumn<int> durationSeconds = GeneratedColumn<int>(
    'duration_seconds',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _summaryMeta = const VerificationMeta(
    'summary',
  );
  @override
  late final GeneratedColumn<String> summary = GeneratedColumn<String>(
    'summary',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _transcriptTextMeta = const VerificationMeta(
    'transcriptText',
  );
  @override
  late final GeneratedColumn<String> transcriptText = GeneratedColumn<String>(
    'transcript_text',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _transcriptSourceMeta = const VerificationMeta(
    'transcriptSource',
  );
  @override
  late final GeneratedColumn<String> transcriptSource = GeneratedColumn<String>(
    'transcript_source',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _transcriptUpdatedAtMeta =
      const VerificationMeta('transcriptUpdatedAt');
  @override
  late final GeneratedColumn<String> transcriptUpdatedAt =
      GeneratedColumn<String>(
        'transcript_updated_at',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _audioUrlMeta = const VerificationMeta(
    'audioUrl',
  );
  @override
  late final GeneratedColumn<String> audioUrl = GeneratedColumn<String>(
    'audio_url',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _audioUrlExpiresAtMeta = const VerificationMeta(
    'audioUrlExpiresAt',
  );
  @override
  late final GeneratedColumn<DateTime> audioUrlExpiresAt =
      GeneratedColumn<DateTime>(
        'audio_url_expires_at',
        aliasedName,
        true,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _thumbnailUrlMeta = const VerificationMeta(
    'thumbnailUrl',
  );
  @override
  late final GeneratedColumn<String> thumbnailUrl = GeneratedColumn<String>(
    'thumbnail_url',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    title,
    speaker,
    sermonDate,
    series,
    primaryReference,
    durationSeconds,
    summary,
    transcriptText,
    transcriptSource,
    transcriptUpdatedAt,
    audioUrl,
    audioUrlExpiresAt,
    thumbnailUrl,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_sermons';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalSermon> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
        _titleMeta,
        title.isAcceptableOrUnknown(data['title']!, _titleMeta),
      );
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('speaker')) {
      context.handle(
        _speakerMeta,
        speaker.isAcceptableOrUnknown(data['speaker']!, _speakerMeta),
      );
    } else if (isInserting) {
      context.missing(_speakerMeta);
    }
    if (data.containsKey('sermon_date')) {
      context.handle(
        _sermonDateMeta,
        sermonDate.isAcceptableOrUnknown(data['sermon_date']!, _sermonDateMeta),
      );
    } else if (isInserting) {
      context.missing(_sermonDateMeta);
    }
    if (data.containsKey('series')) {
      context.handle(
        _seriesMeta,
        series.isAcceptableOrUnknown(data['series']!, _seriesMeta),
      );
    }
    if (data.containsKey('primary_reference')) {
      context.handle(
        _primaryReferenceMeta,
        primaryReference.isAcceptableOrUnknown(
          data['primary_reference']!,
          _primaryReferenceMeta,
        ),
      );
    }
    if (data.containsKey('duration_seconds')) {
      context.handle(
        _durationSecondsMeta,
        durationSeconds.isAcceptableOrUnknown(
          data['duration_seconds']!,
          _durationSecondsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_durationSecondsMeta);
    }
    if (data.containsKey('summary')) {
      context.handle(
        _summaryMeta,
        summary.isAcceptableOrUnknown(data['summary']!, _summaryMeta),
      );
    }
    if (data.containsKey('transcript_text')) {
      context.handle(
        _transcriptTextMeta,
        transcriptText.isAcceptableOrUnknown(
          data['transcript_text']!,
          _transcriptTextMeta,
        ),
      );
    }
    if (data.containsKey('transcript_source')) {
      context.handle(
        _transcriptSourceMeta,
        transcriptSource.isAcceptableOrUnknown(
          data['transcript_source']!,
          _transcriptSourceMeta,
        ),
      );
    }
    if (data.containsKey('transcript_updated_at')) {
      context.handle(
        _transcriptUpdatedAtMeta,
        transcriptUpdatedAt.isAcceptableOrUnknown(
          data['transcript_updated_at']!,
          _transcriptUpdatedAtMeta,
        ),
      );
    }
    if (data.containsKey('audio_url')) {
      context.handle(
        _audioUrlMeta,
        audioUrl.isAcceptableOrUnknown(data['audio_url']!, _audioUrlMeta),
      );
    }
    if (data.containsKey('audio_url_expires_at')) {
      context.handle(
        _audioUrlExpiresAtMeta,
        audioUrlExpiresAt.isAcceptableOrUnknown(
          data['audio_url_expires_at']!,
          _audioUrlExpiresAtMeta,
        ),
      );
    }
    if (data.containsKey('thumbnail_url')) {
      context.handle(
        _thumbnailUrlMeta,
        thumbnailUrl.isAcceptableOrUnknown(
          data['thumbnail_url']!,
          _thumbnailUrlMeta,
        ),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalSermon map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalSermon(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      title: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}title'],
      )!,
      speaker: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}speaker'],
      )!,
      sermonDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}sermon_date'],
      )!,
      series: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}series'],
      ),
      primaryReference: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}primary_reference'],
      ),
      durationSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}duration_seconds'],
      )!,
      summary: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}summary'],
      ),
      transcriptText: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}transcript_text'],
      ),
      transcriptSource: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}transcript_source'],
      ),
      transcriptUpdatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}transcript_updated_at'],
      ),
      audioUrl: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}audio_url'],
      ),
      audioUrlExpiresAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}audio_url_expires_at'],
      ),
      thumbnailUrl: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}thumbnail_url'],
      ),
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $LocalSermonsTable createAlias(String alias) {
    return $LocalSermonsTable(attachedDatabase, alias);
  }
}

class LocalSermon extends DataClass implements Insertable<LocalSermon> {
  final String id;
  final String title;
  final String speaker;
  final DateTime sermonDate;
  final String? series;
  final String? primaryReference;
  final int durationSeconds;
  final String? summary;
  final String? transcriptText;
  final String? transcriptSource;
  final String? transcriptUpdatedAt;
  final String? audioUrl;
  final DateTime? audioUrlExpiresAt;
  final String? thumbnailUrl;
  final DateTime updatedAt;
  const LocalSermon({
    required this.id,
    required this.title,
    required this.speaker,
    required this.sermonDate,
    this.series,
    this.primaryReference,
    required this.durationSeconds,
    this.summary,
    this.transcriptText,
    this.transcriptSource,
    this.transcriptUpdatedAt,
    this.audioUrl,
    this.audioUrlExpiresAt,
    this.thumbnailUrl,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['title'] = Variable<String>(title);
    map['speaker'] = Variable<String>(speaker);
    map['sermon_date'] = Variable<DateTime>(sermonDate);
    if (!nullToAbsent || series != null) {
      map['series'] = Variable<String>(series);
    }
    if (!nullToAbsent || primaryReference != null) {
      map['primary_reference'] = Variable<String>(primaryReference);
    }
    map['duration_seconds'] = Variable<int>(durationSeconds);
    if (!nullToAbsent || summary != null) {
      map['summary'] = Variable<String>(summary);
    }
    if (!nullToAbsent || transcriptText != null) {
      map['transcript_text'] = Variable<String>(transcriptText);
    }
    if (!nullToAbsent || transcriptSource != null) {
      map['transcript_source'] = Variable<String>(transcriptSource);
    }
    if (!nullToAbsent || transcriptUpdatedAt != null) {
      map['transcript_updated_at'] = Variable<String>(transcriptUpdatedAt);
    }
    if (!nullToAbsent || audioUrl != null) {
      map['audio_url'] = Variable<String>(audioUrl);
    }
    if (!nullToAbsent || audioUrlExpiresAt != null) {
      map['audio_url_expires_at'] = Variable<DateTime>(audioUrlExpiresAt);
    }
    if (!nullToAbsent || thumbnailUrl != null) {
      map['thumbnail_url'] = Variable<String>(thumbnailUrl);
    }
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  LocalSermonsCompanion toCompanion(bool nullToAbsent) {
    return LocalSermonsCompanion(
      id: Value(id),
      title: Value(title),
      speaker: Value(speaker),
      sermonDate: Value(sermonDate),
      series: series == null && nullToAbsent
          ? const Value.absent()
          : Value(series),
      primaryReference: primaryReference == null && nullToAbsent
          ? const Value.absent()
          : Value(primaryReference),
      durationSeconds: Value(durationSeconds),
      summary: summary == null && nullToAbsent
          ? const Value.absent()
          : Value(summary),
      transcriptText: transcriptText == null && nullToAbsent
          ? const Value.absent()
          : Value(transcriptText),
      transcriptSource: transcriptSource == null && nullToAbsent
          ? const Value.absent()
          : Value(transcriptSource),
      transcriptUpdatedAt: transcriptUpdatedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(transcriptUpdatedAt),
      audioUrl: audioUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(audioUrl),
      audioUrlExpiresAt: audioUrlExpiresAt == null && nullToAbsent
          ? const Value.absent()
          : Value(audioUrlExpiresAt),
      thumbnailUrl: thumbnailUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(thumbnailUrl),
      updatedAt: Value(updatedAt),
    );
  }

  factory LocalSermon.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalSermon(
      id: serializer.fromJson<String>(json['id']),
      title: serializer.fromJson<String>(json['title']),
      speaker: serializer.fromJson<String>(json['speaker']),
      sermonDate: serializer.fromJson<DateTime>(json['sermonDate']),
      series: serializer.fromJson<String?>(json['series']),
      primaryReference: serializer.fromJson<String?>(json['primaryReference']),
      durationSeconds: serializer.fromJson<int>(json['durationSeconds']),
      summary: serializer.fromJson<String?>(json['summary']),
      transcriptText: serializer.fromJson<String?>(json['transcriptText']),
      transcriptSource: serializer.fromJson<String?>(json['transcriptSource']),
      transcriptUpdatedAt: serializer.fromJson<String?>(
        json['transcriptUpdatedAt'],
      ),
      audioUrl: serializer.fromJson<String?>(json['audioUrl']),
      audioUrlExpiresAt: serializer.fromJson<DateTime?>(
        json['audioUrlExpiresAt'],
      ),
      thumbnailUrl: serializer.fromJson<String?>(json['thumbnailUrl']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'title': serializer.toJson<String>(title),
      'speaker': serializer.toJson<String>(speaker),
      'sermonDate': serializer.toJson<DateTime>(sermonDate),
      'series': serializer.toJson<String?>(series),
      'primaryReference': serializer.toJson<String?>(primaryReference),
      'durationSeconds': serializer.toJson<int>(durationSeconds),
      'summary': serializer.toJson<String?>(summary),
      'transcriptText': serializer.toJson<String?>(transcriptText),
      'transcriptSource': serializer.toJson<String?>(transcriptSource),
      'transcriptUpdatedAt': serializer.toJson<String?>(transcriptUpdatedAt),
      'audioUrl': serializer.toJson<String?>(audioUrl),
      'audioUrlExpiresAt': serializer.toJson<DateTime?>(audioUrlExpiresAt),
      'thumbnailUrl': serializer.toJson<String?>(thumbnailUrl),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  LocalSermon copyWith({
    String? id,
    String? title,
    String? speaker,
    DateTime? sermonDate,
    Value<String?> series = const Value.absent(),
    Value<String?> primaryReference = const Value.absent(),
    int? durationSeconds,
    Value<String?> summary = const Value.absent(),
    Value<String?> transcriptText = const Value.absent(),
    Value<String?> transcriptSource = const Value.absent(),
    Value<String?> transcriptUpdatedAt = const Value.absent(),
    Value<String?> audioUrl = const Value.absent(),
    Value<DateTime?> audioUrlExpiresAt = const Value.absent(),
    Value<String?> thumbnailUrl = const Value.absent(),
    DateTime? updatedAt,
  }) => LocalSermon(
    id: id ?? this.id,
    title: title ?? this.title,
    speaker: speaker ?? this.speaker,
    sermonDate: sermonDate ?? this.sermonDate,
    series: series.present ? series.value : this.series,
    primaryReference: primaryReference.present
        ? primaryReference.value
        : this.primaryReference,
    durationSeconds: durationSeconds ?? this.durationSeconds,
    summary: summary.present ? summary.value : this.summary,
    transcriptText: transcriptText.present
        ? transcriptText.value
        : this.transcriptText,
    transcriptSource: transcriptSource.present
        ? transcriptSource.value
        : this.transcriptSource,
    transcriptUpdatedAt: transcriptUpdatedAt.present
        ? transcriptUpdatedAt.value
        : this.transcriptUpdatedAt,
    audioUrl: audioUrl.present ? audioUrl.value : this.audioUrl,
    audioUrlExpiresAt: audioUrlExpiresAt.present
        ? audioUrlExpiresAt.value
        : this.audioUrlExpiresAt,
    thumbnailUrl: thumbnailUrl.present ? thumbnailUrl.value : this.thumbnailUrl,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  LocalSermon copyWithCompanion(LocalSermonsCompanion data) {
    return LocalSermon(
      id: data.id.present ? data.id.value : this.id,
      title: data.title.present ? data.title.value : this.title,
      speaker: data.speaker.present ? data.speaker.value : this.speaker,
      sermonDate: data.sermonDate.present
          ? data.sermonDate.value
          : this.sermonDate,
      series: data.series.present ? data.series.value : this.series,
      primaryReference: data.primaryReference.present
          ? data.primaryReference.value
          : this.primaryReference,
      durationSeconds: data.durationSeconds.present
          ? data.durationSeconds.value
          : this.durationSeconds,
      summary: data.summary.present ? data.summary.value : this.summary,
      transcriptText: data.transcriptText.present
          ? data.transcriptText.value
          : this.transcriptText,
      transcriptSource: data.transcriptSource.present
          ? data.transcriptSource.value
          : this.transcriptSource,
      transcriptUpdatedAt: data.transcriptUpdatedAt.present
          ? data.transcriptUpdatedAt.value
          : this.transcriptUpdatedAt,
      audioUrl: data.audioUrl.present ? data.audioUrl.value : this.audioUrl,
      audioUrlExpiresAt: data.audioUrlExpiresAt.present
          ? data.audioUrlExpiresAt.value
          : this.audioUrlExpiresAt,
      thumbnailUrl: data.thumbnailUrl.present
          ? data.thumbnailUrl.value
          : this.thumbnailUrl,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalSermon(')
          ..write('id: $id, ')
          ..write('title: $title, ')
          ..write('speaker: $speaker, ')
          ..write('sermonDate: $sermonDate, ')
          ..write('series: $series, ')
          ..write('primaryReference: $primaryReference, ')
          ..write('durationSeconds: $durationSeconds, ')
          ..write('summary: $summary, ')
          ..write('transcriptText: $transcriptText, ')
          ..write('transcriptSource: $transcriptSource, ')
          ..write('transcriptUpdatedAt: $transcriptUpdatedAt, ')
          ..write('audioUrl: $audioUrl, ')
          ..write('audioUrlExpiresAt: $audioUrlExpiresAt, ')
          ..write('thumbnailUrl: $thumbnailUrl, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    title,
    speaker,
    sermonDate,
    series,
    primaryReference,
    durationSeconds,
    summary,
    transcriptText,
    transcriptSource,
    transcriptUpdatedAt,
    audioUrl,
    audioUrlExpiresAt,
    thumbnailUrl,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalSermon &&
          other.id == this.id &&
          other.title == this.title &&
          other.speaker == this.speaker &&
          other.sermonDate == this.sermonDate &&
          other.series == this.series &&
          other.primaryReference == this.primaryReference &&
          other.durationSeconds == this.durationSeconds &&
          other.summary == this.summary &&
          other.transcriptText == this.transcriptText &&
          other.transcriptSource == this.transcriptSource &&
          other.transcriptUpdatedAt == this.transcriptUpdatedAt &&
          other.audioUrl == this.audioUrl &&
          other.audioUrlExpiresAt == this.audioUrlExpiresAt &&
          other.thumbnailUrl == this.thumbnailUrl &&
          other.updatedAt == this.updatedAt);
}

class LocalSermonsCompanion extends UpdateCompanion<LocalSermon> {
  final Value<String> id;
  final Value<String> title;
  final Value<String> speaker;
  final Value<DateTime> sermonDate;
  final Value<String?> series;
  final Value<String?> primaryReference;
  final Value<int> durationSeconds;
  final Value<String?> summary;
  final Value<String?> transcriptText;
  final Value<String?> transcriptSource;
  final Value<String?> transcriptUpdatedAt;
  final Value<String?> audioUrl;
  final Value<DateTime?> audioUrlExpiresAt;
  final Value<String?> thumbnailUrl;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const LocalSermonsCompanion({
    this.id = const Value.absent(),
    this.title = const Value.absent(),
    this.speaker = const Value.absent(),
    this.sermonDate = const Value.absent(),
    this.series = const Value.absent(),
    this.primaryReference = const Value.absent(),
    this.durationSeconds = const Value.absent(),
    this.summary = const Value.absent(),
    this.transcriptText = const Value.absent(),
    this.transcriptSource = const Value.absent(),
    this.transcriptUpdatedAt = const Value.absent(),
    this.audioUrl = const Value.absent(),
    this.audioUrlExpiresAt = const Value.absent(),
    this.thumbnailUrl = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalSermonsCompanion.insert({
    required String id,
    required String title,
    required String speaker,
    required DateTime sermonDate,
    this.series = const Value.absent(),
    this.primaryReference = const Value.absent(),
    required int durationSeconds,
    this.summary = const Value.absent(),
    this.transcriptText = const Value.absent(),
    this.transcriptSource = const Value.absent(),
    this.transcriptUpdatedAt = const Value.absent(),
    this.audioUrl = const Value.absent(),
    this.audioUrlExpiresAt = const Value.absent(),
    this.thumbnailUrl = const Value.absent(),
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       title = Value(title),
       speaker = Value(speaker),
       sermonDate = Value(sermonDate),
       durationSeconds = Value(durationSeconds),
       updatedAt = Value(updatedAt);
  static Insertable<LocalSermon> custom({
    Expression<String>? id,
    Expression<String>? title,
    Expression<String>? speaker,
    Expression<DateTime>? sermonDate,
    Expression<String>? series,
    Expression<String>? primaryReference,
    Expression<int>? durationSeconds,
    Expression<String>? summary,
    Expression<String>? transcriptText,
    Expression<String>? transcriptSource,
    Expression<String>? transcriptUpdatedAt,
    Expression<String>? audioUrl,
    Expression<DateTime>? audioUrlExpiresAt,
    Expression<String>? thumbnailUrl,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (title != null) 'title': title,
      if (speaker != null) 'speaker': speaker,
      if (sermonDate != null) 'sermon_date': sermonDate,
      if (series != null) 'series': series,
      if (primaryReference != null) 'primary_reference': primaryReference,
      if (durationSeconds != null) 'duration_seconds': durationSeconds,
      if (summary != null) 'summary': summary,
      if (transcriptText != null) 'transcript_text': transcriptText,
      if (transcriptSource != null) 'transcript_source': transcriptSource,
      if (transcriptUpdatedAt != null)
        'transcript_updated_at': transcriptUpdatedAt,
      if (audioUrl != null) 'audio_url': audioUrl,
      if (audioUrlExpiresAt != null) 'audio_url_expires_at': audioUrlExpiresAt,
      if (thumbnailUrl != null) 'thumbnail_url': thumbnailUrl,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalSermonsCompanion copyWith({
    Value<String>? id,
    Value<String>? title,
    Value<String>? speaker,
    Value<DateTime>? sermonDate,
    Value<String?>? series,
    Value<String?>? primaryReference,
    Value<int>? durationSeconds,
    Value<String?>? summary,
    Value<String?>? transcriptText,
    Value<String?>? transcriptSource,
    Value<String?>? transcriptUpdatedAt,
    Value<String?>? audioUrl,
    Value<DateTime?>? audioUrlExpiresAt,
    Value<String?>? thumbnailUrl,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return LocalSermonsCompanion(
      id: id ?? this.id,
      title: title ?? this.title,
      speaker: speaker ?? this.speaker,
      sermonDate: sermonDate ?? this.sermonDate,
      series: series ?? this.series,
      primaryReference: primaryReference ?? this.primaryReference,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      summary: summary ?? this.summary,
      transcriptText: transcriptText ?? this.transcriptText,
      transcriptSource: transcriptSource ?? this.transcriptSource,
      transcriptUpdatedAt: transcriptUpdatedAt ?? this.transcriptUpdatedAt,
      audioUrl: audioUrl ?? this.audioUrl,
      audioUrlExpiresAt: audioUrlExpiresAt ?? this.audioUrlExpiresAt,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (speaker.present) {
      map['speaker'] = Variable<String>(speaker.value);
    }
    if (sermonDate.present) {
      map['sermon_date'] = Variable<DateTime>(sermonDate.value);
    }
    if (series.present) {
      map['series'] = Variable<String>(series.value);
    }
    if (primaryReference.present) {
      map['primary_reference'] = Variable<String>(primaryReference.value);
    }
    if (durationSeconds.present) {
      map['duration_seconds'] = Variable<int>(durationSeconds.value);
    }
    if (summary.present) {
      map['summary'] = Variable<String>(summary.value);
    }
    if (transcriptText.present) {
      map['transcript_text'] = Variable<String>(transcriptText.value);
    }
    if (transcriptSource.present) {
      map['transcript_source'] = Variable<String>(transcriptSource.value);
    }
    if (transcriptUpdatedAt.present) {
      map['transcript_updated_at'] = Variable<String>(
        transcriptUpdatedAt.value,
      );
    }
    if (audioUrl.present) {
      map['audio_url'] = Variable<String>(audioUrl.value);
    }
    if (audioUrlExpiresAt.present) {
      map['audio_url_expires_at'] = Variable<DateTime>(audioUrlExpiresAt.value);
    }
    if (thumbnailUrl.present) {
      map['thumbnail_url'] = Variable<String>(thumbnailUrl.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalSermonsCompanion(')
          ..write('id: $id, ')
          ..write('title: $title, ')
          ..write('speaker: $speaker, ')
          ..write('sermonDate: $sermonDate, ')
          ..write('series: $series, ')
          ..write('primaryReference: $primaryReference, ')
          ..write('durationSeconds: $durationSeconds, ')
          ..write('summary: $summary, ')
          ..write('transcriptText: $transcriptText, ')
          ..write('transcriptSource: $transcriptSource, ')
          ..write('transcriptUpdatedAt: $transcriptUpdatedAt, ')
          ..write('audioUrl: $audioUrl, ')
          ..write('audioUrlExpiresAt: $audioUrlExpiresAt, ')
          ..write('thumbnailUrl: $thumbnailUrl, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalSermonTopicsTable extends LocalSermonTopics
    with TableInfo<$LocalSermonTopicsTable, LocalSermonTopic> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalSermonTopicsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _sermonIdMeta = const VerificationMeta(
    'sermonId',
  );
  @override
  late final GeneratedColumn<String> sermonId = GeneratedColumn<String>(
    'sermon_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES local_sermons (id)',
    ),
  );
  static const VerificationMeta _topicMeta = const VerificationMeta('topic');
  @override
  late final GeneratedColumn<String> topic = GeneratedColumn<String>(
    'topic',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sortOrderMeta = const VerificationMeta(
    'sortOrder',
  );
  @override
  late final GeneratedColumn<int> sortOrder = GeneratedColumn<int>(
    'sort_order',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [sermonId, topic, sortOrder];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_sermon_topics';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalSermonTopic> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('sermon_id')) {
      context.handle(
        _sermonIdMeta,
        sermonId.isAcceptableOrUnknown(data['sermon_id']!, _sermonIdMeta),
      );
    } else if (isInserting) {
      context.missing(_sermonIdMeta);
    }
    if (data.containsKey('topic')) {
      context.handle(
        _topicMeta,
        topic.isAcceptableOrUnknown(data['topic']!, _topicMeta),
      );
    } else if (isInserting) {
      context.missing(_topicMeta);
    }
    if (data.containsKey('sort_order')) {
      context.handle(
        _sortOrderMeta,
        sortOrder.isAcceptableOrUnknown(data['sort_order']!, _sortOrderMeta),
      );
    } else if (isInserting) {
      context.missing(_sortOrderMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {sermonId, topic};
  @override
  LocalSermonTopic map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalSermonTopic(
      sermonId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sermon_id'],
      )!,
      topic: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}topic'],
      )!,
      sortOrder: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}sort_order'],
      )!,
    );
  }

  @override
  $LocalSermonTopicsTable createAlias(String alias) {
    return $LocalSermonTopicsTable(attachedDatabase, alias);
  }
}

class LocalSermonTopic extends DataClass
    implements Insertable<LocalSermonTopic> {
  final String sermonId;
  final String topic;
  final int sortOrder;
  const LocalSermonTopic({
    required this.sermonId,
    required this.topic,
    required this.sortOrder,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['sermon_id'] = Variable<String>(sermonId);
    map['topic'] = Variable<String>(topic);
    map['sort_order'] = Variable<int>(sortOrder);
    return map;
  }

  LocalSermonTopicsCompanion toCompanion(bool nullToAbsent) {
    return LocalSermonTopicsCompanion(
      sermonId: Value(sermonId),
      topic: Value(topic),
      sortOrder: Value(sortOrder),
    );
  }

  factory LocalSermonTopic.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalSermonTopic(
      sermonId: serializer.fromJson<String>(json['sermonId']),
      topic: serializer.fromJson<String>(json['topic']),
      sortOrder: serializer.fromJson<int>(json['sortOrder']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'sermonId': serializer.toJson<String>(sermonId),
      'topic': serializer.toJson<String>(topic),
      'sortOrder': serializer.toJson<int>(sortOrder),
    };
  }

  LocalSermonTopic copyWith({
    String? sermonId,
    String? topic,
    int? sortOrder,
  }) => LocalSermonTopic(
    sermonId: sermonId ?? this.sermonId,
    topic: topic ?? this.topic,
    sortOrder: sortOrder ?? this.sortOrder,
  );
  LocalSermonTopic copyWithCompanion(LocalSermonTopicsCompanion data) {
    return LocalSermonTopic(
      sermonId: data.sermonId.present ? data.sermonId.value : this.sermonId,
      topic: data.topic.present ? data.topic.value : this.topic,
      sortOrder: data.sortOrder.present ? data.sortOrder.value : this.sortOrder,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalSermonTopic(')
          ..write('sermonId: $sermonId, ')
          ..write('topic: $topic, ')
          ..write('sortOrder: $sortOrder')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(sermonId, topic, sortOrder);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalSermonTopic &&
          other.sermonId == this.sermonId &&
          other.topic == this.topic &&
          other.sortOrder == this.sortOrder);
}

class LocalSermonTopicsCompanion extends UpdateCompanion<LocalSermonTopic> {
  final Value<String> sermonId;
  final Value<String> topic;
  final Value<int> sortOrder;
  final Value<int> rowid;
  const LocalSermonTopicsCompanion({
    this.sermonId = const Value.absent(),
    this.topic = const Value.absent(),
    this.sortOrder = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalSermonTopicsCompanion.insert({
    required String sermonId,
    required String topic,
    required int sortOrder,
    this.rowid = const Value.absent(),
  }) : sermonId = Value(sermonId),
       topic = Value(topic),
       sortOrder = Value(sortOrder);
  static Insertable<LocalSermonTopic> custom({
    Expression<String>? sermonId,
    Expression<String>? topic,
    Expression<int>? sortOrder,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (sermonId != null) 'sermon_id': sermonId,
      if (topic != null) 'topic': topic,
      if (sortOrder != null) 'sort_order': sortOrder,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalSermonTopicsCompanion copyWith({
    Value<String>? sermonId,
    Value<String>? topic,
    Value<int>? sortOrder,
    Value<int>? rowid,
  }) {
    return LocalSermonTopicsCompanion(
      sermonId: sermonId ?? this.sermonId,
      topic: topic ?? this.topic,
      sortOrder: sortOrder ?? this.sortOrder,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (sermonId.present) {
      map['sermon_id'] = Variable<String>(sermonId.value);
    }
    if (topic.present) {
      map['topic'] = Variable<String>(topic.value);
    }
    if (sortOrder.present) {
      map['sort_order'] = Variable<int>(sortOrder.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalSermonTopicsCompanion(')
          ..write('sermonId: $sermonId, ')
          ..write('topic: $topic, ')
          ..write('sortOrder: $sortOrder, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalSermonOutlinesTable extends LocalSermonOutlines
    with TableInfo<$LocalSermonOutlinesTable, LocalSermonOutline> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalSermonOutlinesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sermonIdMeta = const VerificationMeta(
    'sermonId',
  );
  @override
  late final GeneratedColumn<String> sermonId = GeneratedColumn<String>(
    'sermon_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES local_sermons (id)',
    ),
  );
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
    'title',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _summaryMeta = const VerificationMeta(
    'summary',
  );
  @override
  late final GeneratedColumn<String> summary = GeneratedColumn<String>(
    'summary',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _startSecondsMeta = const VerificationMeta(
    'startSeconds',
  );
  @override
  late final GeneratedColumn<int> startSeconds = GeneratedColumn<int>(
    'start_seconds',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sortOrderMeta = const VerificationMeta(
    'sortOrder',
  );
  @override
  late final GeneratedColumn<int> sortOrder = GeneratedColumn<int>(
    'sort_order',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    sermonId,
    title,
    summary,
    startSeconds,
    sortOrder,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_sermon_outlines';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalSermonOutline> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('sermon_id')) {
      context.handle(
        _sermonIdMeta,
        sermonId.isAcceptableOrUnknown(data['sermon_id']!, _sermonIdMeta),
      );
    } else if (isInserting) {
      context.missing(_sermonIdMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
        _titleMeta,
        title.isAcceptableOrUnknown(data['title']!, _titleMeta),
      );
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('summary')) {
      context.handle(
        _summaryMeta,
        summary.isAcceptableOrUnknown(data['summary']!, _summaryMeta),
      );
    } else if (isInserting) {
      context.missing(_summaryMeta);
    }
    if (data.containsKey('start_seconds')) {
      context.handle(
        _startSecondsMeta,
        startSeconds.isAcceptableOrUnknown(
          data['start_seconds']!,
          _startSecondsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_startSecondsMeta);
    }
    if (data.containsKey('sort_order')) {
      context.handle(
        _sortOrderMeta,
        sortOrder.isAcceptableOrUnknown(data['sort_order']!, _sortOrderMeta),
      );
    } else if (isInserting) {
      context.missing(_sortOrderMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalSermonOutline map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalSermonOutline(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      sermonId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sermon_id'],
      )!,
      title: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}title'],
      )!,
      summary: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}summary'],
      )!,
      startSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}start_seconds'],
      )!,
      sortOrder: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}sort_order'],
      )!,
    );
  }

  @override
  $LocalSermonOutlinesTable createAlias(String alias) {
    return $LocalSermonOutlinesTable(attachedDatabase, alias);
  }
}

class LocalSermonOutline extends DataClass
    implements Insertable<LocalSermonOutline> {
  final String id;
  final String sermonId;
  final String title;
  final String summary;
  final int startSeconds;
  final int sortOrder;
  const LocalSermonOutline({
    required this.id,
    required this.sermonId,
    required this.title,
    required this.summary,
    required this.startSeconds,
    required this.sortOrder,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['sermon_id'] = Variable<String>(sermonId);
    map['title'] = Variable<String>(title);
    map['summary'] = Variable<String>(summary);
    map['start_seconds'] = Variable<int>(startSeconds);
    map['sort_order'] = Variable<int>(sortOrder);
    return map;
  }

  LocalSermonOutlinesCompanion toCompanion(bool nullToAbsent) {
    return LocalSermonOutlinesCompanion(
      id: Value(id),
      sermonId: Value(sermonId),
      title: Value(title),
      summary: Value(summary),
      startSeconds: Value(startSeconds),
      sortOrder: Value(sortOrder),
    );
  }

  factory LocalSermonOutline.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalSermonOutline(
      id: serializer.fromJson<String>(json['id']),
      sermonId: serializer.fromJson<String>(json['sermonId']),
      title: serializer.fromJson<String>(json['title']),
      summary: serializer.fromJson<String>(json['summary']),
      startSeconds: serializer.fromJson<int>(json['startSeconds']),
      sortOrder: serializer.fromJson<int>(json['sortOrder']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'sermonId': serializer.toJson<String>(sermonId),
      'title': serializer.toJson<String>(title),
      'summary': serializer.toJson<String>(summary),
      'startSeconds': serializer.toJson<int>(startSeconds),
      'sortOrder': serializer.toJson<int>(sortOrder),
    };
  }

  LocalSermonOutline copyWith({
    String? id,
    String? sermonId,
    String? title,
    String? summary,
    int? startSeconds,
    int? sortOrder,
  }) => LocalSermonOutline(
    id: id ?? this.id,
    sermonId: sermonId ?? this.sermonId,
    title: title ?? this.title,
    summary: summary ?? this.summary,
    startSeconds: startSeconds ?? this.startSeconds,
    sortOrder: sortOrder ?? this.sortOrder,
  );
  LocalSermonOutline copyWithCompanion(LocalSermonOutlinesCompanion data) {
    return LocalSermonOutline(
      id: data.id.present ? data.id.value : this.id,
      sermonId: data.sermonId.present ? data.sermonId.value : this.sermonId,
      title: data.title.present ? data.title.value : this.title,
      summary: data.summary.present ? data.summary.value : this.summary,
      startSeconds: data.startSeconds.present
          ? data.startSeconds.value
          : this.startSeconds,
      sortOrder: data.sortOrder.present ? data.sortOrder.value : this.sortOrder,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalSermonOutline(')
          ..write('id: $id, ')
          ..write('sermonId: $sermonId, ')
          ..write('title: $title, ')
          ..write('summary: $summary, ')
          ..write('startSeconds: $startSeconds, ')
          ..write('sortOrder: $sortOrder')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, sermonId, title, summary, startSeconds, sortOrder);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalSermonOutline &&
          other.id == this.id &&
          other.sermonId == this.sermonId &&
          other.title == this.title &&
          other.summary == this.summary &&
          other.startSeconds == this.startSeconds &&
          other.sortOrder == this.sortOrder);
}

class LocalSermonOutlinesCompanion extends UpdateCompanion<LocalSermonOutline> {
  final Value<String> id;
  final Value<String> sermonId;
  final Value<String> title;
  final Value<String> summary;
  final Value<int> startSeconds;
  final Value<int> sortOrder;
  final Value<int> rowid;
  const LocalSermonOutlinesCompanion({
    this.id = const Value.absent(),
    this.sermonId = const Value.absent(),
    this.title = const Value.absent(),
    this.summary = const Value.absent(),
    this.startSeconds = const Value.absent(),
    this.sortOrder = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalSermonOutlinesCompanion.insert({
    required String id,
    required String sermonId,
    required String title,
    required String summary,
    required int startSeconds,
    required int sortOrder,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       sermonId = Value(sermonId),
       title = Value(title),
       summary = Value(summary),
       startSeconds = Value(startSeconds),
       sortOrder = Value(sortOrder);
  static Insertable<LocalSermonOutline> custom({
    Expression<String>? id,
    Expression<String>? sermonId,
    Expression<String>? title,
    Expression<String>? summary,
    Expression<int>? startSeconds,
    Expression<int>? sortOrder,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (sermonId != null) 'sermon_id': sermonId,
      if (title != null) 'title': title,
      if (summary != null) 'summary': summary,
      if (startSeconds != null) 'start_seconds': startSeconds,
      if (sortOrder != null) 'sort_order': sortOrder,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalSermonOutlinesCompanion copyWith({
    Value<String>? id,
    Value<String>? sermonId,
    Value<String>? title,
    Value<String>? summary,
    Value<int>? startSeconds,
    Value<int>? sortOrder,
    Value<int>? rowid,
  }) {
    return LocalSermonOutlinesCompanion(
      id: id ?? this.id,
      sermonId: sermonId ?? this.sermonId,
      title: title ?? this.title,
      summary: summary ?? this.summary,
      startSeconds: startSeconds ?? this.startSeconds,
      sortOrder: sortOrder ?? this.sortOrder,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (sermonId.present) {
      map['sermon_id'] = Variable<String>(sermonId.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (summary.present) {
      map['summary'] = Variable<String>(summary.value);
    }
    if (startSeconds.present) {
      map['start_seconds'] = Variable<int>(startSeconds.value);
    }
    if (sortOrder.present) {
      map['sort_order'] = Variable<int>(sortOrder.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalSermonOutlinesCompanion(')
          ..write('id: $id, ')
          ..write('sermonId: $sermonId, ')
          ..write('title: $title, ')
          ..write('summary: $summary, ')
          ..write('startSeconds: $startSeconds, ')
          ..write('sortOrder: $sortOrder, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalSermonReferencesTable extends LocalSermonReferences
    with TableInfo<$LocalSermonReferencesTable, LocalSermonReference> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalSermonReferencesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sermonIdMeta = const VerificationMeta(
    'sermonId',
  );
  @override
  late final GeneratedColumn<String> sermonId = GeneratedColumn<String>(
    'sermon_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES local_sermons (id)',
    ),
  );
  static const VerificationMeta _verseIdMeta = const VerificationMeta(
    'verseId',
  );
  @override
  late final GeneratedColumn<String> verseId = GeneratedColumn<String>(
    'verse_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _referenceTextMeta = const VerificationMeta(
    'referenceText',
  );
  @override
  late final GeneratedColumn<String> referenceText = GeneratedColumn<String>(
    'reference_text',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _noteMeta = const VerificationMeta('note');
  @override
  late final GeneratedColumn<String> note = GeneratedColumn<String>(
    'note',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _startSecondsMeta = const VerificationMeta(
    'startSeconds',
  );
  @override
  late final GeneratedColumn<int> startSeconds = GeneratedColumn<int>(
    'start_seconds',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    sermonId,
    verseId,
    referenceText,
    note,
    startSeconds,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_sermon_references';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalSermonReference> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('sermon_id')) {
      context.handle(
        _sermonIdMeta,
        sermonId.isAcceptableOrUnknown(data['sermon_id']!, _sermonIdMeta),
      );
    } else if (isInserting) {
      context.missing(_sermonIdMeta);
    }
    if (data.containsKey('verse_id')) {
      context.handle(
        _verseIdMeta,
        verseId.isAcceptableOrUnknown(data['verse_id']!, _verseIdMeta),
      );
    } else if (isInserting) {
      context.missing(_verseIdMeta);
    }
    if (data.containsKey('reference_text')) {
      context.handle(
        _referenceTextMeta,
        referenceText.isAcceptableOrUnknown(
          data['reference_text']!,
          _referenceTextMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_referenceTextMeta);
    }
    if (data.containsKey('note')) {
      context.handle(
        _noteMeta,
        note.isAcceptableOrUnknown(data['note']!, _noteMeta),
      );
    }
    if (data.containsKey('start_seconds')) {
      context.handle(
        _startSecondsMeta,
        startSeconds.isAcceptableOrUnknown(
          data['start_seconds']!,
          _startSecondsMeta,
        ),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalSermonReference map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalSermonReference(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      sermonId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sermon_id'],
      )!,
      verseId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}verse_id'],
      )!,
      referenceText: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}reference_text'],
      )!,
      note: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}note'],
      ),
      startSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}start_seconds'],
      ),
    );
  }

  @override
  $LocalSermonReferencesTable createAlias(String alias) {
    return $LocalSermonReferencesTable(attachedDatabase, alias);
  }
}

class LocalSermonReference extends DataClass
    implements Insertable<LocalSermonReference> {
  final String id;
  final String sermonId;
  final String verseId;
  final String referenceText;
  final String? note;
  final int? startSeconds;
  const LocalSermonReference({
    required this.id,
    required this.sermonId,
    required this.verseId,
    required this.referenceText,
    this.note,
    this.startSeconds,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['sermon_id'] = Variable<String>(sermonId);
    map['verse_id'] = Variable<String>(verseId);
    map['reference_text'] = Variable<String>(referenceText);
    if (!nullToAbsent || note != null) {
      map['note'] = Variable<String>(note);
    }
    if (!nullToAbsent || startSeconds != null) {
      map['start_seconds'] = Variable<int>(startSeconds);
    }
    return map;
  }

  LocalSermonReferencesCompanion toCompanion(bool nullToAbsent) {
    return LocalSermonReferencesCompanion(
      id: Value(id),
      sermonId: Value(sermonId),
      verseId: Value(verseId),
      referenceText: Value(referenceText),
      note: note == null && nullToAbsent ? const Value.absent() : Value(note),
      startSeconds: startSeconds == null && nullToAbsent
          ? const Value.absent()
          : Value(startSeconds),
    );
  }

  factory LocalSermonReference.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalSermonReference(
      id: serializer.fromJson<String>(json['id']),
      sermonId: serializer.fromJson<String>(json['sermonId']),
      verseId: serializer.fromJson<String>(json['verseId']),
      referenceText: serializer.fromJson<String>(json['referenceText']),
      note: serializer.fromJson<String?>(json['note']),
      startSeconds: serializer.fromJson<int?>(json['startSeconds']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'sermonId': serializer.toJson<String>(sermonId),
      'verseId': serializer.toJson<String>(verseId),
      'referenceText': serializer.toJson<String>(referenceText),
      'note': serializer.toJson<String?>(note),
      'startSeconds': serializer.toJson<int?>(startSeconds),
    };
  }

  LocalSermonReference copyWith({
    String? id,
    String? sermonId,
    String? verseId,
    String? referenceText,
    Value<String?> note = const Value.absent(),
    Value<int?> startSeconds = const Value.absent(),
  }) => LocalSermonReference(
    id: id ?? this.id,
    sermonId: sermonId ?? this.sermonId,
    verseId: verseId ?? this.verseId,
    referenceText: referenceText ?? this.referenceText,
    note: note.present ? note.value : this.note,
    startSeconds: startSeconds.present ? startSeconds.value : this.startSeconds,
  );
  LocalSermonReference copyWithCompanion(LocalSermonReferencesCompanion data) {
    return LocalSermonReference(
      id: data.id.present ? data.id.value : this.id,
      sermonId: data.sermonId.present ? data.sermonId.value : this.sermonId,
      verseId: data.verseId.present ? data.verseId.value : this.verseId,
      referenceText: data.referenceText.present
          ? data.referenceText.value
          : this.referenceText,
      note: data.note.present ? data.note.value : this.note,
      startSeconds: data.startSeconds.present
          ? data.startSeconds.value
          : this.startSeconds,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalSermonReference(')
          ..write('id: $id, ')
          ..write('sermonId: $sermonId, ')
          ..write('verseId: $verseId, ')
          ..write('referenceText: $referenceText, ')
          ..write('note: $note, ')
          ..write('startSeconds: $startSeconds')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, sermonId, verseId, referenceText, note, startSeconds);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalSermonReference &&
          other.id == this.id &&
          other.sermonId == this.sermonId &&
          other.verseId == this.verseId &&
          other.referenceText == this.referenceText &&
          other.note == this.note &&
          other.startSeconds == this.startSeconds);
}

class LocalSermonReferencesCompanion
    extends UpdateCompanion<LocalSermonReference> {
  final Value<String> id;
  final Value<String> sermonId;
  final Value<String> verseId;
  final Value<String> referenceText;
  final Value<String?> note;
  final Value<int?> startSeconds;
  final Value<int> rowid;
  const LocalSermonReferencesCompanion({
    this.id = const Value.absent(),
    this.sermonId = const Value.absent(),
    this.verseId = const Value.absent(),
    this.referenceText = const Value.absent(),
    this.note = const Value.absent(),
    this.startSeconds = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalSermonReferencesCompanion.insert({
    required String id,
    required String sermonId,
    required String verseId,
    required String referenceText,
    this.note = const Value.absent(),
    this.startSeconds = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       sermonId = Value(sermonId),
       verseId = Value(verseId),
       referenceText = Value(referenceText);
  static Insertable<LocalSermonReference> custom({
    Expression<String>? id,
    Expression<String>? sermonId,
    Expression<String>? verseId,
    Expression<String>? referenceText,
    Expression<String>? note,
    Expression<int>? startSeconds,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (sermonId != null) 'sermon_id': sermonId,
      if (verseId != null) 'verse_id': verseId,
      if (referenceText != null) 'reference_text': referenceText,
      if (note != null) 'note': note,
      if (startSeconds != null) 'start_seconds': startSeconds,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalSermonReferencesCompanion copyWith({
    Value<String>? id,
    Value<String>? sermonId,
    Value<String>? verseId,
    Value<String>? referenceText,
    Value<String?>? note,
    Value<int?>? startSeconds,
    Value<int>? rowid,
  }) {
    return LocalSermonReferencesCompanion(
      id: id ?? this.id,
      sermonId: sermonId ?? this.sermonId,
      verseId: verseId ?? this.verseId,
      referenceText: referenceText ?? this.referenceText,
      note: note ?? this.note,
      startSeconds: startSeconds ?? this.startSeconds,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (sermonId.present) {
      map['sermon_id'] = Variable<String>(sermonId.value);
    }
    if (verseId.present) {
      map['verse_id'] = Variable<String>(verseId.value);
    }
    if (referenceText.present) {
      map['reference_text'] = Variable<String>(referenceText.value);
    }
    if (note.present) {
      map['note'] = Variable<String>(note.value);
    }
    if (startSeconds.present) {
      map['start_seconds'] = Variable<int>(startSeconds.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalSermonReferencesCompanion(')
          ..write('id: $id, ')
          ..write('sermonId: $sermonId, ')
          ..write('verseId: $verseId, ')
          ..write('referenceText: $referenceText, ')
          ..write('note: $note, ')
          ..write('startSeconds: $startSeconds, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $LocalLifePostsTable extends LocalLifePosts
    with TableInfo<$LocalLifePostsTable, LocalLifePost> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $LocalLifePostsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _typeMeta = const VerificationMeta('type');
  @override
  late final GeneratedColumn<String> type = GeneratedColumn<String>(
    'type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
    'title',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _bodyMeta = const VerificationMeta('body');
  @override
  late final GeneratedColumn<String> body = GeneratedColumn<String>(
    'body',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _metaMeta = const VerificationMeta('meta');
  @override
  late final GeneratedColumn<String> meta = GeneratedColumn<String>(
    'meta',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant(''),
  );
  static const VerificationMeta _iconNameMeta = const VerificationMeta(
    'iconName',
  );
  @override
  late final GeneratedColumn<String> iconName = GeneratedColumn<String>(
    'icon_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('church'),
  );
  static const VerificationMeta _startsAtMeta = const VerificationMeta(
    'startsAt',
  );
  @override
  late final GeneratedColumn<DateTime> startsAt = GeneratedColumn<DateTime>(
    'starts_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _endsAtMeta = const VerificationMeta('endsAt');
  @override
  late final GeneratedColumn<DateTime> endsAt = GeneratedColumn<DateTime>(
    'ends_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _visibilityMeta = const VerificationMeta(
    'visibility',
  );
  @override
  late final GeneratedColumn<String> visibility = GeneratedColumn<String>(
    'visibility',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('published'),
  );
  static const VerificationMeta _imageUrlMeta = const VerificationMeta(
    'imageUrl',
  );
  @override
  late final GeneratedColumn<String> imageUrl = GeneratedColumn<String>(
    'image_url',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _displayWeightMeta = const VerificationMeta(
    'displayWeight',
  );
  @override
  late final GeneratedColumn<int> displayWeight = GeneratedColumn<int>(
    'display_weight',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _ctaLabelMeta = const VerificationMeta(
    'ctaLabel',
  );
  @override
  late final GeneratedColumn<String> ctaLabel = GeneratedColumn<String>(
    'cta_label',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _ctaUrlMeta = const VerificationMeta('ctaUrl');
  @override
  late final GeneratedColumn<String> ctaUrl = GeneratedColumn<String>(
    'cta_url',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    type,
    title,
    body,
    meta,
    iconName,
    startsAt,
    endsAt,
    visibility,
    status,
    imageUrl,
    displayWeight,
    ctaLabel,
    ctaUrl,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'local_life_posts';
  @override
  VerificationContext validateIntegrity(
    Insertable<LocalLifePost> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('type')) {
      context.handle(
        _typeMeta,
        type.isAcceptableOrUnknown(data['type']!, _typeMeta),
      );
    } else if (isInserting) {
      context.missing(_typeMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
        _titleMeta,
        title.isAcceptableOrUnknown(data['title']!, _titleMeta),
      );
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('body')) {
      context.handle(
        _bodyMeta,
        body.isAcceptableOrUnknown(data['body']!, _bodyMeta),
      );
    } else if (isInserting) {
      context.missing(_bodyMeta);
    }
    if (data.containsKey('meta')) {
      context.handle(
        _metaMeta,
        meta.isAcceptableOrUnknown(data['meta']!, _metaMeta),
      );
    }
    if (data.containsKey('icon_name')) {
      context.handle(
        _iconNameMeta,
        iconName.isAcceptableOrUnknown(data['icon_name']!, _iconNameMeta),
      );
    }
    if (data.containsKey('starts_at')) {
      context.handle(
        _startsAtMeta,
        startsAt.isAcceptableOrUnknown(data['starts_at']!, _startsAtMeta),
      );
    }
    if (data.containsKey('ends_at')) {
      context.handle(
        _endsAtMeta,
        endsAt.isAcceptableOrUnknown(data['ends_at']!, _endsAtMeta),
      );
    }
    if (data.containsKey('visibility')) {
      context.handle(
        _visibilityMeta,
        visibility.isAcceptableOrUnknown(data['visibility']!, _visibilityMeta),
      );
    } else if (isInserting) {
      context.missing(_visibilityMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    }
    if (data.containsKey('image_url')) {
      context.handle(
        _imageUrlMeta,
        imageUrl.isAcceptableOrUnknown(data['image_url']!, _imageUrlMeta),
      );
    }
    if (data.containsKey('display_weight')) {
      context.handle(
        _displayWeightMeta,
        displayWeight.isAcceptableOrUnknown(
          data['display_weight']!,
          _displayWeightMeta,
        ),
      );
    }
    if (data.containsKey('cta_label')) {
      context.handle(
        _ctaLabelMeta,
        ctaLabel.isAcceptableOrUnknown(data['cta_label']!, _ctaLabelMeta),
      );
    }
    if (data.containsKey('cta_url')) {
      context.handle(
        _ctaUrlMeta,
        ctaUrl.isAcceptableOrUnknown(data['cta_url']!, _ctaUrlMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  LocalLifePost map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return LocalLifePost(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      type: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}type'],
      )!,
      title: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}title'],
      )!,
      body: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}body'],
      )!,
      meta: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}meta'],
      )!,
      iconName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}icon_name'],
      )!,
      startsAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}starts_at'],
      ),
      endsAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}ends_at'],
      ),
      visibility: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}visibility'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      imageUrl: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}image_url'],
      ),
      displayWeight: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}display_weight'],
      )!,
      ctaLabel: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cta_label'],
      ),
      ctaUrl: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cta_url'],
      ),
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $LocalLifePostsTable createAlias(String alias) {
    return $LocalLifePostsTable(attachedDatabase, alias);
  }
}

class LocalLifePost extends DataClass implements Insertable<LocalLifePost> {
  final String id;
  final String type;
  final String title;
  final String body;
  final String meta;
  final String iconName;
  final DateTime? startsAt;
  final DateTime? endsAt;
  final String visibility;
  final String status;
  final String? imageUrl;
  final int displayWeight;
  final String? ctaLabel;
  final String? ctaUrl;
  final DateTime updatedAt;
  const LocalLifePost({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.meta,
    required this.iconName,
    this.startsAt,
    this.endsAt,
    required this.visibility,
    required this.status,
    this.imageUrl,
    required this.displayWeight,
    this.ctaLabel,
    this.ctaUrl,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['type'] = Variable<String>(type);
    map['title'] = Variable<String>(title);
    map['body'] = Variable<String>(body);
    map['meta'] = Variable<String>(meta);
    map['icon_name'] = Variable<String>(iconName);
    if (!nullToAbsent || startsAt != null) {
      map['starts_at'] = Variable<DateTime>(startsAt);
    }
    if (!nullToAbsent || endsAt != null) {
      map['ends_at'] = Variable<DateTime>(endsAt);
    }
    map['visibility'] = Variable<String>(visibility);
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || imageUrl != null) {
      map['image_url'] = Variable<String>(imageUrl);
    }
    map['display_weight'] = Variable<int>(displayWeight);
    if (!nullToAbsent || ctaLabel != null) {
      map['cta_label'] = Variable<String>(ctaLabel);
    }
    if (!nullToAbsent || ctaUrl != null) {
      map['cta_url'] = Variable<String>(ctaUrl);
    }
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  LocalLifePostsCompanion toCompanion(bool nullToAbsent) {
    return LocalLifePostsCompanion(
      id: Value(id),
      type: Value(type),
      title: Value(title),
      body: Value(body),
      meta: Value(meta),
      iconName: Value(iconName),
      startsAt: startsAt == null && nullToAbsent
          ? const Value.absent()
          : Value(startsAt),
      endsAt: endsAt == null && nullToAbsent
          ? const Value.absent()
          : Value(endsAt),
      visibility: Value(visibility),
      status: Value(status),
      imageUrl: imageUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(imageUrl),
      displayWeight: Value(displayWeight),
      ctaLabel: ctaLabel == null && nullToAbsent
          ? const Value.absent()
          : Value(ctaLabel),
      ctaUrl: ctaUrl == null && nullToAbsent
          ? const Value.absent()
          : Value(ctaUrl),
      updatedAt: Value(updatedAt),
    );
  }

  factory LocalLifePost.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return LocalLifePost(
      id: serializer.fromJson<String>(json['id']),
      type: serializer.fromJson<String>(json['type']),
      title: serializer.fromJson<String>(json['title']),
      body: serializer.fromJson<String>(json['body']),
      meta: serializer.fromJson<String>(json['meta']),
      iconName: serializer.fromJson<String>(json['iconName']),
      startsAt: serializer.fromJson<DateTime?>(json['startsAt']),
      endsAt: serializer.fromJson<DateTime?>(json['endsAt']),
      visibility: serializer.fromJson<String>(json['visibility']),
      status: serializer.fromJson<String>(json['status']),
      imageUrl: serializer.fromJson<String?>(json['imageUrl']),
      displayWeight: serializer.fromJson<int>(json['displayWeight']),
      ctaLabel: serializer.fromJson<String?>(json['ctaLabel']),
      ctaUrl: serializer.fromJson<String?>(json['ctaUrl']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'type': serializer.toJson<String>(type),
      'title': serializer.toJson<String>(title),
      'body': serializer.toJson<String>(body),
      'meta': serializer.toJson<String>(meta),
      'iconName': serializer.toJson<String>(iconName),
      'startsAt': serializer.toJson<DateTime?>(startsAt),
      'endsAt': serializer.toJson<DateTime?>(endsAt),
      'visibility': serializer.toJson<String>(visibility),
      'status': serializer.toJson<String>(status),
      'imageUrl': serializer.toJson<String?>(imageUrl),
      'displayWeight': serializer.toJson<int>(displayWeight),
      'ctaLabel': serializer.toJson<String?>(ctaLabel),
      'ctaUrl': serializer.toJson<String?>(ctaUrl),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  LocalLifePost copyWith({
    String? id,
    String? type,
    String? title,
    String? body,
    String? meta,
    String? iconName,
    Value<DateTime?> startsAt = const Value.absent(),
    Value<DateTime?> endsAt = const Value.absent(),
    String? visibility,
    String? status,
    Value<String?> imageUrl = const Value.absent(),
    int? displayWeight,
    Value<String?> ctaLabel = const Value.absent(),
    Value<String?> ctaUrl = const Value.absent(),
    DateTime? updatedAt,
  }) => LocalLifePost(
    id: id ?? this.id,
    type: type ?? this.type,
    title: title ?? this.title,
    body: body ?? this.body,
    meta: meta ?? this.meta,
    iconName: iconName ?? this.iconName,
    startsAt: startsAt.present ? startsAt.value : this.startsAt,
    endsAt: endsAt.present ? endsAt.value : this.endsAt,
    visibility: visibility ?? this.visibility,
    status: status ?? this.status,
    imageUrl: imageUrl.present ? imageUrl.value : this.imageUrl,
    displayWeight: displayWeight ?? this.displayWeight,
    ctaLabel: ctaLabel.present ? ctaLabel.value : this.ctaLabel,
    ctaUrl: ctaUrl.present ? ctaUrl.value : this.ctaUrl,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  LocalLifePost copyWithCompanion(LocalLifePostsCompanion data) {
    return LocalLifePost(
      id: data.id.present ? data.id.value : this.id,
      type: data.type.present ? data.type.value : this.type,
      title: data.title.present ? data.title.value : this.title,
      body: data.body.present ? data.body.value : this.body,
      meta: data.meta.present ? data.meta.value : this.meta,
      iconName: data.iconName.present ? data.iconName.value : this.iconName,
      startsAt: data.startsAt.present ? data.startsAt.value : this.startsAt,
      endsAt: data.endsAt.present ? data.endsAt.value : this.endsAt,
      visibility: data.visibility.present
          ? data.visibility.value
          : this.visibility,
      status: data.status.present ? data.status.value : this.status,
      imageUrl: data.imageUrl.present ? data.imageUrl.value : this.imageUrl,
      displayWeight: data.displayWeight.present
          ? data.displayWeight.value
          : this.displayWeight,
      ctaLabel: data.ctaLabel.present ? data.ctaLabel.value : this.ctaLabel,
      ctaUrl: data.ctaUrl.present ? data.ctaUrl.value : this.ctaUrl,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('LocalLifePost(')
          ..write('id: $id, ')
          ..write('type: $type, ')
          ..write('title: $title, ')
          ..write('body: $body, ')
          ..write('meta: $meta, ')
          ..write('iconName: $iconName, ')
          ..write('startsAt: $startsAt, ')
          ..write('endsAt: $endsAt, ')
          ..write('visibility: $visibility, ')
          ..write('status: $status, ')
          ..write('imageUrl: $imageUrl, ')
          ..write('displayWeight: $displayWeight, ')
          ..write('ctaLabel: $ctaLabel, ')
          ..write('ctaUrl: $ctaUrl, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    type,
    title,
    body,
    meta,
    iconName,
    startsAt,
    endsAt,
    visibility,
    status,
    imageUrl,
    displayWeight,
    ctaLabel,
    ctaUrl,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is LocalLifePost &&
          other.id == this.id &&
          other.type == this.type &&
          other.title == this.title &&
          other.body == this.body &&
          other.meta == this.meta &&
          other.iconName == this.iconName &&
          other.startsAt == this.startsAt &&
          other.endsAt == this.endsAt &&
          other.visibility == this.visibility &&
          other.status == this.status &&
          other.imageUrl == this.imageUrl &&
          other.displayWeight == this.displayWeight &&
          other.ctaLabel == this.ctaLabel &&
          other.ctaUrl == this.ctaUrl &&
          other.updatedAt == this.updatedAt);
}

class LocalLifePostsCompanion extends UpdateCompanion<LocalLifePost> {
  final Value<String> id;
  final Value<String> type;
  final Value<String> title;
  final Value<String> body;
  final Value<String> meta;
  final Value<String> iconName;
  final Value<DateTime?> startsAt;
  final Value<DateTime?> endsAt;
  final Value<String> visibility;
  final Value<String> status;
  final Value<String?> imageUrl;
  final Value<int> displayWeight;
  final Value<String?> ctaLabel;
  final Value<String?> ctaUrl;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const LocalLifePostsCompanion({
    this.id = const Value.absent(),
    this.type = const Value.absent(),
    this.title = const Value.absent(),
    this.body = const Value.absent(),
    this.meta = const Value.absent(),
    this.iconName = const Value.absent(),
    this.startsAt = const Value.absent(),
    this.endsAt = const Value.absent(),
    this.visibility = const Value.absent(),
    this.status = const Value.absent(),
    this.imageUrl = const Value.absent(),
    this.displayWeight = const Value.absent(),
    this.ctaLabel = const Value.absent(),
    this.ctaUrl = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  LocalLifePostsCompanion.insert({
    required String id,
    required String type,
    required String title,
    required String body,
    this.meta = const Value.absent(),
    this.iconName = const Value.absent(),
    this.startsAt = const Value.absent(),
    this.endsAt = const Value.absent(),
    required String visibility,
    this.status = const Value.absent(),
    this.imageUrl = const Value.absent(),
    this.displayWeight = const Value.absent(),
    this.ctaLabel = const Value.absent(),
    this.ctaUrl = const Value.absent(),
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       type = Value(type),
       title = Value(title),
       body = Value(body),
       visibility = Value(visibility),
       updatedAt = Value(updatedAt);
  static Insertable<LocalLifePost> custom({
    Expression<String>? id,
    Expression<String>? type,
    Expression<String>? title,
    Expression<String>? body,
    Expression<String>? meta,
    Expression<String>? iconName,
    Expression<DateTime>? startsAt,
    Expression<DateTime>? endsAt,
    Expression<String>? visibility,
    Expression<String>? status,
    Expression<String>? imageUrl,
    Expression<int>? displayWeight,
    Expression<String>? ctaLabel,
    Expression<String>? ctaUrl,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (type != null) 'type': type,
      if (title != null) 'title': title,
      if (body != null) 'body': body,
      if (meta != null) 'meta': meta,
      if (iconName != null) 'icon_name': iconName,
      if (startsAt != null) 'starts_at': startsAt,
      if (endsAt != null) 'ends_at': endsAt,
      if (visibility != null) 'visibility': visibility,
      if (status != null) 'status': status,
      if (imageUrl != null) 'image_url': imageUrl,
      if (displayWeight != null) 'display_weight': displayWeight,
      if (ctaLabel != null) 'cta_label': ctaLabel,
      if (ctaUrl != null) 'cta_url': ctaUrl,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  LocalLifePostsCompanion copyWith({
    Value<String>? id,
    Value<String>? type,
    Value<String>? title,
    Value<String>? body,
    Value<String>? meta,
    Value<String>? iconName,
    Value<DateTime?>? startsAt,
    Value<DateTime?>? endsAt,
    Value<String>? visibility,
    Value<String>? status,
    Value<String?>? imageUrl,
    Value<int>? displayWeight,
    Value<String?>? ctaLabel,
    Value<String?>? ctaUrl,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return LocalLifePostsCompanion(
      id: id ?? this.id,
      type: type ?? this.type,
      title: title ?? this.title,
      body: body ?? this.body,
      meta: meta ?? this.meta,
      iconName: iconName ?? this.iconName,
      startsAt: startsAt ?? this.startsAt,
      endsAt: endsAt ?? this.endsAt,
      visibility: visibility ?? this.visibility,
      status: status ?? this.status,
      imageUrl: imageUrl ?? this.imageUrl,
      displayWeight: displayWeight ?? this.displayWeight,
      ctaLabel: ctaLabel ?? this.ctaLabel,
      ctaUrl: ctaUrl ?? this.ctaUrl,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (type.present) {
      map['type'] = Variable<String>(type.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (body.present) {
      map['body'] = Variable<String>(body.value);
    }
    if (meta.present) {
      map['meta'] = Variable<String>(meta.value);
    }
    if (iconName.present) {
      map['icon_name'] = Variable<String>(iconName.value);
    }
    if (startsAt.present) {
      map['starts_at'] = Variable<DateTime>(startsAt.value);
    }
    if (endsAt.present) {
      map['ends_at'] = Variable<DateTime>(endsAt.value);
    }
    if (visibility.present) {
      map['visibility'] = Variable<String>(visibility.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (imageUrl.present) {
      map['image_url'] = Variable<String>(imageUrl.value);
    }
    if (displayWeight.present) {
      map['display_weight'] = Variable<int>(displayWeight.value);
    }
    if (ctaLabel.present) {
      map['cta_label'] = Variable<String>(ctaLabel.value);
    }
    if (ctaUrl.present) {
      map['cta_url'] = Variable<String>(ctaUrl.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('LocalLifePostsCompanion(')
          ..write('id: $id, ')
          ..write('type: $type, ')
          ..write('title: $title, ')
          ..write('body: $body, ')
          ..write('meta: $meta, ')
          ..write('iconName: $iconName, ')
          ..write('startsAt: $startsAt, ')
          ..write('endsAt: $endsAt, ')
          ..write('visibility: $visibility, ')
          ..write('status: $status, ')
          ..write('imageUrl: $imageUrl, ')
          ..write('displayWeight: $displayWeight, ')
          ..write('ctaLabel: $ctaLabel, ')
          ..write('ctaUrl: $ctaUrl, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $ReadingProgressTable extends ReadingProgress
    with TableInfo<$ReadingProgressTable, ReadingProgressData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ReadingProgressTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _bookIdMeta = const VerificationMeta('bookId');
  @override
  late final GeneratedColumn<String> bookId = GeneratedColumn<String>(
    'book_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES local_bible_books (id)',
    ),
  );
  static const VerificationMeta _chapterMeta = const VerificationMeta(
    'chapter',
  );
  @override
  late final GeneratedColumn<int> chapter = GeneratedColumn<int>(
    'chapter',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _verseIdMeta = const VerificationMeta(
    'verseId',
  );
  @override
  late final GeneratedColumn<String> verseId = GeneratedColumn<String>(
    'verse_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    bookId,
    chapter,
    verseId,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'reading_progress';
  @override
  VerificationContext validateIntegrity(
    Insertable<ReadingProgressData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('book_id')) {
      context.handle(
        _bookIdMeta,
        bookId.isAcceptableOrUnknown(data['book_id']!, _bookIdMeta),
      );
    } else if (isInserting) {
      context.missing(_bookIdMeta);
    }
    if (data.containsKey('chapter')) {
      context.handle(
        _chapterMeta,
        chapter.isAcceptableOrUnknown(data['chapter']!, _chapterMeta),
      );
    } else if (isInserting) {
      context.missing(_chapterMeta);
    }
    if (data.containsKey('verse_id')) {
      context.handle(
        _verseIdMeta,
        verseId.isAcceptableOrUnknown(data['verse_id']!, _verseIdMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  ReadingProgressData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ReadingProgressData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      bookId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}book_id'],
      )!,
      chapter: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}chapter'],
      )!,
      verseId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}verse_id'],
      ),
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $ReadingProgressTable createAlias(String alias) {
    return $ReadingProgressTable(attachedDatabase, alias);
  }
}

class ReadingProgressData extends DataClass
    implements Insertable<ReadingProgressData> {
  final String id;
  final String bookId;
  final int chapter;
  final String? verseId;
  final DateTime updatedAt;
  const ReadingProgressData({
    required this.id,
    required this.bookId,
    required this.chapter,
    this.verseId,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['book_id'] = Variable<String>(bookId);
    map['chapter'] = Variable<int>(chapter);
    if (!nullToAbsent || verseId != null) {
      map['verse_id'] = Variable<String>(verseId);
    }
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  ReadingProgressCompanion toCompanion(bool nullToAbsent) {
    return ReadingProgressCompanion(
      id: Value(id),
      bookId: Value(bookId),
      chapter: Value(chapter),
      verseId: verseId == null && nullToAbsent
          ? const Value.absent()
          : Value(verseId),
      updatedAt: Value(updatedAt),
    );
  }

  factory ReadingProgressData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ReadingProgressData(
      id: serializer.fromJson<String>(json['id']),
      bookId: serializer.fromJson<String>(json['bookId']),
      chapter: serializer.fromJson<int>(json['chapter']),
      verseId: serializer.fromJson<String?>(json['verseId']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'bookId': serializer.toJson<String>(bookId),
      'chapter': serializer.toJson<int>(chapter),
      'verseId': serializer.toJson<String?>(verseId),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  ReadingProgressData copyWith({
    String? id,
    String? bookId,
    int? chapter,
    Value<String?> verseId = const Value.absent(),
    DateTime? updatedAt,
  }) => ReadingProgressData(
    id: id ?? this.id,
    bookId: bookId ?? this.bookId,
    chapter: chapter ?? this.chapter,
    verseId: verseId.present ? verseId.value : this.verseId,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  ReadingProgressData copyWithCompanion(ReadingProgressCompanion data) {
    return ReadingProgressData(
      id: data.id.present ? data.id.value : this.id,
      bookId: data.bookId.present ? data.bookId.value : this.bookId,
      chapter: data.chapter.present ? data.chapter.value : this.chapter,
      verseId: data.verseId.present ? data.verseId.value : this.verseId,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ReadingProgressData(')
          ..write('id: $id, ')
          ..write('bookId: $bookId, ')
          ..write('chapter: $chapter, ')
          ..write('verseId: $verseId, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, bookId, chapter, verseId, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ReadingProgressData &&
          other.id == this.id &&
          other.bookId == this.bookId &&
          other.chapter == this.chapter &&
          other.verseId == this.verseId &&
          other.updatedAt == this.updatedAt);
}

class ReadingProgressCompanion extends UpdateCompanion<ReadingProgressData> {
  final Value<String> id;
  final Value<String> bookId;
  final Value<int> chapter;
  final Value<String?> verseId;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const ReadingProgressCompanion({
    this.id = const Value.absent(),
    this.bookId = const Value.absent(),
    this.chapter = const Value.absent(),
    this.verseId = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ReadingProgressCompanion.insert({
    required String id,
    required String bookId,
    required int chapter,
    this.verseId = const Value.absent(),
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       bookId = Value(bookId),
       chapter = Value(chapter),
       updatedAt = Value(updatedAt);
  static Insertable<ReadingProgressData> custom({
    Expression<String>? id,
    Expression<String>? bookId,
    Expression<int>? chapter,
    Expression<String>? verseId,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (bookId != null) 'book_id': bookId,
      if (chapter != null) 'chapter': chapter,
      if (verseId != null) 'verse_id': verseId,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ReadingProgressCompanion copyWith({
    Value<String>? id,
    Value<String>? bookId,
    Value<int>? chapter,
    Value<String?>? verseId,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return ReadingProgressCompanion(
      id: id ?? this.id,
      bookId: bookId ?? this.bookId,
      chapter: chapter ?? this.chapter,
      verseId: verseId ?? this.verseId,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (bookId.present) {
      map['book_id'] = Variable<String>(bookId.value);
    }
    if (chapter.present) {
      map['chapter'] = Variable<int>(chapter.value);
    }
    if (verseId.present) {
      map['verse_id'] = Variable<String>(verseId.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ReadingProgressCompanion(')
          ..write('id: $id, ')
          ..write('bookId: $bookId, ')
          ..write('chapter: $chapter, ')
          ..write('verseId: $verseId, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $StudyNotesTable extends StudyNotes
    with TableInfo<$StudyNotesTable, StudyNote> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $StudyNotesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _verseIdMeta = const VerificationMeta(
    'verseId',
  );
  @override
  late final GeneratedColumn<String> verseId = GeneratedColumn<String>(
    'verse_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _noteTextMeta = const VerificationMeta(
    'noteText',
  );
  @override
  late final GeneratedColumn<String> noteText = GeneratedColumn<String>(
    'note_text',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _highlightColorMeta = const VerificationMeta(
    'highlightColor',
  );
  @override
  late final GeneratedColumn<String> highlightColor = GeneratedColumn<String>(
    'highlight_color',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _dirtyMeta = const VerificationMeta('dirty');
  @override
  late final GeneratedColumn<bool> dirty = GeneratedColumn<bool>(
    'dirty',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("dirty" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _deletedMeta = const VerificationMeta(
    'deleted',
  );
  @override
  late final GeneratedColumn<bool> deleted = GeneratedColumn<bool>(
    'deleted',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("deleted" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    verseId,
    noteText,
    highlightColor,
    dirty,
    deleted,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'study_notes';
  @override
  VerificationContext validateIntegrity(
    Insertable<StudyNote> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('verse_id')) {
      context.handle(
        _verseIdMeta,
        verseId.isAcceptableOrUnknown(data['verse_id']!, _verseIdMeta),
      );
    } else if (isInserting) {
      context.missing(_verseIdMeta);
    }
    if (data.containsKey('note_text')) {
      context.handle(
        _noteTextMeta,
        noteText.isAcceptableOrUnknown(data['note_text']!, _noteTextMeta),
      );
    } else if (isInserting) {
      context.missing(_noteTextMeta);
    }
    if (data.containsKey('highlight_color')) {
      context.handle(
        _highlightColorMeta,
        highlightColor.isAcceptableOrUnknown(
          data['highlight_color']!,
          _highlightColorMeta,
        ),
      );
    }
    if (data.containsKey('dirty')) {
      context.handle(
        _dirtyMeta,
        dirty.isAcceptableOrUnknown(data['dirty']!, _dirtyMeta),
      );
    }
    if (data.containsKey('deleted')) {
      context.handle(
        _deletedMeta,
        deleted.isAcceptableOrUnknown(data['deleted']!, _deletedMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  StudyNote map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return StudyNote(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      verseId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}verse_id'],
      )!,
      noteText: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}note_text'],
      )!,
      highlightColor: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}highlight_color'],
      ),
      dirty: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}dirty'],
      )!,
      deleted: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}deleted'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $StudyNotesTable createAlias(String alias) {
    return $StudyNotesTable(attachedDatabase, alias);
  }
}

class StudyNote extends DataClass implements Insertable<StudyNote> {
  final String id;
  final String verseId;
  final String noteText;
  final String? highlightColor;
  final bool dirty;
  final bool deleted;
  final DateTime updatedAt;
  const StudyNote({
    required this.id,
    required this.verseId,
    required this.noteText,
    this.highlightColor,
    required this.dirty,
    required this.deleted,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['verse_id'] = Variable<String>(verseId);
    map['note_text'] = Variable<String>(noteText);
    if (!nullToAbsent || highlightColor != null) {
      map['highlight_color'] = Variable<String>(highlightColor);
    }
    map['dirty'] = Variable<bool>(dirty);
    map['deleted'] = Variable<bool>(deleted);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  StudyNotesCompanion toCompanion(bool nullToAbsent) {
    return StudyNotesCompanion(
      id: Value(id),
      verseId: Value(verseId),
      noteText: Value(noteText),
      highlightColor: highlightColor == null && nullToAbsent
          ? const Value.absent()
          : Value(highlightColor),
      dirty: Value(dirty),
      deleted: Value(deleted),
      updatedAt: Value(updatedAt),
    );
  }

  factory StudyNote.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return StudyNote(
      id: serializer.fromJson<String>(json['id']),
      verseId: serializer.fromJson<String>(json['verseId']),
      noteText: serializer.fromJson<String>(json['noteText']),
      highlightColor: serializer.fromJson<String?>(json['highlightColor']),
      dirty: serializer.fromJson<bool>(json['dirty']),
      deleted: serializer.fromJson<bool>(json['deleted']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'verseId': serializer.toJson<String>(verseId),
      'noteText': serializer.toJson<String>(noteText),
      'highlightColor': serializer.toJson<String?>(highlightColor),
      'dirty': serializer.toJson<bool>(dirty),
      'deleted': serializer.toJson<bool>(deleted),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  StudyNote copyWith({
    String? id,
    String? verseId,
    String? noteText,
    Value<String?> highlightColor = const Value.absent(),
    bool? dirty,
    bool? deleted,
    DateTime? updatedAt,
  }) => StudyNote(
    id: id ?? this.id,
    verseId: verseId ?? this.verseId,
    noteText: noteText ?? this.noteText,
    highlightColor: highlightColor.present
        ? highlightColor.value
        : this.highlightColor,
    dirty: dirty ?? this.dirty,
    deleted: deleted ?? this.deleted,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  StudyNote copyWithCompanion(StudyNotesCompanion data) {
    return StudyNote(
      id: data.id.present ? data.id.value : this.id,
      verseId: data.verseId.present ? data.verseId.value : this.verseId,
      noteText: data.noteText.present ? data.noteText.value : this.noteText,
      highlightColor: data.highlightColor.present
          ? data.highlightColor.value
          : this.highlightColor,
      dirty: data.dirty.present ? data.dirty.value : this.dirty,
      deleted: data.deleted.present ? data.deleted.value : this.deleted,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('StudyNote(')
          ..write('id: $id, ')
          ..write('verseId: $verseId, ')
          ..write('noteText: $noteText, ')
          ..write('highlightColor: $highlightColor, ')
          ..write('dirty: $dirty, ')
          ..write('deleted: $deleted, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    verseId,
    noteText,
    highlightColor,
    dirty,
    deleted,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is StudyNote &&
          other.id == this.id &&
          other.verseId == this.verseId &&
          other.noteText == this.noteText &&
          other.highlightColor == this.highlightColor &&
          other.dirty == this.dirty &&
          other.deleted == this.deleted &&
          other.updatedAt == this.updatedAt);
}

class StudyNotesCompanion extends UpdateCompanion<StudyNote> {
  final Value<String> id;
  final Value<String> verseId;
  final Value<String> noteText;
  final Value<String?> highlightColor;
  final Value<bool> dirty;
  final Value<bool> deleted;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const StudyNotesCompanion({
    this.id = const Value.absent(),
    this.verseId = const Value.absent(),
    this.noteText = const Value.absent(),
    this.highlightColor = const Value.absent(),
    this.dirty = const Value.absent(),
    this.deleted = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  StudyNotesCompanion.insert({
    required String id,
    required String verseId,
    required String noteText,
    this.highlightColor = const Value.absent(),
    this.dirty = const Value.absent(),
    this.deleted = const Value.absent(),
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       verseId = Value(verseId),
       noteText = Value(noteText),
       updatedAt = Value(updatedAt);
  static Insertable<StudyNote> custom({
    Expression<String>? id,
    Expression<String>? verseId,
    Expression<String>? noteText,
    Expression<String>? highlightColor,
    Expression<bool>? dirty,
    Expression<bool>? deleted,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (verseId != null) 'verse_id': verseId,
      if (noteText != null) 'note_text': noteText,
      if (highlightColor != null) 'highlight_color': highlightColor,
      if (dirty != null) 'dirty': dirty,
      if (deleted != null) 'deleted': deleted,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  StudyNotesCompanion copyWith({
    Value<String>? id,
    Value<String>? verseId,
    Value<String>? noteText,
    Value<String?>? highlightColor,
    Value<bool>? dirty,
    Value<bool>? deleted,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return StudyNotesCompanion(
      id: id ?? this.id,
      verseId: verseId ?? this.verseId,
      noteText: noteText ?? this.noteText,
      highlightColor: highlightColor ?? this.highlightColor,
      dirty: dirty ?? this.dirty,
      deleted: deleted ?? this.deleted,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (verseId.present) {
      map['verse_id'] = Variable<String>(verseId.value);
    }
    if (noteText.present) {
      map['note_text'] = Variable<String>(noteText.value);
    }
    if (highlightColor.present) {
      map['highlight_color'] = Variable<String>(highlightColor.value);
    }
    if (dirty.present) {
      map['dirty'] = Variable<bool>(dirty.value);
    }
    if (deleted.present) {
      map['deleted'] = Variable<bool>(deleted.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('StudyNotesCompanion(')
          ..write('id: $id, ')
          ..write('verseId: $verseId, ')
          ..write('noteText: $noteText, ')
          ..write('highlightColor: $highlightColor, ')
          ..write('dirty: $dirty, ')
          ..write('deleted: $deleted, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $StudyBookmarksTable extends StudyBookmarks
    with TableInfo<$StudyBookmarksTable, StudyBookmark> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $StudyBookmarksTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _verseIdMeta = const VerificationMeta(
    'verseId',
  );
  @override
  late final GeneratedColumn<String> verseId = GeneratedColumn<String>(
    'verse_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _dirtyMeta = const VerificationMeta('dirty');
  @override
  late final GeneratedColumn<bool> dirty = GeneratedColumn<bool>(
    'dirty',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("dirty" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _deletedMeta = const VerificationMeta(
    'deleted',
  );
  @override
  late final GeneratedColumn<bool> deleted = GeneratedColumn<bool>(
    'deleted',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("deleted" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    verseId,
    dirty,
    deleted,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'study_bookmarks';
  @override
  VerificationContext validateIntegrity(
    Insertable<StudyBookmark> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('verse_id')) {
      context.handle(
        _verseIdMeta,
        verseId.isAcceptableOrUnknown(data['verse_id']!, _verseIdMeta),
      );
    } else if (isInserting) {
      context.missing(_verseIdMeta);
    }
    if (data.containsKey('dirty')) {
      context.handle(
        _dirtyMeta,
        dirty.isAcceptableOrUnknown(data['dirty']!, _dirtyMeta),
      );
    }
    if (data.containsKey('deleted')) {
      context.handle(
        _deletedMeta,
        deleted.isAcceptableOrUnknown(data['deleted']!, _deletedMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  StudyBookmark map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return StudyBookmark(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      verseId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}verse_id'],
      )!,
      dirty: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}dirty'],
      )!,
      deleted: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}deleted'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $StudyBookmarksTable createAlias(String alias) {
    return $StudyBookmarksTable(attachedDatabase, alias);
  }
}

class StudyBookmark extends DataClass implements Insertable<StudyBookmark> {
  final String id;
  final String verseId;
  final bool dirty;
  final bool deleted;
  final DateTime updatedAt;
  const StudyBookmark({
    required this.id,
    required this.verseId,
    required this.dirty,
    required this.deleted,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['verse_id'] = Variable<String>(verseId);
    map['dirty'] = Variable<bool>(dirty);
    map['deleted'] = Variable<bool>(deleted);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  StudyBookmarksCompanion toCompanion(bool nullToAbsent) {
    return StudyBookmarksCompanion(
      id: Value(id),
      verseId: Value(verseId),
      dirty: Value(dirty),
      deleted: Value(deleted),
      updatedAt: Value(updatedAt),
    );
  }

  factory StudyBookmark.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return StudyBookmark(
      id: serializer.fromJson<String>(json['id']),
      verseId: serializer.fromJson<String>(json['verseId']),
      dirty: serializer.fromJson<bool>(json['dirty']),
      deleted: serializer.fromJson<bool>(json['deleted']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'verseId': serializer.toJson<String>(verseId),
      'dirty': serializer.toJson<bool>(dirty),
      'deleted': serializer.toJson<bool>(deleted),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  StudyBookmark copyWith({
    String? id,
    String? verseId,
    bool? dirty,
    bool? deleted,
    DateTime? updatedAt,
  }) => StudyBookmark(
    id: id ?? this.id,
    verseId: verseId ?? this.verseId,
    dirty: dirty ?? this.dirty,
    deleted: deleted ?? this.deleted,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  StudyBookmark copyWithCompanion(StudyBookmarksCompanion data) {
    return StudyBookmark(
      id: data.id.present ? data.id.value : this.id,
      verseId: data.verseId.present ? data.verseId.value : this.verseId,
      dirty: data.dirty.present ? data.dirty.value : this.dirty,
      deleted: data.deleted.present ? data.deleted.value : this.deleted,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('StudyBookmark(')
          ..write('id: $id, ')
          ..write('verseId: $verseId, ')
          ..write('dirty: $dirty, ')
          ..write('deleted: $deleted, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, verseId, dirty, deleted, updatedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is StudyBookmark &&
          other.id == this.id &&
          other.verseId == this.verseId &&
          other.dirty == this.dirty &&
          other.deleted == this.deleted &&
          other.updatedAt == this.updatedAt);
}

class StudyBookmarksCompanion extends UpdateCompanion<StudyBookmark> {
  final Value<String> id;
  final Value<String> verseId;
  final Value<bool> dirty;
  final Value<bool> deleted;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const StudyBookmarksCompanion({
    this.id = const Value.absent(),
    this.verseId = const Value.absent(),
    this.dirty = const Value.absent(),
    this.deleted = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  StudyBookmarksCompanion.insert({
    required String id,
    required String verseId,
    this.dirty = const Value.absent(),
    this.deleted = const Value.absent(),
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       verseId = Value(verseId),
       updatedAt = Value(updatedAt);
  static Insertable<StudyBookmark> custom({
    Expression<String>? id,
    Expression<String>? verseId,
    Expression<bool>? dirty,
    Expression<bool>? deleted,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (verseId != null) 'verse_id': verseId,
      if (dirty != null) 'dirty': dirty,
      if (deleted != null) 'deleted': deleted,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  StudyBookmarksCompanion copyWith({
    Value<String>? id,
    Value<String>? verseId,
    Value<bool>? dirty,
    Value<bool>? deleted,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return StudyBookmarksCompanion(
      id: id ?? this.id,
      verseId: verseId ?? this.verseId,
      dirty: dirty ?? this.dirty,
      deleted: deleted ?? this.deleted,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (verseId.present) {
      map['verse_id'] = Variable<String>(verseId.value);
    }
    if (dirty.present) {
      map['dirty'] = Variable<bool>(dirty.value);
    }
    if (deleted.present) {
      map['deleted'] = Variable<bool>(deleted.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('StudyBookmarksCompanion(')
          ..write('id: $id, ')
          ..write('verseId: $verseId, ')
          ..write('dirty: $dirty, ')
          ..write('deleted: $deleted, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SyncQueueTable extends SyncQueue
    with TableInfo<$SyncQueueTable, SyncQueueData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncQueueTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _entityTypeMeta = const VerificationMeta(
    'entityType',
  );
  @override
  late final GeneratedColumn<String> entityType = GeneratedColumn<String>(
    'entity_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _entityIdMeta = const VerificationMeta(
    'entityId',
  );
  @override
  late final GeneratedColumn<String> entityId = GeneratedColumn<String>(
    'entity_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _actionMeta = const VerificationMeta('action');
  @override
  late final GeneratedColumn<String> action = GeneratedColumn<String>(
    'action',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _payloadJsonMeta = const VerificationMeta(
    'payloadJson',
  );
  @override
  late final GeneratedColumn<String> payloadJson = GeneratedColumn<String>(
    'payload_json',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _attemptsMeta = const VerificationMeta(
    'attempts',
  );
  @override
  late final GeneratedColumn<int> attempts = GeneratedColumn<int>(
    'attempts',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _lastErrorMeta = const VerificationMeta(
    'lastError',
  );
  @override
  late final GeneratedColumn<String> lastError = GeneratedColumn<String>(
    'last_error',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    entityType,
    entityId,
    action,
    payloadJson,
    attempts,
    lastError,
    createdAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_queue';
  @override
  VerificationContext validateIntegrity(
    Insertable<SyncQueueData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('entity_type')) {
      context.handle(
        _entityTypeMeta,
        entityType.isAcceptableOrUnknown(data['entity_type']!, _entityTypeMeta),
      );
    } else if (isInserting) {
      context.missing(_entityTypeMeta);
    }
    if (data.containsKey('entity_id')) {
      context.handle(
        _entityIdMeta,
        entityId.isAcceptableOrUnknown(data['entity_id']!, _entityIdMeta),
      );
    } else if (isInserting) {
      context.missing(_entityIdMeta);
    }
    if (data.containsKey('action')) {
      context.handle(
        _actionMeta,
        action.isAcceptableOrUnknown(data['action']!, _actionMeta),
      );
    } else if (isInserting) {
      context.missing(_actionMeta);
    }
    if (data.containsKey('payload_json')) {
      context.handle(
        _payloadJsonMeta,
        payloadJson.isAcceptableOrUnknown(
          data['payload_json']!,
          _payloadJsonMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_payloadJsonMeta);
    }
    if (data.containsKey('attempts')) {
      context.handle(
        _attemptsMeta,
        attempts.isAcceptableOrUnknown(data['attempts']!, _attemptsMeta),
      );
    }
    if (data.containsKey('last_error')) {
      context.handle(
        _lastErrorMeta,
        lastError.isAcceptableOrUnknown(data['last_error']!, _lastErrorMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SyncQueueData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncQueueData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      entityType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}entity_type'],
      )!,
      entityId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}entity_id'],
      )!,
      action: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}action'],
      )!,
      payloadJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payload_json'],
      )!,
      attempts: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}attempts'],
      )!,
      lastError: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}last_error'],
      ),
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
    );
  }

  @override
  $SyncQueueTable createAlias(String alias) {
    return $SyncQueueTable(attachedDatabase, alias);
  }
}

class SyncQueueData extends DataClass implements Insertable<SyncQueueData> {
  final String id;
  final String entityType;
  final String entityId;
  final String action;
  final String payloadJson;
  final int attempts;
  final String? lastError;
  final DateTime createdAt;
  const SyncQueueData({
    required this.id,
    required this.entityType,
    required this.entityId,
    required this.action,
    required this.payloadJson,
    required this.attempts,
    this.lastError,
    required this.createdAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['entity_type'] = Variable<String>(entityType);
    map['entity_id'] = Variable<String>(entityId);
    map['action'] = Variable<String>(action);
    map['payload_json'] = Variable<String>(payloadJson);
    map['attempts'] = Variable<int>(attempts);
    if (!nullToAbsent || lastError != null) {
      map['last_error'] = Variable<String>(lastError);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  SyncQueueCompanion toCompanion(bool nullToAbsent) {
    return SyncQueueCompanion(
      id: Value(id),
      entityType: Value(entityType),
      entityId: Value(entityId),
      action: Value(action),
      payloadJson: Value(payloadJson),
      attempts: Value(attempts),
      lastError: lastError == null && nullToAbsent
          ? const Value.absent()
          : Value(lastError),
      createdAt: Value(createdAt),
    );
  }

  factory SyncQueueData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncQueueData(
      id: serializer.fromJson<String>(json['id']),
      entityType: serializer.fromJson<String>(json['entityType']),
      entityId: serializer.fromJson<String>(json['entityId']),
      action: serializer.fromJson<String>(json['action']),
      payloadJson: serializer.fromJson<String>(json['payloadJson']),
      attempts: serializer.fromJson<int>(json['attempts']),
      lastError: serializer.fromJson<String?>(json['lastError']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'entityType': serializer.toJson<String>(entityType),
      'entityId': serializer.toJson<String>(entityId),
      'action': serializer.toJson<String>(action),
      'payloadJson': serializer.toJson<String>(payloadJson),
      'attempts': serializer.toJson<int>(attempts),
      'lastError': serializer.toJson<String?>(lastError),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  SyncQueueData copyWith({
    String? id,
    String? entityType,
    String? entityId,
    String? action,
    String? payloadJson,
    int? attempts,
    Value<String?> lastError = const Value.absent(),
    DateTime? createdAt,
  }) => SyncQueueData(
    id: id ?? this.id,
    entityType: entityType ?? this.entityType,
    entityId: entityId ?? this.entityId,
    action: action ?? this.action,
    payloadJson: payloadJson ?? this.payloadJson,
    attempts: attempts ?? this.attempts,
    lastError: lastError.present ? lastError.value : this.lastError,
    createdAt: createdAt ?? this.createdAt,
  );
  SyncQueueData copyWithCompanion(SyncQueueCompanion data) {
    return SyncQueueData(
      id: data.id.present ? data.id.value : this.id,
      entityType: data.entityType.present
          ? data.entityType.value
          : this.entityType,
      entityId: data.entityId.present ? data.entityId.value : this.entityId,
      action: data.action.present ? data.action.value : this.action,
      payloadJson: data.payloadJson.present
          ? data.payloadJson.value
          : this.payloadJson,
      attempts: data.attempts.present ? data.attempts.value : this.attempts,
      lastError: data.lastError.present ? data.lastError.value : this.lastError,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueData(')
          ..write('id: $id, ')
          ..write('entityType: $entityType, ')
          ..write('entityId: $entityId, ')
          ..write('action: $action, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('attempts: $attempts, ')
          ..write('lastError: $lastError, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    entityType,
    entityId,
    action,
    payloadJson,
    attempts,
    lastError,
    createdAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncQueueData &&
          other.id == this.id &&
          other.entityType == this.entityType &&
          other.entityId == this.entityId &&
          other.action == this.action &&
          other.payloadJson == this.payloadJson &&
          other.attempts == this.attempts &&
          other.lastError == this.lastError &&
          other.createdAt == this.createdAt);
}

class SyncQueueCompanion extends UpdateCompanion<SyncQueueData> {
  final Value<String> id;
  final Value<String> entityType;
  final Value<String> entityId;
  final Value<String> action;
  final Value<String> payloadJson;
  final Value<int> attempts;
  final Value<String?> lastError;
  final Value<DateTime> createdAt;
  final Value<int> rowid;
  const SyncQueueCompanion({
    this.id = const Value.absent(),
    this.entityType = const Value.absent(),
    this.entityId = const Value.absent(),
    this.action = const Value.absent(),
    this.payloadJson = const Value.absent(),
    this.attempts = const Value.absent(),
    this.lastError = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SyncQueueCompanion.insert({
    required String id,
    required String entityType,
    required String entityId,
    required String action,
    required String payloadJson,
    this.attempts = const Value.absent(),
    this.lastError = const Value.absent(),
    required DateTime createdAt,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       entityType = Value(entityType),
       entityId = Value(entityId),
       action = Value(action),
       payloadJson = Value(payloadJson),
       createdAt = Value(createdAt);
  static Insertable<SyncQueueData> custom({
    Expression<String>? id,
    Expression<String>? entityType,
    Expression<String>? entityId,
    Expression<String>? action,
    Expression<String>? payloadJson,
    Expression<int>? attempts,
    Expression<String>? lastError,
    Expression<DateTime>? createdAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (entityType != null) 'entity_type': entityType,
      if (entityId != null) 'entity_id': entityId,
      if (action != null) 'action': action,
      if (payloadJson != null) 'payload_json': payloadJson,
      if (attempts != null) 'attempts': attempts,
      if (lastError != null) 'last_error': lastError,
      if (createdAt != null) 'created_at': createdAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SyncQueueCompanion copyWith({
    Value<String>? id,
    Value<String>? entityType,
    Value<String>? entityId,
    Value<String>? action,
    Value<String>? payloadJson,
    Value<int>? attempts,
    Value<String?>? lastError,
    Value<DateTime>? createdAt,
    Value<int>? rowid,
  }) {
    return SyncQueueCompanion(
      id: id ?? this.id,
      entityType: entityType ?? this.entityType,
      entityId: entityId ?? this.entityId,
      action: action ?? this.action,
      payloadJson: payloadJson ?? this.payloadJson,
      attempts: attempts ?? this.attempts,
      lastError: lastError ?? this.lastError,
      createdAt: createdAt ?? this.createdAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (entityType.present) {
      map['entity_type'] = Variable<String>(entityType.value);
    }
    if (entityId.present) {
      map['entity_id'] = Variable<String>(entityId.value);
    }
    if (action.present) {
      map['action'] = Variable<String>(action.value);
    }
    if (payloadJson.present) {
      map['payload_json'] = Variable<String>(payloadJson.value);
    }
    if (attempts.present) {
      map['attempts'] = Variable<int>(attempts.value);
    }
    if (lastError.present) {
      map['last_error'] = Variable<String>(lastError.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueCompanion(')
          ..write('id: $id, ')
          ..write('entityType: $entityType, ')
          ..write('entityId: $entityId, ')
          ..write('action: $action, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('attempts: $attempts, ')
          ..write('lastError: $lastError, ')
          ..write('createdAt: $createdAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $LocalBibleBooksTable localBibleBooks = $LocalBibleBooksTable(
    this,
  );
  late final $LocalBibleTranslationsTable localBibleTranslations =
      $LocalBibleTranslationsTable(this);
  late final $LocalBibleVersesTable localBibleVerses = $LocalBibleVersesTable(
    this,
  );
  late final $LocalBibleVerseTextsTable localBibleVerseTexts =
      $LocalBibleVerseTextsTable(this);
  late final $LocalSermonsTable localSermons = $LocalSermonsTable(this);
  late final $LocalSermonTopicsTable localSermonTopics =
      $LocalSermonTopicsTable(this);
  late final $LocalSermonOutlinesTable localSermonOutlines =
      $LocalSermonOutlinesTable(this);
  late final $LocalSermonReferencesTable localSermonReferences =
      $LocalSermonReferencesTable(this);
  late final $LocalLifePostsTable localLifePosts = $LocalLifePostsTable(this);
  late final $ReadingProgressTable readingProgress = $ReadingProgressTable(
    this,
  );
  late final $StudyNotesTable studyNotes = $StudyNotesTable(this);
  late final $StudyBookmarksTable studyBookmarks = $StudyBookmarksTable(this);
  late final $SyncQueueTable syncQueue = $SyncQueueTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    localBibleBooks,
    localBibleTranslations,
    localBibleVerses,
    localBibleVerseTexts,
    localSermons,
    localSermonTopics,
    localSermonOutlines,
    localSermonReferences,
    localLifePosts,
    readingProgress,
    studyNotes,
    studyBookmarks,
    syncQueue,
  ];
}

typedef $$LocalBibleBooksTableCreateCompanionBuilder =
    LocalBibleBooksCompanion Function({
      required String id,
      required String testament,
      Value<String> category,
      required String nameZh,
      Value<String> nameZhHant,
      required String nameEn,
      Value<String> abbreviationZh,
      Value<String> abbreviationZhHant,
      Value<String> abbreviationEn,
      required int chapterCount,
      required int sortOrder,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$LocalBibleBooksTableUpdateCompanionBuilder =
    LocalBibleBooksCompanion Function({
      Value<String> id,
      Value<String> testament,
      Value<String> category,
      Value<String> nameZh,
      Value<String> nameZhHant,
      Value<String> nameEn,
      Value<String> abbreviationZh,
      Value<String> abbreviationZhHant,
      Value<String> abbreviationEn,
      Value<int> chapterCount,
      Value<int> sortOrder,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

final class $$LocalBibleBooksTableReferences
    extends
        BaseReferences<_$AppDatabase, $LocalBibleBooksTable, LocalBibleBook> {
  $$LocalBibleBooksTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static MultiTypedResultKey<$LocalBibleVersesTable, List<LocalBibleVerse>>
  _localBibleVersesRefsTable(_$AppDatabase db) => MultiTypedResultKey.fromTable(
    db.localBibleVerses,
    aliasName: 'local_bible_books__id__local_bible_verses__book_id',
  );

  $$LocalBibleVersesTableProcessedTableManager get localBibleVersesRefs {
    final manager = $$LocalBibleVersesTableTableManager(
      $_db,
      $_db.localBibleVerses,
    ).filter((f) => f.bookId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(
      _localBibleVersesRefsTable($_db),
    );
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }

  static MultiTypedResultKey<$ReadingProgressTable, List<ReadingProgressData>>
  _readingProgressRefsTable(_$AppDatabase db) => MultiTypedResultKey.fromTable(
    db.readingProgress,
    aliasName: 'local_bible_books__id__reading_progress__book_id',
  );

  $$ReadingProgressTableProcessedTableManager get readingProgressRefs {
    final manager = $$ReadingProgressTableTableManager(
      $_db,
      $_db.readingProgress,
    ).filter((f) => f.bookId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(
      _readingProgressRefsTable($_db),
    );
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }
}

class $$LocalBibleBooksTableFilterComposer
    extends Composer<_$AppDatabase, $LocalBibleBooksTable> {
  $$LocalBibleBooksTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get testament => $composableBuilder(
    column: $table.testament,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get category => $composableBuilder(
    column: $table.category,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get nameZh => $composableBuilder(
    column: $table.nameZh,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get nameZhHant => $composableBuilder(
    column: $table.nameZhHant,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get nameEn => $composableBuilder(
    column: $table.nameEn,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get abbreviationZh => $composableBuilder(
    column: $table.abbreviationZh,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get abbreviationZhHant => $composableBuilder(
    column: $table.abbreviationZhHant,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get abbreviationEn => $composableBuilder(
    column: $table.abbreviationEn,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get chapterCount => $composableBuilder(
    column: $table.chapterCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get sortOrder => $composableBuilder(
    column: $table.sortOrder,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );

  Expression<bool> localBibleVersesRefs(
    Expression<bool> Function($$LocalBibleVersesTableFilterComposer f) f,
  ) {
    final $$LocalBibleVersesTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.localBibleVerses,
      getReferencedColumn: (t) => t.bookId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalBibleVersesTableFilterComposer(
            $db: $db,
            $table: $db.localBibleVerses,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }

  Expression<bool> readingProgressRefs(
    Expression<bool> Function($$ReadingProgressTableFilterComposer f) f,
  ) {
    final $$ReadingProgressTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.readingProgress,
      getReferencedColumn: (t) => t.bookId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$ReadingProgressTableFilterComposer(
            $db: $db,
            $table: $db.readingProgress,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$LocalBibleBooksTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalBibleBooksTable> {
  $$LocalBibleBooksTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get testament => $composableBuilder(
    column: $table.testament,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get category => $composableBuilder(
    column: $table.category,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get nameZh => $composableBuilder(
    column: $table.nameZh,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get nameZhHant => $composableBuilder(
    column: $table.nameZhHant,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get nameEn => $composableBuilder(
    column: $table.nameEn,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get abbreviationZh => $composableBuilder(
    column: $table.abbreviationZh,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get abbreviationZhHant => $composableBuilder(
    column: $table.abbreviationZhHant,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get abbreviationEn => $composableBuilder(
    column: $table.abbreviationEn,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get chapterCount => $composableBuilder(
    column: $table.chapterCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get sortOrder => $composableBuilder(
    column: $table.sortOrder,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalBibleBooksTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalBibleBooksTable> {
  $$LocalBibleBooksTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get testament =>
      $composableBuilder(column: $table.testament, builder: (column) => column);

  GeneratedColumn<String> get category =>
      $composableBuilder(column: $table.category, builder: (column) => column);

  GeneratedColumn<String> get nameZh =>
      $composableBuilder(column: $table.nameZh, builder: (column) => column);

  GeneratedColumn<String> get nameZhHant => $composableBuilder(
    column: $table.nameZhHant,
    builder: (column) => column,
  );

  GeneratedColumn<String> get nameEn =>
      $composableBuilder(column: $table.nameEn, builder: (column) => column);

  GeneratedColumn<String> get abbreviationZh => $composableBuilder(
    column: $table.abbreviationZh,
    builder: (column) => column,
  );

  GeneratedColumn<String> get abbreviationZhHant => $composableBuilder(
    column: $table.abbreviationZhHant,
    builder: (column) => column,
  );

  GeneratedColumn<String> get abbreviationEn => $composableBuilder(
    column: $table.abbreviationEn,
    builder: (column) => column,
  );

  GeneratedColumn<int> get chapterCount => $composableBuilder(
    column: $table.chapterCount,
    builder: (column) => column,
  );

  GeneratedColumn<int> get sortOrder =>
      $composableBuilder(column: $table.sortOrder, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  Expression<T> localBibleVersesRefs<T extends Object>(
    Expression<T> Function($$LocalBibleVersesTableAnnotationComposer a) f,
  ) {
    final $$LocalBibleVersesTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.localBibleVerses,
      getReferencedColumn: (t) => t.bookId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalBibleVersesTableAnnotationComposer(
            $db: $db,
            $table: $db.localBibleVerses,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }

  Expression<T> readingProgressRefs<T extends Object>(
    Expression<T> Function($$ReadingProgressTableAnnotationComposer a) f,
  ) {
    final $$ReadingProgressTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.readingProgress,
      getReferencedColumn: (t) => t.bookId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$ReadingProgressTableAnnotationComposer(
            $db: $db,
            $table: $db.readingProgress,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$LocalBibleBooksTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalBibleBooksTable,
          LocalBibleBook,
          $$LocalBibleBooksTableFilterComposer,
          $$LocalBibleBooksTableOrderingComposer,
          $$LocalBibleBooksTableAnnotationComposer,
          $$LocalBibleBooksTableCreateCompanionBuilder,
          $$LocalBibleBooksTableUpdateCompanionBuilder,
          (LocalBibleBook, $$LocalBibleBooksTableReferences),
          LocalBibleBook,
          PrefetchHooks Function({
            bool localBibleVersesRefs,
            bool readingProgressRefs,
          })
        > {
  $$LocalBibleBooksTableTableManager(
    _$AppDatabase db,
    $LocalBibleBooksTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalBibleBooksTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalBibleBooksTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalBibleBooksTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> testament = const Value.absent(),
                Value<String> category = const Value.absent(),
                Value<String> nameZh = const Value.absent(),
                Value<String> nameZhHant = const Value.absent(),
                Value<String> nameEn = const Value.absent(),
                Value<String> abbreviationZh = const Value.absent(),
                Value<String> abbreviationZhHant = const Value.absent(),
                Value<String> abbreviationEn = const Value.absent(),
                Value<int> chapterCount = const Value.absent(),
                Value<int> sortOrder = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalBibleBooksCompanion(
                id: id,
                testament: testament,
                category: category,
                nameZh: nameZh,
                nameZhHant: nameZhHant,
                nameEn: nameEn,
                abbreviationZh: abbreviationZh,
                abbreviationZhHant: abbreviationZhHant,
                abbreviationEn: abbreviationEn,
                chapterCount: chapterCount,
                sortOrder: sortOrder,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String testament,
                Value<String> category = const Value.absent(),
                required String nameZh,
                Value<String> nameZhHant = const Value.absent(),
                required String nameEn,
                Value<String> abbreviationZh = const Value.absent(),
                Value<String> abbreviationZhHant = const Value.absent(),
                Value<String> abbreviationEn = const Value.absent(),
                required int chapterCount,
                required int sortOrder,
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => LocalBibleBooksCompanion.insert(
                id: id,
                testament: testament,
                category: category,
                nameZh: nameZh,
                nameZhHant: nameZhHant,
                nameEn: nameEn,
                abbreviationZh: abbreviationZh,
                abbreviationZhHant: abbreviationZhHant,
                abbreviationEn: abbreviationEn,
                chapterCount: chapterCount,
                sortOrder: sortOrder,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LocalBibleBooksTable, LocalBibleBook>(table),
                  $$LocalBibleBooksTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback:
              ({localBibleVersesRefs = false, readingProgressRefs = false}) {
                return PrefetchHooks(
                  db: db,
                  explicitlyWatchedTables: [
                    if (localBibleVersesRefs) db.localBibleVerses,
                    if (readingProgressRefs) db.readingProgress,
                  ],
                  addJoins: null,
                  getPrefetchedDataCallback: (items) async {
                    return [
                      if (localBibleVersesRefs)
                        await $_getPrefetchedData<
                          LocalBibleBook,
                          $LocalBibleBooksTable,
                          LocalBibleVerse
                        >(
                          currentTable: table,
                          referencedTable: $$LocalBibleBooksTableReferences
                              ._localBibleVersesRefsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$LocalBibleBooksTableReferences(
                                db,
                                table,
                                p0,
                              ).localBibleVersesRefs,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.bookId == item.id,
                              ),
                          typedResults: items,
                        ),
                      if (readingProgressRefs)
                        await $_getPrefetchedData<
                          LocalBibleBook,
                          $LocalBibleBooksTable,
                          ReadingProgressData
                        >(
                          currentTable: table,
                          referencedTable: $$LocalBibleBooksTableReferences
                              ._readingProgressRefsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$LocalBibleBooksTableReferences(
                                db,
                                table,
                                p0,
                              ).readingProgressRefs,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.bookId == item.id,
                              ),
                          typedResults: items,
                        ),
                    ];
                  },
                );
              },
        ),
      );
}

typedef $$LocalBibleBooksTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalBibleBooksTable,
      LocalBibleBook,
      $$LocalBibleBooksTableFilterComposer,
      $$LocalBibleBooksTableOrderingComposer,
      $$LocalBibleBooksTableAnnotationComposer,
      $$LocalBibleBooksTableCreateCompanionBuilder,
      $$LocalBibleBooksTableUpdateCompanionBuilder,
      (LocalBibleBook, $$LocalBibleBooksTableReferences),
      LocalBibleBook,
      PrefetchHooks Function({
        bool localBibleVersesRefs,
        bool readingProgressRefs,
      })
    >;
typedef $$LocalBibleTranslationsTableCreateCompanionBuilder =
    LocalBibleTranslationsCompanion Function({
      required String id,
      required String localeCode,
      required String name,
      required String abbreviation,
      required String copyrightStatus,
      required String sourceUrl,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$LocalBibleTranslationsTableUpdateCompanionBuilder =
    LocalBibleTranslationsCompanion Function({
      Value<String> id,
      Value<String> localeCode,
      Value<String> name,
      Value<String> abbreviation,
      Value<String> copyrightStatus,
      Value<String> sourceUrl,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$LocalBibleTranslationsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalBibleTranslationsTable> {
  $$LocalBibleTranslationsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get localeCode => $composableBuilder(
    column: $table.localeCode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get abbreviation => $composableBuilder(
    column: $table.abbreviation,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get copyrightStatus => $composableBuilder(
    column: $table.copyrightStatus,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get sourceUrl => $composableBuilder(
    column: $table.sourceUrl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalBibleTranslationsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalBibleTranslationsTable> {
  $$LocalBibleTranslationsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get localeCode => $composableBuilder(
    column: $table.localeCode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get abbreviation => $composableBuilder(
    column: $table.abbreviation,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get copyrightStatus => $composableBuilder(
    column: $table.copyrightStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get sourceUrl => $composableBuilder(
    column: $table.sourceUrl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalBibleTranslationsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalBibleTranslationsTable> {
  $$LocalBibleTranslationsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get localeCode => $composableBuilder(
    column: $table.localeCode,
    builder: (column) => column,
  );

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get abbreviation => $composableBuilder(
    column: $table.abbreviation,
    builder: (column) => column,
  );

  GeneratedColumn<String> get copyrightStatus => $composableBuilder(
    column: $table.copyrightStatus,
    builder: (column) => column,
  );

  GeneratedColumn<String> get sourceUrl =>
      $composableBuilder(column: $table.sourceUrl, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$LocalBibleTranslationsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalBibleTranslationsTable,
          LocalBibleTranslation,
          $$LocalBibleTranslationsTableFilterComposer,
          $$LocalBibleTranslationsTableOrderingComposer,
          $$LocalBibleTranslationsTableAnnotationComposer,
          $$LocalBibleTranslationsTableCreateCompanionBuilder,
          $$LocalBibleTranslationsTableUpdateCompanionBuilder,
          (
            LocalBibleTranslation,
            BaseReferences<
              _$AppDatabase,
              $LocalBibleTranslationsTable,
              LocalBibleTranslation
            >,
          ),
          LocalBibleTranslation,
          PrefetchHooks Function()
        > {
  $$LocalBibleTranslationsTableTableManager(
    _$AppDatabase db,
    $LocalBibleTranslationsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalBibleTranslationsTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              $$LocalBibleTranslationsTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$LocalBibleTranslationsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> localeCode = const Value.absent(),
                Value<String> name = const Value.absent(),
                Value<String> abbreviation = const Value.absent(),
                Value<String> copyrightStatus = const Value.absent(),
                Value<String> sourceUrl = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalBibleTranslationsCompanion(
                id: id,
                localeCode: localeCode,
                name: name,
                abbreviation: abbreviation,
                copyrightStatus: copyrightStatus,
                sourceUrl: sourceUrl,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String localeCode,
                required String name,
                required String abbreviation,
                required String copyrightStatus,
                required String sourceUrl,
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => LocalBibleTranslationsCompanion.insert(
                id: id,
                localeCode: localeCode,
                name: name,
                abbreviation: abbreviation,
                copyrightStatus: copyrightStatus,
                sourceUrl: sourceUrl,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<
                    $LocalBibleTranslationsTable,
                    LocalBibleTranslation
                  >(table),
                  BaseReferences<
                    _$AppDatabase,
                    $LocalBibleTranslationsTable,
                    LocalBibleTranslation
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalBibleTranslationsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalBibleTranslationsTable,
      LocalBibleTranslation,
      $$LocalBibleTranslationsTableFilterComposer,
      $$LocalBibleTranslationsTableOrderingComposer,
      $$LocalBibleTranslationsTableAnnotationComposer,
      $$LocalBibleTranslationsTableCreateCompanionBuilder,
      $$LocalBibleTranslationsTableUpdateCompanionBuilder,
      (
        LocalBibleTranslation,
        BaseReferences<
          _$AppDatabase,
          $LocalBibleTranslationsTable,
          LocalBibleTranslation
        >,
      ),
      LocalBibleTranslation,
      PrefetchHooks Function()
    >;
typedef $$LocalBibleVersesTableCreateCompanionBuilder =
    LocalBibleVersesCompanion Function({
      required String id,
      required String bookId,
      required int chapter,
      required int verse,
      required String textZh,
      Value<String?> textEn,
      Value<bool> hasLexicon,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$LocalBibleVersesTableUpdateCompanionBuilder =
    LocalBibleVersesCompanion Function({
      Value<String> id,
      Value<String> bookId,
      Value<int> chapter,
      Value<int> verse,
      Value<String> textZh,
      Value<String?> textEn,
      Value<bool> hasLexicon,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

final class $$LocalBibleVersesTableReferences
    extends
        BaseReferences<_$AppDatabase, $LocalBibleVersesTable, LocalBibleVerse> {
  $$LocalBibleVersesTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static $LocalBibleBooksTable _bookIdTable(_$AppDatabase db) => db
      .localBibleBooks
      .createAlias('local_bible_verses__book_id__local_bible_books__id');

  $$LocalBibleBooksTableProcessedTableManager get bookId {
    final $_column = $_itemColumn<String>('book_id')!;

    final manager = $$LocalBibleBooksTableTableManager(
      $_db,
      $_db.localBibleBooks,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_bookIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$LocalBibleVersesTableFilterComposer
    extends Composer<_$AppDatabase, $LocalBibleVersesTable> {
  $$LocalBibleVersesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get chapter => $composableBuilder(
    column: $table.chapter,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get verse => $composableBuilder(
    column: $table.verse,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get textZh => $composableBuilder(
    column: $table.textZh,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get textEn => $composableBuilder(
    column: $table.textEn,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get hasLexicon => $composableBuilder(
    column: $table.hasLexicon,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );

  $$LocalBibleBooksTableFilterComposer get bookId {
    final $$LocalBibleBooksTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.bookId,
      referencedTable: $db.localBibleBooks,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalBibleBooksTableFilterComposer(
            $db: $db,
            $table: $db.localBibleBooks,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$LocalBibleVersesTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalBibleVersesTable> {
  $$LocalBibleVersesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get chapter => $composableBuilder(
    column: $table.chapter,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get verse => $composableBuilder(
    column: $table.verse,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get textZh => $composableBuilder(
    column: $table.textZh,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get textEn => $composableBuilder(
    column: $table.textEn,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get hasLexicon => $composableBuilder(
    column: $table.hasLexicon,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );

  $$LocalBibleBooksTableOrderingComposer get bookId {
    final $$LocalBibleBooksTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.bookId,
      referencedTable: $db.localBibleBooks,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalBibleBooksTableOrderingComposer(
            $db: $db,
            $table: $db.localBibleBooks,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$LocalBibleVersesTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalBibleVersesTable> {
  $$LocalBibleVersesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<int> get chapter =>
      $composableBuilder(column: $table.chapter, builder: (column) => column);

  GeneratedColumn<int> get verse =>
      $composableBuilder(column: $table.verse, builder: (column) => column);

  GeneratedColumn<String> get textZh =>
      $composableBuilder(column: $table.textZh, builder: (column) => column);

  GeneratedColumn<String> get textEn =>
      $composableBuilder(column: $table.textEn, builder: (column) => column);

  GeneratedColumn<bool> get hasLexicon => $composableBuilder(
    column: $table.hasLexicon,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  $$LocalBibleBooksTableAnnotationComposer get bookId {
    final $$LocalBibleBooksTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.bookId,
      referencedTable: $db.localBibleBooks,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalBibleBooksTableAnnotationComposer(
            $db: $db,
            $table: $db.localBibleBooks,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$LocalBibleVersesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalBibleVersesTable,
          LocalBibleVerse,
          $$LocalBibleVersesTableFilterComposer,
          $$LocalBibleVersesTableOrderingComposer,
          $$LocalBibleVersesTableAnnotationComposer,
          $$LocalBibleVersesTableCreateCompanionBuilder,
          $$LocalBibleVersesTableUpdateCompanionBuilder,
          (LocalBibleVerse, $$LocalBibleVersesTableReferences),
          LocalBibleVerse,
          PrefetchHooks Function({bool bookId})
        > {
  $$LocalBibleVersesTableTableManager(
    _$AppDatabase db,
    $LocalBibleVersesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalBibleVersesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalBibleVersesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalBibleVersesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> bookId = const Value.absent(),
                Value<int> chapter = const Value.absent(),
                Value<int> verse = const Value.absent(),
                Value<String> textZh = const Value.absent(),
                Value<String?> textEn = const Value.absent(),
                Value<bool> hasLexicon = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalBibleVersesCompanion(
                id: id,
                bookId: bookId,
                chapter: chapter,
                verse: verse,
                textZh: textZh,
                textEn: textEn,
                hasLexicon: hasLexicon,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String bookId,
                required int chapter,
                required int verse,
                required String textZh,
                Value<String?> textEn = const Value.absent(),
                Value<bool> hasLexicon = const Value.absent(),
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => LocalBibleVersesCompanion.insert(
                id: id,
                bookId: bookId,
                chapter: chapter,
                verse: verse,
                textZh: textZh,
                textEn: textEn,
                hasLexicon: hasLexicon,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LocalBibleVersesTable, LocalBibleVerse>(table),
                  $$LocalBibleVersesTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({bookId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (bookId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.bookId,
                                referencedTable:
                                    $$LocalBibleVersesTableReferences
                                        ._bookIdTable(db),
                                referencedColumn:
                                    $$LocalBibleVersesTableReferences
                                        ._bookIdTable(db)
                                        .id,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$LocalBibleVersesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalBibleVersesTable,
      LocalBibleVerse,
      $$LocalBibleVersesTableFilterComposer,
      $$LocalBibleVersesTableOrderingComposer,
      $$LocalBibleVersesTableAnnotationComposer,
      $$LocalBibleVersesTableCreateCompanionBuilder,
      $$LocalBibleVersesTableUpdateCompanionBuilder,
      (LocalBibleVerse, $$LocalBibleVersesTableReferences),
      LocalBibleVerse,
      PrefetchHooks Function({bool bookId})
    >;
typedef $$LocalBibleVerseTextsTableCreateCompanionBuilder =
    LocalBibleVerseTextsCompanion Function({
      required String id,
      required String versionId,
      required String verseId,
      required String bookId,
      required int chapter,
      required int verse,
      required String verseText,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$LocalBibleVerseTextsTableUpdateCompanionBuilder =
    LocalBibleVerseTextsCompanion Function({
      Value<String> id,
      Value<String> versionId,
      Value<String> verseId,
      Value<String> bookId,
      Value<int> chapter,
      Value<int> verse,
      Value<String> verseText,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$LocalBibleVerseTextsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalBibleVerseTextsTable> {
  $$LocalBibleVerseTextsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get versionId => $composableBuilder(
    column: $table.versionId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get verseId => $composableBuilder(
    column: $table.verseId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get bookId => $composableBuilder(
    column: $table.bookId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get chapter => $composableBuilder(
    column: $table.chapter,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get verse => $composableBuilder(
    column: $table.verse,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get verseText => $composableBuilder(
    column: $table.verseText,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalBibleVerseTextsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalBibleVerseTextsTable> {
  $$LocalBibleVerseTextsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get versionId => $composableBuilder(
    column: $table.versionId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get verseId => $composableBuilder(
    column: $table.verseId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get bookId => $composableBuilder(
    column: $table.bookId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get chapter => $composableBuilder(
    column: $table.chapter,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get verse => $composableBuilder(
    column: $table.verse,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get verseText => $composableBuilder(
    column: $table.verseText,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalBibleVerseTextsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalBibleVerseTextsTable> {
  $$LocalBibleVerseTextsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get versionId =>
      $composableBuilder(column: $table.versionId, builder: (column) => column);

  GeneratedColumn<String> get verseId =>
      $composableBuilder(column: $table.verseId, builder: (column) => column);

  GeneratedColumn<String> get bookId =>
      $composableBuilder(column: $table.bookId, builder: (column) => column);

  GeneratedColumn<int> get chapter =>
      $composableBuilder(column: $table.chapter, builder: (column) => column);

  GeneratedColumn<int> get verse =>
      $composableBuilder(column: $table.verse, builder: (column) => column);

  GeneratedColumn<String> get verseText =>
      $composableBuilder(column: $table.verseText, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$LocalBibleVerseTextsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalBibleVerseTextsTable,
          LocalBibleVerseText,
          $$LocalBibleVerseTextsTableFilterComposer,
          $$LocalBibleVerseTextsTableOrderingComposer,
          $$LocalBibleVerseTextsTableAnnotationComposer,
          $$LocalBibleVerseTextsTableCreateCompanionBuilder,
          $$LocalBibleVerseTextsTableUpdateCompanionBuilder,
          (
            LocalBibleVerseText,
            BaseReferences<
              _$AppDatabase,
              $LocalBibleVerseTextsTable,
              LocalBibleVerseText
            >,
          ),
          LocalBibleVerseText,
          PrefetchHooks Function()
        > {
  $$LocalBibleVerseTextsTableTableManager(
    _$AppDatabase db,
    $LocalBibleVerseTextsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalBibleVerseTextsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalBibleVerseTextsTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$LocalBibleVerseTextsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> versionId = const Value.absent(),
                Value<String> verseId = const Value.absent(),
                Value<String> bookId = const Value.absent(),
                Value<int> chapter = const Value.absent(),
                Value<int> verse = const Value.absent(),
                Value<String> verseText = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalBibleVerseTextsCompanion(
                id: id,
                versionId: versionId,
                verseId: verseId,
                bookId: bookId,
                chapter: chapter,
                verse: verse,
                verseText: verseText,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String versionId,
                required String verseId,
                required String bookId,
                required int chapter,
                required int verse,
                required String verseText,
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => LocalBibleVerseTextsCompanion.insert(
                id: id,
                versionId: versionId,
                verseId: verseId,
                bookId: bookId,
                chapter: chapter,
                verse: verse,
                verseText: verseText,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LocalBibleVerseTextsTable, LocalBibleVerseText>(
                    table,
                  ),
                  BaseReferences<
                    _$AppDatabase,
                    $LocalBibleVerseTextsTable,
                    LocalBibleVerseText
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalBibleVerseTextsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalBibleVerseTextsTable,
      LocalBibleVerseText,
      $$LocalBibleVerseTextsTableFilterComposer,
      $$LocalBibleVerseTextsTableOrderingComposer,
      $$LocalBibleVerseTextsTableAnnotationComposer,
      $$LocalBibleVerseTextsTableCreateCompanionBuilder,
      $$LocalBibleVerseTextsTableUpdateCompanionBuilder,
      (
        LocalBibleVerseText,
        BaseReferences<
          _$AppDatabase,
          $LocalBibleVerseTextsTable,
          LocalBibleVerseText
        >,
      ),
      LocalBibleVerseText,
      PrefetchHooks Function()
    >;
typedef $$LocalSermonsTableCreateCompanionBuilder =
    LocalSermonsCompanion Function({
      required String id,
      required String title,
      required String speaker,
      required DateTime sermonDate,
      Value<String?> series,
      Value<String?> primaryReference,
      required int durationSeconds,
      Value<String?> summary,
      Value<String?> transcriptText,
      Value<String?> transcriptSource,
      Value<String?> transcriptUpdatedAt,
      Value<String?> audioUrl,
      Value<DateTime?> audioUrlExpiresAt,
      Value<String?> thumbnailUrl,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$LocalSermonsTableUpdateCompanionBuilder =
    LocalSermonsCompanion Function({
      Value<String> id,
      Value<String> title,
      Value<String> speaker,
      Value<DateTime> sermonDate,
      Value<String?> series,
      Value<String?> primaryReference,
      Value<int> durationSeconds,
      Value<String?> summary,
      Value<String?> transcriptText,
      Value<String?> transcriptSource,
      Value<String?> transcriptUpdatedAt,
      Value<String?> audioUrl,
      Value<DateTime?> audioUrlExpiresAt,
      Value<String?> thumbnailUrl,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

final class $$LocalSermonsTableReferences
    extends BaseReferences<_$AppDatabase, $LocalSermonsTable, LocalSermon> {
  $$LocalSermonsTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static MultiTypedResultKey<$LocalSermonTopicsTable, List<LocalSermonTopic>>
  _localSermonTopicsRefsTable(_$AppDatabase db) =>
      MultiTypedResultKey.fromTable(
        db.localSermonTopics,
        aliasName: 'local_sermons__id__local_sermon_topics__sermon_id',
      );

  $$LocalSermonTopicsTableProcessedTableManager get localSermonTopicsRefs {
    final manager = $$LocalSermonTopicsTableTableManager(
      $_db,
      $_db.localSermonTopics,
    ).filter((f) => f.sermonId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(
      _localSermonTopicsRefsTable($_db),
    );
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }

  static MultiTypedResultKey<
    $LocalSermonOutlinesTable,
    List<LocalSermonOutline>
  >
  _localSermonOutlinesRefsTable(_$AppDatabase db) =>
      MultiTypedResultKey.fromTable(
        db.localSermonOutlines,
        aliasName: 'local_sermons__id__local_sermon_outlines__sermon_id',
      );

  $$LocalSermonOutlinesTableProcessedTableManager get localSermonOutlinesRefs {
    final manager = $$LocalSermonOutlinesTableTableManager(
      $_db,
      $_db.localSermonOutlines,
    ).filter((f) => f.sermonId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(
      _localSermonOutlinesRefsTable($_db),
    );
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }

  static MultiTypedResultKey<
    $LocalSermonReferencesTable,
    List<LocalSermonReference>
  >
  _localSermonReferencesRefsTable(_$AppDatabase db) =>
      MultiTypedResultKey.fromTable(
        db.localSermonReferences,
        aliasName: 'local_sermons__id__local_sermon_references__sermon_id',
      );

  $$LocalSermonReferencesTableProcessedTableManager
  get localSermonReferencesRefs {
    final manager = $$LocalSermonReferencesTableTableManager(
      $_db,
      $_db.localSermonReferences,
    ).filter((f) => f.sermonId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(
      _localSermonReferencesRefsTable($_db),
    );
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }
}

class $$LocalSermonsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalSermonsTable> {
  $$LocalSermonsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get speaker => $composableBuilder(
    column: $table.speaker,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get sermonDate => $composableBuilder(
    column: $table.sermonDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get series => $composableBuilder(
    column: $table.series,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get primaryReference => $composableBuilder(
    column: $table.primaryReference,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get durationSeconds => $composableBuilder(
    column: $table.durationSeconds,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get summary => $composableBuilder(
    column: $table.summary,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get transcriptText => $composableBuilder(
    column: $table.transcriptText,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get transcriptSource => $composableBuilder(
    column: $table.transcriptSource,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get transcriptUpdatedAt => $composableBuilder(
    column: $table.transcriptUpdatedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get audioUrl => $composableBuilder(
    column: $table.audioUrl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get audioUrlExpiresAt => $composableBuilder(
    column: $table.audioUrlExpiresAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get thumbnailUrl => $composableBuilder(
    column: $table.thumbnailUrl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );

  Expression<bool> localSermonTopicsRefs(
    Expression<bool> Function($$LocalSermonTopicsTableFilterComposer f) f,
  ) {
    final $$LocalSermonTopicsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.localSermonTopics,
      getReferencedColumn: (t) => t.sermonId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalSermonTopicsTableFilterComposer(
            $db: $db,
            $table: $db.localSermonTopics,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }

  Expression<bool> localSermonOutlinesRefs(
    Expression<bool> Function($$LocalSermonOutlinesTableFilterComposer f) f,
  ) {
    final $$LocalSermonOutlinesTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.localSermonOutlines,
      getReferencedColumn: (t) => t.sermonId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalSermonOutlinesTableFilterComposer(
            $db: $db,
            $table: $db.localSermonOutlines,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }

  Expression<bool> localSermonReferencesRefs(
    Expression<bool> Function($$LocalSermonReferencesTableFilterComposer f) f,
  ) {
    final $$LocalSermonReferencesTableFilterComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.id,
          referencedTable: $db.localSermonReferences,
          getReferencedColumn: (t) => t.sermonId,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => $$LocalSermonReferencesTableFilterComposer(
                $db: $db,
                $table: $db.localSermonReferences,
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return f(composer);
  }
}

class $$LocalSermonsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalSermonsTable> {
  $$LocalSermonsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get speaker => $composableBuilder(
    column: $table.speaker,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get sermonDate => $composableBuilder(
    column: $table.sermonDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get series => $composableBuilder(
    column: $table.series,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get primaryReference => $composableBuilder(
    column: $table.primaryReference,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get durationSeconds => $composableBuilder(
    column: $table.durationSeconds,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get summary => $composableBuilder(
    column: $table.summary,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get transcriptText => $composableBuilder(
    column: $table.transcriptText,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get transcriptSource => $composableBuilder(
    column: $table.transcriptSource,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get transcriptUpdatedAt => $composableBuilder(
    column: $table.transcriptUpdatedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get audioUrl => $composableBuilder(
    column: $table.audioUrl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get audioUrlExpiresAt => $composableBuilder(
    column: $table.audioUrlExpiresAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get thumbnailUrl => $composableBuilder(
    column: $table.thumbnailUrl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalSermonsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalSermonsTable> {
  $$LocalSermonsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<String> get speaker =>
      $composableBuilder(column: $table.speaker, builder: (column) => column);

  GeneratedColumn<DateTime> get sermonDate => $composableBuilder(
    column: $table.sermonDate,
    builder: (column) => column,
  );

  GeneratedColumn<String> get series =>
      $composableBuilder(column: $table.series, builder: (column) => column);

  GeneratedColumn<String> get primaryReference => $composableBuilder(
    column: $table.primaryReference,
    builder: (column) => column,
  );

  GeneratedColumn<int> get durationSeconds => $composableBuilder(
    column: $table.durationSeconds,
    builder: (column) => column,
  );

  GeneratedColumn<String> get summary =>
      $composableBuilder(column: $table.summary, builder: (column) => column);

  GeneratedColumn<String> get transcriptText => $composableBuilder(
    column: $table.transcriptText,
    builder: (column) => column,
  );

  GeneratedColumn<String> get transcriptSource => $composableBuilder(
    column: $table.transcriptSource,
    builder: (column) => column,
  );

  GeneratedColumn<String> get transcriptUpdatedAt => $composableBuilder(
    column: $table.transcriptUpdatedAt,
    builder: (column) => column,
  );

  GeneratedColumn<String> get audioUrl =>
      $composableBuilder(column: $table.audioUrl, builder: (column) => column);

  GeneratedColumn<DateTime> get audioUrlExpiresAt => $composableBuilder(
    column: $table.audioUrlExpiresAt,
    builder: (column) => column,
  );

  GeneratedColumn<String> get thumbnailUrl => $composableBuilder(
    column: $table.thumbnailUrl,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  Expression<T> localSermonTopicsRefs<T extends Object>(
    Expression<T> Function($$LocalSermonTopicsTableAnnotationComposer a) f,
  ) {
    final $$LocalSermonTopicsTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.id,
          referencedTable: $db.localSermonTopics,
          getReferencedColumn: (t) => t.sermonId,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => $$LocalSermonTopicsTableAnnotationComposer(
                $db: $db,
                $table: $db.localSermonTopics,
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return f(composer);
  }

  Expression<T> localSermonOutlinesRefs<T extends Object>(
    Expression<T> Function($$LocalSermonOutlinesTableAnnotationComposer a) f,
  ) {
    final $$LocalSermonOutlinesTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.id,
          referencedTable: $db.localSermonOutlines,
          getReferencedColumn: (t) => t.sermonId,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => $$LocalSermonOutlinesTableAnnotationComposer(
                $db: $db,
                $table: $db.localSermonOutlines,
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return f(composer);
  }

  Expression<T> localSermonReferencesRefs<T extends Object>(
    Expression<T> Function($$LocalSermonReferencesTableAnnotationComposer a) f,
  ) {
    final $$LocalSermonReferencesTableAnnotationComposer composer =
        $composerBuilder(
          composer: this,
          getCurrentColumn: (t) => t.id,
          referencedTable: $db.localSermonReferences,
          getReferencedColumn: (t) => t.sermonId,
          builder:
              (
                joinBuilder, {
                $addJoinBuilderToRootComposer,
                $removeJoinBuilderFromRootComposer,
              }) => $$LocalSermonReferencesTableAnnotationComposer(
                $db: $db,
                $table: $db.localSermonReferences,
                $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
                joinBuilder: joinBuilder,
                $removeJoinBuilderFromRootComposer:
                    $removeJoinBuilderFromRootComposer,
              ),
        );
    return f(composer);
  }
}

class $$LocalSermonsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalSermonsTable,
          LocalSermon,
          $$LocalSermonsTableFilterComposer,
          $$LocalSermonsTableOrderingComposer,
          $$LocalSermonsTableAnnotationComposer,
          $$LocalSermonsTableCreateCompanionBuilder,
          $$LocalSermonsTableUpdateCompanionBuilder,
          (LocalSermon, $$LocalSermonsTableReferences),
          LocalSermon,
          PrefetchHooks Function({
            bool localSermonTopicsRefs,
            bool localSermonOutlinesRefs,
            bool localSermonReferencesRefs,
          })
        > {
  $$LocalSermonsTableTableManager(_$AppDatabase db, $LocalSermonsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalSermonsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalSermonsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalSermonsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> title = const Value.absent(),
                Value<String> speaker = const Value.absent(),
                Value<DateTime> sermonDate = const Value.absent(),
                Value<String?> series = const Value.absent(),
                Value<String?> primaryReference = const Value.absent(),
                Value<int> durationSeconds = const Value.absent(),
                Value<String?> summary = const Value.absent(),
                Value<String?> transcriptText = const Value.absent(),
                Value<String?> transcriptSource = const Value.absent(),
                Value<String?> transcriptUpdatedAt = const Value.absent(),
                Value<String?> audioUrl = const Value.absent(),
                Value<DateTime?> audioUrlExpiresAt = const Value.absent(),
                Value<String?> thumbnailUrl = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalSermonsCompanion(
                id: id,
                title: title,
                speaker: speaker,
                sermonDate: sermonDate,
                series: series,
                primaryReference: primaryReference,
                durationSeconds: durationSeconds,
                summary: summary,
                transcriptText: transcriptText,
                transcriptSource: transcriptSource,
                transcriptUpdatedAt: transcriptUpdatedAt,
                audioUrl: audioUrl,
                audioUrlExpiresAt: audioUrlExpiresAt,
                thumbnailUrl: thumbnailUrl,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String title,
                required String speaker,
                required DateTime sermonDate,
                Value<String?> series = const Value.absent(),
                Value<String?> primaryReference = const Value.absent(),
                required int durationSeconds,
                Value<String?> summary = const Value.absent(),
                Value<String?> transcriptText = const Value.absent(),
                Value<String?> transcriptSource = const Value.absent(),
                Value<String?> transcriptUpdatedAt = const Value.absent(),
                Value<String?> audioUrl = const Value.absent(),
                Value<DateTime?> audioUrlExpiresAt = const Value.absent(),
                Value<String?> thumbnailUrl = const Value.absent(),
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => LocalSermonsCompanion.insert(
                id: id,
                title: title,
                speaker: speaker,
                sermonDate: sermonDate,
                series: series,
                primaryReference: primaryReference,
                durationSeconds: durationSeconds,
                summary: summary,
                transcriptText: transcriptText,
                transcriptSource: transcriptSource,
                transcriptUpdatedAt: transcriptUpdatedAt,
                audioUrl: audioUrl,
                audioUrlExpiresAt: audioUrlExpiresAt,
                thumbnailUrl: thumbnailUrl,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LocalSermonsTable, LocalSermon>(table),
                  $$LocalSermonsTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback:
              ({
                localSermonTopicsRefs = false,
                localSermonOutlinesRefs = false,
                localSermonReferencesRefs = false,
              }) {
                return PrefetchHooks(
                  db: db,
                  explicitlyWatchedTables: [
                    if (localSermonTopicsRefs) db.localSermonTopics,
                    if (localSermonOutlinesRefs) db.localSermonOutlines,
                    if (localSermonReferencesRefs) db.localSermonReferences,
                  ],
                  addJoins: null,
                  getPrefetchedDataCallback: (items) async {
                    return [
                      if (localSermonTopicsRefs)
                        await $_getPrefetchedData<
                          LocalSermon,
                          $LocalSermonsTable,
                          LocalSermonTopic
                        >(
                          currentTable: table,
                          referencedTable: $$LocalSermonsTableReferences
                              ._localSermonTopicsRefsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$LocalSermonsTableReferences(
                                db,
                                table,
                                p0,
                              ).localSermonTopicsRefs,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.sermonId == item.id,
                              ),
                          typedResults: items,
                        ),
                      if (localSermonOutlinesRefs)
                        await $_getPrefetchedData<
                          LocalSermon,
                          $LocalSermonsTable,
                          LocalSermonOutline
                        >(
                          currentTable: table,
                          referencedTable: $$LocalSermonsTableReferences
                              ._localSermonOutlinesRefsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$LocalSermonsTableReferences(
                                db,
                                table,
                                p0,
                              ).localSermonOutlinesRefs,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.sermonId == item.id,
                              ),
                          typedResults: items,
                        ),
                      if (localSermonReferencesRefs)
                        await $_getPrefetchedData<
                          LocalSermon,
                          $LocalSermonsTable,
                          LocalSermonReference
                        >(
                          currentTable: table,
                          referencedTable: $$LocalSermonsTableReferences
                              ._localSermonReferencesRefsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$LocalSermonsTableReferences(
                                db,
                                table,
                                p0,
                              ).localSermonReferencesRefs,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.sermonId == item.id,
                              ),
                          typedResults: items,
                        ),
                    ];
                  },
                );
              },
        ),
      );
}

typedef $$LocalSermonsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalSermonsTable,
      LocalSermon,
      $$LocalSermonsTableFilterComposer,
      $$LocalSermonsTableOrderingComposer,
      $$LocalSermonsTableAnnotationComposer,
      $$LocalSermonsTableCreateCompanionBuilder,
      $$LocalSermonsTableUpdateCompanionBuilder,
      (LocalSermon, $$LocalSermonsTableReferences),
      LocalSermon,
      PrefetchHooks Function({
        bool localSermonTopicsRefs,
        bool localSermonOutlinesRefs,
        bool localSermonReferencesRefs,
      })
    >;
typedef $$LocalSermonTopicsTableCreateCompanionBuilder =
    LocalSermonTopicsCompanion Function({
      required String sermonId,
      required String topic,
      required int sortOrder,
      Value<int> rowid,
    });
typedef $$LocalSermonTopicsTableUpdateCompanionBuilder =
    LocalSermonTopicsCompanion Function({
      Value<String> sermonId,
      Value<String> topic,
      Value<int> sortOrder,
      Value<int> rowid,
    });

final class $$LocalSermonTopicsTableReferences
    extends
        BaseReferences<
          _$AppDatabase,
          $LocalSermonTopicsTable,
          LocalSermonTopic
        > {
  $$LocalSermonTopicsTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static $LocalSermonsTable _sermonIdTable(_$AppDatabase db) => db.localSermons
      .createAlias('local_sermon_topics__sermon_id__local_sermons__id');

  $$LocalSermonsTableProcessedTableManager get sermonId {
    final $_column = $_itemColumn<String>('sermon_id')!;

    final manager = $$LocalSermonsTableTableManager(
      $_db,
      $_db.localSermons,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_sermonIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$LocalSermonTopicsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalSermonTopicsTable> {
  $$LocalSermonTopicsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get topic => $composableBuilder(
    column: $table.topic,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get sortOrder => $composableBuilder(
    column: $table.sortOrder,
    builder: (column) => ColumnFilters(column),
  );

  $$LocalSermonsTableFilterComposer get sermonId {
    final $$LocalSermonsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.sermonId,
      referencedTable: $db.localSermons,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalSermonsTableFilterComposer(
            $db: $db,
            $table: $db.localSermons,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$LocalSermonTopicsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalSermonTopicsTable> {
  $$LocalSermonTopicsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get topic => $composableBuilder(
    column: $table.topic,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get sortOrder => $composableBuilder(
    column: $table.sortOrder,
    builder: (column) => ColumnOrderings(column),
  );

  $$LocalSermonsTableOrderingComposer get sermonId {
    final $$LocalSermonsTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.sermonId,
      referencedTable: $db.localSermons,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalSermonsTableOrderingComposer(
            $db: $db,
            $table: $db.localSermons,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$LocalSermonTopicsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalSermonTopicsTable> {
  $$LocalSermonTopicsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get topic =>
      $composableBuilder(column: $table.topic, builder: (column) => column);

  GeneratedColumn<int> get sortOrder =>
      $composableBuilder(column: $table.sortOrder, builder: (column) => column);

  $$LocalSermonsTableAnnotationComposer get sermonId {
    final $$LocalSermonsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.sermonId,
      referencedTable: $db.localSermons,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalSermonsTableAnnotationComposer(
            $db: $db,
            $table: $db.localSermons,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$LocalSermonTopicsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalSermonTopicsTable,
          LocalSermonTopic,
          $$LocalSermonTopicsTableFilterComposer,
          $$LocalSermonTopicsTableOrderingComposer,
          $$LocalSermonTopicsTableAnnotationComposer,
          $$LocalSermonTopicsTableCreateCompanionBuilder,
          $$LocalSermonTopicsTableUpdateCompanionBuilder,
          (LocalSermonTopic, $$LocalSermonTopicsTableReferences),
          LocalSermonTopic,
          PrefetchHooks Function({bool sermonId})
        > {
  $$LocalSermonTopicsTableTableManager(
    _$AppDatabase db,
    $LocalSermonTopicsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalSermonTopicsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalSermonTopicsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalSermonTopicsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> sermonId = const Value.absent(),
                Value<String> topic = const Value.absent(),
                Value<int> sortOrder = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalSermonTopicsCompanion(
                sermonId: sermonId,
                topic: topic,
                sortOrder: sortOrder,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String sermonId,
                required String topic,
                required int sortOrder,
                Value<int> rowid = const Value.absent(),
              }) => LocalSermonTopicsCompanion.insert(
                sermonId: sermonId,
                topic: topic,
                sortOrder: sortOrder,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LocalSermonTopicsTable, LocalSermonTopic>(table),
                  $$LocalSermonTopicsTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({sermonId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (sermonId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.sermonId,
                                referencedTable:
                                    $$LocalSermonTopicsTableReferences
                                        ._sermonIdTable(db),
                                referencedColumn:
                                    $$LocalSermonTopicsTableReferences
                                        ._sermonIdTable(db)
                                        .id,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$LocalSermonTopicsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalSermonTopicsTable,
      LocalSermonTopic,
      $$LocalSermonTopicsTableFilterComposer,
      $$LocalSermonTopicsTableOrderingComposer,
      $$LocalSermonTopicsTableAnnotationComposer,
      $$LocalSermonTopicsTableCreateCompanionBuilder,
      $$LocalSermonTopicsTableUpdateCompanionBuilder,
      (LocalSermonTopic, $$LocalSermonTopicsTableReferences),
      LocalSermonTopic,
      PrefetchHooks Function({bool sermonId})
    >;
typedef $$LocalSermonOutlinesTableCreateCompanionBuilder =
    LocalSermonOutlinesCompanion Function({
      required String id,
      required String sermonId,
      required String title,
      required String summary,
      required int startSeconds,
      required int sortOrder,
      Value<int> rowid,
    });
typedef $$LocalSermonOutlinesTableUpdateCompanionBuilder =
    LocalSermonOutlinesCompanion Function({
      Value<String> id,
      Value<String> sermonId,
      Value<String> title,
      Value<String> summary,
      Value<int> startSeconds,
      Value<int> sortOrder,
      Value<int> rowid,
    });

final class $$LocalSermonOutlinesTableReferences
    extends
        BaseReferences<
          _$AppDatabase,
          $LocalSermonOutlinesTable,
          LocalSermonOutline
        > {
  $$LocalSermonOutlinesTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static $LocalSermonsTable _sermonIdTable(_$AppDatabase db) => db.localSermons
      .createAlias('local_sermon_outlines__sermon_id__local_sermons__id');

  $$LocalSermonsTableProcessedTableManager get sermonId {
    final $_column = $_itemColumn<String>('sermon_id')!;

    final manager = $$LocalSermonsTableTableManager(
      $_db,
      $_db.localSermons,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_sermonIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$LocalSermonOutlinesTableFilterComposer
    extends Composer<_$AppDatabase, $LocalSermonOutlinesTable> {
  $$LocalSermonOutlinesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get summary => $composableBuilder(
    column: $table.summary,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get startSeconds => $composableBuilder(
    column: $table.startSeconds,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get sortOrder => $composableBuilder(
    column: $table.sortOrder,
    builder: (column) => ColumnFilters(column),
  );

  $$LocalSermonsTableFilterComposer get sermonId {
    final $$LocalSermonsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.sermonId,
      referencedTable: $db.localSermons,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalSermonsTableFilterComposer(
            $db: $db,
            $table: $db.localSermons,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$LocalSermonOutlinesTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalSermonOutlinesTable> {
  $$LocalSermonOutlinesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get summary => $composableBuilder(
    column: $table.summary,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get startSeconds => $composableBuilder(
    column: $table.startSeconds,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get sortOrder => $composableBuilder(
    column: $table.sortOrder,
    builder: (column) => ColumnOrderings(column),
  );

  $$LocalSermonsTableOrderingComposer get sermonId {
    final $$LocalSermonsTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.sermonId,
      referencedTable: $db.localSermons,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalSermonsTableOrderingComposer(
            $db: $db,
            $table: $db.localSermons,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$LocalSermonOutlinesTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalSermonOutlinesTable> {
  $$LocalSermonOutlinesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<String> get summary =>
      $composableBuilder(column: $table.summary, builder: (column) => column);

  GeneratedColumn<int> get startSeconds => $composableBuilder(
    column: $table.startSeconds,
    builder: (column) => column,
  );

  GeneratedColumn<int> get sortOrder =>
      $composableBuilder(column: $table.sortOrder, builder: (column) => column);

  $$LocalSermonsTableAnnotationComposer get sermonId {
    final $$LocalSermonsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.sermonId,
      referencedTable: $db.localSermons,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalSermonsTableAnnotationComposer(
            $db: $db,
            $table: $db.localSermons,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$LocalSermonOutlinesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalSermonOutlinesTable,
          LocalSermonOutline,
          $$LocalSermonOutlinesTableFilterComposer,
          $$LocalSermonOutlinesTableOrderingComposer,
          $$LocalSermonOutlinesTableAnnotationComposer,
          $$LocalSermonOutlinesTableCreateCompanionBuilder,
          $$LocalSermonOutlinesTableUpdateCompanionBuilder,
          (LocalSermonOutline, $$LocalSermonOutlinesTableReferences),
          LocalSermonOutline,
          PrefetchHooks Function({bool sermonId})
        > {
  $$LocalSermonOutlinesTableTableManager(
    _$AppDatabase db,
    $LocalSermonOutlinesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalSermonOutlinesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalSermonOutlinesTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$LocalSermonOutlinesTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> sermonId = const Value.absent(),
                Value<String> title = const Value.absent(),
                Value<String> summary = const Value.absent(),
                Value<int> startSeconds = const Value.absent(),
                Value<int> sortOrder = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalSermonOutlinesCompanion(
                id: id,
                sermonId: sermonId,
                title: title,
                summary: summary,
                startSeconds: startSeconds,
                sortOrder: sortOrder,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String sermonId,
                required String title,
                required String summary,
                required int startSeconds,
                required int sortOrder,
                Value<int> rowid = const Value.absent(),
              }) => LocalSermonOutlinesCompanion.insert(
                id: id,
                sermonId: sermonId,
                title: title,
                summary: summary,
                startSeconds: startSeconds,
                sortOrder: sortOrder,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LocalSermonOutlinesTable, LocalSermonOutline>(
                    table,
                  ),
                  $$LocalSermonOutlinesTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({sermonId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (sermonId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.sermonId,
                                referencedTable:
                                    $$LocalSermonOutlinesTableReferences
                                        ._sermonIdTable(db),
                                referencedColumn:
                                    $$LocalSermonOutlinesTableReferences
                                        ._sermonIdTable(db)
                                        .id,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$LocalSermonOutlinesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalSermonOutlinesTable,
      LocalSermonOutline,
      $$LocalSermonOutlinesTableFilterComposer,
      $$LocalSermonOutlinesTableOrderingComposer,
      $$LocalSermonOutlinesTableAnnotationComposer,
      $$LocalSermonOutlinesTableCreateCompanionBuilder,
      $$LocalSermonOutlinesTableUpdateCompanionBuilder,
      (LocalSermonOutline, $$LocalSermonOutlinesTableReferences),
      LocalSermonOutline,
      PrefetchHooks Function({bool sermonId})
    >;
typedef $$LocalSermonReferencesTableCreateCompanionBuilder =
    LocalSermonReferencesCompanion Function({
      required String id,
      required String sermonId,
      required String verseId,
      required String referenceText,
      Value<String?> note,
      Value<int?> startSeconds,
      Value<int> rowid,
    });
typedef $$LocalSermonReferencesTableUpdateCompanionBuilder =
    LocalSermonReferencesCompanion Function({
      Value<String> id,
      Value<String> sermonId,
      Value<String> verseId,
      Value<String> referenceText,
      Value<String?> note,
      Value<int?> startSeconds,
      Value<int> rowid,
    });

final class $$LocalSermonReferencesTableReferences
    extends
        BaseReferences<
          _$AppDatabase,
          $LocalSermonReferencesTable,
          LocalSermonReference
        > {
  $$LocalSermonReferencesTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static $LocalSermonsTable _sermonIdTable(_$AppDatabase db) => db.localSermons
      .createAlias('local_sermon_references__sermon_id__local_sermons__id');

  $$LocalSermonsTableProcessedTableManager get sermonId {
    final $_column = $_itemColumn<String>('sermon_id')!;

    final manager = $$LocalSermonsTableTableManager(
      $_db,
      $_db.localSermons,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_sermonIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$LocalSermonReferencesTableFilterComposer
    extends Composer<_$AppDatabase, $LocalSermonReferencesTable> {
  $$LocalSermonReferencesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get verseId => $composableBuilder(
    column: $table.verseId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get referenceText => $composableBuilder(
    column: $table.referenceText,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get note => $composableBuilder(
    column: $table.note,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get startSeconds => $composableBuilder(
    column: $table.startSeconds,
    builder: (column) => ColumnFilters(column),
  );

  $$LocalSermonsTableFilterComposer get sermonId {
    final $$LocalSermonsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.sermonId,
      referencedTable: $db.localSermons,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalSermonsTableFilterComposer(
            $db: $db,
            $table: $db.localSermons,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$LocalSermonReferencesTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalSermonReferencesTable> {
  $$LocalSermonReferencesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get verseId => $composableBuilder(
    column: $table.verseId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get referenceText => $composableBuilder(
    column: $table.referenceText,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get note => $composableBuilder(
    column: $table.note,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get startSeconds => $composableBuilder(
    column: $table.startSeconds,
    builder: (column) => ColumnOrderings(column),
  );

  $$LocalSermonsTableOrderingComposer get sermonId {
    final $$LocalSermonsTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.sermonId,
      referencedTable: $db.localSermons,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalSermonsTableOrderingComposer(
            $db: $db,
            $table: $db.localSermons,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$LocalSermonReferencesTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalSermonReferencesTable> {
  $$LocalSermonReferencesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get verseId =>
      $composableBuilder(column: $table.verseId, builder: (column) => column);

  GeneratedColumn<String> get referenceText => $composableBuilder(
    column: $table.referenceText,
    builder: (column) => column,
  );

  GeneratedColumn<String> get note =>
      $composableBuilder(column: $table.note, builder: (column) => column);

  GeneratedColumn<int> get startSeconds => $composableBuilder(
    column: $table.startSeconds,
    builder: (column) => column,
  );

  $$LocalSermonsTableAnnotationComposer get sermonId {
    final $$LocalSermonsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.sermonId,
      referencedTable: $db.localSermons,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalSermonsTableAnnotationComposer(
            $db: $db,
            $table: $db.localSermons,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$LocalSermonReferencesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalSermonReferencesTable,
          LocalSermonReference,
          $$LocalSermonReferencesTableFilterComposer,
          $$LocalSermonReferencesTableOrderingComposer,
          $$LocalSermonReferencesTableAnnotationComposer,
          $$LocalSermonReferencesTableCreateCompanionBuilder,
          $$LocalSermonReferencesTableUpdateCompanionBuilder,
          (LocalSermonReference, $$LocalSermonReferencesTableReferences),
          LocalSermonReference,
          PrefetchHooks Function({bool sermonId})
        > {
  $$LocalSermonReferencesTableTableManager(
    _$AppDatabase db,
    $LocalSermonReferencesTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalSermonReferencesTableFilterComposer(
                $db: db,
                $table: table,
              ),
          createOrderingComposer: () =>
              $$LocalSermonReferencesTableOrderingComposer(
                $db: db,
                $table: table,
              ),
          createComputedFieldComposer: () =>
              $$LocalSermonReferencesTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> sermonId = const Value.absent(),
                Value<String> verseId = const Value.absent(),
                Value<String> referenceText = const Value.absent(),
                Value<String?> note = const Value.absent(),
                Value<int?> startSeconds = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalSermonReferencesCompanion(
                id: id,
                sermonId: sermonId,
                verseId: verseId,
                referenceText: referenceText,
                note: note,
                startSeconds: startSeconds,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String sermonId,
                required String verseId,
                required String referenceText,
                Value<String?> note = const Value.absent(),
                Value<int?> startSeconds = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalSermonReferencesCompanion.insert(
                id: id,
                sermonId: sermonId,
                verseId: verseId,
                referenceText: referenceText,
                note: note,
                startSeconds: startSeconds,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<
                    $LocalSermonReferencesTable,
                    LocalSermonReference
                  >(table),
                  $$LocalSermonReferencesTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({sermonId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (sermonId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.sermonId,
                                referencedTable:
                                    $$LocalSermonReferencesTableReferences
                                        ._sermonIdTable(db),
                                referencedColumn:
                                    $$LocalSermonReferencesTableReferences
                                        ._sermonIdTable(db)
                                        .id,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$LocalSermonReferencesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalSermonReferencesTable,
      LocalSermonReference,
      $$LocalSermonReferencesTableFilterComposer,
      $$LocalSermonReferencesTableOrderingComposer,
      $$LocalSermonReferencesTableAnnotationComposer,
      $$LocalSermonReferencesTableCreateCompanionBuilder,
      $$LocalSermonReferencesTableUpdateCompanionBuilder,
      (LocalSermonReference, $$LocalSermonReferencesTableReferences),
      LocalSermonReference,
      PrefetchHooks Function({bool sermonId})
    >;
typedef $$LocalLifePostsTableCreateCompanionBuilder =
    LocalLifePostsCompanion Function({
      required String id,
      required String type,
      required String title,
      required String body,
      Value<String> meta,
      Value<String> iconName,
      Value<DateTime?> startsAt,
      Value<DateTime?> endsAt,
      required String visibility,
      Value<String> status,
      Value<String?> imageUrl,
      Value<int> displayWeight,
      Value<String?> ctaLabel,
      Value<String?> ctaUrl,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$LocalLifePostsTableUpdateCompanionBuilder =
    LocalLifePostsCompanion Function({
      Value<String> id,
      Value<String> type,
      Value<String> title,
      Value<String> body,
      Value<String> meta,
      Value<String> iconName,
      Value<DateTime?> startsAt,
      Value<DateTime?> endsAt,
      Value<String> visibility,
      Value<String> status,
      Value<String?> imageUrl,
      Value<int> displayWeight,
      Value<String?> ctaLabel,
      Value<String?> ctaUrl,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$LocalLifePostsTableFilterComposer
    extends Composer<_$AppDatabase, $LocalLifePostsTable> {
  $$LocalLifePostsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get type => $composableBuilder(
    column: $table.type,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get body => $composableBuilder(
    column: $table.body,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get meta => $composableBuilder(
    column: $table.meta,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get iconName => $composableBuilder(
    column: $table.iconName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get startsAt => $composableBuilder(
    column: $table.startsAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get endsAt => $composableBuilder(
    column: $table.endsAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get visibility => $composableBuilder(
    column: $table.visibility,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get imageUrl => $composableBuilder(
    column: $table.imageUrl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get displayWeight => $composableBuilder(
    column: $table.displayWeight,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get ctaLabel => $composableBuilder(
    column: $table.ctaLabel,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get ctaUrl => $composableBuilder(
    column: $table.ctaUrl,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$LocalLifePostsTableOrderingComposer
    extends Composer<_$AppDatabase, $LocalLifePostsTable> {
  $$LocalLifePostsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get type => $composableBuilder(
    column: $table.type,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get body => $composableBuilder(
    column: $table.body,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get meta => $composableBuilder(
    column: $table.meta,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get iconName => $composableBuilder(
    column: $table.iconName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get startsAt => $composableBuilder(
    column: $table.startsAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get endsAt => $composableBuilder(
    column: $table.endsAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get visibility => $composableBuilder(
    column: $table.visibility,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get imageUrl => $composableBuilder(
    column: $table.imageUrl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get displayWeight => $composableBuilder(
    column: $table.displayWeight,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get ctaLabel => $composableBuilder(
    column: $table.ctaLabel,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get ctaUrl => $composableBuilder(
    column: $table.ctaUrl,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$LocalLifePostsTableAnnotationComposer
    extends Composer<_$AppDatabase, $LocalLifePostsTable> {
  $$LocalLifePostsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get type =>
      $composableBuilder(column: $table.type, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<String> get body =>
      $composableBuilder(column: $table.body, builder: (column) => column);

  GeneratedColumn<String> get meta =>
      $composableBuilder(column: $table.meta, builder: (column) => column);

  GeneratedColumn<String> get iconName =>
      $composableBuilder(column: $table.iconName, builder: (column) => column);

  GeneratedColumn<DateTime> get startsAt =>
      $composableBuilder(column: $table.startsAt, builder: (column) => column);

  GeneratedColumn<DateTime> get endsAt =>
      $composableBuilder(column: $table.endsAt, builder: (column) => column);

  GeneratedColumn<String> get visibility => $composableBuilder(
    column: $table.visibility,
    builder: (column) => column,
  );

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get imageUrl =>
      $composableBuilder(column: $table.imageUrl, builder: (column) => column);

  GeneratedColumn<int> get displayWeight => $composableBuilder(
    column: $table.displayWeight,
    builder: (column) => column,
  );

  GeneratedColumn<String> get ctaLabel =>
      $composableBuilder(column: $table.ctaLabel, builder: (column) => column);

  GeneratedColumn<String> get ctaUrl =>
      $composableBuilder(column: $table.ctaUrl, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$LocalLifePostsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $LocalLifePostsTable,
          LocalLifePost,
          $$LocalLifePostsTableFilterComposer,
          $$LocalLifePostsTableOrderingComposer,
          $$LocalLifePostsTableAnnotationComposer,
          $$LocalLifePostsTableCreateCompanionBuilder,
          $$LocalLifePostsTableUpdateCompanionBuilder,
          (
            LocalLifePost,
            BaseReferences<_$AppDatabase, $LocalLifePostsTable, LocalLifePost>,
          ),
          LocalLifePost,
          PrefetchHooks Function()
        > {
  $$LocalLifePostsTableTableManager(
    _$AppDatabase db,
    $LocalLifePostsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$LocalLifePostsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$LocalLifePostsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$LocalLifePostsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> type = const Value.absent(),
                Value<String> title = const Value.absent(),
                Value<String> body = const Value.absent(),
                Value<String> meta = const Value.absent(),
                Value<String> iconName = const Value.absent(),
                Value<DateTime?> startsAt = const Value.absent(),
                Value<DateTime?> endsAt = const Value.absent(),
                Value<String> visibility = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String?> imageUrl = const Value.absent(),
                Value<int> displayWeight = const Value.absent(),
                Value<String?> ctaLabel = const Value.absent(),
                Value<String?> ctaUrl = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => LocalLifePostsCompanion(
                id: id,
                type: type,
                title: title,
                body: body,
                meta: meta,
                iconName: iconName,
                startsAt: startsAt,
                endsAt: endsAt,
                visibility: visibility,
                status: status,
                imageUrl: imageUrl,
                displayWeight: displayWeight,
                ctaLabel: ctaLabel,
                ctaUrl: ctaUrl,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String type,
                required String title,
                required String body,
                Value<String> meta = const Value.absent(),
                Value<String> iconName = const Value.absent(),
                Value<DateTime?> startsAt = const Value.absent(),
                Value<DateTime?> endsAt = const Value.absent(),
                required String visibility,
                Value<String> status = const Value.absent(),
                Value<String?> imageUrl = const Value.absent(),
                Value<int> displayWeight = const Value.absent(),
                Value<String?> ctaLabel = const Value.absent(),
                Value<String?> ctaUrl = const Value.absent(),
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => LocalLifePostsCompanion.insert(
                id: id,
                type: type,
                title: title,
                body: body,
                meta: meta,
                iconName: iconName,
                startsAt: startsAt,
                endsAt: endsAt,
                visibility: visibility,
                status: status,
                imageUrl: imageUrl,
                displayWeight: displayWeight,
                ctaLabel: ctaLabel,
                ctaUrl: ctaUrl,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$LocalLifePostsTable, LocalLifePost>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $LocalLifePostsTable,
                    LocalLifePost
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$LocalLifePostsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $LocalLifePostsTable,
      LocalLifePost,
      $$LocalLifePostsTableFilterComposer,
      $$LocalLifePostsTableOrderingComposer,
      $$LocalLifePostsTableAnnotationComposer,
      $$LocalLifePostsTableCreateCompanionBuilder,
      $$LocalLifePostsTableUpdateCompanionBuilder,
      (
        LocalLifePost,
        BaseReferences<_$AppDatabase, $LocalLifePostsTable, LocalLifePost>,
      ),
      LocalLifePost,
      PrefetchHooks Function()
    >;
typedef $$ReadingProgressTableCreateCompanionBuilder =
    ReadingProgressCompanion Function({
      required String id,
      required String bookId,
      required int chapter,
      Value<String?> verseId,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$ReadingProgressTableUpdateCompanionBuilder =
    ReadingProgressCompanion Function({
      Value<String> id,
      Value<String> bookId,
      Value<int> chapter,
      Value<String?> verseId,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

final class $$ReadingProgressTableReferences
    extends
        BaseReferences<
          _$AppDatabase,
          $ReadingProgressTable,
          ReadingProgressData
        > {
  $$ReadingProgressTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static $LocalBibleBooksTable _bookIdTable(_$AppDatabase db) => db
      .localBibleBooks
      .createAlias('reading_progress__book_id__local_bible_books__id');

  $$LocalBibleBooksTableProcessedTableManager get bookId {
    final $_column = $_itemColumn<String>('book_id')!;

    final manager = $$LocalBibleBooksTableTableManager(
      $_db,
      $_db.localBibleBooks,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_bookIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$ReadingProgressTableFilterComposer
    extends Composer<_$AppDatabase, $ReadingProgressTable> {
  $$ReadingProgressTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get chapter => $composableBuilder(
    column: $table.chapter,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get verseId => $composableBuilder(
    column: $table.verseId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );

  $$LocalBibleBooksTableFilterComposer get bookId {
    final $$LocalBibleBooksTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.bookId,
      referencedTable: $db.localBibleBooks,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalBibleBooksTableFilterComposer(
            $db: $db,
            $table: $db.localBibleBooks,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$ReadingProgressTableOrderingComposer
    extends Composer<_$AppDatabase, $ReadingProgressTable> {
  $$ReadingProgressTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get chapter => $composableBuilder(
    column: $table.chapter,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get verseId => $composableBuilder(
    column: $table.verseId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );

  $$LocalBibleBooksTableOrderingComposer get bookId {
    final $$LocalBibleBooksTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.bookId,
      referencedTable: $db.localBibleBooks,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalBibleBooksTableOrderingComposer(
            $db: $db,
            $table: $db.localBibleBooks,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$ReadingProgressTableAnnotationComposer
    extends Composer<_$AppDatabase, $ReadingProgressTable> {
  $$ReadingProgressTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<int> get chapter =>
      $composableBuilder(column: $table.chapter, builder: (column) => column);

  GeneratedColumn<String> get verseId =>
      $composableBuilder(column: $table.verseId, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  $$LocalBibleBooksTableAnnotationComposer get bookId {
    final $$LocalBibleBooksTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.bookId,
      referencedTable: $db.localBibleBooks,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$LocalBibleBooksTableAnnotationComposer(
            $db: $db,
            $table: $db.localBibleBooks,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$ReadingProgressTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $ReadingProgressTable,
          ReadingProgressData,
          $$ReadingProgressTableFilterComposer,
          $$ReadingProgressTableOrderingComposer,
          $$ReadingProgressTableAnnotationComposer,
          $$ReadingProgressTableCreateCompanionBuilder,
          $$ReadingProgressTableUpdateCompanionBuilder,
          (ReadingProgressData, $$ReadingProgressTableReferences),
          ReadingProgressData,
          PrefetchHooks Function({bool bookId})
        > {
  $$ReadingProgressTableTableManager(
    _$AppDatabase db,
    $ReadingProgressTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ReadingProgressTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ReadingProgressTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ReadingProgressTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> bookId = const Value.absent(),
                Value<int> chapter = const Value.absent(),
                Value<String?> verseId = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => ReadingProgressCompanion(
                id: id,
                bookId: bookId,
                chapter: chapter,
                verseId: verseId,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String bookId,
                required int chapter,
                Value<String?> verseId = const Value.absent(),
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => ReadingProgressCompanion.insert(
                id: id,
                bookId: bookId,
                chapter: chapter,
                verseId: verseId,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$ReadingProgressTable, ReadingProgressData>(
                    table,
                  ),
                  $$ReadingProgressTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({bookId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (bookId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.bookId,
                                referencedTable:
                                    $$ReadingProgressTableReferences
                                        ._bookIdTable(db),
                                referencedColumn:
                                    $$ReadingProgressTableReferences
                                        ._bookIdTable(db)
                                        .id,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$ReadingProgressTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $ReadingProgressTable,
      ReadingProgressData,
      $$ReadingProgressTableFilterComposer,
      $$ReadingProgressTableOrderingComposer,
      $$ReadingProgressTableAnnotationComposer,
      $$ReadingProgressTableCreateCompanionBuilder,
      $$ReadingProgressTableUpdateCompanionBuilder,
      (ReadingProgressData, $$ReadingProgressTableReferences),
      ReadingProgressData,
      PrefetchHooks Function({bool bookId})
    >;
typedef $$StudyNotesTableCreateCompanionBuilder =
    StudyNotesCompanion Function({
      required String id,
      required String verseId,
      required String noteText,
      Value<String?> highlightColor,
      Value<bool> dirty,
      Value<bool> deleted,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$StudyNotesTableUpdateCompanionBuilder =
    StudyNotesCompanion Function({
      Value<String> id,
      Value<String> verseId,
      Value<String> noteText,
      Value<String?> highlightColor,
      Value<bool> dirty,
      Value<bool> deleted,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$StudyNotesTableFilterComposer
    extends Composer<_$AppDatabase, $StudyNotesTable> {
  $$StudyNotesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get verseId => $composableBuilder(
    column: $table.verseId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get noteText => $composableBuilder(
    column: $table.noteText,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get highlightColor => $composableBuilder(
    column: $table.highlightColor,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get dirty => $composableBuilder(
    column: $table.dirty,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get deleted => $composableBuilder(
    column: $table.deleted,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$StudyNotesTableOrderingComposer
    extends Composer<_$AppDatabase, $StudyNotesTable> {
  $$StudyNotesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get verseId => $composableBuilder(
    column: $table.verseId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get noteText => $composableBuilder(
    column: $table.noteText,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get highlightColor => $composableBuilder(
    column: $table.highlightColor,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get dirty => $composableBuilder(
    column: $table.dirty,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get deleted => $composableBuilder(
    column: $table.deleted,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$StudyNotesTableAnnotationComposer
    extends Composer<_$AppDatabase, $StudyNotesTable> {
  $$StudyNotesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get verseId =>
      $composableBuilder(column: $table.verseId, builder: (column) => column);

  GeneratedColumn<String> get noteText =>
      $composableBuilder(column: $table.noteText, builder: (column) => column);

  GeneratedColumn<String> get highlightColor => $composableBuilder(
    column: $table.highlightColor,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get dirty =>
      $composableBuilder(column: $table.dirty, builder: (column) => column);

  GeneratedColumn<bool> get deleted =>
      $composableBuilder(column: $table.deleted, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$StudyNotesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $StudyNotesTable,
          StudyNote,
          $$StudyNotesTableFilterComposer,
          $$StudyNotesTableOrderingComposer,
          $$StudyNotesTableAnnotationComposer,
          $$StudyNotesTableCreateCompanionBuilder,
          $$StudyNotesTableUpdateCompanionBuilder,
          (
            StudyNote,
            BaseReferences<_$AppDatabase, $StudyNotesTable, StudyNote>,
          ),
          StudyNote,
          PrefetchHooks Function()
        > {
  $$StudyNotesTableTableManager(_$AppDatabase db, $StudyNotesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$StudyNotesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$StudyNotesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$StudyNotesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> verseId = const Value.absent(),
                Value<String> noteText = const Value.absent(),
                Value<String?> highlightColor = const Value.absent(),
                Value<bool> dirty = const Value.absent(),
                Value<bool> deleted = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => StudyNotesCompanion(
                id: id,
                verseId: verseId,
                noteText: noteText,
                highlightColor: highlightColor,
                dirty: dirty,
                deleted: deleted,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String verseId,
                required String noteText,
                Value<String?> highlightColor = const Value.absent(),
                Value<bool> dirty = const Value.absent(),
                Value<bool> deleted = const Value.absent(),
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => StudyNotesCompanion.insert(
                id: id,
                verseId: verseId,
                noteText: noteText,
                highlightColor: highlightColor,
                dirty: dirty,
                deleted: deleted,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$StudyNotesTable, StudyNote>(table),
                  BaseReferences<_$AppDatabase, $StudyNotesTable, StudyNote>(
                    db,
                    table,
                    e,
                  ),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$StudyNotesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $StudyNotesTable,
      StudyNote,
      $$StudyNotesTableFilterComposer,
      $$StudyNotesTableOrderingComposer,
      $$StudyNotesTableAnnotationComposer,
      $$StudyNotesTableCreateCompanionBuilder,
      $$StudyNotesTableUpdateCompanionBuilder,
      (StudyNote, BaseReferences<_$AppDatabase, $StudyNotesTable, StudyNote>),
      StudyNote,
      PrefetchHooks Function()
    >;
typedef $$StudyBookmarksTableCreateCompanionBuilder =
    StudyBookmarksCompanion Function({
      required String id,
      required String verseId,
      Value<bool> dirty,
      Value<bool> deleted,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$StudyBookmarksTableUpdateCompanionBuilder =
    StudyBookmarksCompanion Function({
      Value<String> id,
      Value<String> verseId,
      Value<bool> dirty,
      Value<bool> deleted,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$StudyBookmarksTableFilterComposer
    extends Composer<_$AppDatabase, $StudyBookmarksTable> {
  $$StudyBookmarksTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get verseId => $composableBuilder(
    column: $table.verseId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get dirty => $composableBuilder(
    column: $table.dirty,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get deleted => $composableBuilder(
    column: $table.deleted,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$StudyBookmarksTableOrderingComposer
    extends Composer<_$AppDatabase, $StudyBookmarksTable> {
  $$StudyBookmarksTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get verseId => $composableBuilder(
    column: $table.verseId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get dirty => $composableBuilder(
    column: $table.dirty,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get deleted => $composableBuilder(
    column: $table.deleted,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$StudyBookmarksTableAnnotationComposer
    extends Composer<_$AppDatabase, $StudyBookmarksTable> {
  $$StudyBookmarksTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get verseId =>
      $composableBuilder(column: $table.verseId, builder: (column) => column);

  GeneratedColumn<bool> get dirty =>
      $composableBuilder(column: $table.dirty, builder: (column) => column);

  GeneratedColumn<bool> get deleted =>
      $composableBuilder(column: $table.deleted, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$StudyBookmarksTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $StudyBookmarksTable,
          StudyBookmark,
          $$StudyBookmarksTableFilterComposer,
          $$StudyBookmarksTableOrderingComposer,
          $$StudyBookmarksTableAnnotationComposer,
          $$StudyBookmarksTableCreateCompanionBuilder,
          $$StudyBookmarksTableUpdateCompanionBuilder,
          (
            StudyBookmark,
            BaseReferences<_$AppDatabase, $StudyBookmarksTable, StudyBookmark>,
          ),
          StudyBookmark,
          PrefetchHooks Function()
        > {
  $$StudyBookmarksTableTableManager(
    _$AppDatabase db,
    $StudyBookmarksTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$StudyBookmarksTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$StudyBookmarksTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$StudyBookmarksTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> verseId = const Value.absent(),
                Value<bool> dirty = const Value.absent(),
                Value<bool> deleted = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => StudyBookmarksCompanion(
                id: id,
                verseId: verseId,
                dirty: dirty,
                deleted: deleted,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String verseId,
                Value<bool> dirty = const Value.absent(),
                Value<bool> deleted = const Value.absent(),
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => StudyBookmarksCompanion.insert(
                id: id,
                verseId: verseId,
                dirty: dirty,
                deleted: deleted,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$StudyBookmarksTable, StudyBookmark>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $StudyBookmarksTable,
                    StudyBookmark
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$StudyBookmarksTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $StudyBookmarksTable,
      StudyBookmark,
      $$StudyBookmarksTableFilterComposer,
      $$StudyBookmarksTableOrderingComposer,
      $$StudyBookmarksTableAnnotationComposer,
      $$StudyBookmarksTableCreateCompanionBuilder,
      $$StudyBookmarksTableUpdateCompanionBuilder,
      (
        StudyBookmark,
        BaseReferences<_$AppDatabase, $StudyBookmarksTable, StudyBookmark>,
      ),
      StudyBookmark,
      PrefetchHooks Function()
    >;
typedef $$SyncQueueTableCreateCompanionBuilder =
    SyncQueueCompanion Function({
      required String id,
      required String entityType,
      required String entityId,
      required String action,
      required String payloadJson,
      Value<int> attempts,
      Value<String?> lastError,
      required DateTime createdAt,
      Value<int> rowid,
    });
typedef $$SyncQueueTableUpdateCompanionBuilder =
    SyncQueueCompanion Function({
      Value<String> id,
      Value<String> entityType,
      Value<String> entityId,
      Value<String> action,
      Value<String> payloadJson,
      Value<int> attempts,
      Value<String?> lastError,
      Value<DateTime> createdAt,
      Value<int> rowid,
    });

class $$SyncQueueTableFilterComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get entityType => $composableBuilder(
    column: $table.entityType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get entityId => $composableBuilder(
    column: $table.entityId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get action => $composableBuilder(
    column: $table.action,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get payloadJson => $composableBuilder(
    column: $table.payloadJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get attempts => $composableBuilder(
    column: $table.attempts,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lastError => $composableBuilder(
    column: $table.lastError,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$SyncQueueTableOrderingComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get entityType => $composableBuilder(
    column: $table.entityType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get entityId => $composableBuilder(
    column: $table.entityId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get action => $composableBuilder(
    column: $table.action,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get payloadJson => $composableBuilder(
    column: $table.payloadJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get attempts => $composableBuilder(
    column: $table.attempts,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lastError => $composableBuilder(
    column: $table.lastError,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SyncQueueTableAnnotationComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get entityType => $composableBuilder(
    column: $table.entityType,
    builder: (column) => column,
  );

  GeneratedColumn<String> get entityId =>
      $composableBuilder(column: $table.entityId, builder: (column) => column);

  GeneratedColumn<String> get action =>
      $composableBuilder(column: $table.action, builder: (column) => column);

  GeneratedColumn<String> get payloadJson => $composableBuilder(
    column: $table.payloadJson,
    builder: (column) => column,
  );

  GeneratedColumn<int> get attempts =>
      $composableBuilder(column: $table.attempts, builder: (column) => column);

  GeneratedColumn<String> get lastError =>
      $composableBuilder(column: $table.lastError, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$SyncQueueTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $SyncQueueTable,
          SyncQueueData,
          $$SyncQueueTableFilterComposer,
          $$SyncQueueTableOrderingComposer,
          $$SyncQueueTableAnnotationComposer,
          $$SyncQueueTableCreateCompanionBuilder,
          $$SyncQueueTableUpdateCompanionBuilder,
          (
            SyncQueueData,
            BaseReferences<_$AppDatabase, $SyncQueueTable, SyncQueueData>,
          ),
          SyncQueueData,
          PrefetchHooks Function()
        > {
  $$SyncQueueTableTableManager(_$AppDatabase db, $SyncQueueTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncQueueTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncQueueTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncQueueTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> entityType = const Value.absent(),
                Value<String> entityId = const Value.absent(),
                Value<String> action = const Value.absent(),
                Value<String> payloadJson = const Value.absent(),
                Value<int> attempts = const Value.absent(),
                Value<String?> lastError = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SyncQueueCompanion(
                id: id,
                entityType: entityType,
                entityId: entityId,
                action: action,
                payloadJson: payloadJson,
                attempts: attempts,
                lastError: lastError,
                createdAt: createdAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String entityType,
                required String entityId,
                required String action,
                required String payloadJson,
                Value<int> attempts = const Value.absent(),
                Value<String?> lastError = const Value.absent(),
                required DateTime createdAt,
                Value<int> rowid = const Value.absent(),
              }) => SyncQueueCompanion.insert(
                id: id,
                entityType: entityType,
                entityId: entityId,
                action: action,
                payloadJson: payloadJson,
                attempts: attempts,
                lastError: lastError,
                createdAt: createdAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$SyncQueueTable, SyncQueueData>(table),
                  BaseReferences<_$AppDatabase, $SyncQueueTable, SyncQueueData>(
                    db,
                    table,
                    e,
                  ),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SyncQueueTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $SyncQueueTable,
      SyncQueueData,
      $$SyncQueueTableFilterComposer,
      $$SyncQueueTableOrderingComposer,
      $$SyncQueueTableAnnotationComposer,
      $$SyncQueueTableCreateCompanionBuilder,
      $$SyncQueueTableUpdateCompanionBuilder,
      (
        SyncQueueData,
        BaseReferences<_$AppDatabase, $SyncQueueTable, SyncQueueData>,
      ),
      SyncQueueData,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$LocalBibleBooksTableTableManager get localBibleBooks =>
      $$LocalBibleBooksTableTableManager(_db, _db.localBibleBooks);
  $$LocalBibleTranslationsTableTableManager get localBibleTranslations =>
      $$LocalBibleTranslationsTableTableManager(
        _db,
        _db.localBibleTranslations,
      );
  $$LocalBibleVersesTableTableManager get localBibleVerses =>
      $$LocalBibleVersesTableTableManager(_db, _db.localBibleVerses);
  $$LocalBibleVerseTextsTableTableManager get localBibleVerseTexts =>
      $$LocalBibleVerseTextsTableTableManager(_db, _db.localBibleVerseTexts);
  $$LocalSermonsTableTableManager get localSermons =>
      $$LocalSermonsTableTableManager(_db, _db.localSermons);
  $$LocalSermonTopicsTableTableManager get localSermonTopics =>
      $$LocalSermonTopicsTableTableManager(_db, _db.localSermonTopics);
  $$LocalSermonOutlinesTableTableManager get localSermonOutlines =>
      $$LocalSermonOutlinesTableTableManager(_db, _db.localSermonOutlines);
  $$LocalSermonReferencesTableTableManager get localSermonReferences =>
      $$LocalSermonReferencesTableTableManager(_db, _db.localSermonReferences);
  $$LocalLifePostsTableTableManager get localLifePosts =>
      $$LocalLifePostsTableTableManager(_db, _db.localLifePosts);
  $$ReadingProgressTableTableManager get readingProgress =>
      $$ReadingProgressTableTableManager(_db, _db.readingProgress);
  $$StudyNotesTableTableManager get studyNotes =>
      $$StudyNotesTableTableManager(_db, _db.studyNotes);
  $$StudyBookmarksTableTableManager get studyBookmarks =>
      $$StudyBookmarksTableTableManager(_db, _db.studyBookmarks);
  $$SyncQueueTableTableManager get syncQueue =>
      $$SyncQueueTableTableManager(_db, _db.syncQueue);
}
