import type { AdminPermission } from "@mbc/api-contracts";
import { createRouter, createWebHistory } from "vue-router";

import { useAdminAuthStore } from "./core/auth/auth_store";
import { appConfig } from "./core/config/env";
import AuditLogsPage from "./features/audit/pages/AuditLogsPage.vue";
import AiManagementPage from "./features/ai/pages/AiManagementPage.vue";
import BibleKnowledgePage from "./features/bible-knowledge/pages/BibleKnowledgePage.vue";
import BibleNotesPage from "./features/bible-notes/pages/BibleNotesPage.vue";
import CarePage from "./features/care/pages/CarePage.vue";
import CoursesPage from "./features/courses/pages/CoursesPage.vue";
import DashboardPage from "./features/dashboard/pages/DashboardPage.vue";
import DiscipleshipPage from "./features/discipleship/pages/DiscipleshipPage.vue";
import GivingPage from "./features/giving/pages/GivingPage.vue";
import GroupsPage from "./features/groups/pages/GroupsPage.vue";
import JobsPage from "./features/jobs/pages/JobsPage.vue";
import LifePostsPage from "./features/life-posts/pages/LifePostsPage.vue";
import LoginPage from "./features/auth/pages/LoginPage.vue";
import MembersPage from "./features/members/pages/MembersPage.vue";
import NewcomersPage from "./features/newcomers/pages/NewcomersPage.vue";
import NotificationsPage from "./features/notifications/pages/NotificationsPage.vue";
import PrayerPage from "./features/prayer/pages/PrayerPage.vue";
import ReadingPlansPage from "./features/reading-plans/pages/ReadingPlansPage.vue";
import SermonDiscussionGuidesPage from "./features/sermon-discussion-guides/pages/SermonDiscussionGuidesPage.vue";
import SermonsPage from "./features/sermons/pages/SermonsPage.vue";
import ServingPage from "./features/serving/pages/ServingPage.vue";
import SettingsPage from "./features/settings/pages/SettingsPage.vue";
import UsersPage from "./features/users/pages/UsersPage.vue";

function adminPageMeta(permission: AdminPermission) {
  return { requiresAuth: true, permission };
}

export const router = createRouter({
  history: createWebHistory(appConfig.adminBasePath),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginPage,
      meta: { layout: "auth" }
    },
    {
      path: "/",
      name: "dashboard",
      component: DashboardPage,
      meta: adminPageMeta("dashboard:read")
    },
    {
      path: "/sermons",
      name: "sermons",
      component: SermonsPage,
      meta: adminPageMeta("sermons:read")
    },
    {
      path: "/sermon-discussion-guides",
      name: "sermon-discussion-guides",
      component: SermonDiscussionGuidesPage,
      meta: adminPageMeta("sermon_guides:read")
    },
    {
      path: "/bible-knowledge",
      name: "bible-knowledge",
      component: BibleKnowledgePage,
      meta: adminPageMeta("bible_knowledge:read")
    },
    {
      path: "/bible-notes",
      name: "bible-notes",
      component: BibleNotesPage,
      meta: adminPageMeta("bible_notes:read")
    },
    {
      path: "/reading-plans",
      name: "reading-plans",
      component: ReadingPlansPage,
      meta: adminPageMeta("reading_plans:read")
    },
    {
      path: "/discipleship",
      name: "discipleship",
      component: DiscipleshipPage,
      meta: adminPageMeta("discipleship:read")
    },
    {
      path: "/life-posts",
      name: "life-posts",
      component: LifePostsPage,
      meta: adminPageMeta("life_posts:read")
    },
    {
      path: "/prayer",
      name: "prayer",
      component: PrayerPage,
      meta: adminPageMeta("prayer:read")
    },
    {
      path: "/giving",
      name: "giving",
      component: GivingPage,
      meta: adminPageMeta("giving:read")
    },
    {
      path: "/groups",
      name: "groups",
      component: GroupsPage,
      meta: adminPageMeta("groups:read")
    },
    {
      path: "/courses",
      name: "courses",
      component: CoursesPage,
      meta: adminPageMeta("courses:read")
    },
    {
      path: "/serving",
      name: "serving",
      component: ServingPage,
      meta: adminPageMeta("serving:read")
    },
    {
      path: "/members",
      name: "members",
      component: MembersPage,
      meta: adminPageMeta("users:read")
    },
    {
      path: "/newcomers",
      name: "newcomers",
      component: NewcomersPage,
      meta: adminPageMeta("newcomers:read")
    },
    {
      path: "/care",
      name: "care",
      component: CarePage,
      meta: adminPageMeta("care:read")
    },
    {
      path: "/users",
      name: "users",
      component: UsersPage,
      meta: adminPageMeta("users:read")
    },
    {
      path: "/ai",
      name: "ai",
      component: AiManagementPage,
      meta: adminPageMeta("ai:read")
    },
    {
      path: "/audit",
      name: "audit",
      component: AuditLogsPage,
      meta: adminPageMeta("audit:read")
    },
    {
      path: "/jobs",
      name: "jobs",
      component: JobsPage,
      meta: adminPageMeta("jobs:read")
    },
    {
      path: "/notifications",
      name: "notifications",
      component: NotificationsPage,
      meta: adminPageMeta("notifications:read")
    },
    {
      path: "/settings",
      name: "settings",
      component: SettingsPage,
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

  const permission = to.meta.permission as AdminPermission | undefined;
  if (permission && !authStore.can(permission)) {
    return firstAllowedAdminPath(authStore.can) ?? false;
  }

  if (to.path === "/login" && authStore.isAuthenticated) {
    return "/";
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
