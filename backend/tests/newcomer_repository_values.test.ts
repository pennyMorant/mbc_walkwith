import { describe, expect, it } from "vitest";

import { newcomerUpdateValues } from "../src/modules/newcomers/postgres-newcomer.repository.js";

describe("newcomer repository update values", () => {
  it("updates only fields present in a patch intent", () => {
    const values = newcomerUpdateValues({
      interest: "  Sunday worship  ",
      nextFollowUpAt: null
    });

    expect(values).toMatchObject({
      interest: "Sunday worship",
      nextFollowUpAt: null
    });
    expect(values.updatedAt).toBeInstanceOf(Date);
    expect(values).not.toHaveProperty("status");
    expect(values).not.toHaveProperty("linkedMemberUserId");
    expect(values).not.toHaveProperty("conversionStatus");
  });
});
