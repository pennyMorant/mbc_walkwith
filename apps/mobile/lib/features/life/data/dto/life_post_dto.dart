import '../../domain/life_post.dart';
import 'event_registration_summary_dto.dart';
import 'life_post_json_reader.dart';

export 'event_registration_summary_dto.dart';

const _lifePostVisibilities = {'public', 'members', 'group', 'private'};
const _lifePostStatuses = {'draft', 'needs_review', 'published', 'archived'};
const _lifePostTypes = {
  'weekly_bulletin',
  'sunday',
  'announcement',
  'event',
  'fellowship',
  'group',
  'course',
  'serving',
  'prayer',
  'care',
  'giving',
};

class LifePostDto {
  const LifePostDto({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.meta,
    required this.iconName,
    this.startsAt,
    this.endsAt,
    this.visibility,
    this.status = 'published',
    this.imageUrl,
    this.sort = 0,
    this.ctaLabel,
    this.ctaUrl,
    this.registrationEnabled = false,
    this.registrationCapacity,
    this.registrationDeadline,
    this.registrationAllowCancellation = true,
    this.registrationMaxPartySize = 1,
    this.registrationSummary,
    this.updatedAt,
    this.isRead = false,
    this.readAt,
  });

  final String id;
  final String type;
  final String title;
  final String body;
  final String meta;
  final String iconName;
  final String? startsAt;
  final String? endsAt;
  final String? visibility;
  final String status;
  final String? imageUrl;
  final int sort;
  final String? ctaLabel;
  final String? ctaUrl;
  final bool registrationEnabled;
  final int? registrationCapacity;
  final String? registrationDeadline;
  final bool registrationAllowCancellation;
  final int registrationMaxPartySize;
  final EventRegistrationSummaryDto? registrationSummary;
  final String? updatedAt;
  final bool isRead;
  final String? readAt;

  factory LifePostDto.fromJson(Map<String, Object?> json) {
    final registrationEnabled = readLifePostBool(json, 'registrationEnabled');
    final registrationCapacity = readNullableLifePostInt(
      json,
      'registrationCapacity',
      minimum: 1,
    );
    final registrationSummary = EventRegistrationSummaryDto.fromJson(
      readLifePostObject(json, 'registrationSummary'),
    );
    if (registrationSummary.enabled != registrationEnabled ||
        registrationSummary.capacity != registrationCapacity) {
      throw const FormatException(
        'Registration summary must match the life post configuration.',
      );
    }
    return LifePostDto(
      id: readLifePostString(json, 'id', allowEmpty: false),
      type: readLifePostEnum(json, 'type', _lifePostTypes),
      title: readLifePostString(json, 'title', allowEmpty: false),
      body: readLifePostString(json, 'body'),
      meta: readLifePostString(json, 'meta'),
      iconName: readLifePostString(json, 'iconName', allowEmpty: false),
      startsAt: readNullableLifePostIsoDateTime(json, 'startsAt'),
      endsAt: readNullableLifePostIsoDateTime(json, 'endsAt'),
      visibility: readLifePostEnum(json, 'visibility', _lifePostVisibilities),
      status: readLifePostEnum(json, 'status', _lifePostStatuses),
      imageUrl: readNullableLifePostString(json, 'imageUrl'),
      sort: readLifePostInt(json, 'sort', minimum: 0, maximum: 100),
      ctaLabel: readNullableLifePostString(json, 'ctaLabel'),
      ctaUrl: readNullableLifePostString(json, 'ctaUrl'),
      registrationEnabled: registrationEnabled,
      registrationCapacity: registrationCapacity,
      registrationDeadline: readNullableLifePostIsoDateTime(
        json,
        'registrationDeadline',
      ),
      registrationAllowCancellation: readLifePostBool(
        json,
        'registrationAllowCancellation',
      ),
      registrationMaxPartySize: readLifePostInt(
        json,
        'registrationMaxPartySize',
        minimum: 1,
        maximum: 20,
      ),
      registrationSummary: registrationSummary,
      updatedAt: readLifePostIsoDateTime(json, 'updatedAt'),
      isRead: readOptionalLifePostBool(json, 'isRead', defaultValue: false),
      readAt: readNullableLifePostIsoDateTime(json, 'readAt'),
    );
  }

  LifePost toDomain() {
    return LifePost(
      id: id,
      type: type,
      title: title,
      body: body,
      meta: meta,
      iconName: iconName,
      startsAt: _dateFromString(startsAt),
      endsAt: _dateFromString(endsAt),
      visibility: visibility ?? 'public',
      status: status,
      imageUrl: imageUrl,
      sort: sort,
      ctaLabel: ctaLabel,
      ctaUrl: ctaUrl,
      registrationEnabled: registrationEnabled,
      registrationCapacity: registrationCapacity,
      registrationDeadline: _dateFromString(registrationDeadline),
      registrationAllowCancellation: registrationAllowCancellation,
      registrationMaxPartySize: registrationMaxPartySize,
      registrationSummary: registrationSummary?.toDomain(),
      updatedAt: _dateFromString(updatedAt),
      isRead: isRead,
      readAt: _dateFromString(readAt),
    );
  }

  LifePostDto copyWith({
    String? id,
    String? type,
    String? title,
    String? body,
    String? meta,
    String? iconName,
    String? startsAt,
    String? endsAt,
    String? visibility,
    String? status,
    String? imageUrl,
    int? sort,
    String? ctaLabel,
    String? ctaUrl,
    bool? registrationEnabled,
    int? registrationCapacity,
    String? registrationDeadline,
    bool? registrationAllowCancellation,
    int? registrationMaxPartySize,
    EventRegistrationSummaryDto? registrationSummary,
    String? updatedAt,
    bool? isRead,
    String? readAt,
  }) {
    return LifePostDto(
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
      sort: sort ?? this.sort,
      ctaLabel: ctaLabel ?? this.ctaLabel,
      ctaUrl: ctaUrl ?? this.ctaUrl,
      registrationEnabled: registrationEnabled ?? this.registrationEnabled,
      registrationCapacity: registrationCapacity ?? this.registrationCapacity,
      registrationDeadline: registrationDeadline ?? this.registrationDeadline,
      registrationAllowCancellation:
          registrationAllowCancellation ?? this.registrationAllowCancellation,
      registrationMaxPartySize:
          registrationMaxPartySize ?? this.registrationMaxPartySize,
      registrationSummary: registrationSummary ?? this.registrationSummary,
      updatedAt: updatedAt ?? this.updatedAt,
      isRead: isRead ?? this.isRead,
      readAt: readAt ?? this.readAt,
    );
  }
}

DateTime? _dateFromString(String? value) =>
    value == null ? null : DateTime.parse(value).toLocal();
