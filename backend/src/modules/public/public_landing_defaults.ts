import {
  publicLandingContentSchema,
  supportedLocales,
  type AppSetting,
  type PublicLandingAction,
  type PublicLandingResponse,
  type SupportedLocale
} from "@mbc/api-contracts";

const defaultUpdatedAt = "2026-06-25T00:00:00.000Z";

export const publicLandingSettingCategory = "public_landing";
export const publicLandingDefaultLocale: SupportedLocale = "zh-Hans";

export const publicLandingSettingIds = [
  "identity",
  "brandAction",
  "navigation",
  "headerActions",
  "mobileActions",
  "hero",
  "mission",
  "service",
  "schedule",
  "people",
  "events",
  "entrance",
  "app",
  "contact",
  "footerActions"
] as const;

export type PublicLandingSettingId = (typeof publicLandingSettingIds)[number];

export const publicLandingSettingKeys = Object.fromEntries(
  publicLandingSettingIds.map((id) => [
    id,
    publicLandingSettingKey(publicLandingDefaultLocale, id)
  ])
) as Record<PublicLandingSettingId, string>;

const zhHansDefaultContent = publicLandingContentSchema.parse({
  locale: "zh-Hans",
  identity: {
    name: "格兰朵拉国语浸信会",
    englishName: "Mandarin Baptist Church of Glendora",
    brandMark: "MBCG",
    logoUrl: "/mbc_web_logo.png",
    mission: "造就门徒，差派工人，领人归主",
    welcome:
      "在 Glendora 一起敬拜、学习真道、彼此扶持，并把福音带进家庭、社区与世界。"
  },
  brandAction: {
    id: "brand-home",
    title: "回到首页",
    subtitle: null,
    href: "#top",
    iconName: "mdi-home-outline",
    kind: "anchor",
    target: "same_tab"
  },
  navigation: [
    action("new", "新朋友", "#new", "mdi-hand-heart"),
    action("service", "本周聚会", "#service", "mdi-calendar-heart"),
    action("app", "App", "#app", "mdi-cellphone"),
    action("contact", "联系", "#contact", "mdi-message-text-outline")
  ],
  headerActions: [
    action("header-service", "本周聚会", "#service", "mdi-calendar-heart"),
    action("header-contact", "联系教会", "#contact", "mdi-message-text-outline")
  ],
  mobileActions: [
    action("mobile-service", "时间", "#service", "mdi-clock-outline"),
    action("mobile-app", "App", "#app", "mdi-cellphone"),
    action("mobile-contact", "联系", "#contact", "mdi-message-text-outline")
  ],
  hero: {
    kicker: "Mandarin Baptist Church of Glendora",
    title: "格兰朵拉国语浸信会",
    mission: "造就门徒，差派工人，领人归主",
    body: "在 Glendora 一起敬拜、学习真道、彼此扶持，并把福音带进家庭、社区与世界。",
    imageUrl: "",
    primaryActions: [
      action("hero-new", "我是新朋友", "#new", "mdi-hand-heart"),
      action("hero-service", "本周聚会", "#service", "mdi-calendar-heart")
    ],
    quickActions: [
      action(
        "quick-service",
        "本周聚会",
        "#service",
        "mdi-calendar-heart",
        "时间、地点、儿童安排"
      ),
      action(
        "quick-app",
        "WalkWith App",
        "#app",
        "mdi-cellphone",
        "读经、讲道、活动和通知"
      ),
      action(
        "quick-new",
        "我是新朋友",
        "#new",
        "mdi-hand-heart",
        "欢迎你来到我们当中"
      ),
      action(
        "quick-contact",
        "联系教会",
        "#contact",
        "mdi-message-text-outline",
        "问题、探访、代祷和联系"
      )
    ]
  },
  mission: {
    eyebrow: "我们的方向",
    title: "以大使命塑造教会生活",
    body: "教会的每一个聚会、课程、关怀和服事，都围绕这三个方向展开。",
    pillars: [
      {
        title: "造就门徒",
        iconName: "mdi-book-open-page-variant",
        body: "透过主日崇拜、主日学、圣经阅读和课程，帮助弟兄姊妹在真道上扎根。"
      },
      {
        title: "差派工人",
        iconName: "mdi-account-hard-hat",
        body: "装备同工参与敬拜、关怀、儿童青少年、团契、小组、课程与社区服事。"
      },
      {
        title: "领人归主",
        iconName: "mdi-cross",
        body: "以福音为中心欢迎新朋友，透过祷告、陪伴、活动邀请和见证，把人带到基督面前。"
      }
    ]
  },
  service: {
    eyebrow: "本周聚会",
    title: "欢迎你这个主日来到我们当中",
    body: "我们期待与你一同敬拜、认识真道，也在聚会后继续彼此扶持、同行。",
    imageUrl: "",
    facts: [],
    actions: [
      action(
        "contact-worker",
        "联系同工",
        "#contact",
        "mdi-message-text-outline"
      )
    ]
  },
  schedule: {
    eyebrow: "固定聚会",
    title: "一周中的教会生活",
    body: "聚会时间与地点由教会同工在后台维护，请在来访前查看最新安排。",
    items: []
  },
  people: {
    eyebrow: "认识我们",
    title: "牧者与同工",
    body: "认识服事教会与社区的牧者和同工。",
    items: []
  },
  events: {
    eyebrow: "近期活动",
    title: "一起参与教会生活",
    body: "查看已公开发布并仍在进行中的近期活动。",
    emptyText: "目前没有已发布的近期活动。",
    maxItems: 6,
    items: []
  },
  entrance: {
    eyebrow: "教会入口",
    title: "从这里开始认识我们",
    body: "你可以在这里找到聚会时间、地址、来访指引和联系方式。若你愿意继续认识我们，也欢迎与我们保持联系。",
    actions: [
      action(
        "entrance-new",
        "新朋友入口",
        "#contact",
        "mdi-hand-heart",
        "第一次来访、聚会问题、探访联系"
      ),
      action(
        "entrance-app",
        "进入 WalkWith App",
        "#app",
        "mdi-cellphone",
        "读经、听讲道、报名活动、接收通知"
      )
    ]
  },
  app: {
    eyebrow: "MBC WalkWith App",
    title: "在一周中继续与教会同行",
    body: "WalkWith 会帮助会友读经、回顾主日信息、跟进教会生活与重要提醒，在忙碌的一周中仍与教会保持连接。",
    previewTitle: "WalkWith",
    previewItems: [
      "今日读经 · 约翰福音 15",
      "主日信息 · 一周回顾",
      "活动提醒 · 主日崇拜"
    ],
    highlights: [
      {
        title: "读经与朗读",
        iconName: "mdi-book-open-page-variant",
        body: "使用已获授权或公开版权的圣经文本，帮助会友安静阅读、聆听和默想。"
      },
      {
        title: "讲道与学习",
        iconName: "mdi-headphones",
        body: "回顾主日信息、讲章要点与经文引用，帮助一周中继续思想神的话。"
      },
      {
        title: "活动与通知",
        iconName: "mdi-calendar-heart",
        body: "查看近期活动、周报和提醒，让教会生活更容易跟上。"
      },
      {
        title: "个人入口",
        iconName: "mdi-account-heart-outline",
        body: "会友资料、通知偏好和未来个人服务都有清楚入口。"
      }
    ],
    actions: [
      action("app-notify", "获取 App 上线通知", "#contact", "mdi-bell-outline")
    ]
  },
  contact: {
    eyebrow: "联系教会",
    title: "格兰朵拉国语浸信会",
    body: "造就门徒，差派工人，领人归主",
    links: [],
    copyright: "©2026 Mandarin Baptist Church of Glendora"
  },
  footerActions: [
    action("footer-top", "回到顶部", "#top", "mdi-arrow-up")
  ],
  updatedAt: defaultUpdatedAt
});

const zhHantDefaultContent = localizePublicLandingContent("zh-Hant", {
  identity: {
    name: "格蘭朵拉國語浸信會",
    mission: "造就門徒，差派工人，領人歸主",
    welcome:
      "在 Glendora 一起敬拜、學習真道、彼此扶持，並把福音帶進家庭、社區與世界。"
  },
  actions: {
    "brand-home": ["回到首頁"],
    new: ["新朋友"],
    service: ["本週聚會"],
    contact: ["聯繫"],
    "header-service": ["本週聚會"],
    "header-contact": ["聯繫教會"],
    "mobile-service": ["時間"],
    "mobile-contact": ["聯繫"],
    "hero-new": ["我是新朋友"],
    "hero-service": ["本週聚會"],
    "quick-service": ["本週聚會", "時間、地點、兒童安排"],
    "quick-app": ["WalkWith App", "讀經、講道、活動和通知"],
    "quick-new": ["我是新朋友", "歡迎你來到我們當中"],
    "quick-contact": ["聯繫教會", "問題、探訪、代禱和聯繫"],
    "contact-worker": ["聯繫同工"],
    "entrance-new": ["新朋友入口", "第一次來訪、聚會問題、探訪聯繫"],
    "entrance-app": ["進入 WalkWith App", "讀經、聽講道、報名活動、接收通知"],
    "app-notify": ["獲取 App 上線通知"],
    "footer-top": ["回到頂部"]
  },
  hero: {
    title: "格蘭朵拉國語浸信會",
    mission: "造就門徒，差派工人，領人歸主",
    body: "在 Glendora 一起敬拜、學習真道、彼此扶持，並把福音帶進家庭、社區與世界。"
  },
  mission: {
    eyebrow: "我們的方向",
    title: "以大使命塑造教會生活",
    body: "教會的每一個聚會、課程、關懷和服事，都圍繞這三個方向展開。",
    pillars: [
      [
        "造就門徒",
        "透過主日崇拜、主日學、聖經閱讀和課程，幫助弟兄姊妹在真道上扎根。"
      ],
      [
        "差派工人",
        "裝備同工參與敬拜、關懷、兒童青少年、團契、小組、課程與社區服事。"
      ],
      [
        "領人歸主",
        "以福音為中心歡迎新朋友，透過禱告、陪伴、活動邀請和見證，把人帶到基督面前。"
      ]
    ]
  },
  service: {
    eyebrow: "本週聚會",
    title: "歡迎你這個主日來到我們當中",
    body: "我們期待與你一同敬拜、認識真道，也在聚會後繼續彼此扶持、同行。",
    facts: []
  },
  schedule: {
    eyebrow: "固定聚會",
    title: "一週中的教會生活",
    body: "聚會時間與地點由教會同工在後台維護，請在來訪前查看最新安排。"
  },
  people: {
    eyebrow: "認識我們",
    title: "牧者與同工",
    body: "認識服事教會與社區的牧者和同工。"
  },
  events: {
    eyebrow: "近期活動",
    title: "一起參與教會生活",
    body: "查看已公開發布並仍在進行中的近期活動。",
    emptyText: "目前沒有已發布的近期活動。"
  },
  entrance: {
    eyebrow: "教會入口",
    title: "從這裡開始認識我們",
    body: "你可以在這裡找到聚會時間、地址、來訪指引和聯繫方式。若你願意繼續認識我們，也歡迎與我們保持聯繫。"
  },
  app: {
    title: "在一週中繼續與教會同行",
    body: "WalkWith 會幫助會友讀經、回顧主日信息、跟進教會生活與重要提醒，在忙碌的一週中仍與教會保持連接。",
    previewItems: [
      "今日讀經 · 約翰福音 15",
      "主日信息 · 一週回顧",
      "活動提醒 · 主日崇拜"
    ],
    highlights: [
      [
        "讀經與朗讀",
        "使用已獲授權或公開版權的聖經文本，幫助會友安靜閱讀、聆聽和默想。"
      ],
      ["講道與學習", "回顧主日信息、講章要點與經文引用，幫助一週中繼續思想神的話。"],
      ["活動與通知", "查看近期活動、週報和提醒，讓教會生活更容易跟上。"],
      ["個人入口", "會友資料、通知偏好和未來個人服務都有清楚入口。"]
    ]
  },
  contact: {
    eyebrow: "聯繫教會",
    title: "格蘭朵拉國語浸信會",
    body: "造就門徒，差派工人，領人歸主"
  }
});

const enDefaultContent = localizePublicLandingContent("en", {
  identity: {
    name: "Mandarin Baptist Church of Glendora",
    mission: "Make disciples, send workers, lead people to Christ",
    welcome:
      "Worship, learn God's Word, care for one another, and carry the gospel into our homes, community, and world."
  },
  actions: {
    "brand-home": ["Back to home"],
    new: ["New here"],
    service: ["This Sunday"],
    contact: ["Contact"],
    "header-service": ["This Sunday"],
    "header-contact": ["Contact us"],
    "mobile-service": ["Time"],
    "mobile-contact": ["Contact"],
    "hero-new": ["I'm new"],
    "hero-service": ["This Sunday"],
    "quick-service": ["This Sunday", "Time, location, and children's ministry"],
    "quick-app": ["WalkWith App", "Bible reading, sermons, events, and updates"],
    "quick-new": ["I'm new", "We are glad you are here"],
    "quick-contact": ["Contact us", "Questions, visits, prayer, and care"],
    "contact-worker": ["Contact a team member"],
    "entrance-new": ["New visitor entrance", "First visit, service questions, and care"],
    "entrance-app": ["Open WalkWith App", "Bible reading, sermons, events, and updates"],
    "app-notify": ["Get App launch updates"],
    "footer-top": ["Back to top"]
  },
  hero: {
    title: "Mandarin Baptist Church of Glendora",
    mission: "Make disciples, send workers, lead people to Christ",
    body: "Worship, learn God's Word, care for one another, and carry the gospel into our homes, community, and world."
  },
  mission: {
    eyebrow: "Our direction",
    title: "Church life shaped by the Great Commission",
    body: "Every gathering, class, care effort, and ministry team is shaped by these three directions.",
    pillars: [
      [
        "Make disciples",
        "Through worship, Sunday school, Bible reading, and classes, we help brothers and sisters take root in God's Word."
      ],
      [
        "Send workers",
        "We equip coworkers to serve in worship, care, children and youth, fellowship, groups, classes, and community ministry."
      ],
      [
        "Lead people to Christ",
        "Centered on the gospel, we welcome new friends through prayer, companionship, invitations, and testimony."
      ]
    ]
  },
  service: {
    eyebrow: "This Sunday",
    title: "You are welcome to join us this Sunday",
    body: "We look forward to worshiping with you, learning God's Word together, and continuing in fellowship after the service.",
    facts: []
  },
  schedule: {
    eyebrow: "Weekly gatherings",
    title: "Church life throughout the week",
    body: "Service times and locations are maintained by church staff. Please review the latest schedule before visiting."
  },
  people: {
    eyebrow: "Meet us",
    title: "Pastors and ministry team",
    body: "Meet the pastors and ministry team serving our church and community."
  },
  events: {
    eyebrow: "Upcoming events",
    title: "Take part in church life",
    body: "Explore upcoming activities that have been reviewed and published by the church.",
    emptyText: "There are no published upcoming events right now."
  },
  entrance: {
    eyebrow: "Church entrances",
    title: "Start here to get to know us",
    body: "Find service time, address, visitor information, and contact links here. We would be glad to stay connected with you."
  },
  app: {
    title: "Walk with the church during the week",
    body: "WalkWith helps members read Scripture, revisit Sunday teaching, follow church life, and stay connected through important updates.",
    previewItems: [
      "Today's reading · John 15",
      "Sunday message · Weekly review",
      "Event reminder · Sunday worship"
    ],
    highlights: [
      [
        "Bible reading and TTS",
        "Read, listen, and meditate with Bible text that is public domain or properly licensed."
      ],
      [
        "Sermons and study",
        "Review Sunday messages, outlines, and Scripture references during the week."
      ],
      ["Events and notifications", "Follow upcoming activities, bulletins, and reminders."],
      ["Personal entrance", "Member profile, notification preferences, and future personal services have clear entry points."]
    ]
  },
  contact: {
    eyebrow: "Contact",
    title: "Mandarin Baptist Church of Glendora",
    body: "Make disciples, send workers, lead people to Christ"
  }
});

const esDefaultContent = localizePublicLandingContent("es", {
  identity: {
    name: "Iglesia Bautista Mandarin de Glendora",
    mission: "Formar discípulos, enviar obreros y guiar personas a Cristo",
    welcome:
      "Adoramos, aprendemos la Palabra de Dios, nos cuidamos unos a otros y llevamos el evangelio a nuestros hogares, comunidad y mundo."
  },
  actions: {
    "brand-home": ["Volver al inicio"],
    new: ["Soy nuevo"],
    service: ["Este domingo"],
    contact: ["Contacto"],
    "header-service": ["Este domingo"],
    "header-contact": ["Contactar"],
    "mobile-service": ["Hora"],
    "mobile-contact": ["Contacto"],
    "hero-new": ["Soy nuevo"],
    "hero-service": ["Este domingo"],
    "quick-service": ["Este domingo", "Horario, ubicación y ministerio infantil"],
    "quick-app": ["WalkWith App", "Lectura bíblica, sermones, eventos y avisos"],
    "quick-new": ["Soy nuevo", "Nos alegra que estés aquí"],
    "quick-contact": ["Contactar", "Preguntas, visitas, oración y cuidado"],
    "contact-worker": ["Contactar a un servidor"],
    "entrance-new": ["Entrada para visitantes", "Primera visita, preguntas y cuidado"],
    "entrance-app": ["Abrir WalkWith App", "Lectura bíblica, sermones, eventos y avisos"],
    "app-notify": ["Recibir aviso del lanzamiento de la App"],
    "footer-top": ["Volver arriba"]
  },
  hero: {
    title: "Iglesia Bautista Mandarin de Glendora",
    mission: "Formar discípulos, enviar obreros y guiar personas a Cristo",
    body: "Adoramos, aprendemos la Palabra de Dios, nos cuidamos unos a otros y llevamos el evangelio a nuestros hogares, comunidad y mundo."
  },
  mission: {
    eyebrow: "Nuestra dirección",
    title: "Vida de iglesia formada por la Gran Comisión",
    body: "Cada reunión, clase, cuidado y servicio se orienta por estas tres direcciones.",
    pillars: [
      [
        "Formar discípulos",
        "Por medio de la adoración, escuela dominical, lectura bíblica y clases, ayudamos a los hermanos a echar raíces en la Palabra de Dios."
      ],
      [
        "Enviar obreros",
        "Equipamos servidores para adoración, cuidado, niños y jóvenes, compañerismo, grupos, clases y servicio comunitario."
      ],
      [
        "Guiar personas a Cristo",
        "Centrados en el evangelio, recibimos a nuevos amigos con oración, compañía, invitaciones y testimonio."
      ]
    ]
  },
  service: {
    eyebrow: "Este domingo",
    title: "Eres bienvenido este domingo",
    body: "Esperamos adorar contigo, aprender juntos la Palabra de Dios y seguir en comunión después del servicio.",
    facts: []
  },
  schedule: {
    eyebrow: "Reuniones semanales",
    title: "Vida de iglesia durante la semana",
    body: "El equipo de la iglesia mantiene los horarios y lugares. Revisa la información más reciente antes de visitarnos."
  },
  people: {
    eyebrow: "Conócenos",
    title: "Pastores y equipo ministerial",
    body: "Conoce a los pastores y servidores que acompañan a nuestra iglesia y comunidad."
  },
  events: {
    eyebrow: "Próximos eventos",
    title: "Participa en la vida de la iglesia",
    body: "Explora las próximas actividades revisadas y publicadas por la iglesia.",
    emptyText: "No hay próximos eventos publicados en este momento."
  },
  entrance: {
    eyebrow: "Entradas de la iglesia",
    title: "Comienza aquí para conocernos",
    body: "Encuentra horario, dirección, información para visitantes y formas de contacto. Nos alegraría seguir conectados contigo."
  },
  app: {
    title: "Camina con la iglesia durante la semana",
    body: "WalkWith ayuda a los miembros a leer la Biblia, repasar la enseñanza dominical, seguir la vida de la iglesia y mantenerse conectados con avisos importantes.",
    previewItems: [
      "Lectura de hoy · Juan 15",
      "Mensaje dominical · Repaso semanal",
      "Recordatorio · Culto dominical"
    ],
    highlights: [
      [
        "Lectura bíblica y voz",
        "Lee, escucha y medita con textos bíblicos de dominio público o debidamente autorizados."
      ],
      [
        "Sermones y estudio",
        "Repasa mensajes dominicales, bosquejos y referencias bíblicas durante la semana."
      ],
      ["Eventos y notificaciones", "Sigue actividades, boletines y recordatorios."],
      ["Entrada personal", "Perfil de miembro, preferencias de notificación y futuros servicios personales tienen entradas claras."]
    ]
  },
  contact: {
    eyebrow: "Contacto",
    title: "Iglesia Bautista Mandarin de Glendora",
    body: "Formar discípulos, enviar obreros y guiar personas a Cristo"
  }
});

export const publicLandingDefaultContentByLocale = {
  en: enDefaultContent,
  es: esDefaultContent,
  "zh-Hans": zhHansDefaultContent,
  "zh-Hant": zhHantDefaultContent
} satisfies Record<SupportedLocale, PublicLandingResponse>;

export const publicLandingDefaultContent =
  publicLandingDefaultContentByLocale[publicLandingDefaultLocale];

export const publicLandingDefaultSettings: AppSetting[] = supportedLocales.flatMap(
  (locale) =>
    publicLandingSettingIds.map((id) =>
      setting(locale, id, defaultSettingValue(locale, id))
    )
);

function defaultSettingValue(
  locale: SupportedLocale,
  id: PublicLandingSettingId
) {
  if (id !== "events") {
    return publicLandingDefaultContentByLocale[locale][id];
  }
  const { items: _items, ...config } =
    publicLandingDefaultContentByLocale[locale].events;
  return config;
}

export function publicLandingSettingKey(
  locale: SupportedLocale,
  id: PublicLandingSettingId
) {
  if (locale === publicLandingDefaultLocale) {
    return `publicLanding.${id}`;
  }
  return `publicLanding.${locale}.${id}`;
}

export function publicLandingSettingKeyParts(
  key: string
): { locale: SupportedLocale; id: PublicLandingSettingId } | null {
  const baseId = publicLandingSettingIds.find(
    (id) => publicLandingSettingKey(publicLandingDefaultLocale, id) === key
  );
  if (baseId) {
    return { locale: publicLandingDefaultLocale, id: baseId };
  }

  for (const locale of supportedLocales) {
    const id = publicLandingSettingIds.find(
      (sectionId) => publicLandingSettingKey(locale, sectionId) === key
    );
    if (id) {
      return { locale, id };
    }
  }

  return null;
}

function setting(
  locale: SupportedLocale,
  id: PublicLandingSettingId,
  value: unknown
): AppSetting {
  return {
    key: publicLandingSettingKey(locale, id),
    category: publicLandingSettingCategory,
    label: `${sectionLabel(id)} (${localeLabel(locale)})`,
    description:
      "公开官网使用的后端配置。修改后会影响 /v1/public/landing 对应语言返回的数据。",
    value,
    updatedAt: defaultUpdatedAt
  };
}

function sectionLabel(id: PublicLandingSettingId) {
  return {
    identity: "官网身份与 Logo",
    brandAction: "官网品牌点击行为",
    navigation: "官网顶部导航",
    headerActions: "官网顶部按钮",
    mobileActions: "手机版官网底部快捷入口",
    hero: "官网首屏内容",
    mission: "教会宗旨区块",
    service: "聚会时间、地址与地图入口",
    schedule: "教会固定日程",
    people: "牧者与同工介绍",
    events: "近期活动区块",
    entrance: "新朋友和公开入口",
    app: "App 下载与引导入口",
    contact: "联系方式和社交媒体",
    footerActions: "页脚行动入口"
  }[id];
}

function localeLabel(locale: SupportedLocale) {
  return {
    en: "English",
    es: "Español",
    "zh-Hans": "简体中文",
    "zh-Hant": "繁體中文"
  }[locale];
}

function localizePublicLandingContent(
  locale: SupportedLocale,
  text: LocalizedLandingText
): PublicLandingResponse {
  const base = zhHansDefaultContent;
  const content = {
    ...base,
    locale,
    identity: {
      ...base.identity,
      ...text.identity
    },
    brandAction: localizeAction(base.brandAction, text.actions["brand-home"]),
    navigation: base.navigation.map((item) =>
      localizeAction(item, text.actions[item.id])
    ),
    headerActions: base.headerActions.map((item) =>
      localizeAction(item, text.actions[item.id])
    ),
    mobileActions: base.mobileActions.map((item) =>
      localizeAction(item, text.actions[item.id])
    ),
    hero: {
      ...base.hero,
      ...text.hero,
      primaryActions: base.hero.primaryActions.map((item) =>
        localizeAction(item, text.actions[item.id])
      ),
      quickActions: base.hero.quickActions.map((item) =>
        localizeAction(item, text.actions[item.id])
      )
    },
    mission: {
      ...base.mission,
      eyebrow: text.mission.eyebrow,
      title: text.mission.title,
      body: text.mission.body,
      pillars: base.mission.pillars.map((pillar, index) => ({
        ...pillar,
        title: text.mission.pillars[index]?.[0] ?? pillar.title,
        body: text.mission.pillars[index]?.[1] ?? pillar.body
      }))
    },
    service: {
      ...base.service,
      eyebrow: text.service.eyebrow,
      title: text.service.title,
      body: text.service.body,
      facts: base.service.facts.map((item, index) => ({
        ...item,
        label: text.service.facts[index] ?? item.label
      })),
      actions: base.service.actions.map((item) =>
        localizeAction(item, text.actions[item.id])
      )
    },
    schedule: {
      ...base.schedule,
      ...text.schedule
    },
    people: {
      ...base.people,
      ...text.people
    },
    events: {
      ...base.events,
      ...text.events,
      items: []
    },
    entrance: {
      ...base.entrance,
      eyebrow: text.entrance.eyebrow,
      title: text.entrance.title,
      body: text.entrance.body,
      actions: base.entrance.actions.map((item) =>
        localizeAction(item, text.actions[item.id])
      )
    },
    app: {
      ...base.app,
      title: text.app.title,
      body: text.app.body,
      previewItems: text.app.previewItems,
      highlights: base.app.highlights.map((item, index) => ({
        ...item,
        title: text.app.highlights[index]?.[0] ?? item.title,
        body: text.app.highlights[index]?.[1] ?? item.body
      })),
      actions: base.app.actions.map((item) =>
        localizeAction(item, text.actions[item.id])
      )
    },
    contact: {
      ...base.contact,
      ...text.contact
    },
    footerActions: base.footerActions.map((item) =>
      localizeAction(item, text.actions[item.id])
    )
  };

  return publicLandingContentSchema.parse(content);
}

function action(
  id: string,
  title: string,
  href: string,
  iconName: string,
  subtitle: string | null = null,
  kind: PublicLandingAction["kind"] = "anchor",
  target: PublicLandingAction["target"] = "same_tab"
): PublicLandingAction {
  return {
    id,
    title,
    subtitle,
    href,
    iconName,
    kind,
    target
  };
}

function localizeAction(
  item: PublicLandingAction,
  text?: readonly [string, string?]
): PublicLandingAction {
  if (!text) {
    return item;
  }
  return {
    ...item,
    title: text[0],
    subtitle: text.length > 1 ? text[1] ?? null : item.subtitle
  };
}

type LocalizedLandingText = {
  identity: {
    name: string;
    mission: string;
    welcome: string;
  };
  actions: Record<string, readonly [string, string?]>;
  hero: {
    title: string;
    mission: string;
    body: string;
  };
  mission: {
    eyebrow: string;
    title: string;
    body: string;
    pillars: Array<readonly [string, string]>;
  };
  service: {
    eyebrow: string;
    title: string;
    body: string;
    facts: string[];
  };
  schedule: {
    eyebrow: string;
    title: string;
    body: string;
  };
  people: {
    eyebrow: string;
    title: string;
    body: string;
  };
  events: {
    eyebrow: string;
    title: string;
    body: string;
    emptyText: string;
  };
  entrance: {
    eyebrow: string;
    title: string;
    body: string;
  };
  app: {
    title: string;
    body: string;
    previewItems: string[];
    highlights: Array<readonly [string, string]>;
  };
  contact: {
    eyebrow: string;
    title: string;
    body: string;
  };
};
