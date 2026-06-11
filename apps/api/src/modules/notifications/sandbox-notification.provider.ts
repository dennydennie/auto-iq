import { Injectable } from "@nestjs/common";
import type { NotificationChannel } from "../../common/constants/listing.constants";

export interface ProviderSendInput {
  channel: NotificationChannel;
  recipientAddress: string;
  template: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class SandboxNotificationProvider {
  async send(input: ProviderSendInput): Promise<{ providerRef: string }> {
    return {
      providerRef: `sandbox:${input.channel.toLowerCase()}:${Date.now()}`,
    };
  }
}
