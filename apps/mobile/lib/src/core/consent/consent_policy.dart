const consentVersion = '1.0.0';

const consentTypes = {
  'TERMS',
  'PRIVACY',
  'BUYER_RULES',
  'SELLER_RULES',
  'NO_SIDE_DEAL',
};

List<String> requiredConsentsForRoles(Iterable<String> roles) {
  final result = <String>['TERMS', 'PRIVACY'];
  if (roles.contains('BUYER')) result.add('BUYER_RULES');
  if (roles.contains('SELLER')) result.add('SELLER_RULES');
  result.add('NO_SIDE_DEAL');
  return List.unmodifiable(result);
}

bool hasEveryRequiredConsent(
  Iterable<String> roles,
  Iterable<String> accepted,
) {
  final acceptedSet = accepted.toSet();
  return requiredConsentsForRoles(roles).every(acceptedSet.contains);
}
