import { describe, expect, it } from "vitest";

import { InMemoryMemberRepository } from "../src/modules/members/in-memory-member.repository.js";
import { InMemoryNotificationInboxRepository } from "../src/modules/notifications/in-memory-notification-inbox.repository.js";
import { NotificationInboxService } from "../src/modules/notifications/notification-inbox.service.js";

describe("notification inbox service", () => {
  it("creates deduped notification messages and member inbox items by preference", async () => {
    const memberRepository = new InMemoryMemberRepository();
    await memberRepository.update("member-chan", {
      notificationSettings: {
        weeklyBulletin: true,
        sermonPublished: true,
        lifePostPublished: false,
        prayerUpdates: false
      }
    });

    const repository = new InMemoryNotificationInboxRepository(
      memberRepository
    );
    const service = new NotificationInboxService(repository);

    const first = await service.createForPreference({
      type: "life_post_published",
      title: "Church life: Fellowship dinner",
      body: "Dinner is this Friday.",
      route: "/life/posts/life-post-1",
      data: {
        lifePostId: "life-post-1"
      },
      sourceType: "life_post",
      sourceId: "life-post-1",
      dedupeKey: "life_post_published:life-post-1",
      preference: "lifePostPublished"
    });

    expect(first.createdMessage).toBe(true);
    expect(first.items).toHaveLength(1);
    expect(first.items[0]).toMatchObject({
      userId: "member-lee",
      type: "life_post_published",
      route: "/life/posts/life-post-1",
      readAt: null,
      archivedAt: null
    });

    const duplicate = await service.createForPreference({
      type: "life_post_published",
      title: "Different title should not replace deduped message",
      body: "Different body",
      dedupeKey: "life_post_published:life-post-1",
      preference: "lifePostPublished"
    });

    expect(duplicate.createdMessage).toBe(false);
    expect(duplicate.message.id).toBe(first.message.id);
    expect(duplicate.items).toHaveLength(1);
    expect(duplicate.items[0].id).toBe(first.items[0].id);
  });

  it("does not create inbox items for inactive members", async () => {
    const memberRepository = new InMemoryMemberRepository();
    await memberRepository.update("member-lee", { status: "inactive" });
    await memberRepository.update("member-chan", { status: "blocked" });
    const service = new NotificationInboxService(
      new InMemoryNotificationInboxRepository(memberRepository)
    );

    const result = await service.createForPreference({
      type: "sermon_published",
      title: "New sermon",
      body: "Romans 8",
      dedupeKey: "sermon_published:sermon-1",
      preference: "sermonPublished"
    });

    expect(result.createdMessage).toBe(true);
    expect(result.items).toHaveLength(0);
  });

  it("lists unread items and supports idempotent read and archive actions", async () => {
    const memberRepository = new InMemoryMemberRepository();
    const repository = new InMemoryNotificationInboxRepository(
      memberRepository
    );
    const service = new NotificationInboxService(repository);
    const fanout = await service.createForPreference({
      type: "sermon_published",
      title: "New sermon",
      body: "Romans 8",
      route: "/sermons/sermon-1",
      dedupeKey: "sermon_published:sermon-1",
      preference: "sermonPublished"
    });
    const item = fanout.items.find((entry) => entry.userId === "member-lee");
    expect(item).toBeDefined();

    const before = await service.listForMember("member-lee");
    expect(before.unreadCount).toBe(1);
    expect(before.items[0].readAt).toBeNull();

    const read = await service.markRead("member-lee", item!.id);
    const readAgain = await service.markRead("member-lee", item.id);
    expect(read?.readAt).toBeTruthy();
    expect(readAgain?.readAt).toBe(read?.readAt);

    const archived = await service.archive("member-lee", item.id);
    expect(archived?.archivedAt).toBeTruthy();
    const afterArchive = await service.listForMember("member-lee");
    expect(afterArchive.items).toHaveLength(0);
    expect(afterArchive.unreadCount).toBe(0);

    await service.createForPreference({
      type: "sermon_published",
      title: "Another sermon",
      body: "Romans 12",
      dedupeKey: "sermon_published:sermon-2",
      preference: "sermonPublished"
    });
    await expect(service.archiveAll("member-lee")).resolves.toBe(1);
    await expect(service.archiveAll("member-lee")).resolves.toBe(0);
    await expect(service.listForMember("member-lee")).resolves.toEqual({
      items: [],
      unreadCount: 0
    });
  });
});
