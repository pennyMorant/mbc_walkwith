import type { SermonProgress } from "@mbc/api-contracts";

export type SermonProgressViewer = {
  userType: "member" | "external";
  userId: string;
};

export type SaveSermonProgressInput = {
  sermonId: string;
  viewer: SermonProgressViewer;
  positionSeconds: number;
  completed: boolean;
  completedAt: Date | null;
};

export interface SermonProgressRepository {
  get(
    sermonId: string,
    viewer: SermonProgressViewer
  ): Promise<SermonProgress | null>;
  upsert(input: SaveSermonProgressInput): Promise<SermonProgress>;
}
