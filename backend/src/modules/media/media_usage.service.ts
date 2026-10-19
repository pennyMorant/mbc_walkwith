import type { MediaAssetUsage } from "@mbc/api-contracts";

export interface MediaUsageProvider {
  listUsages(mediaId: string): Promise<MediaAssetUsage[]>;
}

export class MediaUsageService {
  constructor(private readonly providers: readonly MediaUsageProvider[]) {}

  async list(mediaId: string): Promise<MediaAssetUsage[]> {
    const usages = (
      await Promise.all(
        this.providers.map((provider) => provider.listUsages(mediaId))
      )
    ).flat();
    const unique = new Map(
      usages.map((usage) => [
        [usage.source, usage.sourceId, usage.slot].join(":"),
        usage
      ])
    );
    return [...unique.values()].sort(compareUsage);
  }
}

function compareUsage(left: MediaAssetUsage, right: MediaAssetUsage) {
  return (
    left.source.localeCompare(right.source) ||
    left.sourceLabel.localeCompare(right.sourceLabel) ||
    left.sourceId.localeCompare(right.sourceId) ||
    left.slot.localeCompare(right.slot)
  );
}
