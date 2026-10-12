import type { MemberPushDevice } from "@mbc/api-contracts";

export type PushMessage = {
  type: string;
  title: string;
  body: string;
  route?: string;
  data?: Record<string, string>;
};

export type PushSendResult = {
  attempted: number;
  sent: number;
  failed: number;
  revokedTokens: number;
  retryDeviceIds?: string[];
};

export interface PushProvider {
  sendToDevices(
    devices: MemberPushDevice[],
    message: PushMessage
  ): Promise<PushSendResult>;
}
