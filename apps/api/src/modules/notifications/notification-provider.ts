import type { NotificationChannel } from "../../common/constants/listing.constants";

export interface ProviderSendInput {
  channel: NotificationChannel;
  recipientAddress: string;
  template: string;
  payload: Record<string, unknown>;
}

export interface ProviderSendResult {
  providerRef: string;
}

export abstract class NotificationProvider {
  abstract send(input: ProviderSendInput): Promise<ProviderSendResult>;
}
