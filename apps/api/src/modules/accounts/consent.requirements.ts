import { ConsentType } from "../../db/entity/user-consent.entity";

const BASE_CONSENTS: ConsentType[] = ["TERMS", "PRIVACY"];
const FINAL_CONSENTS: ConsentType[] = ["NO_SIDE_DEAL"];

export function requiredConsentTypes(roles: string[]): ConsentType[] {
  const roleConsents = new Set<ConsentType>();
  if (roles.includes("BUYER")) roleConsents.add("BUYER_RULES");
  if (roles.includes("SELLER")) roleConsents.add("SELLER_RULES");
  return [...BASE_CONSENTS, ...roleConsents, ...FINAL_CONSENTS];
}

export function hasRequiredConsents(
  roles: string[],
  consents: Array<{ consentType: ConsentType }>,
): boolean {
  const accepted = new Set(consents.map((consent) => consent.consentType));
  return requiredConsentTypes(roles).every((type) => accepted.has(type));
}
