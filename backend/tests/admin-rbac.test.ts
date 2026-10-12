import { describe, expect, it } from "vitest";

import {
  permissionsByRole,
  roleHasPermission
} from "../src/modules/admin/auth/admin-rbac.js";

describe("admin RBAC", () => {
  it("allows content editors to edit sermons but not publish them", () => {
    expect(roleHasPermission("content_editor", "sermons:update")).toBe(true);
    expect(roleHasPermission("content_editor", "sermons:publish")).toBe(false);
  });

  it("keeps finance users out of sermon administration", () => {
    expect(roleHasPermission("finance", "giving:read")).toBe(true);
    expect(roleHasPermission("finance", "giving:manage")).toBe(true);
    expect(roleHasPermission("finance", "sermons:update")).toBe(false);
  });

  it("separates giving fund management from general admin roles", () => {
    expect(roleHasPermission("owner", "giving:manage")).toBe(true);
    expect(roleHasPermission("admin", "giving:manage")).toBe(false);
    expect(roleHasPermission("pastor", "giving:manage")).toBe(false);
    expect(roleHasPermission("content_editor", "giving:manage")).toBe(false);
    expect(roleHasPermission("viewer", "giving:manage")).toBe(false);
  });

  it("keeps general content and viewer roles out of pastoral care", () => {
    expect(roleHasPermission("pastor", "care:read")).toBe(true);
    expect(roleHasPermission("pastor", "care:manage")).toBe(true);
    expect(roleHasPermission("content_editor", "care:read")).toBe(false);
    expect(roleHasPermission("content_editor", "care:manage")).toBe(false);
    expect(roleHasPermission("viewer", "care:read")).toBe(false);
    expect(roleHasPermission("viewer", "care:manage")).toBe(false);
  });

  it("allows ministry content roles to use AI without exposing finance users", () => {
    expect(roleHasPermission("admin", "ai:use")).toBe(true);
    expect(roleHasPermission("pastor", "ai:use")).toBe(true);
    expect(roleHasPermission("content_editor", "ai:use")).toBe(true);
    expect(roleHasPermission("finance", "ai:use")).toBe(false);
    expect(roleHasPermission("viewer", "ai:use")).toBe(false);
  });

  it("gives owners the complete permission set", () => {
    for (const permission of permissionsByRole.owner) {
      expect(roleHasPermission("owner", permission)).toBe(true);
    }
  });
});
