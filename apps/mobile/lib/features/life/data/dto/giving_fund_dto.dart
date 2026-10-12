import '../../domain/giving_record.dart';
import 'giving_json_reader.dart';

const _fundStatuses = {'draft', 'active', 'paused', 'archived'};

class GivingFundDto {
  const GivingFundDto({
    required this.id,
    required this.code,
    required this.name,
    required this.description,
    required this.status,
    required this.targetAmountCents,
    required this.displayOrder,
  });

  factory GivingFundDto.fromJson(Map<String, Object?> json) {
    return GivingFundDto(
      id: readGivingString(json, 'id', allowEmpty: false),
      code: readGivingString(json, 'code', allowEmpty: false),
      name: readGivingString(json, 'name', allowEmpty: false),
      description: readGivingString(json, 'description', defaultValue: ''),
      status: readGivingEnum(json, 'status', _fundStatuses),
      targetAmountCents: readNullableGivingNonNegativeInt(
        json,
        'targetAmountCents',
      ),
      displayOrder: readGivingInt(json, 'displayOrder', defaultValue: 0),
    );
  }

  final String id;
  final String code;
  final String name;
  final String description;
  final String status;
  final int? targetAmountCents;
  final int displayOrder;

  GivingFund toDomain() => GivingFund(
    id: id,
    code: code,
    name: name,
    description: description,
    status: status,
    targetAmountCents: targetAmountCents,
    displayOrder: displayOrder,
  );
}

List<GivingFund> readActiveGivingFunds(Map<String, Object?> response) {
  final funds = readGivingObjectList(
    readGivingData(response),
    'items',
  ).map(GivingFundDto.fromJson).toList(growable: false);
  if (funds.any((fund) => fund.status != 'active')) {
    throw const FormatException(
      'Active giving funds response contains an inactive fund.',
    );
  }
  return funds.map((dto) => dto.toDomain()).toList(growable: false);
}
