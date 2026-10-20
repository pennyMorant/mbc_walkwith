import type { AdminPermission } from "@mbc/api-contracts";

export type AdminNavigationItem = {
  titleKey: string;
  value: string;
  permission: AdminPermission;
  icon: string;
};

export type AdminNavigationGroup = {
  id: string;
  titleKey: string | null;
  items: AdminNavigationItem[];
};

export const adminNavigationGroups: AdminNavigationGroup[] = [
  {
    id: "overview",
    titleKey: null,
    items: [
      {
        titleKey: "nav.dashboard",
        value: "/",
        permission: "dashboard:read",
        icon: "mdi-view-dashboard-outline"
      }
    ]
  },
  {
    id: "content",
    titleKey: "nav.group.content",
    items: [
      { titleKey: "nav.sermons", value: "/sermons", permission: "sermons:read", icon: "mdi-microphone-outline" },
      { titleKey: "nav.sermonGuides", value: "/sermon-discussion-guides", permission: "sermon_guides:read", icon: "mdi-forum-outline" },
      { titleKey: "nav.lifePosts", value: "/life-posts", permission: "life_posts:read", icon: "mdi-newspaper-variant-outline" },
      { titleKey: "nav.bibleKnowledge", value: "/bible-knowledge", permission: "bible_knowledge:read", icon: "mdi-book-open-page-variant-outline" },
      { titleKey: "nav.bibleNotes", value: "/bible-notes", permission: "bible_notes:read", icon: "mdi-note-text-outline" },
      { titleKey: "nav.media", value: "/media", permission: "media:read", icon: "mdi-image-multiple-outline" }
    ]
  },
  {
    id: "ministry",
    titleKey: "nav.group.ministry",
    items: [
      { titleKey: "nav.groups", value: "/groups", permission: "groups:read", icon: "mdi-account-group-outline" },
      { titleKey: "nav.courses", value: "/courses", permission: "courses:read", icon: "mdi-school-outline" },
      { titleKey: "nav.readingPlans", value: "/reading-plans", permission: "reading_plans:read", icon: "mdi-calendar-text-outline" },
      { titleKey: "nav.discipleship", value: "/discipleship", permission: "discipleship:read", icon: "mdi-map-marker-path" },
      { titleKey: "nav.serving", value: "/serving", permission: "serving:read", icon: "mdi-calendar-check-outline" },
      { titleKey: "nav.prayer", value: "/prayer", permission: "prayer:read", icon: "mdi-hands-pray" }
    ]
  },
  {
    id: "giving",
    titleKey: "nav.group.giving",
    items: [
      { titleKey: "nav.giving", value: "/giving", permission: "giving:read", icon: "mdi-hand-coin-outline" }
    ]
  },
  {
    id: "people",
    titleKey: "nav.group.people",
    items: [
      { titleKey: "nav.members", value: "/members", permission: "users:read", icon: "mdi-account-multiple-outline" },
      { titleKey: "nav.newcomers", value: "/newcomers", permission: "newcomers:read", icon: "mdi-account-heart-outline" },
      { titleKey: "nav.care", value: "/care", permission: "care:read", icon: "mdi-hand-heart-outline" },
      { titleKey: "nav.users", value: "/users", permission: "users:read", icon: "mdi-shield-account-outline" }
    ]
  },
  {
    id: "system",
    titleKey: "nav.group.system",
    items: [
      { titleKey: "nav.ai", value: "/ai", permission: "ai:read", icon: "mdi-creation-outline" },
      { titleKey: "nav.notifications", value: "/notifications", permission: "notifications:read", icon: "mdi-bell-outline" },
      { titleKey: "nav.jobs", value: "/jobs", permission: "jobs:read", icon: "mdi-progress-wrench" },
      { titleKey: "nav.audit", value: "/audit", permission: "audit:read", icon: "mdi-file-document-check-outline" },
      { titleKey: "nav.settings", value: "/settings", permission: "settings:read", icon: "mdi-cog-outline" }
    ]
  }
];
