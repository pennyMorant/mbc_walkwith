import type { PublicLandingAction } from "@mbc/api-contracts";

export function actionTarget(action: PublicLandingAction) {
  return action.target === "new_tab" ? "_blank" : undefined;
}

export function actionRel(action: PublicLandingAction) {
  return action.target === "new_tab" ? "noopener noreferrer" : undefined;
}
