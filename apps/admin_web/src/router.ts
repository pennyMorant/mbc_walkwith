import type { AdminPermission } from "@mbc/api-contracts";
import { createRouter, createWebHistory } from "vue-router";

import { useAdminAuthStore } from "./core/auth/auth_store";
import { appConfig } from "./core/config/env";

function adminPageMeta(permission: AdminPermission) {
  return { requiresAuth: true, permission };
}

export const router = createRouter({
  history: createWebHistory(appConfig.adminBasePath),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("./features/auth/pages/LoginPage.vue"),
      meta: { layout: "auth" }
    },
    {
      path: "/access-denied",
      name: "access-denied",
      component: () => import("./features/auth/pages/AccessDeniedPage.vue"),
      meta: { requiresAuth: true }
    },
    {
      path: "/",
      name: "dashboard",
      component: () => import("./features/dashboard/pages/DashboardPage.vue"),
      meta: adminPageMeta("dashboard:read")
    },
    {
      path: "/sermons",
      name: "sermons",
      component: () => import("./features/sermons/pages/SermonsPage.vue"),
      meta: adminPageMeta("sermons:read")
    },
    {
      path: "/sermon-discussion-guides",
      name: "sermon-discussion-guides",
      component: () => import("./features/sermon-discussion-guides/pages/SermonDiscussionGuidesPage.vue"),
      meta: adminPageMeta("sermon_guides:read")
    },
    {
      path: "/bible-knowledge",
      name: "bible-knowledge",
      component: () => import("./features/bible-knowledge/pages/BibleKnowledgePage.vue"),
      meta: adminPageMeta("bible_knowledge:read")
    },
    {
      path: "/bible-notes",
      name: "bible-notes",
      component: () => import("./features/bible-notes/pages/BibleNotesPage.vue"),
      meta: adminPageMeta("bible_notes:read")
    },
    {
      path: "/reading-plans",
      name: "reading-plans",
      component: () => import("./features/reading-plans/pages/ReadingPlansPage.vue"),
      meta: adminPageMeta("reading_plans:read")
    },
    {
      path: "/discipleship",
      name: "discipleship",
      component: () => import("./features/discipleship/pages/DiscipleshipPage.vue"),
      meta: adminPageMeta("discipleship:read")
    },
    {
      path: "/life-posts",
      name: "life-posts",
      component: () => import("./features/life-posts/pages/LifePostsPage.vue"),
      meta: adminPageMeta("life_posts:read")
    },
    {
      path: "/prayer",
      name: "prayer",
      component: () => import("./features/prayer/pages/PrayerPage.vue"),
      meta: adminPageMeta("prayer:read")
    },
    {
      path: "/giving",
      name: "giving",
      component: () => import("./features/giving/pages/GivingPage.vue"),
      meta: adminPageMeta("giving:read")
    },
    {
      path: "/groups",
      name: "groups",
      component: () => import("./features/groups/pages/GroupsPage.vue"),
      meta: adminPageMeta("groups:read")
    },
    {
      path: "/courses",
      name: "courses",
      component: () => import("./features/courses/pages/CoursesPage.vue"),
      meta: adminPageMeta("courses:read")
    },
    {
      path: "/serving",
      name: "serving",
      component: () => import("./features/serving/pages/ServingPage.vue"),
      meta: adminPageMeta("serving:read")
    },
    {
      path: "/members",
      name: "members",
      component: () => import("./features/members/pages/MembersPage.vue"),
      meta: adminPageMeta("users:read")
    },
    {
      path: "/newcomers",
      name: "newcomers",
      component: () => import("./features/newcomers/pages/NewcomersPage.vue"),
      meta: adminPageMeta("newcomers:read")
    },
    {
      path: "/care",
      name: "care",
      component: () => import("./features/care/pages/CarePage.vue"),
      meta: adminPageMeta("care:read")
    },
    {
      path: "/users",
      name: "users",
      component: () => import("./features/users/pages/UsersPage.vue"),
      meta: adminPageMeta("users:read")
    },
    {
      path: "/ai",
      name: "ai",
      component: () => import("./features/ai/pages/AiManagementPage.vue"),
      meta: adminPageMeta("ai:read")
    },
    {
      path: "/audit",
      name: "audit",
      component: () => import("./features/audit/pages/AuditLogsPage.vue"),
      meta: adminPageMeta("audit:read")
    },
    {
      path: "/jobs",
      name: "jobs",
      component: () => import("./features/jobs/pages/JobsPage.vue"),
      meta: adminPageMeta("jobs:read")
    },
    {
      path: "/notifications",
      name: "notifications",
      component: () => import("./features/notifications/pages/NotificationsPage.vue"),
      meta: adminPageMeta("notifications:read")
    },
    {
      path: "/media",
      name: "media",
      component: () => import("./features/media/pages/MediaPage.vue"),
      meta: adminPageMeta("media:read")
    },
    {
      path: "/settings",
      name: "settings",
      component: () => import("./features/settings/pages/SettingsPage.vue"),
      meta: adminPageMeta("settings:read")
    }
  ]
});

router.beforeEach((to) => {
  const authStore = useAdminAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      path: "/login",
      query: {
        redirect: to.fullPath
      }
    };
  }

  if (to.path === "/login" && authStore.isAuthenticated) {
    return firstAllowedAdminPath(authStore.can) ?? "/access-denied";
  }

  if (to.path === "/access-denied") {
    return firstAllowedAdminPath(authStore.can) ?? true;
  }

  const permission = to.meta.permission as AdminPermission | undefined;
  if (permission && !authStore.can(permission)) {
    return firstAllowedAdminPath(authStore.can) ?? "/access-denied";
  }

  return true;
});

function firstAllowedAdminPath(can: (permission: AdminPermission) => boolean) {
  const route = router.getRoutes().find((candidate) => {
    const permission = candidate.meta.permission as AdminPermission | undefined;
    return permission ? can(permission) : false;
  });
  return route?.path;
}
