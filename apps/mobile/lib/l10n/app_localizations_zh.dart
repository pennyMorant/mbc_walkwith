// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Chinese (`zh`).
class AppLocalizationsZh extends AppLocalizations {
  AppLocalizationsZh([String locale = 'zh']) : super(locale);

  @override
  String get appTitle => 'MBCG';

  @override
  String get commonStatusUnknownLabel => '未知状态';

  @override
  String get commonVisibilityUnknownLabel => '未知可见性';

  @override
  String get commonPrivacyUnknownLabel => '未知隐私范围';

  @override
  String get tabStudy => '读经';

  @override
  String get tabSermons => '讲道';

  @override
  String get tabLife => '生活';

  @override
  String get tabMine => '我的';

  @override
  String get mineTitle => '我的';

  @override
  String get memberOptionalSignInTitle => '可选登录';

  @override
  String get memberOptionalSignInBody => '你可以继续以访客使用；登录后可在后续同步读经、祷告和奉献记录。';

  @override
  String get memberEmailLabel => '邮箱';

  @override
  String get memberInvalidEmail => '请输入有效的邮箱地址。';

  @override
  String get memberShowPasswordTooltip => '显示密码';

  @override
  String get memberHidePasswordTooltip => '隐藏密码';

  @override
  String get memberNameLabel => '姓名';

  @override
  String get memberPasswordLabel => '密码';

  @override
  String get memberConfirmPasswordLabel => '确认密码';

  @override
  String get memberCodeLabel => '验证码';

  @override
  String get memberVerifyEmailAction => '验证邮箱';

  @override
  String get memberSignInAction => '登录';

  @override
  String get memberContinueWithGoogle => '使用 Google 继续';

  @override
  String get memberContinueWithApple => '使用 Apple 继续';

  @override
  String get memberAuthAlternative => '或';

  @override
  String get memberFederatedSetupUnavailable => 'Google 与 Apple 登录尚未完成配置。';

  @override
  String get memberFederatedSignInFailed => '登录未能完成，请重试。';

  @override
  String get memberLoginEmailTitle => '欢迎回来';

  @override
  String get memberLoginEmailBody => '登录后继续参与教会生活。';

  @override
  String get memberNextAction => '下一步';

  @override
  String get memberCreateAccountAction => '创建账号';

  @override
  String get memberPasswordTitle => '输入密码';

  @override
  String get memberForgotPasswordAction => '忘记密码？';

  @override
  String get memberPasswordResetTitle => '重设密码';

  @override
  String get memberPasswordResetRequestBody => '如该邮箱可重设密码，我们会发送验证码。';

  @override
  String get memberPasswordResetCodeBody => '请输入邮件中的验证码，然后设置新密码。';

  @override
  String get memberPasswordResetAction => '重设密码';

  @override
  String get memberPasswordResetComplete => '密码已更新，请使用新密码登录。';

  @override
  String get memberBackToSignInAction => '返回登录';

  @override
  String get memberRegisterAction => '注册';

  @override
  String get memberChangeEmailAction => '更换邮箱';

  @override
  String get memberPasswordMismatch => '两次输入的密码不一致。';

  @override
  String get memberSignOutAction => '退出登录';

  @override
  String get memberRegistrationClosed => '会员注册暂时关闭，请联系教会办公室。';

  @override
  String get memberRegistrationPendingApproval => '注册已收到，请等待教会审核。';

  @override
  String get memberProfileTitle => '我的资料';

  @override
  String get memberProfileEditTitle => '资料详情';

  @override
  String get memberProfileSaveAction => '保存资料';

  @override
  String get memberProfileSaved => '资料已保存。';

  @override
  String get memberProfileOpenAction => '编辑资料';

  @override
  String get memberStatusLabel => '状态';

  @override
  String get memberRoleLabel => '身份';

  @override
  String get memberGroupLabel => '小组';

  @override
  String get memberNoGroupLabel => '未加入小组';

  @override
  String get memberPhoneLabel => '电话';

  @override
  String get memberAddressLabel => '地址';

  @override
  String get memberFaithStartYearLabel => '信主年份';

  @override
  String get memberBaptizedYearLabel => '受洗年份';

  @override
  String get memberJoinedChurchAtLabel => '加入教会日期';

  @override
  String get memberEmergencyContactNameLabel => '紧急联系人';

  @override
  String get memberEmergencyContactPhoneLabel => '紧急联系人电话';

  @override
  String get mineGivingEntryTitle => '奉献与年度证明';

  @override
  String get mineGivingEntryBody => '查看奉献记录、已确认数据和年度证明 PDF。';

  @override
  String get mineLifeOverviewTitle => '我的教会生活';

  @override
  String get mineLifeOverviewBody => '快速查看你的小组、课程、服事和关怀请求状态。';

  @override
  String get mineLifeGroupsLabel => '小组';

  @override
  String get mineLifeCoursesLabel => '课程';

  @override
  String mineLifeCoursesCountLabel(int count) {
    return '$count 门课程';
  }

  @override
  String get mineLifeServingLabel => '服事';

  @override
  String mineLifeServingCountLabel(int count) {
    return '$count 项服事';
  }

  @override
  String get mineLifeCareLabel => '关怀';

  @override
  String mineLifeOverviewMetricSemanticLabel(String label, int count) {
    return '$label：$count';
  }

  @override
  String get mineLifeOpenLifeAction => '打开生活';

  @override
  String get preferencesTitle => '偏好';

  @override
  String get appearanceTitle => '外观';

  @override
  String get themeModeSystem => '跟随系统';

  @override
  String get themeModeLight => '浅色';

  @override
  String get themeModeDark => '深色';

  @override
  String get textSizeTitle => '字体大小';

  @override
  String get textSizeBody => '让读经、敬拜和教会生活内容更容易阅读。';

  @override
  String get textSizeSystem => '跟随系统';

  @override
  String get textSizeStandard => '标准';

  @override
  String get textSizeLarge => '大';

  @override
  String get textSizeExtraLarge => '特大';

  @override
  String get notificationPermissionTitle => '通知权限';

  @override
  String get notificationPermissionEnabledBody => '系统已允许通知。需要关闭时，请通过开关进入系统设置。';

  @override
  String get notificationPermissionDisabledBody => '系统通知权限未开启。打开开关后会请求系统权限。';

  @override
  String get aboutTitle => '关于';

  @override
  String get aboutChurchTitle => '关于教会';

  @override
  String get churchAddressTitle => '地址 / 地图';

  @override
  String get churchPhoneTitle => '联系电话';

  @override
  String get churchEmailTitle => '联系邮箱';

  @override
  String get privacyPolicyTitle => '隐私政策';

  @override
  String get termsOfUseTitle => '使用条款';

  @override
  String get appVersionTitle => 'App 版本';

  @override
  String appVersionValue(String version) {
    return '版本 $version';
  }

  @override
  String get periodPickerTooltip => '选择日期范围';

  @override
  String get periodThisWeek => '本周';

  @override
  String get periodThisMonth => '本月';

  @override
  String get periodPreviousAction => '上一段';

  @override
  String get periodNextAction => '下一段';

  @override
  String get periodApplyAction => '应用';

  @override
  String get languageTitle => '语言';

  @override
  String get systemLanguageLabel => '系统语言';

  @override
  String get languageSystemBody => 'App 默认跟随系统语言。需要切换语言时，请在系统原生设置中修改此 App 的语言。';

  @override
  String get openSystemSettingsAction => '打开系统设置';

  @override
  String get bibleTranslationLabel => '圣经版本';

  @override
  String get studyTitle => '读经';

  @override
  String get bibleSearchTooltip => '搜索经文';

  @override
  String get bibleSearchTitle => '搜索经文';

  @override
  String get bibleSearchHint => '输入一句经文或关键词';

  @override
  String get bibleSearchStartTitle => '搜索整本圣经';

  @override
  String get bibleSearchStartBody =>
      '可以输入一句话、半句经文或几个关键词。搜索会使用当前 App 语言对应的圣经版本。';

  @override
  String get bibleSearchNoResultsTitle => '没有找到匹配经文';

  @override
  String get bibleSearchNoResultsBody =>
      '可以减少关键词，或换一种说法。搜索会尝试宽松匹配，但太短的词可能会被忽略。';

  @override
  String get bibleSearchErrorTitle => '搜索失败';

  @override
  String get versePickerTooltip => '选择经节';

  @override
  String get versePickerTitle => '选择经节';

  @override
  String get readerSettingsTooltip => '阅读设置';

  @override
  String get readerSettingsTitle => '阅读设置';

  @override
  String get readerAssistsTitle => '阅读辅助';

  @override
  String get chapterPeopleAssistTitle => '本章人物';

  @override
  String get chapterPeopleAssistBody => '在当前章节统一显示本章出现的圣经人物入口，不在每节反复标注。';

  @override
  String get chapterPlacesAssistTitle => '本章地名';

  @override
  String get chapterPlacesAssistBody => '在当前章节统一显示本章出现的圣经地名入口，不在每节反复标注。';

  @override
  String get lexiconAssistTitle => '原文词汇';

  @override
  String get lexiconAssistBody => '经文有本地原文资料时，显示词汇解释入口。';

  @override
  String get aiStudyHintsAssistTitle => 'AI 解经提示';

  @override
  String get aiStudyHintsAssistBody => '启用长按经文释义和相关学习提示。';

  @override
  String get chapterPeopleTooltip => '本章人物';

  @override
  String get chapterPeopleTitle => '本章人物';

  @override
  String get chapterPlacesTooltip => '本章地名';

  @override
  String get chapterPlacesTitle => '本章地名';

  @override
  String get continueReadingTitle => '继续阅读';

  @override
  String get continueReadingAction => '继续';

  @override
  String get defaultContinueReadingTitle => '罗马书 8';

  @override
  String get defaultContinueReadingSubtitle => '从罗马书 8 继续';

  @override
  String continueReadingChapterSubtitle(String bookName, int chapter) {
    return '从 $bookName $chapter 继续';
  }

  @override
  String continueReadingVerseSubtitle(
    int chapter,
    String verse,
    String bookName,
  ) {
    return '上次读到 $chapter:$verse · $bookName';
  }

  @override
  String get readingPlansTitle => '我的读经计划';

  @override
  String get readingPlansBody => '继续当前计划，使用本地经文阅读或朗读。';

  @override
  String get readingPlanStartAction => '开始';

  @override
  String get readingPlanContinueAction => '继续';

  @override
  String get readingPlanReadAction => '阅读';

  @override
  String get readingPlanCompleteDayAction => '标记完成';

  @override
  String get readingPlanCompletedLabel => '已完成';

  @override
  String get readingPlanNoDaysBody => '这个计划还没有每日经文引用。';

  @override
  String get readingPlanLoadErrorTitle => '读经计划载入失败';

  @override
  String get readingPlanLoadErrorBody => '请刷新后再试一次。';

  @override
  String get readingPlanActionError => '读经计划更新失败，请再试一次。';

  @override
  String readingPlanDaysLabel(int count) {
    return '$count 天';
  }

  @override
  String readingPlanDayLabel(int dayNumber) {
    return '第 $dayNumber 天';
  }

  @override
  String readingPlanProgressLabel(int completed, int total) {
    return '已完成 $completed/$total';
  }

  @override
  String get mineReadingPlansTitle => '我的读经计划';

  @override
  String get mineReadingPlansBody => '查看我的读经计划和完成进度。';

  @override
  String get mineReadingPlansEmpty => '从读经页面开始一个计划后，进度会显示在这里。';

  @override
  String get mineReadingPlansOpenStudyAction => '打开读经';

  @override
  String get readingPlanCurrentTab => '进行中';

  @override
  String get readingPlanHistoryTab => '历史';

  @override
  String get readingPlanCurrentEmpty => '当前没有进行中的读经计划。';

  @override
  String get readingPlanHistoryEmpty => '已完成或已结束的计划会显示在这里。';

  @override
  String get readingPlanViewAllAction => '查看计划';

  @override
  String get readingPlanRestartAction => '重新开始';

  @override
  String get readingPlanLoadMoreAction => '加载更多';

  @override
  String get readingPlanPauseAction => '暂停';

  @override
  String get readingPlanResumeAction => '继续';

  @override
  String get readingPlanAbandonAction => '结束计划';

  @override
  String get readingPlanAbandonConfirmBody => '结束本次计划并移入历史吗？已保存的进度仍会保留。';

  @override
  String get readingPlanNotStartedLabel => '未开始';

  @override
  String get readingPlanActiveLabel => '进行中';

  @override
  String get readingPlanPausedLabel => '已暂停';

  @override
  String get readingPlanAbandonedLabel => '已结束';

  @override
  String readingPlanAttemptLabel(int attempt) {
    return '第 $attempt 次';
  }

  @override
  String readingPlanStartedOn(String date) {
    return '开始于 $date';
  }

  @override
  String readingPlanEndedOn(String date) {
    return '结束于 $date';
  }

  @override
  String get readingPlanHistoryDetailTitle => '计划详情';

  @override
  String get readingPlanNoteLabel => '笔记';

  @override
  String get readingPlanRestartedMessage => '新的读经计划已开始。';

  @override
  String mineReadingPlanProgressChip(int completed) {
    return '已完成 $completed';
  }

  @override
  String get oldTestamentLabel => '旧约';

  @override
  String get newTestamentLabel => '新约';

  @override
  String bibleBookCountLabel(int count) {
    return '$count 卷';
  }

  @override
  String bibleChapterCountLabel(int count) {
    return '$count 章';
  }

  @override
  String bibleChapterCountWithName(int count, String bookName) {
    return '$count 章 · $bookName';
  }

  @override
  String bibleChapterReference(String bookName, int chapter) {
    return '$bookName $chapter';
  }

  @override
  String bibleChapterButtonSemanticLabel(String bookName, int chapter) {
    return '$bookName第 $chapter 章';
  }

  @override
  String get categoryLaw => '摩西五经';

  @override
  String get categoryOldTestamentHistory => '历史书';

  @override
  String get categoryWisdom => '诗歌智慧书';

  @override
  String get categoryMajorProphets => '大先知书';

  @override
  String get categoryMinorProphets => '小先知书';

  @override
  String get categoryGospels => '福音书';

  @override
  String get categoryActs => '历史书';

  @override
  String get categoryPaulineLetters => '保罗书信';

  @override
  String get categoryGeneralLetters => '普通书信';

  @override
  String get categoryApocalyptic => '启示文学';

  @override
  String get studyLoadErrorTitle => '圣经目录载入失败';

  @override
  String get studyLoadErrorBody => '请稍后重试，或检查本地圣经种子数据是否已正确打包。';

  @override
  String get readerFallbackTitle => '读经';

  @override
  String get previousChapterTooltip => '上一章';

  @override
  String get nextChapterTooltip => '下一章';

  @override
  String get readerLoadErrorTitle => '章节载入失败';

  @override
  String get readerLoadErrorBody => '请稍后重试，或检查本地圣经数据是否完成导入。';

  @override
  String get emptyChapterBody => '这一章暂时没有可显示的经文。';

  @override
  String get verseActionsTooltip => '笔记与高亮';

  @override
  String get verseActionsTitle => '经文工具';

  @override
  String get bookmarkVerseTitle => '收藏这一节';

  @override
  String get highlightTitle => '高亮';

  @override
  String get highlightNone => '无';

  @override
  String get highlightYellow => '金色';

  @override
  String get highlightGreen => '绿色';

  @override
  String get highlightBlue => '蓝色';

  @override
  String get highlightRose => '玫瑰色';

  @override
  String get noteTitle => '笔记';

  @override
  String get noteHint => '写下私人读经笔记';

  @override
  String get saveNoteAction => '保存笔记';

  @override
  String get verseNotesMyNotesTab => '我的笔记';

  @override
  String get verseNotesChurchNotesTab => '教会心得';

  @override
  String get verseNotesPublishHint => '发布后，其他使用此 App 的人读到这节经文时可以看到。';

  @override
  String get verseNotesDisplayNameHint => '访客显示名';

  @override
  String get verseNotesContentHint => '分享你对这节经文的心得';

  @override
  String get verseNotesPublishAction => '分享';

  @override
  String get verseNotesUpdateAction => '更新';

  @override
  String get verseNotesDeleteAction => '删除';

  @override
  String get verseNotesYourReflectionTitle => '我的心得';

  @override
  String get verseNotesSharedTitle => '公开心得';

  @override
  String verseNotesCountLabel(int count) {
    return '$count 条心得';
  }

  @override
  String get verseNotesMineLabel => '我的';

  @override
  String get verseNotesEmptyState => '这节经文还没有公开心得。';

  @override
  String get verseNotesEmptyError => '请先写下心得。';

  @override
  String get verseNotesGenericError => '经文心得加载失败。';

  @override
  String get studyChapterLabel => '罗马书 8';

  @override
  String get translationLabel => '和合本';

  @override
  String relatedSermonsLabel(int count) {
    return '$count 篇相关讲道';
  }

  @override
  String verseNumberLabel(int verse) {
    return '第 $verse 节';
  }

  @override
  String explanationTitleSuffix(String reference) {
    return '$reference 释义';
  }

  @override
  String get sourceLabel => '依据来源';

  @override
  String get relatedVersesLabel => '相关经文';

  @override
  String get aiStudyDisclaimer => 'AI 解释供学习参考，重要神学或牧养问题请咨询牧者。';

  @override
  String get aiStudySheetTitle => 'AI 查经辅助';

  @override
  String get aiStudyQuestionLabel => '问题';

  @override
  String get aiStudyDefaultQuestion => '请帮助我按上下文理解这节经文。';

  @override
  String get aiStudyGenerateAction => '生成查经辅助';

  @override
  String get aiStudyRetryAction => '重新提问';

  @override
  String get aiStudyResultTitle => '学习回应';

  @override
  String get aiStudySignInTitle => '需要登录';

  @override
  String get aiStudySignInBody => '请先在“我的”页面登录，再使用 AI 查经辅助。';

  @override
  String get aiStudyErrorTitle => 'AI 查经辅助暂不可用';

  @override
  String get aiStudyProviderDisabled => 'AI 服务还没有配置完成，请等教会同工开启后再试。';

  @override
  String get aiStudyProviderFailed => 'AI 服务暂时没有响应，请稍后重试。';

  @override
  String get aiStudyRateLimited => 'AI 请求太频繁了，请稍等后再试。';

  @override
  String get lexiconLoveTitle => '爱 / agape';

  @override
  String get lexiconGoodTitle => '益处 / agathon';

  @override
  String get lexiconLoveBody => '希腊文 ἀγάπη，常用于表达出于神主动、坚定、盟约性的爱。';

  @override
  String get lexiconGoodBody =>
      '希腊文 ἀγαθόν，指良善、有益处的结果。罗马书 8:28 的重点不是环境本身舒服，而是神最终成就的良善目的。';

  @override
  String get confirmKnown => '知道了';

  @override
  String get sermonsTitle => '讲道';

  @override
  String get searchSermonsTooltip => '搜索讲道';

  @override
  String get sermonFilterTooltip => '筛选讲道';

  @override
  String get sermonFilterTitle => '筛选讲道';

  @override
  String get sermonFilterSpeakerLabel => '讲员';

  @override
  String get sermonFilterSeriesLabel => '系列';

  @override
  String get sermonFilterTopicLabel => '主题';

  @override
  String get sermonFilterClearAction => '清除筛选';

  @override
  String get sermonFilterLoadError => '筛选条件暂时无法加载，请稍后重试。';

  @override
  String get sermonDetailTitle => '讲道详情';

  @override
  String get sermonContinueListeningTitle => '继续收听';

  @override
  String get sermonStudyNotesTitle => '讲义';

  @override
  String get sermonSummaryTitle => '讲道重点';

  @override
  String get sermonOpenDetailAction => '查看讲道详情';

  @override
  String get sermonOutlineTitle => '沉浸式讲义';

  @override
  String get sermonReferencesTitle => '讲道引用经文';

  @override
  String get sermonTranscriptTitle => '讲道文本';

  @override
  String get sermonSectionNotesLabel => '讲义';

  @override
  String get sermonSectionReferencesLabel => '经文';

  @override
  String get sermonSectionTranscriptLabel => '文稿';

  @override
  String get sermonPlaybackSpeedTitle => '播放速度';

  @override
  String get sermonTranscriptReadAction => '阅读文本';

  @override
  String get sermonTranscriptCollapseAction => '收起';

  @override
  String get sermonAiAskAction => '询问这篇讲道';

  @override
  String get sermonDiscussionTitle => '讲道讨论包';

  @override
  String get sermonDiscussionPrivateLabel => '私密回应';

  @override
  String get sermonDiscussionQuestionsTitle => '讨论问题';

  @override
  String get sermonDiscussionActionStepsTitle => '行动回应';

  @override
  String get sermonDiscussionPrayerTitle => '祷告方向';

  @override
  String get sermonDiscussionRespondAction => '写回应';

  @override
  String get sermonDiscussionResponseTitle => '个人回应';

  @override
  String get sermonDiscussionResponseHint => '写下你的心得或下一步行动';

  @override
  String get sermonDiscussionResponsePrivateNote => '你的回应默认只对自己可见。';

  @override
  String get sermonDiscussionSubmitAction => '提交';

  @override
  String get sermonDiscussionSubmitted => '回应已保存。';

  @override
  String get sermonDiscussionError => '回应保存失败，请再试一次。';

  @override
  String get sermonDiscussionLoadError => '讨论材料加载失败。';

  @override
  String get sermonDiscussionObservationChip => '观察';

  @override
  String get sermonDiscussionInterpretationChip => '解释';

  @override
  String get sermonDiscussionApplicationChip => '应用';

  @override
  String get sermonDiscussionPrayerChip => '祷告';

  @override
  String get sermonDiscussionActionChip => '行动';

  @override
  String get sermonAiSheetTitle => '讲道问答';

  @override
  String get sermonAiDefaultQuestion => '请帮助我理解这篇讲道的重点。';

  @override
  String get sermonAiGenerateAction => '生成讲道回答';

  @override
  String get relatedSermonsTitle => '相关讲道';

  @override
  String get sermonLoadErrorTitle => '讲道数据暂时无法加载';

  @override
  String get sermonLoadErrorBody => '稍后会从后端重新获取讲道列表。';

  @override
  String get retryAction => '重试';

  @override
  String get sermonEmptyTitle => '暂无讲道内容';

  @override
  String get sermonAudioMissing => '暂未上传音频';

  @override
  String get sermonAudioPreparing => '正在准备音频';

  @override
  String get sermonAudioLoading => '正在加载音频';

  @override
  String get sermonAudioReady => '可以播放';

  @override
  String get sermonAudioUnavailable => '音频暂时无法加载';

  @override
  String get rewindTooltip => '后退 15 秒';

  @override
  String get playTooltip => '播放';

  @override
  String get forwardTooltip => '前进 30 秒';

  @override
  String get lifeTitle => '教会生活';

  @override
  String get notificationsTooltip => '通知';

  @override
  String get notificationsPageTitle => '通知';

  @override
  String get notificationInboxTitle => '最近通知';

  @override
  String unreadCountSemanticLabel(String label, int count) {
    return '$label，$count 条未读';
  }

  @override
  String get notificationInboxEmptyTitle => '暂无通知';

  @override
  String get notificationInboxEmptyBody => '这台设备收到新的教会更新后会显示在这里。';

  @override
  String get notificationRefreshAction => '刷新通知';

  @override
  String get notificationMarkAllReadAction => '全部标为已读';

  @override
  String get notificationClearAction => '清空通知';

  @override
  String get notificationDeviceUnavailableBody =>
      '当前构建还没有接入 Firebase 应用配置，暂时无法启用推送。';

  @override
  String get weeklyBulletinTitle => '本周周报';

  @override
  String get lifeSundayHeroEmptyBody => '同工发布本周主日信息后，会显示在这里。';

  @override
  String get lifeTabWeek => '本周';

  @override
  String get lifeTabEvents => '活动';

  @override
  String get lifeTabGroups => '小组';

  @override
  String get lifeTabCourses => '课程';

  @override
  String get lifeTabServing => '服事';

  @override
  String get lifeTabPrayer => '代祷';

  @override
  String get lifeTabWeekEmpty => '新的教会生活卡片发布后会显示在这里。';

  @override
  String get lifeTabEventsEmpty => '当前暂无开放的活动卡片。';

  @override
  String get lifeTabMemberSignInBody => '请到“我的”登录后查看会友专属的小组、课程、服事和关怀卡片。';

  @override
  String get lifeTabPrayerDisabled => '当前构建暂未启用代祷请求。';

  @override
  String get lifeOpenDetailAction => '查看详情';

  @override
  String get lifeUpdatesTitle => '最新动态';

  @override
  String get lifeParticipationTitle => '我的参与';

  @override
  String get lifeLoadErrorTitle => '教会生活数据暂时无法加载';

  @override
  String get lifeLoadErrorBody => '稍后会从后端重新获取周报和生活信息。';

  @override
  String get lifeSectionLoadError => '此区域暂时无法加载，请重试。';

  @override
  String get lifeEmptyTitle => '暂无教会生活内容';

  @override
  String get lifePostNoBody => '详细内容会稍后补充。';

  @override
  String get lifePostVisibilityMembers => '会众可见';

  @override
  String get lifePostVisibilityGroup => '小组可见';

  @override
  String get lifePostVisibilityPrivate => '私密';

  @override
  String get lifePostTypeWeeklyBulletin => '周报';

  @override
  String get lifePostTypeSunday => '主日';

  @override
  String get lifePostTypeAnnouncement => '公告';

  @override
  String get lifePostTypeEvent => '活动';

  @override
  String get lifePostTypeGroup => '小组';

  @override
  String get lifePostTypeFellowship => '团契';

  @override
  String get lifePostTypeCourse => '课程';

  @override
  String get lifePostTypeServing => '服事';

  @override
  String get lifePostTypePrayer => '代祷';

  @override
  String get lifePostTypeGiving => '奉献';

  @override
  String get lifePostUnread => '未读';

  @override
  String get lifePostActionOpen => '打开链接';

  @override
  String get lifePostScheduleTbd => '时间待定';

  @override
  String get myEventRegistrationsTitle => '我的报名';

  @override
  String get groupsTitle => '小组与团契';

  @override
  String get groupsEmptyBody => '目前暂无可加入的小组或团契。';

  @override
  String get groupApplyAction => '申请加入';

  @override
  String get groupAlreadyMember => '你已在小组中';

  @override
  String get groupApplicationSubmitted => '申请已提交';

  @override
  String get groupApplicationSubmitSuccess => '申请已提交。';

  @override
  String get groupWithdrawAction => '撤回申请';

  @override
  String get groupApplicationWithdrawSuccess => '申请已撤回。';

  @override
  String get groupCapacityFull => '小组已满员';

  @override
  String get groupMyGroupsTitle => '我的小组';

  @override
  String get groupMyGroupsEmptyBody => '你目前还没有加入小组。';

  @override
  String get groupSignInToViewMineBody => '登录后可在不同设备查看你的小组。';

  @override
  String groupMemberCount(int count) {
    return '$count 位成员';
  }

  @override
  String groupMemberCapacity(int count, int capacity) {
    return '$count/$capacity 位成员';
  }

  @override
  String get coursesTitle => '课程与学习';

  @override
  String get coursesEmptyBody => '目前暂无开放的课程。';

  @override
  String get courseMyCoursesTitle => '我的课程';

  @override
  String get courseMyCoursesEmptyBody => '你目前还没有课程报名记录。';

  @override
  String get courseLessonsTitle => '课程课次';

  @override
  String get courseLessonsEmptyBody => '这门课程尚未发布课次。';

  @override
  String get courseSignInToEnrollBody => '登录后可报名课程，并在不同设备同步学习进度。';

  @override
  String get courseSignInToViewMineBody => '登录后可查看正在学习和已经完成的课程。';

  @override
  String get courseEnrollAction => '报名课程';

  @override
  String get courseSubmittedAction => '已提交';

  @override
  String get courseEnrolledAction => '已报名';

  @override
  String get courseWaitlistedAction => '候补中';

  @override
  String get courseCancelledAction => '已取消';

  @override
  String get courseCompletedAction => '已完成';

  @override
  String get courseEnrollmentSubmitSuccess => '课程报名已提交。';

  @override
  String get courseStatusDraft => '草稿';

  @override
  String get courseStatusOpen => '开放报名';

  @override
  String get courseStatusClosed => '已关闭';

  @override
  String get courseStatusInProgress => '进行中';

  @override
  String get courseStatusCompleted => '已完成';

  @override
  String get courseStatusArchived => '已归档';

  @override
  String courseLessonCount(int count) {
    return '$count 个课次';
  }

  @override
  String get courseCapacityOpen => '名额开放';

  @override
  String courseCapacityLabel(int count, int capacity) {
    return '$count/$capacity 个名额';
  }

  @override
  String courseProgressLabel(int completed, int total) {
    return '已完成 $completed/$total 个课次';
  }

  @override
  String get servingTitle => '我的服事';

  @override
  String get servingEmptyBody => '目前暂无服事安排。';

  @override
  String get servingConfirmAction => '确认服事';

  @override
  String get servingLeaveAction => '请假';

  @override
  String get servingConfirmSuccess => '服事已确认。';

  @override
  String get servingLeaveSuccess => '请假请求已提交。';

  @override
  String get servingStatusScheduled => '待确认';

  @override
  String get servingStatusConfirmed => '已确认';

  @override
  String get servingStatusDeclined => '已请假';

  @override
  String get servingStatusSwapRequested => '申请换班';

  @override
  String get servingStatusCovered => '已有替补';

  @override
  String get servingStatusCancelled => '已取消';

  @override
  String get servingScheduleTab => '排班';

  @override
  String get servingAvailabilityTab => '可用时间';

  @override
  String get servingAvailabilityEmptyBody => '尚未提交可用时间。';

  @override
  String get servingAvailabilityAddAction => '添加可用时间';

  @override
  String get servingAvailabilitySheetTitle => '新的可用时间';

  @override
  String get servingAvailabilityStatusLabel => '可用状态';

  @override
  String get servingAvailabilityStatusAvailable => '可以服事';

  @override
  String get servingAvailabilityStatusUnavailable => '无法服事';

  @override
  String get servingAvailabilityStatusPreferred => '优先时段';

  @override
  String get servingAvailabilityStartLabel => '开始时间';

  @override
  String get servingAvailabilityEndLabel => '结束时间';

  @override
  String get servingAvailabilityNoteHint => '补充说明（可选）';

  @override
  String get servingAvailabilitySaveAction => '保存可用时间';

  @override
  String get servingAvailabilityCreateSuccess => '可用时间已保存。';

  @override
  String get servingAvailabilityInvalidRange => '结束时间必须晚于开始时间。';

  @override
  String get servingCheckInTitle => '到岗状态';

  @override
  String get servingCheckInAction => '确认到岗';

  @override
  String get servingCheckInSuccess => '到岗已确认。';

  @override
  String get servingCheckInNotRecorded => '尚未确认到岗。';

  @override
  String get servingCheckInStatusPending => '待到岗';

  @override
  String get servingCheckInStatusCheckedIn => '已到岗';

  @override
  String get servingCheckInStatusMissed => '未到岗';

  @override
  String get servingAssignmentNoteTitle => '服事说明';

  @override
  String get servingResponseNoteTitle => '我的回复';

  @override
  String get eventRegistrationTitle => '活动报名';

  @override
  String get eventRegistrationRegisterAction => '报名';

  @override
  String get eventRegistrationUpdateAction => '保存修改';

  @override
  String get eventRegistrationCancelAction => '取消报名';

  @override
  String get eventRegistrationCheckInAction => '签到';

  @override
  String get eventCheckInScanAction => '扫描现场码';

  @override
  String get eventCheckInScanTitle => '现场签到';

  @override
  String get eventCheckInScanPrompt => '请扫描同工打印的活动签到二维码。';

  @override
  String get eventCheckInScanSuccessTitle => '签到成功';

  @override
  String get eventCheckInScanViewEvent => '查看活动';

  @override
  String get eventCheckInScanAgain => '继续扫描';

  @override
  String get eventCheckInScanSignInRequired => '请先登录，再扫描现场签到二维码。';

  @override
  String get eventCheckInQrInvalid => '这个签到二维码无效，请重新扫描。';

  @override
  String get eventCheckInQrExpired => '这个签到二维码已过期，请联系同工。';

  @override
  String get eventCheckInQrDisabled => '这个签到二维码已停用，请联系同工。';

  @override
  String get eventCheckInQrRegistrationRequired => '没有找到你的活动报名，请先报名或联系同工。';

  @override
  String get eventRegistrationRegistered => '你已报名';

  @override
  String get eventRegistrationCheckedIn => '你已签到';

  @override
  String get eventRegistrationSignInBody => '登录后即可报名参加这个活动。';

  @override
  String get eventRegistrationFull => '报名名额已满。';

  @override
  String get eventRegistrationClosed => '报名已截止。';

  @override
  String get eventRegistrationUnavailable => '这个活动目前不可报名或不可查看。';

  @override
  String get eventRegistrationNotFound => '没有找到你的报名记录，请刷新后再试。';

  @override
  String get eventRegistrationPartySizeInvalid => '请选择更少的参加人数。';

  @override
  String get eventRegistrationCheckInLocked => '已签到的报名只能由同工修改。';

  @override
  String get eventRegistrationSuccess => '报名成功。';

  @override
  String get eventRegistrationUpdateSuccess => '报名信息已更新。';

  @override
  String get eventRegistrationCancelSuccess => '已取消报名。';

  @override
  String get eventRegistrationCheckInSuccess => '签到成功。';

  @override
  String eventRegistrationCheckedInAt(String time) {
    return '签到时间：$time';
  }

  @override
  String get eventRegistrationPartySizeLabel => '参加人数';

  @override
  String eventRegistrationPartySize(int count) {
    return '$count 人';
  }

  @override
  String get eventRegistrationNoteLabel => '备注';

  @override
  String get eventRegistrationNoteHint => '餐食需要、到达说明，或可协助事项';

  @override
  String eventRegistrationSpots(int registered, int capacity) {
    return '已报名 $registered/$capacity';
  }

  @override
  String eventRegistrationUnlimitedSpots(int registered) {
    return '已报名 $registered';
  }

  @override
  String eventRegistrationRemaining(int remaining) {
    return '剩余 $remaining 个名额';
  }

  @override
  String get givingGuestBody => '登录后可查看自己的奉献记录和年度证明。';

  @override
  String get givingHistoryTitle => '奉献记录';

  @override
  String get givingTransactionsTitle => '最近交易';

  @override
  String get givingTransactionsEmptyBody => '暂时还没有奉献记录。';

  @override
  String givingSummaryYear(int year) {
    return '$year 年';
  }

  @override
  String givingSummaryAmount(String amount) {
    return '总额 $amount';
  }

  @override
  String givingSummaryCount(int count) {
    return '$count 笔奉献';
  }

  @override
  String get givingStatementSectionTitle => '年度证明';

  @override
  String get annualStatementsTitle => '年度证明';

  @override
  String get annualStatementsEmptyBody => '暂时还没有年度证明。';

  @override
  String givingStatementLabel(int year) {
    return '$year 年证明';
  }

  @override
  String get prayerTitle => '代祷';

  @override
  String get prayerEmptyBody => '暂无公开代祷事项。';

  @override
  String get prayerSubmitTitle => '提交代祷事项';

  @override
  String get prayerSubmitAction => '提交';

  @override
  String get prayerGuestSubmitBody => '可以访客身份提交。私密事项只给牧者和后台同工查看。';

  @override
  String get prayerMemberSubmitBody => '这条代祷会关联到你的会员资料，之后可以查看处理状态。';

  @override
  String get prayerTitleLabel => '标题';

  @override
  String get prayerBodyLabel => '代祷内容';

  @override
  String get prayerNameLabel => '姓名';

  @override
  String get prayerValidationError => '请填写标题和代祷内容。';

  @override
  String get prayerSubmittedMessage => '代祷事项已提交，等待审核。';

  @override
  String get prayerMineLabel => '我的';

  @override
  String get prayerVisibilityPrivate => '私密';

  @override
  String get prayerVisibilityPublic => '公开';

  @override
  String get prayerVisibilityMembers => '会众';

  @override
  String get prayerVisibilityGroup => '小组';

  @override
  String get prayerStatusPending => '待审核';

  @override
  String get prayerStatusApproved => '已通过';

  @override
  String get prayerStatusHidden => '已隐藏';

  @override
  String get prayerStatusArchived => '已归档';

  @override
  String get careTitle => '关怀';

  @override
  String get careEmptyBody => '暂时还没有关怀请求。';

  @override
  String get careSubmitTitle => '请求牧养关怀';

  @override
  String get careSubmitAction => '请求关怀';

  @override
  String get careSubmitBody => '请简要说明你希望牧者或关怀同工如何跟进。内部跟进备注只给授权同工查看。';

  @override
  String get careSignInRequired => '请先以会友身份登录后再提交关怀请求。';

  @override
  String get careTitleLabel => '标题';

  @override
  String get careBodyLabel => '你希望我们如何关怀你？';

  @override
  String get carePrivacyLabel => '隐私范围';

  @override
  String get carePrivacyPastoralOnly => '仅牧者团队';

  @override
  String get carePrivacyAssignedTeam => '指定关怀团队';

  @override
  String get carePrivacyAdminRestricted => '仅受限管理员';

  @override
  String get careValidationError => '请填写标题和关怀内容。';

  @override
  String get careSubmittedMessage => '关怀请求已提交。';

  @override
  String get careStatusSubmitted => '已提交';

  @override
  String get careStatusAssigned => '已分配';

  @override
  String get careStatusInProgress => '跟进中';

  @override
  String get careStatusResolved => '已解决';

  @override
  String get careStatusArchived => '已归档';

  @override
  String careNextFollowUp(String date) {
    return '下次跟进 $date';
  }

  @override
  String get givingTitle => '奉献';

  @override
  String get givingCardTitle => '奉献与年度证明';

  @override
  String get givingCardBody => '通过 Stripe 安全奉献，完成后可在这里查看已确认的奉献记录和年度证明。';

  @override
  String get givingCheckoutTitle => '现在奉献';

  @override
  String get givingCheckoutBody => '付款由 Stripe 处理，App 不保存银行卡或银行账户信息。';

  @override
  String get givingAmountLabel => '金额';

  @override
  String get givingFundLabel => '奉献项目';

  @override
  String get givingFundsLoading => '正在加载奉献项目...';

  @override
  String get givingFundsEmpty => '当前没有可用的奉献项目。';

  @override
  String get givingCategoryOffering => '奉献';

  @override
  String get givingCategoryMissions => '宣教';

  @override
  String get givingCheckoutAction => '前往 Stripe';

  @override
  String get givingAmountError =>
      '请输入 USD 1.00 至 USD 100,000.00 之间的金额，最多保留两位小数。';

  @override
  String get givingCheckoutOpenError => '无法打开 Stripe 付款页面。';

  @override
  String get givingCheckoutReturnSuccess => 'Stripe 付款流程已完成。确认入账后会显示在奉献记录中。';

  @override
  String get givingCheckoutReturnCancel => 'Stripe 付款已取消。';

  @override
  String get annualStatementTooltip => '年度证明';

  @override
  String get annualStatementPreviewAction => '预览 CSV';

  @override
  String get annualStatementCopyCsvAction => '复制 CSV';

  @override
  String get annualStatementCopiedMessage => '证明 CSV 已复制。';

  @override
  String get annualStatementSavePdfAction => '保存 PDF';

  @override
  String get annualStatementSharePdfAction => '分享 PDF';

  @override
  String get annualStatementSharePdfText => '年度奉献证明';

  @override
  String get annualStatementPdfSharedMessage => '年度证明 PDF 已分享。';

  @override
  String get annualStatementPdfOpenedMessage => '年度证明 PDF 已保存并打开。';

  @override
  String annualStatementPdfSavedMessage(String path) {
    return '年度证明 PDF 已保存到 $path。';
  }

  @override
  String get copyPathAction => '复制路径';

  @override
  String get annualStatementExportTitle => '证明导出';

  @override
  String get annualStatementStatusPendingLabel => '处理中';

  @override
  String get annualStatementStatusReadyLabel => '可用';

  @override
  String get annualStatementStatusSentLabel => '已发送';

  @override
  String get annualStatementStatusFailedLabel => '失败';

  @override
  String get givingStatusPendingLabel => '处理中';

  @override
  String get givingStatusSucceededLabel => '成功';

  @override
  String get givingStatusFailedLabel => '失败';

  @override
  String get givingStatusRefundedLabel => '已退款';

  @override
  String get bibleTtsReadyTitle => '朗读圣经';

  @override
  String bibleTtsCurrentVerse(int verse) {
    return '正在朗读第 $verse 节';
  }

  @override
  String bibleTtsPausedVerse(int verse) {
    return '已暂停在第 $verse 节，继续会重读本节。';
  }

  @override
  String bibleTtsRateLabel(double rate) {
    final intl.NumberFormat rateNumberFormat = intl.NumberFormat.compact(
      locale: localeName,
    );
    final String rateString = rateNumberFormat.format(rate);

    return '${rateString}x';
  }

  @override
  String get bibleTtsPlayTooltip => '朗读';

  @override
  String get bibleTtsPauseTooltip => '暂停朗读';

  @override
  String get bibleTtsStopTooltip => '停止朗读';

  @override
  String get bibleTtsPreviousVerseTooltip => '上一节';

  @override
  String get bibleTtsNextVerseTooltip => '下一节';

  @override
  String get bibleTtsErrorTextMissing => '这段经文没有可朗读的文字。';

  @override
  String get bibleTtsErrorEngineUnavailable => '此设备暂时无法使用文字朗读。请检查系统语音设置后重试。';

  @override
  String get bibleTtsErrorLanguageUnavailable => '系统尚未安装这个圣经语言的语音。';

  @override
  String get bibleTtsErrorInterrupted => '朗读已中断。点击播放可从当前经节继续。';

  @override
  String get bibleTtsErrorStartFailed => '无法开始朗读。请检查设备语音设置后重试。';

  @override
  String get newcomerCardTitle => '第一次来吗？';

  @override
  String get newcomerCardBody => '我们很愿意欢迎你、回答问题，并帮助你认识教会生活。';

  @override
  String get newcomerCardAction => '我是新朋友';

  @override
  String get newcomerSheetTitle => '欢迎来到 MBCG';

  @override
  String get newcomerSheetGuestBody => '留下简单资料，教会同工会与你联系。';

  @override
  String get newcomerSheetMemberBody => '你也可以介绍自己，或请同工与你联系。';

  @override
  String get newcomerNameLabel => '姓名';

  @override
  String get newcomerEmailLabel => '邮箱';

  @override
  String get newcomerPhoneLabel => '电话';

  @override
  String get newcomerInterestLabel => '你想了解什么？';

  @override
  String get newcomerSubmitAction => '发送给教会同工';

  @override
  String get newcomerNameValidationError => '请输入姓名。';

  @override
  String get newcomerContactValidationError => '请至少留下邮箱或电话。';

  @override
  String get newcomerEmailValidationError => '请输入有效的邮箱地址。';

  @override
  String get newcomerSubmittedMessage => '谢谢，我们已经收到你的资料。';

  @override
  String get mineDiscipleshipTitle => '我的门徒成长路径';

  @override
  String get mineDiscipleshipBody => '查看教会同工为你安排的下一步成长操练。';

  @override
  String get mineDiscipleshipEmpty => '当前还没有分配成长路径。';

  @override
  String get mineDiscipleshipLoadError => '无法加载你的成长路径。';

  @override
  String mineDiscipleshipProgressChip(int completed, int total) {
    return '$completed/$total 个任务';
  }

  @override
  String get discipleshipStatusNotStarted => '未开始';

  @override
  String get discipleshipStatusInProgress => '进行中';

  @override
  String get discipleshipStatusBlocked => '受阻';

  @override
  String get discipleshipStatusCompleted => '已完成';

  @override
  String get discipleshipStatusPaused => '已暂停';

  @override
  String get discipleshipStatusCancelled => '已取消';
}

/// The translations for Chinese, using the Han script (`zh_Hans`).
class AppLocalizationsZhHans extends AppLocalizationsZh {
  AppLocalizationsZhHans() : super('zh_Hans');

  @override
  String get appTitle => 'MBCG';

  @override
  String get commonStatusUnknownLabel => '未知状态';

  @override
  String get commonVisibilityUnknownLabel => '未知可见性';

  @override
  String get commonPrivacyUnknownLabel => '未知隐私范围';

  @override
  String get tabStudy => '读经';

  @override
  String get tabSermons => '讲道';

  @override
  String get tabLife => '生活';

  @override
  String get tabMine => '我的';

  @override
  String get mineTitle => '我的';

  @override
  String get memberOptionalSignInTitle => '可选登录';

  @override
  String get memberOptionalSignInBody => '你可以继续以访客使用；登录后可在后续同步读经、祷告和奉献记录。';

  @override
  String get memberEmailLabel => '邮箱';

  @override
  String get memberInvalidEmail => '请输入有效的邮箱地址。';

  @override
  String get memberShowPasswordTooltip => '显示密码';

  @override
  String get memberHidePasswordTooltip => '隐藏密码';

  @override
  String get memberNameLabel => '姓名';

  @override
  String get memberPasswordLabel => '密码';

  @override
  String get memberConfirmPasswordLabel => '确认密码';

  @override
  String get memberCodeLabel => '验证码';

  @override
  String get memberVerifyEmailAction => '验证邮箱';

  @override
  String get memberSignInAction => '登录';

  @override
  String get memberContinueWithGoogle => '使用 Google 继续';

  @override
  String get memberContinueWithApple => '使用 Apple 继续';

  @override
  String get memberAuthAlternative => '或';

  @override
  String get memberFederatedSetupUnavailable => 'Google 与 Apple 登录尚未完成配置。';

  @override
  String get memberFederatedSignInFailed => '登录未能完成，请重试。';

  @override
  String get memberLoginEmailTitle => '欢迎回来';

  @override
  String get memberLoginEmailBody => '登录后继续参与教会生活。';

  @override
  String get memberNextAction => '下一步';

  @override
  String get memberCreateAccountAction => '创建账号';

  @override
  String get memberPasswordTitle => '输入密码';

  @override
  String get memberForgotPasswordAction => '忘记密码？';

  @override
  String get memberPasswordResetTitle => '重设密码';

  @override
  String get memberPasswordResetRequestBody => '如该邮箱可重设密码，我们会发送验证码。';

  @override
  String get memberPasswordResetCodeBody => '请输入邮件中的验证码，然后设置新密码。';

  @override
  String get memberPasswordResetAction => '重设密码';

  @override
  String get memberPasswordResetComplete => '密码已更新，请使用新密码登录。';

  @override
  String get memberBackToSignInAction => '返回登录';

  @override
  String get memberRegisterAction => '注册';

  @override
  String get memberChangeEmailAction => '更换邮箱';

  @override
  String get memberPasswordMismatch => '两次输入的密码不一致。';

  @override
  String get memberSignOutAction => '退出登录';

  @override
  String get memberRegistrationClosed => '会员注册暂时关闭，请联系教会办公室。';

  @override
  String get memberRegistrationPendingApproval => '注册已收到，请等待教会审核。';

  @override
  String get memberProfileTitle => '我的资料';

  @override
  String get memberProfileEditTitle => '资料详情';

  @override
  String get memberProfileSaveAction => '保存资料';

  @override
  String get memberProfileSaved => '资料已保存。';

  @override
  String get memberProfileOpenAction => '编辑资料';

  @override
  String get memberStatusLabel => '状态';

  @override
  String get memberRoleLabel => '身份';

  @override
  String get memberGroupLabel => '小组';

  @override
  String get memberNoGroupLabel => '未加入小组';

  @override
  String get memberPhoneLabel => '电话';

  @override
  String get memberAddressLabel => '地址';

  @override
  String get memberFaithStartYearLabel => '信主年份';

  @override
  String get memberBaptizedYearLabel => '受洗年份';

  @override
  String get memberJoinedChurchAtLabel => '加入教会日期';

  @override
  String get memberEmergencyContactNameLabel => '紧急联系人';

  @override
  String get memberEmergencyContactPhoneLabel => '紧急联系人电话';

  @override
  String get mineGivingEntryTitle => '奉献与年度证明';

  @override
  String get mineGivingEntryBody => '查看奉献记录、已确认数据和年度证明 PDF。';

  @override
  String get mineLifeOverviewTitle => '我的教会生活';

  @override
  String get mineLifeOverviewBody => '快速查看你的小组、课程、服事和关怀请求状态。';

  @override
  String get mineLifeGroupsLabel => '小组';

  @override
  String get mineLifeCoursesLabel => '课程';

  @override
  String mineLifeCoursesCountLabel(int count) {
    return '$count 门课程';
  }

  @override
  String get mineLifeServingLabel => '服事';

  @override
  String mineLifeServingCountLabel(int count) {
    return '$count 项服事';
  }

  @override
  String get mineLifeCareLabel => '关怀';

  @override
  String mineLifeOverviewMetricSemanticLabel(String label, int count) {
    return '$label：$count';
  }

  @override
  String get mineLifeOpenLifeAction => '打开生活';

  @override
  String get preferencesTitle => '偏好';

  @override
  String get appearanceTitle => '外观';

  @override
  String get themeModeSystem => '跟随系统';

  @override
  String get themeModeLight => '浅色';

  @override
  String get themeModeDark => '深色';

  @override
  String get textSizeTitle => '字体大小';

  @override
  String get textSizeBody => '让读经、敬拜和教会生活内容更容易阅读。';

  @override
  String get textSizeSystem => '跟随系统';

  @override
  String get textSizeStandard => '标准';

  @override
  String get textSizeLarge => '大';

  @override
  String get textSizeExtraLarge => '特大';

  @override
  String get notificationPermissionTitle => '通知权限';

  @override
  String get notificationPermissionEnabledBody => '系统已允许通知。需要关闭时，请通过开关进入系统设置。';

  @override
  String get notificationPermissionDisabledBody => '系统通知权限未开启。打开开关后会请求系统权限。';

  @override
  String get aboutTitle => '关于';

  @override
  String get aboutChurchTitle => '关于教会';

  @override
  String get churchAddressTitle => '地址 / 地图';

  @override
  String get churchPhoneTitle => '联系电话';

  @override
  String get churchEmailTitle => '联系邮箱';

  @override
  String get privacyPolicyTitle => '隐私政策';

  @override
  String get termsOfUseTitle => '使用条款';

  @override
  String get appVersionTitle => 'App 版本';

  @override
  String appVersionValue(String version) {
    return '版本 $version';
  }

  @override
  String get periodPickerTooltip => '选择日期范围';

  @override
  String get periodThisWeek => '本周';

  @override
  String get periodThisMonth => '本月';

  @override
  String get periodPreviousAction => '上一段';

  @override
  String get periodNextAction => '下一段';

  @override
  String get periodApplyAction => '应用';

  @override
  String get languageTitle => '语言';

  @override
  String get systemLanguageLabel => '系统语言';

  @override
  String get languageSystemBody => 'App 默认跟随系统语言。需要切换语言时，请在系统原生设置中修改此 App 的语言。';

  @override
  String get openSystemSettingsAction => '打开系统设置';

  @override
  String get bibleTranslationLabel => '圣经版本';

  @override
  String get studyTitle => '读经';

  @override
  String get bibleSearchTooltip => '搜索经文';

  @override
  String get bibleSearchTitle => '搜索经文';

  @override
  String get bibleSearchHint => '输入一句经文或关键词';

  @override
  String get bibleSearchStartTitle => '搜索整本圣经';

  @override
  String get bibleSearchStartBody =>
      '可以输入一句话、半句经文或几个关键词。搜索会使用当前 App 语言对应的圣经版本。';

  @override
  String get bibleSearchNoResultsTitle => '没有找到匹配经文';

  @override
  String get bibleSearchNoResultsBody =>
      '可以减少关键词，或换一种说法。搜索会尝试宽松匹配，但太短的词可能会被忽略。';

  @override
  String get bibleSearchErrorTitle => '搜索失败';

  @override
  String get versePickerTooltip => '选择经节';

  @override
  String get versePickerTitle => '选择经节';

  @override
  String get readerSettingsTooltip => '阅读设置';

  @override
  String get readerSettingsTitle => '阅读设置';

  @override
  String get readerAssistsTitle => '阅读辅助';

  @override
  String get chapterPeopleAssistTitle => '本章人物';

  @override
  String get chapterPeopleAssistBody => '在当前章节统一显示本章出现的圣经人物入口，不在每节反复标注。';

  @override
  String get chapterPlacesAssistTitle => '本章地名';

  @override
  String get chapterPlacesAssistBody => '在当前章节统一显示本章出现的圣经地名入口，不在每节反复标注。';

  @override
  String get lexiconAssistTitle => '原文词汇';

  @override
  String get lexiconAssistBody => '经文有本地原文资料时，显示词汇解释入口。';

  @override
  String get aiStudyHintsAssistTitle => 'AI 解经提示';

  @override
  String get aiStudyHintsAssistBody => '启用长按经文释义和相关学习提示。';

  @override
  String get chapterPeopleTooltip => '本章人物';

  @override
  String get chapterPeopleTitle => '本章人物';

  @override
  String get chapterPlacesTooltip => '本章地名';

  @override
  String get chapterPlacesTitle => '本章地名';

  @override
  String get continueReadingTitle => '继续阅读';

  @override
  String get continueReadingAction => '继续';

  @override
  String get defaultContinueReadingTitle => '罗马书 8';

  @override
  String get defaultContinueReadingSubtitle => '从罗马书 8 继续';

  @override
  String continueReadingChapterSubtitle(String bookName, int chapter) {
    return '从 $bookName $chapter 继续';
  }

  @override
  String continueReadingVerseSubtitle(
    int chapter,
    String verse,
    String bookName,
  ) {
    return '上次读到 $chapter:$verse · $bookName';
  }

  @override
  String get readingPlansTitle => '我的读经计划';

  @override
  String get readingPlansBody => '继续当前计划，使用本地经文阅读或朗读。';

  @override
  String get readingPlanStartAction => '开始';

  @override
  String get readingPlanContinueAction => '继续';

  @override
  String get readingPlanReadAction => '阅读';

  @override
  String get readingPlanCompleteDayAction => '标记完成';

  @override
  String get readingPlanCompletedLabel => '已完成';

  @override
  String get readingPlanNoDaysBody => '这个计划还没有每日经文引用。';

  @override
  String get readingPlanLoadErrorTitle => '读经计划载入失败';

  @override
  String get readingPlanLoadErrorBody => '请刷新后再试一次。';

  @override
  String get readingPlanActionError => '读经计划更新失败，请再试一次。';

  @override
  String readingPlanDaysLabel(int count) {
    return '$count 天';
  }

  @override
  String readingPlanDayLabel(int dayNumber) {
    return '第 $dayNumber 天';
  }

  @override
  String readingPlanProgressLabel(int completed, int total) {
    return '已完成 $completed/$total';
  }

  @override
  String get mineReadingPlansTitle => '我的读经计划';

  @override
  String get mineReadingPlansBody => '查看我的读经计划和完成进度。';

  @override
  String get mineReadingPlansEmpty => '从读经页面开始一个计划后，进度会显示在这里。';

  @override
  String get mineReadingPlansOpenStudyAction => '打开读经';

  @override
  String get readingPlanCurrentTab => '进行中';

  @override
  String get readingPlanHistoryTab => '历史';

  @override
  String get readingPlanCurrentEmpty => '当前没有进行中的读经计划。';

  @override
  String get readingPlanHistoryEmpty => '已完成或已结束的计划会显示在这里。';

  @override
  String get readingPlanViewAllAction => '查看计划';

  @override
  String get readingPlanRestartAction => '重新开始';

  @override
  String get readingPlanLoadMoreAction => '加载更多';

  @override
  String get readingPlanPauseAction => '暂停';

  @override
  String get readingPlanResumeAction => '继续';

  @override
  String get readingPlanAbandonAction => '结束计划';

  @override
  String get readingPlanAbandonConfirmBody => '结束本次计划并移入历史吗？已保存的进度仍会保留。';

  @override
  String get readingPlanNotStartedLabel => '未开始';

  @override
  String get readingPlanActiveLabel => '进行中';

  @override
  String get readingPlanPausedLabel => '已暂停';

  @override
  String get readingPlanAbandonedLabel => '已结束';

  @override
  String readingPlanAttemptLabel(int attempt) {
    return '第 $attempt 次';
  }

  @override
  String readingPlanStartedOn(String date) {
    return '开始于 $date';
  }

  @override
  String readingPlanEndedOn(String date) {
    return '结束于 $date';
  }

  @override
  String get readingPlanHistoryDetailTitle => '计划详情';

  @override
  String get readingPlanNoteLabel => '笔记';

  @override
  String get readingPlanRestartedMessage => '新的读经计划已开始。';

  @override
  String mineReadingPlanProgressChip(int completed) {
    return '已完成 $completed';
  }

  @override
  String get oldTestamentLabel => '旧约';

  @override
  String get newTestamentLabel => '新约';

  @override
  String bibleBookCountLabel(int count) {
    return '$count 卷';
  }

  @override
  String bibleChapterCountLabel(int count) {
    return '$count 章';
  }

  @override
  String bibleChapterCountWithName(int count, String bookName) {
    return '$count 章 · $bookName';
  }

  @override
  String bibleChapterReference(String bookName, int chapter) {
    return '$bookName $chapter';
  }

  @override
  String bibleChapterButtonSemanticLabel(String bookName, int chapter) {
    return '$bookName第 $chapter 章';
  }

  @override
  String get categoryLaw => '摩西五经';

  @override
  String get categoryOldTestamentHistory => '历史书';

  @override
  String get categoryWisdom => '诗歌智慧书';

  @override
  String get categoryMajorProphets => '大先知书';

  @override
  String get categoryMinorProphets => '小先知书';

  @override
  String get categoryGospels => '福音书';

  @override
  String get categoryActs => '历史书';

  @override
  String get categoryPaulineLetters => '保罗书信';

  @override
  String get categoryGeneralLetters => '普通书信';

  @override
  String get categoryApocalyptic => '启示文学';

  @override
  String get studyLoadErrorTitle => '圣经目录载入失败';

  @override
  String get studyLoadErrorBody => '请稍后重试，或检查本地圣经种子数据是否已正确打包。';

  @override
  String get readerFallbackTitle => '读经';

  @override
  String get previousChapterTooltip => '上一章';

  @override
  String get nextChapterTooltip => '下一章';

  @override
  String get readerLoadErrorTitle => '章节载入失败';

  @override
  String get readerLoadErrorBody => '请稍后重试，或检查本地圣经数据是否完成导入。';

  @override
  String get emptyChapterBody => '这一章暂时没有可显示的经文。';

  @override
  String get verseActionsTooltip => '笔记与高亮';

  @override
  String get verseActionsTitle => '经文工具';

  @override
  String get bookmarkVerseTitle => '收藏这一节';

  @override
  String get highlightTitle => '高亮';

  @override
  String get highlightNone => '无';

  @override
  String get highlightYellow => '金色';

  @override
  String get highlightGreen => '绿色';

  @override
  String get highlightBlue => '蓝色';

  @override
  String get highlightRose => '玫瑰色';

  @override
  String get noteTitle => '笔记';

  @override
  String get noteHint => '写下私人读经笔记';

  @override
  String get saveNoteAction => '保存笔记';

  @override
  String get verseNotesMyNotesTab => '我的笔记';

  @override
  String get verseNotesChurchNotesTab => '教会心得';

  @override
  String get verseNotesPublishHint => '发布后，其他使用此 App 的人读到这节经文时可以看到。';

  @override
  String get verseNotesDisplayNameHint => '访客显示名';

  @override
  String get verseNotesContentHint => '分享你对这节经文的心得';

  @override
  String get verseNotesPublishAction => '分享';

  @override
  String get verseNotesUpdateAction => '更新';

  @override
  String get verseNotesDeleteAction => '删除';

  @override
  String get verseNotesYourReflectionTitle => '我的心得';

  @override
  String get verseNotesSharedTitle => '公开心得';

  @override
  String verseNotesCountLabel(int count) {
    return '$count 条心得';
  }

  @override
  String get verseNotesMineLabel => '我的';

  @override
  String get verseNotesEmptyState => '这节经文还没有公开心得。';

  @override
  String get verseNotesEmptyError => '请先写下心得。';

  @override
  String get verseNotesGenericError => '经文心得加载失败。';

  @override
  String get studyChapterLabel => '罗马书 8';

  @override
  String get translationLabel => '和合本';

  @override
  String relatedSermonsLabel(int count) {
    return '$count 篇相关讲道';
  }

  @override
  String verseNumberLabel(int verse) {
    return '第 $verse 节';
  }

  @override
  String explanationTitleSuffix(String reference) {
    return '$reference 释义';
  }

  @override
  String get sourceLabel => '依据来源';

  @override
  String get relatedVersesLabel => '相关经文';

  @override
  String get aiStudyDisclaimer => 'AI 解释供学习参考，重要神学或牧养问题请咨询牧者。';

  @override
  String get aiStudySheetTitle => 'AI 查经辅助';

  @override
  String get aiStudyQuestionLabel => '问题';

  @override
  String get aiStudyDefaultQuestion => '请帮助我按上下文理解这节经文。';

  @override
  String get aiStudyGenerateAction => '生成查经辅助';

  @override
  String get aiStudyRetryAction => '重新提问';

  @override
  String get aiStudyResultTitle => '学习回应';

  @override
  String get aiStudySignInTitle => '需要登录';

  @override
  String get aiStudySignInBody => '请先在“我的”页面登录，再使用 AI 查经辅助。';

  @override
  String get aiStudyErrorTitle => 'AI 查经辅助暂不可用';

  @override
  String get aiStudyProviderDisabled => 'AI 服务还没有配置完成，请等教会同工开启后再试。';

  @override
  String get aiStudyProviderFailed => 'AI 服务暂时没有响应，请稍后重试。';

  @override
  String get aiStudyRateLimited => 'AI 请求太频繁了，请稍等后再试。';

  @override
  String get lexiconLoveTitle => '爱 / agape';

  @override
  String get lexiconGoodTitle => '益处 / agathon';

  @override
  String get lexiconLoveBody => '希腊文 ἀγάπη，常用于表达出于神主动、坚定、盟约性的爱。';

  @override
  String get lexiconGoodBody =>
      '希腊文 ἀγαθόν，指良善、有益处的结果。罗马书 8:28 的重点不是环境本身舒服，而是神最终成就的良善目的。';

  @override
  String get confirmKnown => '知道了';

  @override
  String get sermonsTitle => '讲道';

  @override
  String get searchSermonsTooltip => '搜索讲道';

  @override
  String get sermonFilterTooltip => '筛选讲道';

  @override
  String get sermonFilterTitle => '筛选讲道';

  @override
  String get sermonFilterSpeakerLabel => '讲员';

  @override
  String get sermonFilterSeriesLabel => '系列';

  @override
  String get sermonFilterTopicLabel => '主题';

  @override
  String get sermonFilterClearAction => '清除筛选';

  @override
  String get sermonFilterLoadError => '筛选条件暂时无法加载，请稍后重试。';

  @override
  String get sermonDetailTitle => '讲道详情';

  @override
  String get sermonContinueListeningTitle => '继续收听';

  @override
  String get sermonStudyNotesTitle => '讲义';

  @override
  String get sermonSummaryTitle => '讲道重点';

  @override
  String get sermonOpenDetailAction => '查看讲道详情';

  @override
  String get sermonOutlineTitle => '沉浸式讲义';

  @override
  String get sermonReferencesTitle => '讲道引用经文';

  @override
  String get sermonTranscriptTitle => '讲道文本';

  @override
  String get sermonSectionNotesLabel => '讲义';

  @override
  String get sermonSectionReferencesLabel => '经文';

  @override
  String get sermonSectionTranscriptLabel => '文稿';

  @override
  String get sermonPlaybackSpeedTitle => '播放速度';

  @override
  String get sermonTranscriptReadAction => '阅读文本';

  @override
  String get sermonTranscriptCollapseAction => '收起';

  @override
  String get sermonAiAskAction => '询问这篇讲道';

  @override
  String get sermonDiscussionTitle => '讲道讨论包';

  @override
  String get sermonDiscussionPrivateLabel => '私密回应';

  @override
  String get sermonDiscussionQuestionsTitle => '讨论问题';

  @override
  String get sermonDiscussionActionStepsTitle => '行动回应';

  @override
  String get sermonDiscussionPrayerTitle => '祷告方向';

  @override
  String get sermonDiscussionRespondAction => '写回应';

  @override
  String get sermonDiscussionResponseTitle => '个人回应';

  @override
  String get sermonDiscussionResponseHint => '写下你的心得或下一步行动';

  @override
  String get sermonDiscussionResponsePrivateNote => '你的回应默认只对自己可见。';

  @override
  String get sermonDiscussionSubmitAction => '提交';

  @override
  String get sermonDiscussionSubmitted => '回应已保存。';

  @override
  String get sermonDiscussionError => '回应保存失败，请再试一次。';

  @override
  String get sermonDiscussionLoadError => '讨论材料加载失败。';

  @override
  String get sermonDiscussionObservationChip => '观察';

  @override
  String get sermonDiscussionInterpretationChip => '解释';

  @override
  String get sermonDiscussionApplicationChip => '应用';

  @override
  String get sermonDiscussionPrayerChip => '祷告';

  @override
  String get sermonDiscussionActionChip => '行动';

  @override
  String get sermonAiSheetTitle => '讲道问答';

  @override
  String get sermonAiDefaultQuestion => '请帮助我理解这篇讲道的重点。';

  @override
  String get sermonAiGenerateAction => '生成讲道回答';

  @override
  String get relatedSermonsTitle => '相关讲道';

  @override
  String get sermonLoadErrorTitle => '讲道数据暂时无法加载';

  @override
  String get sermonLoadErrorBody => '稍后会从后端重新获取讲道列表。';

  @override
  String get retryAction => '重试';

  @override
  String get sermonEmptyTitle => '暂无讲道内容';

  @override
  String get sermonAudioMissing => '暂未上传音频';

  @override
  String get sermonAudioPreparing => '正在准备音频';

  @override
  String get sermonAudioLoading => '正在加载音频';

  @override
  String get sermonAudioReady => '可以播放';

  @override
  String get sermonAudioUnavailable => '音频暂时无法加载';

  @override
  String get rewindTooltip => '后退 15 秒';

  @override
  String get playTooltip => '播放';

  @override
  String get forwardTooltip => '前进 30 秒';

  @override
  String get lifeTitle => '教会生活';

  @override
  String get notificationsTooltip => '通知';

  @override
  String get notificationsPageTitle => '通知';

  @override
  String get notificationInboxTitle => '最近通知';

  @override
  String unreadCountSemanticLabel(String label, int count) {
    return '$label，$count 条未读';
  }

  @override
  String get notificationInboxEmptyTitle => '暂无通知';

  @override
  String get notificationInboxEmptyBody => '这台设备收到新的教会更新后会显示在这里。';

  @override
  String get notificationRefreshAction => '刷新通知';

  @override
  String get notificationMarkAllReadAction => '全部标为已读';

  @override
  String get notificationClearAction => '清空通知';

  @override
  String get notificationDeviceUnavailableBody =>
      '当前构建还没有接入 Firebase 应用配置，暂时无法启用推送。';

  @override
  String get weeklyBulletinTitle => '本周周报';

  @override
  String get lifeSundayHeroEmptyBody => '同工发布本周主日信息后，会显示在这里。';

  @override
  String get lifeTabWeek => '本周';

  @override
  String get lifeTabEvents => '活动';

  @override
  String get lifeTabGroups => '小组';

  @override
  String get lifeTabCourses => '课程';

  @override
  String get lifeTabServing => '服事';

  @override
  String get lifeTabPrayer => '代祷';

  @override
  String get lifeTabWeekEmpty => '新的教会生活卡片发布后会显示在这里。';

  @override
  String get lifeTabEventsEmpty => '当前暂无开放的活动卡片。';

  @override
  String get lifeTabMemberSignInBody => '请到“我的”登录后查看会友专属的小组、课程、服事和关怀卡片。';

  @override
  String get lifeTabPrayerDisabled => '当前构建暂未启用代祷请求。';

  @override
  String get lifeOpenDetailAction => '查看详情';

  @override
  String get lifeUpdatesTitle => '最新动态';

  @override
  String get lifeParticipationTitle => '我的参与';

  @override
  String get lifeLoadErrorTitle => '教会生活数据暂时无法加载';

  @override
  String get lifeLoadErrorBody => '稍后会从后端重新获取周报和生活信息。';

  @override
  String get lifeSectionLoadError => '此区域暂时无法加载，请重试。';

  @override
  String get lifeEmptyTitle => '暂无教会生活内容';

  @override
  String get lifePostNoBody => '详细内容会稍后补充。';

  @override
  String get lifePostVisibilityMembers => '会众可见';

  @override
  String get lifePostVisibilityGroup => '小组可见';

  @override
  String get lifePostVisibilityPrivate => '私密';

  @override
  String get lifePostTypeWeeklyBulletin => '周报';

  @override
  String get lifePostTypeSunday => '主日';

  @override
  String get lifePostTypeAnnouncement => '公告';

  @override
  String get lifePostTypeEvent => '活动';

  @override
  String get lifePostTypeGroup => '小组';

  @override
  String get lifePostTypeFellowship => '团契';

  @override
  String get lifePostTypeCourse => '课程';

  @override
  String get lifePostTypeServing => '服事';

  @override
  String get lifePostTypePrayer => '代祷';

  @override
  String get lifePostTypeGiving => '奉献';

  @override
  String get lifePostUnread => '未读';

  @override
  String get lifePostActionOpen => '打开链接';

  @override
  String get lifePostScheduleTbd => '时间待定';

  @override
  String get myEventRegistrationsTitle => '我的报名';

  @override
  String get groupsTitle => '小组与团契';

  @override
  String get groupsEmptyBody => '目前暂无可加入的小组或团契。';

  @override
  String get groupApplyAction => '申请加入';

  @override
  String get groupAlreadyMember => '你已在小组中';

  @override
  String get groupApplicationSubmitted => '申请已提交';

  @override
  String get groupApplicationSubmitSuccess => '申请已提交。';

  @override
  String get groupWithdrawAction => '撤回申请';

  @override
  String get groupApplicationWithdrawSuccess => '申请已撤回。';

  @override
  String get groupCapacityFull => '小组已满员';

  @override
  String get groupMyGroupsTitle => '我的小组';

  @override
  String get groupMyGroupsEmptyBody => '你目前还没有加入小组。';

  @override
  String get groupSignInToViewMineBody => '登录后可在不同设备查看你的小组。';

  @override
  String groupMemberCount(int count) {
    return '$count 位成员';
  }

  @override
  String groupMemberCapacity(int count, int capacity) {
    return '$count/$capacity 位成员';
  }

  @override
  String get coursesTitle => '课程与学习';

  @override
  String get coursesEmptyBody => '目前暂无开放的课程。';

  @override
  String get courseMyCoursesTitle => '我的课程';

  @override
  String get courseMyCoursesEmptyBody => '你目前还没有课程报名记录。';

  @override
  String get courseLessonsTitle => '课程课次';

  @override
  String get courseLessonsEmptyBody => '这门课程尚未发布课次。';

  @override
  String get courseSignInToEnrollBody => '登录后可报名课程，并在不同设备同步学习进度。';

  @override
  String get courseSignInToViewMineBody => '登录后可查看正在学习和已经完成的课程。';

  @override
  String get courseEnrollAction => '报名课程';

  @override
  String get courseSubmittedAction => '已提交';

  @override
  String get courseEnrolledAction => '已报名';

  @override
  String get courseWaitlistedAction => '候补中';

  @override
  String get courseCancelledAction => '已取消';

  @override
  String get courseCompletedAction => '已完成';

  @override
  String get courseEnrollmentSubmitSuccess => '课程报名已提交。';

  @override
  String get courseStatusDraft => '草稿';

  @override
  String get courseStatusOpen => '开放报名';

  @override
  String get courseStatusClosed => '已关闭';

  @override
  String get courseStatusInProgress => '进行中';

  @override
  String get courseStatusCompleted => '已完成';

  @override
  String get courseStatusArchived => '已归档';

  @override
  String courseLessonCount(int count) {
    return '$count 个课次';
  }

  @override
  String get courseCapacityOpen => '名额开放';

  @override
  String courseCapacityLabel(int count, int capacity) {
    return '$count/$capacity 个名额';
  }

  @override
  String courseProgressLabel(int completed, int total) {
    return '已完成 $completed/$total 个课次';
  }

  @override
  String get servingTitle => '我的服事';

  @override
  String get servingEmptyBody => '目前暂无服事安排。';

  @override
  String get servingConfirmAction => '确认服事';

  @override
  String get servingLeaveAction => '请假';

  @override
  String get servingConfirmSuccess => '服事已确认。';

  @override
  String get servingLeaveSuccess => '请假请求已提交。';

  @override
  String get servingStatusScheduled => '待确认';

  @override
  String get servingStatusConfirmed => '已确认';

  @override
  String get servingStatusDeclined => '已请假';

  @override
  String get servingStatusSwapRequested => '申请换班';

  @override
  String get servingStatusCovered => '已有替补';

  @override
  String get servingStatusCancelled => '已取消';

  @override
  String get servingScheduleTab => '排班';

  @override
  String get servingAvailabilityTab => '可用时间';

  @override
  String get servingAvailabilityEmptyBody => '尚未提交可用时间。';

  @override
  String get servingAvailabilityAddAction => '添加可用时间';

  @override
  String get servingAvailabilitySheetTitle => '新的可用时间';

  @override
  String get servingAvailabilityStatusLabel => '可用状态';

  @override
  String get servingAvailabilityStatusAvailable => '可以服事';

  @override
  String get servingAvailabilityStatusUnavailable => '无法服事';

  @override
  String get servingAvailabilityStatusPreferred => '优先时段';

  @override
  String get servingAvailabilityStartLabel => '开始时间';

  @override
  String get servingAvailabilityEndLabel => '结束时间';

  @override
  String get servingAvailabilityNoteHint => '补充说明（可选）';

  @override
  String get servingAvailabilitySaveAction => '保存可用时间';

  @override
  String get servingAvailabilityCreateSuccess => '可用时间已保存。';

  @override
  String get servingAvailabilityInvalidRange => '结束时间必须晚于开始时间。';

  @override
  String get servingCheckInTitle => '到岗状态';

  @override
  String get servingCheckInAction => '确认到岗';

  @override
  String get servingCheckInSuccess => '到岗已确认。';

  @override
  String get servingCheckInNotRecorded => '尚未确认到岗。';

  @override
  String get servingCheckInStatusPending => '待到岗';

  @override
  String get servingCheckInStatusCheckedIn => '已到岗';

  @override
  String get servingCheckInStatusMissed => '未到岗';

  @override
  String get servingAssignmentNoteTitle => '服事说明';

  @override
  String get servingResponseNoteTitle => '我的回复';

  @override
  String get eventRegistrationTitle => '活动报名';

  @override
  String get eventRegistrationRegisterAction => '报名';

  @override
  String get eventRegistrationUpdateAction => '保存修改';

  @override
  String get eventRegistrationCancelAction => '取消报名';

  @override
  String get eventRegistrationCheckInAction => '签到';

  @override
  String get eventCheckInScanAction => '扫描现场码';

  @override
  String get eventCheckInScanTitle => '现场签到';

  @override
  String get eventCheckInScanPrompt => '请扫描同工打印的活动签到二维码。';

  @override
  String get eventCheckInScanSuccessTitle => '签到成功';

  @override
  String get eventCheckInScanViewEvent => '查看活动';

  @override
  String get eventCheckInScanAgain => '继续扫描';

  @override
  String get eventCheckInScanSignInRequired => '请先登录，再扫描现场签到二维码。';

  @override
  String get eventCheckInQrInvalid => '这个签到二维码无效，请重新扫描。';

  @override
  String get eventCheckInQrExpired => '这个签到二维码已过期，请联系同工。';

  @override
  String get eventCheckInQrDisabled => '这个签到二维码已停用，请联系同工。';

  @override
  String get eventCheckInQrRegistrationRequired => '没有找到你的活动报名，请先报名或联系同工。';

  @override
  String get eventRegistrationRegistered => '你已报名';

  @override
  String get eventRegistrationCheckedIn => '你已签到';

  @override
  String get eventRegistrationSignInBody => '登录后即可报名参加这个活动。';

  @override
  String get eventRegistrationFull => '报名名额已满。';

  @override
  String get eventRegistrationClosed => '报名已截止。';

  @override
  String get eventRegistrationUnavailable => '这个活动目前不可报名或不可查看。';

  @override
  String get eventRegistrationNotFound => '没有找到你的报名记录，请刷新后再试。';

  @override
  String get eventRegistrationPartySizeInvalid => '请选择更少的参加人数。';

  @override
  String get eventRegistrationCheckInLocked => '已签到的报名只能由同工修改。';

  @override
  String get eventRegistrationSuccess => '报名成功。';

  @override
  String get eventRegistrationUpdateSuccess => '报名信息已更新。';

  @override
  String get eventRegistrationCancelSuccess => '已取消报名。';

  @override
  String get eventRegistrationCheckInSuccess => '签到成功。';

  @override
  String eventRegistrationCheckedInAt(String time) {
    return '签到时间：$time';
  }

  @override
  String get eventRegistrationPartySizeLabel => '参加人数';

  @override
  String eventRegistrationPartySize(int count) {
    return '$count 人';
  }

  @override
  String get eventRegistrationNoteLabel => '备注';

  @override
  String get eventRegistrationNoteHint => '餐食需要、到达说明，或可协助事项';

  @override
  String eventRegistrationSpots(int registered, int capacity) {
    return '已报名 $registered/$capacity';
  }

  @override
  String eventRegistrationUnlimitedSpots(int registered) {
    return '已报名 $registered';
  }

  @override
  String eventRegistrationRemaining(int remaining) {
    return '剩余 $remaining 个名额';
  }

  @override
  String get givingGuestBody => '登录后可查看自己的奉献记录和年度证明。';

  @override
  String get givingHistoryTitle => '奉献记录';

  @override
  String get givingTransactionsTitle => '最近交易';

  @override
  String get givingTransactionsEmptyBody => '暂时还没有奉献记录。';

  @override
  String givingSummaryYear(int year) {
    return '$year 年';
  }

  @override
  String givingSummaryAmount(String amount) {
    return '总额 $amount';
  }

  @override
  String givingSummaryCount(int count) {
    return '$count 笔奉献';
  }

  @override
  String get givingStatementSectionTitle => '年度证明';

  @override
  String get annualStatementsTitle => '年度证明';

  @override
  String get annualStatementsEmptyBody => '暂时还没有年度证明。';

  @override
  String givingStatementLabel(int year) {
    return '$year 年证明';
  }

  @override
  String get prayerTitle => '代祷';

  @override
  String get prayerEmptyBody => '暂无公开代祷事项。';

  @override
  String get prayerSubmitTitle => '提交代祷事项';

  @override
  String get prayerSubmitAction => '提交';

  @override
  String get prayerGuestSubmitBody => '可以访客身份提交。私密事项只给牧者和后台同工查看。';

  @override
  String get prayerMemberSubmitBody => '这条代祷会关联到你的会员资料，之后可以查看处理状态。';

  @override
  String get prayerTitleLabel => '标题';

  @override
  String get prayerBodyLabel => '代祷内容';

  @override
  String get prayerNameLabel => '姓名';

  @override
  String get prayerValidationError => '请填写标题和代祷内容。';

  @override
  String get prayerSubmittedMessage => '代祷事项已提交，等待审核。';

  @override
  String get prayerMineLabel => '我的';

  @override
  String get prayerVisibilityPrivate => '私密';

  @override
  String get prayerVisibilityPublic => '公开';

  @override
  String get prayerVisibilityMembers => '会众';

  @override
  String get prayerVisibilityGroup => '小组';

  @override
  String get prayerStatusPending => '待审核';

  @override
  String get prayerStatusApproved => '已通过';

  @override
  String get prayerStatusHidden => '已隐藏';

  @override
  String get prayerStatusArchived => '已归档';

  @override
  String get careTitle => '关怀';

  @override
  String get careEmptyBody => '暂时还没有关怀请求。';

  @override
  String get careSubmitTitle => '请求牧养关怀';

  @override
  String get careSubmitAction => '请求关怀';

  @override
  String get careSubmitBody => '请简要说明你希望牧者或关怀同工如何跟进。内部跟进备注只给授权同工查看。';

  @override
  String get careSignInRequired => '请先以会友身份登录后再提交关怀请求。';

  @override
  String get careTitleLabel => '标题';

  @override
  String get careBodyLabel => '你希望我们如何关怀你？';

  @override
  String get carePrivacyLabel => '隐私范围';

  @override
  String get carePrivacyPastoralOnly => '仅牧者团队';

  @override
  String get carePrivacyAssignedTeam => '指定关怀团队';

  @override
  String get carePrivacyAdminRestricted => '仅受限管理员';

  @override
  String get careValidationError => '请填写标题和关怀内容。';

  @override
  String get careSubmittedMessage => '关怀请求已提交。';

  @override
  String get careStatusSubmitted => '已提交';

  @override
  String get careStatusAssigned => '已分配';

  @override
  String get careStatusInProgress => '跟进中';

  @override
  String get careStatusResolved => '已解决';

  @override
  String get careStatusArchived => '已归档';

  @override
  String careNextFollowUp(String date) {
    return '下次跟进 $date';
  }

  @override
  String get givingTitle => '奉献';

  @override
  String get givingCardTitle => '奉献与年度证明';

  @override
  String get givingCardBody => '通过 Stripe 安全奉献，完成后可在这里查看已确认的奉献记录和年度证明。';

  @override
  String get givingCheckoutTitle => '现在奉献';

  @override
  String get givingCheckoutBody => '付款由 Stripe 处理，App 不保存银行卡或银行账户信息。';

  @override
  String get givingAmountLabel => '金额';

  @override
  String get givingFundLabel => '奉献项目';

  @override
  String get givingFundsLoading => '正在加载奉献项目...';

  @override
  String get givingFundsEmpty => '当前没有可用的奉献项目。';

  @override
  String get givingCategoryOffering => '奉献';

  @override
  String get givingCategoryMissions => '宣教';

  @override
  String get givingCheckoutAction => '前往 Stripe';

  @override
  String get givingAmountError =>
      '请输入 USD 1.00 至 USD 100,000.00 之间的金额，最多保留两位小数。';

  @override
  String get givingCheckoutOpenError => '无法打开 Stripe 付款页面。';

  @override
  String get givingCheckoutReturnSuccess => 'Stripe 付款流程已完成。确认入账后会显示在奉献记录中。';

  @override
  String get givingCheckoutReturnCancel => 'Stripe 付款已取消。';

  @override
  String get annualStatementTooltip => '年度证明';

  @override
  String get annualStatementPreviewAction => '预览 CSV';

  @override
  String get annualStatementCopyCsvAction => '复制 CSV';

  @override
  String get annualStatementCopiedMessage => '证明 CSV 已复制。';

  @override
  String get annualStatementSavePdfAction => '保存 PDF';

  @override
  String get annualStatementSharePdfAction => '分享 PDF';

  @override
  String get annualStatementSharePdfText => '年度奉献证明';

  @override
  String get annualStatementPdfSharedMessage => '年度证明 PDF 已分享。';

  @override
  String get annualStatementPdfOpenedMessage => '年度证明 PDF 已保存并打开。';

  @override
  String annualStatementPdfSavedMessage(String path) {
    return '年度证明 PDF 已保存到 $path。';
  }

  @override
  String get copyPathAction => '复制路径';

  @override
  String get annualStatementExportTitle => '证明导出';

  @override
  String get annualStatementStatusPendingLabel => '处理中';

  @override
  String get annualStatementStatusReadyLabel => '可用';

  @override
  String get annualStatementStatusSentLabel => '已发送';

  @override
  String get annualStatementStatusFailedLabel => '失败';

  @override
  String get givingStatusPendingLabel => '处理中';

  @override
  String get givingStatusSucceededLabel => '成功';

  @override
  String get givingStatusFailedLabel => '失败';

  @override
  String get givingStatusRefundedLabel => '已退款';

  @override
  String get bibleTtsReadyTitle => '朗读圣经';

  @override
  String bibleTtsCurrentVerse(int verse) {
    return '正在朗读第 $verse 节';
  }

  @override
  String bibleTtsPausedVerse(int verse) {
    return '已暂停在第 $verse 节，继续会重读本节。';
  }

  @override
  String bibleTtsRateLabel(double rate) {
    final intl.NumberFormat rateNumberFormat = intl.NumberFormat.compact(
      locale: localeName,
    );
    final String rateString = rateNumberFormat.format(rate);

    return '${rateString}x';
  }

  @override
  String get bibleTtsPlayTooltip => '朗读';

  @override
  String get bibleTtsPauseTooltip => '暂停朗读';

  @override
  String get bibleTtsStopTooltip => '停止朗读';

  @override
  String get bibleTtsPreviousVerseTooltip => '上一节';

  @override
  String get bibleTtsNextVerseTooltip => '下一节';

  @override
  String get bibleTtsErrorTextMissing => '这段经文没有可朗读的文字。';

  @override
  String get bibleTtsErrorEngineUnavailable => '此设备暂时无法使用文字朗读。请检查系统语音设置后重试。';

  @override
  String get bibleTtsErrorLanguageUnavailable => '系统尚未安装这个圣经语言的语音。';

  @override
  String get bibleTtsErrorInterrupted => '朗读已中断。点击播放可从当前经节继续。';

  @override
  String get bibleTtsErrorStartFailed => '无法开始朗读。请检查设备语音设置后重试。';

  @override
  String get newcomerCardTitle => '第一次来吗？';

  @override
  String get newcomerCardBody => '我们很愿意欢迎你、回答问题，并帮助你认识教会生活。';

  @override
  String get newcomerCardAction => '我是新朋友';

  @override
  String get newcomerSheetTitle => '欢迎来到 MBCG';

  @override
  String get newcomerSheetGuestBody => '留下简单资料，教会同工会与你联系。';

  @override
  String get newcomerSheetMemberBody => '你也可以介绍自己，或请同工与你联系。';

  @override
  String get newcomerNameLabel => '姓名';

  @override
  String get newcomerEmailLabel => '邮箱';

  @override
  String get newcomerPhoneLabel => '电话';

  @override
  String get newcomerInterestLabel => '你想了解什么？';

  @override
  String get newcomerSubmitAction => '发送给教会同工';

  @override
  String get newcomerNameValidationError => '请输入姓名。';

  @override
  String get newcomerContactValidationError => '请至少留下邮箱或电话。';

  @override
  String get newcomerEmailValidationError => '请输入有效的邮箱地址。';

  @override
  String get newcomerSubmittedMessage => '谢谢，我们已经收到你的资料。';

  @override
  String get mineDiscipleshipTitle => '我的门徒成长路径';

  @override
  String get mineDiscipleshipBody => '查看教会同工为你安排的下一步成长操练。';

  @override
  String get mineDiscipleshipEmpty => '当前还没有分配成长路径。';

  @override
  String get mineDiscipleshipLoadError => '无法加载你的成长路径。';

  @override
  String mineDiscipleshipProgressChip(int completed, int total) {
    return '$completed/$total 个任务';
  }

  @override
  String get discipleshipStatusNotStarted => '未开始';

  @override
  String get discipleshipStatusInProgress => '进行中';

  @override
  String get discipleshipStatusBlocked => '受阻';

  @override
  String get discipleshipStatusCompleted => '已完成';

  @override
  String get discipleshipStatusPaused => '已暂停';

  @override
  String get discipleshipStatusCancelled => '已取消';
}

/// The translations for Chinese, using the Han script (`zh_Hant`).
class AppLocalizationsZhHant extends AppLocalizationsZh {
  AppLocalizationsZhHant() : super('zh_Hant');

  @override
  String get appTitle => 'MBCG';

  @override
  String get commonStatusUnknownLabel => '未知狀態';

  @override
  String get commonVisibilityUnknownLabel => '未知可見性';

  @override
  String get commonPrivacyUnknownLabel => '未知隱私範圍';

  @override
  String get tabStudy => '讀經';

  @override
  String get tabSermons => '講道';

  @override
  String get tabLife => '生活';

  @override
  String get tabMine => '我的';

  @override
  String get mineTitle => '我的';

  @override
  String get memberOptionalSignInTitle => '可選登入';

  @override
  String get memberOptionalSignInBody => '你可以繼續以訪客使用；登入後可在後續同步讀經、禱告和奉獻記錄。';

  @override
  String get memberEmailLabel => '電郵';

  @override
  String get memberInvalidEmail => '請輸入有效的電子郵件地址。';

  @override
  String get memberShowPasswordTooltip => '顯示密碼';

  @override
  String get memberHidePasswordTooltip => '隱藏密碼';

  @override
  String get memberNameLabel => '姓名';

  @override
  String get memberPasswordLabel => '密碼';

  @override
  String get memberConfirmPasswordLabel => '確認密碼';

  @override
  String get memberCodeLabel => '驗證碼';

  @override
  String get memberVerifyEmailAction => '驗證電郵';

  @override
  String get memberSignInAction => '登入';

  @override
  String get memberContinueWithGoogle => '使用 Google 繼續';

  @override
  String get memberContinueWithApple => '使用 Apple 繼續';

  @override
  String get memberAuthAlternative => '或';

  @override
  String get memberFederatedSetupUnavailable => 'Google 與 Apple 登入尚未完成設定。';

  @override
  String get memberFederatedSignInFailed => '登入未能完成，請重試。';

  @override
  String get memberLoginEmailTitle => '歡迎回來';

  @override
  String get memberLoginEmailBody => '登入後繼續參與教會生活。';

  @override
  String get memberNextAction => '下一步';

  @override
  String get memberCreateAccountAction => '建立帳號';

  @override
  String get memberPasswordTitle => '輸入密碼';

  @override
  String get memberForgotPasswordAction => '忘記密碼？';

  @override
  String get memberPasswordResetTitle => '重設密碼';

  @override
  String get memberPasswordResetRequestBody => '若此電子郵件可重設密碼，我們會寄送驗證碼。';

  @override
  String get memberPasswordResetCodeBody => '請輸入電子郵件中的驗證碼，然後設定新密碼。';

  @override
  String get memberPasswordResetAction => '重設密碼';

  @override
  String get memberPasswordResetComplete => '密碼已更新，請使用新密碼登入。';

  @override
  String get memberBackToSignInAction => '返回登入';

  @override
  String get memberRegisterAction => '註冊';

  @override
  String get memberChangeEmailAction => '更換電郵';

  @override
  String get memberPasswordMismatch => '兩次輸入的密碼不一致。';

  @override
  String get memberSignOutAction => '登出';

  @override
  String get memberRegistrationClosed => '會員註冊暫時關閉，請聯絡教會辦公室。';

  @override
  String get memberRegistrationPendingApproval => '註冊已收到，請等待教會審核。';

  @override
  String get memberProfileTitle => '我的資料';

  @override
  String get memberProfileEditTitle => '資料詳情';

  @override
  String get memberProfileSaveAction => '儲存資料';

  @override
  String get memberProfileSaved => '資料已儲存。';

  @override
  String get memberProfileOpenAction => '編輯資料';

  @override
  String get memberStatusLabel => '狀態';

  @override
  String get memberRoleLabel => '身份';

  @override
  String get memberGroupLabel => '小組';

  @override
  String get memberNoGroupLabel => '未加入小組';

  @override
  String get memberPhoneLabel => '電話';

  @override
  String get memberAddressLabel => '地址';

  @override
  String get memberFaithStartYearLabel => '信主年份';

  @override
  String get memberBaptizedYearLabel => '受洗年份';

  @override
  String get memberJoinedChurchAtLabel => '加入教會日期';

  @override
  String get memberEmergencyContactNameLabel => '緊急聯絡人';

  @override
  String get memberEmergencyContactPhoneLabel => '緊急聯絡人電話';

  @override
  String get mineGivingEntryTitle => '奉獻與年度證明';

  @override
  String get mineGivingEntryBody => '查看奉獻記錄、已確認資料和年度證明 PDF。';

  @override
  String get mineLifeOverviewTitle => '我的教會生活';

  @override
  String get mineLifeOverviewBody => '快速查看你的小組、課程、服事和關懷請求狀態。';

  @override
  String get mineLifeGroupsLabel => '小組';

  @override
  String get mineLifeCoursesLabel => '課程';

  @override
  String mineLifeCoursesCountLabel(int count) {
    return '$count 門課程';
  }

  @override
  String get mineLifeServingLabel => '服事';

  @override
  String mineLifeServingCountLabel(int count) {
    return '$count 項服事';
  }

  @override
  String get mineLifeCareLabel => '關懷';

  @override
  String mineLifeOverviewMetricSemanticLabel(String label, int count) {
    return '$label：$count';
  }

  @override
  String get mineLifeOpenLifeAction => '打開生活';

  @override
  String get preferencesTitle => '偏好';

  @override
  String get appearanceTitle => '外觀';

  @override
  String get themeModeSystem => '跟隨系統';

  @override
  String get themeModeLight => '淺色';

  @override
  String get themeModeDark => '深色';

  @override
  String get textSizeTitle => '字體大小';

  @override
  String get textSizeBody => '讓讀經、敬拜和教會生活內容更容易閱讀。';

  @override
  String get textSizeSystem => '跟隨系統';

  @override
  String get textSizeStandard => '標準';

  @override
  String get textSizeLarge => '大';

  @override
  String get textSizeExtraLarge => '特大';

  @override
  String get notificationPermissionTitle => '通知權限';

  @override
  String get notificationPermissionEnabledBody => '系統已允許通知。需要關閉時，請透過開關進入系統設定。';

  @override
  String get notificationPermissionDisabledBody => '系統通知權限未開啟。打開開關後會請求系統權限。';

  @override
  String get aboutTitle => '關於';

  @override
  String get aboutChurchTitle => '關於教會';

  @override
  String get churchAddressTitle => '地址 / 地圖';

  @override
  String get churchPhoneTitle => '聯絡電話';

  @override
  String get churchEmailTitle => '聯絡電郵';

  @override
  String get privacyPolicyTitle => '隱私政策';

  @override
  String get termsOfUseTitle => '使用條款';

  @override
  String get appVersionTitle => 'App 版本';

  @override
  String appVersionValue(String version) {
    return '版本 $version';
  }

  @override
  String get periodPickerTooltip => '選擇日期範圍';

  @override
  String get periodThisWeek => '本週';

  @override
  String get periodThisMonth => '本月';

  @override
  String get periodPreviousAction => '上一段';

  @override
  String get periodNextAction => '下一段';

  @override
  String get periodApplyAction => '套用';

  @override
  String get languageTitle => '語言';

  @override
  String get systemLanguageLabel => '系統語言';

  @override
  String get languageSystemBody => 'App 預設跟隨系統語言。需要切換語言時，請在系統原生設定中修改此 App 的語言。';

  @override
  String get openSystemSettingsAction => '打開系統設定';

  @override
  String get bibleTranslationLabel => '聖經版本';

  @override
  String get studyTitle => '讀經';

  @override
  String get bibleSearchTooltip => '搜尋經文';

  @override
  String get bibleSearchTitle => '搜尋經文';

  @override
  String get bibleSearchHint => '輸入一句經文或關鍵詞';

  @override
  String get bibleSearchStartTitle => '搜尋整本聖經';

  @override
  String get bibleSearchStartBody =>
      '可以輸入一句話、半句經文或幾個關鍵詞。搜尋會使用目前 App 語言對應的聖經版本。';

  @override
  String get bibleSearchNoResultsTitle => '沒有找到匹配經文';

  @override
  String get bibleSearchNoResultsBody =>
      '可以減少關鍵詞，或換一種說法。搜尋會嘗試寬鬆匹配，但太短的詞可能會被忽略。';

  @override
  String get bibleSearchErrorTitle => '搜尋失敗';

  @override
  String get versePickerTooltip => '選擇經節';

  @override
  String get versePickerTitle => '選擇經節';

  @override
  String get readerSettingsTooltip => '閱讀設定';

  @override
  String get readerSettingsTitle => '閱讀設定';

  @override
  String get readerAssistsTitle => '閱讀輔助';

  @override
  String get chapterPeopleAssistTitle => '本章人物';

  @override
  String get chapterPeopleAssistBody => '在目前章節統一顯示本章出現的聖經人物入口，不在每節反覆標註。';

  @override
  String get chapterPlacesAssistTitle => '本章地名';

  @override
  String get chapterPlacesAssistBody => '在目前章節統一顯示本章出現的聖經地名入口，不在每節反覆標註。';

  @override
  String get lexiconAssistTitle => '原文詞彙';

  @override
  String get lexiconAssistBody => '經文有本地原文資料時，顯示詞彙解釋入口。';

  @override
  String get aiStudyHintsAssistTitle => 'AI 解經提示';

  @override
  String get aiStudyHintsAssistBody => '啟用長按經文釋義和相關學習提示。';

  @override
  String get chapterPeopleTooltip => '本章人物';

  @override
  String get chapterPeopleTitle => '本章人物';

  @override
  String get chapterPlacesTooltip => '本章地名';

  @override
  String get chapterPlacesTitle => '本章地名';

  @override
  String get continueReadingTitle => '繼續閱讀';

  @override
  String get continueReadingAction => '繼續';

  @override
  String get defaultContinueReadingTitle => '羅馬書 8';

  @override
  String get defaultContinueReadingSubtitle => '從羅馬書 8 繼續';

  @override
  String continueReadingChapterSubtitle(String bookName, int chapter) {
    return '從 $bookName $chapter 繼續';
  }

  @override
  String continueReadingVerseSubtitle(
    int chapter,
    String verse,
    String bookName,
  ) {
    return '上次讀到 $chapter:$verse · $bookName';
  }

  @override
  String get readingPlansTitle => '我的讀經計畫';

  @override
  String get readingPlansBody => '繼續目前的計畫，使用本地經文閱讀或朗讀。';

  @override
  String get readingPlanStartAction => '開始';

  @override
  String get readingPlanContinueAction => '繼續';

  @override
  String get readingPlanReadAction => '閱讀';

  @override
  String get readingPlanCompleteDayAction => '標記完成';

  @override
  String get readingPlanCompletedLabel => '已完成';

  @override
  String get readingPlanNoDaysBody => '這個計畫還沒有每日經文引用。';

  @override
  String get readingPlanLoadErrorTitle => '讀經計畫載入失敗';

  @override
  String get readingPlanLoadErrorBody => '請重新整理後再試一次。';

  @override
  String get readingPlanActionError => '讀經計畫更新失敗，請再試一次。';

  @override
  String readingPlanDaysLabel(int count) {
    return '$count 天';
  }

  @override
  String readingPlanDayLabel(int dayNumber) {
    return '第 $dayNumber 天';
  }

  @override
  String readingPlanProgressLabel(int completed, int total) {
    return '已完成 $completed/$total';
  }

  @override
  String get mineReadingPlansTitle => '我的讀經計畫';

  @override
  String get mineReadingPlansBody => '查看我的讀經計畫和完成進度。';

  @override
  String get mineReadingPlansEmpty => '從讀經頁面開始一個計畫後，進度會顯示在這裡。';

  @override
  String get mineReadingPlansOpenStudyAction => '打開讀經';

  @override
  String get readingPlanCurrentTab => '進行中';

  @override
  String get readingPlanHistoryTab => '歷史';

  @override
  String get readingPlanCurrentEmpty => '目前沒有進行中的讀經計畫。';

  @override
  String get readingPlanHistoryEmpty => '已完成或已結束的計畫會顯示在這裡。';

  @override
  String get readingPlanViewAllAction => '查看計畫';

  @override
  String get readingPlanRestartAction => '重新開始';

  @override
  String get readingPlanLoadMoreAction => '載入更多';

  @override
  String get readingPlanPauseAction => '暫停';

  @override
  String get readingPlanResumeAction => '繼續';

  @override
  String get readingPlanAbandonAction => '結束計畫';

  @override
  String get readingPlanAbandonConfirmBody => '結束本次計畫並移入歷史嗎？已儲存的進度仍會保留。';

  @override
  String get readingPlanNotStartedLabel => '未開始';

  @override
  String get readingPlanActiveLabel => '進行中';

  @override
  String get readingPlanPausedLabel => '已暫停';

  @override
  String get readingPlanAbandonedLabel => '已結束';

  @override
  String readingPlanAttemptLabel(int attempt) {
    return '第 $attempt 次';
  }

  @override
  String readingPlanStartedOn(String date) {
    return '開始於 $date';
  }

  @override
  String readingPlanEndedOn(String date) {
    return '結束於 $date';
  }

  @override
  String get readingPlanHistoryDetailTitle => '計畫詳情';

  @override
  String get readingPlanNoteLabel => '筆記';

  @override
  String get readingPlanRestartedMessage => '新的讀經計畫已開始。';

  @override
  String mineReadingPlanProgressChip(int completed) {
    return '已完成 $completed';
  }

  @override
  String get oldTestamentLabel => '舊約';

  @override
  String get newTestamentLabel => '新約';

  @override
  String bibleBookCountLabel(int count) {
    return '$count 卷';
  }

  @override
  String bibleChapterCountLabel(int count) {
    return '$count 章';
  }

  @override
  String bibleChapterCountWithName(int count, String bookName) {
    return '$count 章 · $bookName';
  }

  @override
  String bibleChapterReference(String bookName, int chapter) {
    return '$bookName $chapter';
  }

  @override
  String bibleChapterButtonSemanticLabel(String bookName, int chapter) {
    return '$bookName第 $chapter 章';
  }

  @override
  String get categoryLaw => '摩西五經';

  @override
  String get categoryOldTestamentHistory => '歷史書';

  @override
  String get categoryWisdom => '詩歌智慧書';

  @override
  String get categoryMajorProphets => '大先知書';

  @override
  String get categoryMinorProphets => '小先知書';

  @override
  String get categoryGospels => '福音書';

  @override
  String get categoryActs => '歷史書';

  @override
  String get categoryPaulineLetters => '保羅書信';

  @override
  String get categoryGeneralLetters => '普通書信';

  @override
  String get categoryApocalyptic => '啟示文學';

  @override
  String get studyLoadErrorTitle => '聖經目錄載入失敗';

  @override
  String get studyLoadErrorBody => '請稍後重試，或檢查本地聖經種子資料是否已正確打包。';

  @override
  String get readerFallbackTitle => '讀經';

  @override
  String get previousChapterTooltip => '上一章';

  @override
  String get nextChapterTooltip => '下一章';

  @override
  String get readerLoadErrorTitle => '章節載入失敗';

  @override
  String get readerLoadErrorBody => '請稍後重試，或檢查本地聖經資料是否完成匯入。';

  @override
  String get emptyChapterBody => '這一章暫時沒有可顯示的經文。';

  @override
  String get verseActionsTooltip => '筆記與高亮';

  @override
  String get verseActionsTitle => '經文工具';

  @override
  String get bookmarkVerseTitle => '收藏這一節';

  @override
  String get highlightTitle => '高亮';

  @override
  String get highlightNone => '無';

  @override
  String get highlightYellow => '金色';

  @override
  String get highlightGreen => '綠色';

  @override
  String get highlightBlue => '藍色';

  @override
  String get highlightRose => '玫瑰色';

  @override
  String get noteTitle => '筆記';

  @override
  String get noteHint => '寫下私人讀經筆記';

  @override
  String get saveNoteAction => '保存筆記';

  @override
  String get verseNotesMyNotesTab => '我的筆記';

  @override
  String get verseNotesChurchNotesTab => '教會心得';

  @override
  String get verseNotesPublishHint => '發布後，其他使用此 App 的人讀到這節經文時可以看到。';

  @override
  String get verseNotesDisplayNameHint => '訪客顯示名';

  @override
  String get verseNotesContentHint => '分享你對這節經文的心得';

  @override
  String get verseNotesPublishAction => '分享';

  @override
  String get verseNotesUpdateAction => '更新';

  @override
  String get verseNotesDeleteAction => '刪除';

  @override
  String get verseNotesYourReflectionTitle => '我的心得';

  @override
  String get verseNotesSharedTitle => '公開心得';

  @override
  String verseNotesCountLabel(int count) {
    return '$count 則心得';
  }

  @override
  String get verseNotesMineLabel => '我的';

  @override
  String get verseNotesEmptyState => '這節經文還沒有公開心得。';

  @override
  String get verseNotesEmptyError => '請先寫下心得。';

  @override
  String get verseNotesGenericError => '經文心得載入失敗。';

  @override
  String get studyChapterLabel => '羅馬書 8';

  @override
  String get translationLabel => '和合本';

  @override
  String relatedSermonsLabel(int count) {
    return '$count 篇相關講道';
  }

  @override
  String verseNumberLabel(int verse) {
    return '第 $verse 節';
  }

  @override
  String explanationTitleSuffix(String reference) {
    return '$reference 釋義';
  }

  @override
  String get sourceLabel => '依據來源';

  @override
  String get relatedVersesLabel => '相關經文';

  @override
  String get aiStudyDisclaimer => 'AI 解釋供學習參考，重要神學或牧養問題請諮詢牧者。';

  @override
  String get aiStudySheetTitle => 'AI 查經輔助';

  @override
  String get aiStudyQuestionLabel => '問題';

  @override
  String get aiStudyDefaultQuestion => '請幫助我按上下文理解這節經文。';

  @override
  String get aiStudyGenerateAction => '生成查經輔助';

  @override
  String get aiStudyRetryAction => '重新提問';

  @override
  String get aiStudyResultTitle => '學習回應';

  @override
  String get aiStudySignInTitle => '需要登入';

  @override
  String get aiStudySignInBody => '請先在「我的」頁面登入，再使用 AI 查經輔助。';

  @override
  String get aiStudyErrorTitle => 'AI 查經輔助暫不可用';

  @override
  String get aiStudyProviderDisabled => 'AI 服務還沒有配置完成，請等教會同工開啟後再試。';

  @override
  String get aiStudyProviderFailed => 'AI 服務暫時沒有回應，請稍後重試。';

  @override
  String get aiStudyRateLimited => 'AI 請求太頻繁了，請稍等後再試。';

  @override
  String get lexiconLoveTitle => '愛 / agape';

  @override
  String get lexiconGoodTitle => '益處 / agathon';

  @override
  String get lexiconLoveBody => '希臘文 ἀγάπη，常用於表達出於神主動、堅定、盟約性的愛。';

  @override
  String get lexiconGoodBody =>
      '希臘文 ἀγαθόν，指良善、有益處的結果。羅馬書 8:28 的重點不是環境本身舒服，而是神最終成就的良善目的。';

  @override
  String get confirmKnown => '知道了';

  @override
  String get sermonsTitle => '講道';

  @override
  String get searchSermonsTooltip => '搜尋講道';

  @override
  String get sermonFilterTooltip => '篩選講道';

  @override
  String get sermonFilterTitle => '篩選講道';

  @override
  String get sermonFilterSpeakerLabel => '講員';

  @override
  String get sermonFilterSeriesLabel => '系列';

  @override
  String get sermonFilterTopicLabel => '主題';

  @override
  String get sermonFilterClearAction => '清除篩選';

  @override
  String get sermonFilterLoadError => '篩選條件暫時無法載入，請稍後重試。';

  @override
  String get sermonDetailTitle => '講道詳情';

  @override
  String get sermonContinueListeningTitle => '繼續收聽';

  @override
  String get sermonStudyNotesTitle => '講義';

  @override
  String get sermonSummaryTitle => '講道重點';

  @override
  String get sermonOpenDetailAction => '查看講道詳情';

  @override
  String get sermonOutlineTitle => '沉浸式講義';

  @override
  String get sermonReferencesTitle => '講道引用經文';

  @override
  String get sermonTranscriptTitle => '講道文本';

  @override
  String get sermonSectionNotesLabel => '講義';

  @override
  String get sermonSectionReferencesLabel => '經文';

  @override
  String get sermonSectionTranscriptLabel => '文稿';

  @override
  String get sermonPlaybackSpeedTitle => '播放速度';

  @override
  String get sermonTranscriptReadAction => '閱讀文本';

  @override
  String get sermonTranscriptCollapseAction => '收起';

  @override
  String get sermonAiAskAction => '詢問這篇講道';

  @override
  String get sermonDiscussionTitle => '講道討論包';

  @override
  String get sermonDiscussionPrivateLabel => '私密回應';

  @override
  String get sermonDiscussionQuestionsTitle => '討論問題';

  @override
  String get sermonDiscussionActionStepsTitle => '行動回應';

  @override
  String get sermonDiscussionPrayerTitle => '禱告方向';

  @override
  String get sermonDiscussionRespondAction => '寫回應';

  @override
  String get sermonDiscussionResponseTitle => '個人回應';

  @override
  String get sermonDiscussionResponseHint => '寫下你的心得或下一步行動';

  @override
  String get sermonDiscussionResponsePrivateNote => '你的回應預設只對自己可見。';

  @override
  String get sermonDiscussionSubmitAction => '提交';

  @override
  String get sermonDiscussionSubmitted => '回應已保存。';

  @override
  String get sermonDiscussionError => '回應保存失敗，請再試一次。';

  @override
  String get sermonDiscussionLoadError => '討論材料載入失敗。';

  @override
  String get sermonDiscussionObservationChip => '觀察';

  @override
  String get sermonDiscussionInterpretationChip => '解釋';

  @override
  String get sermonDiscussionApplicationChip => '應用';

  @override
  String get sermonDiscussionPrayerChip => '禱告';

  @override
  String get sermonDiscussionActionChip => '行動';

  @override
  String get sermonAiSheetTitle => '講道問答';

  @override
  String get sermonAiDefaultQuestion => '請幫助我理解這篇講道的重點。';

  @override
  String get sermonAiGenerateAction => '生成講道回答';

  @override
  String get relatedSermonsTitle => '相關講道';

  @override
  String get sermonLoadErrorTitle => '講道資料暫時無法載入';

  @override
  String get sermonLoadErrorBody => '稍後會從後端重新取得講道列表。';

  @override
  String get retryAction => '重試';

  @override
  String get sermonEmptyTitle => '暫無講道內容';

  @override
  String get sermonAudioMissing => '暫未上傳音訊';

  @override
  String get sermonAudioPreparing => '正在準備音訊';

  @override
  String get sermonAudioLoading => '正在載入音訊';

  @override
  String get sermonAudioReady => '可以播放';

  @override
  String get sermonAudioUnavailable => '音訊暫時無法載入';

  @override
  String get rewindTooltip => '後退 15 秒';

  @override
  String get playTooltip => '播放';

  @override
  String get forwardTooltip => '前進 30 秒';

  @override
  String get lifeTitle => '教會生活';

  @override
  String get notificationsTooltip => '通知';

  @override
  String get notificationsPageTitle => '通知';

  @override
  String get notificationInboxTitle => '最近通知';

  @override
  String unreadCountSemanticLabel(String label, int count) {
    return '$label，$count 條未讀';
  }

  @override
  String get notificationInboxEmptyTitle => '暫無通知';

  @override
  String get notificationInboxEmptyBody => '這台裝置收到新的教會更新後會顯示在這裡。';

  @override
  String get notificationRefreshAction => '重新整理通知';

  @override
  String get notificationMarkAllReadAction => '全部標為已讀';

  @override
  String get notificationClearAction => '清空通知';

  @override
  String get notificationDeviceUnavailableBody =>
      '目前建置還沒有接入 Firebase 應用設定，暫時無法啟用推送。';

  @override
  String get weeklyBulletinTitle => '本週週報';

  @override
  String get lifeSundayHeroEmptyBody => '同工發佈本週主日資訊後，會顯示在這裡。';

  @override
  String get lifeTabWeek => '本週';

  @override
  String get lifeTabEvents => '活動';

  @override
  String get lifeTabGroups => '小組';

  @override
  String get lifeTabCourses => '課程';

  @override
  String get lifeTabServing => '服事';

  @override
  String get lifeTabPrayer => '代禱';

  @override
  String get lifeTabWeekEmpty => '新的教會生活卡片發佈後會顯示在這裡。';

  @override
  String get lifeTabEventsEmpty => '目前暫無開放的活動卡片。';

  @override
  String get lifeTabMemberSignInBody => '請到「我的」登入後查看會友專屬的小組、課程、服事和關懷卡片。';

  @override
  String get lifeTabPrayerDisabled => '目前建置暫未啟用代禱請求。';

  @override
  String get lifeOpenDetailAction => '查看詳情';

  @override
  String get lifeUpdatesTitle => '最新動態';

  @override
  String get lifeParticipationTitle => '我的參與';

  @override
  String get lifeLoadErrorTitle => '教會生活資料暫時無法載入';

  @override
  String get lifeLoadErrorBody => '稍後會從後端重新取得週報和生活資訊。';

  @override
  String get lifeSectionLoadError => '此區域暫時無法載入，請重試。';

  @override
  String get lifeEmptyTitle => '暫無教會生活內容';

  @override
  String get lifePostNoBody => '詳細內容會稍後補充。';

  @override
  String get lifePostVisibilityMembers => '會眾可見';

  @override
  String get lifePostVisibilityGroup => '小組可見';

  @override
  String get lifePostVisibilityPrivate => '私密';

  @override
  String get lifePostTypeWeeklyBulletin => '週報';

  @override
  String get lifePostTypeSunday => '主日';

  @override
  String get lifePostTypeAnnouncement => '公告';

  @override
  String get lifePostTypeEvent => '活動';

  @override
  String get lifePostTypeGroup => '小組';

  @override
  String get lifePostTypeFellowship => '團契';

  @override
  String get lifePostTypeCourse => '課程';

  @override
  String get lifePostTypeServing => '服事';

  @override
  String get lifePostTypePrayer => '代禱';

  @override
  String get lifePostTypeGiving => '奉獻';

  @override
  String get lifePostUnread => '未讀';

  @override
  String get lifePostActionOpen => '打開連結';

  @override
  String get lifePostScheduleTbd => '時間待定';

  @override
  String get myEventRegistrationsTitle => '我的報名';

  @override
  String get groupsTitle => '小組與團契';

  @override
  String get groupsEmptyBody => '目前暫無可加入的小組或團契。';

  @override
  String get groupApplyAction => '申請加入';

  @override
  String get groupAlreadyMember => '你已在小組中';

  @override
  String get groupApplicationSubmitted => '申請已提交';

  @override
  String get groupApplicationSubmitSuccess => '申請已提交。';

  @override
  String get groupWithdrawAction => '撤回申請';

  @override
  String get groupApplicationWithdrawSuccess => '申請已撤回。';

  @override
  String get groupCapacityFull => '小組已滿員';

  @override
  String get groupMyGroupsTitle => '我的小組';

  @override
  String get groupMyGroupsEmptyBody => '你目前還沒有加入小組。';

  @override
  String get groupSignInToViewMineBody => '登入後可在不同裝置查看你的小組。';

  @override
  String groupMemberCount(int count) {
    return '$count 位成員';
  }

  @override
  String groupMemberCapacity(int count, int capacity) {
    return '$count/$capacity 位成員';
  }

  @override
  String get coursesTitle => '課程與學習';

  @override
  String get coursesEmptyBody => '目前暫無開放的課程。';

  @override
  String get courseMyCoursesTitle => '我的課程';

  @override
  String get courseMyCoursesEmptyBody => '你目前還沒有課程報名記錄。';

  @override
  String get courseLessonsTitle => '課程課次';

  @override
  String get courseLessonsEmptyBody => '這門課程尚未發布課次。';

  @override
  String get courseSignInToEnrollBody => '登入後可報名課程，並在不同裝置同步學習進度。';

  @override
  String get courseSignInToViewMineBody => '登入後可查看正在學習和已經完成的課程。';

  @override
  String get courseEnrollAction => '報名課程';

  @override
  String get courseSubmittedAction => '已提交';

  @override
  String get courseEnrolledAction => '已報名';

  @override
  String get courseWaitlistedAction => '候補中';

  @override
  String get courseCancelledAction => '已取消';

  @override
  String get courseCompletedAction => '已完成';

  @override
  String get courseEnrollmentSubmitSuccess => '課程報名已提交。';

  @override
  String get courseStatusDraft => '草稿';

  @override
  String get courseStatusOpen => '開放報名';

  @override
  String get courseStatusClosed => '已關閉';

  @override
  String get courseStatusInProgress => '進行中';

  @override
  String get courseStatusCompleted => '已完成';

  @override
  String get courseStatusArchived => '已歸檔';

  @override
  String courseLessonCount(int count) {
    return '$count 個課次';
  }

  @override
  String get courseCapacityOpen => '名額開放';

  @override
  String courseCapacityLabel(int count, int capacity) {
    return '$count/$capacity 個名額';
  }

  @override
  String courseProgressLabel(int completed, int total) {
    return '已完成 $completed/$total 個課次';
  }

  @override
  String get servingTitle => '我的服事';

  @override
  String get servingEmptyBody => '目前暫無服事安排。';

  @override
  String get servingConfirmAction => '確認服事';

  @override
  String get servingLeaveAction => '請假';

  @override
  String get servingConfirmSuccess => '服事已確認。';

  @override
  String get servingLeaveSuccess => '請假請求已提交。';

  @override
  String get servingStatusScheduled => '待確認';

  @override
  String get servingStatusConfirmed => '已確認';

  @override
  String get servingStatusDeclined => '已請假';

  @override
  String get servingStatusSwapRequested => '申請換班';

  @override
  String get servingStatusCovered => '已有替補';

  @override
  String get servingStatusCancelled => '已取消';

  @override
  String get servingScheduleTab => '排班';

  @override
  String get servingAvailabilityTab => '可用時間';

  @override
  String get servingAvailabilityEmptyBody => '尚未提交可用時間。';

  @override
  String get servingAvailabilityAddAction => '新增可用時間';

  @override
  String get servingAvailabilitySheetTitle => '新的可用時間';

  @override
  String get servingAvailabilityStatusLabel => '可用狀態';

  @override
  String get servingAvailabilityStatusAvailable => '可以服事';

  @override
  String get servingAvailabilityStatusUnavailable => '無法服事';

  @override
  String get servingAvailabilityStatusPreferred => '優先時段';

  @override
  String get servingAvailabilityStartLabel => '開始時間';

  @override
  String get servingAvailabilityEndLabel => '結束時間';

  @override
  String get servingAvailabilityNoteHint => '補充說明（可選）';

  @override
  String get servingAvailabilitySaveAction => '儲存可用時間';

  @override
  String get servingAvailabilityCreateSuccess => '可用時間已儲存。';

  @override
  String get servingAvailabilityInvalidRange => '結束時間必須晚於開始時間。';

  @override
  String get servingCheckInTitle => '到崗狀態';

  @override
  String get servingCheckInAction => '確認到崗';

  @override
  String get servingCheckInSuccess => '到崗已確認。';

  @override
  String get servingCheckInNotRecorded => '尚未確認到崗。';

  @override
  String get servingCheckInStatusPending => '待到崗';

  @override
  String get servingCheckInStatusCheckedIn => '已到崗';

  @override
  String get servingCheckInStatusMissed => '未到崗';

  @override
  String get servingAssignmentNoteTitle => '服事說明';

  @override
  String get servingResponseNoteTitle => '我的回覆';

  @override
  String get eventRegistrationTitle => '活動報名';

  @override
  String get eventRegistrationRegisterAction => '報名';

  @override
  String get eventRegistrationUpdateAction => '保存修改';

  @override
  String get eventRegistrationCancelAction => '取消報名';

  @override
  String get eventRegistrationCheckInAction => '簽到';

  @override
  String get eventCheckInScanAction => '掃描現場碼';

  @override
  String get eventCheckInScanTitle => '現場簽到';

  @override
  String get eventCheckInScanPrompt => '請掃描同工列印的活動簽到二維碼。';

  @override
  String get eventCheckInScanSuccessTitle => '簽到成功';

  @override
  String get eventCheckInScanViewEvent => '查看活動';

  @override
  String get eventCheckInScanAgain => '繼續掃描';

  @override
  String get eventCheckInScanSignInRequired => '請先登入，再掃描現場簽到二維碼。';

  @override
  String get eventCheckInQrInvalid => '這個簽到二維碼無效，請重新掃描。';

  @override
  String get eventCheckInQrExpired => '這個簽到二維碼已過期，請聯絡同工。';

  @override
  String get eventCheckInQrDisabled => '這個簽到二維碼已停用，請聯絡同工。';

  @override
  String get eventCheckInQrRegistrationRequired => '沒有找到你的活動報名，請先報名或聯絡同工。';

  @override
  String get eventRegistrationRegistered => '你已報名';

  @override
  String get eventRegistrationCheckedIn => '你已簽到';

  @override
  String get eventRegistrationSignInBody => '登入後即可報名參加這個活動。';

  @override
  String get eventRegistrationFull => '報名名額已滿。';

  @override
  String get eventRegistrationClosed => '報名已截止。';

  @override
  String get eventRegistrationUnavailable => '這個活動目前不可報名或不可查看。';

  @override
  String get eventRegistrationNotFound => '沒有找到你的報名記錄，請刷新後再試。';

  @override
  String get eventRegistrationPartySizeInvalid => '請選擇更少的參加人數。';

  @override
  String get eventRegistrationCheckInLocked => '已簽到的報名只能由同工修改。';

  @override
  String get eventRegistrationSuccess => '報名成功。';

  @override
  String get eventRegistrationUpdateSuccess => '報名資料已更新。';

  @override
  String get eventRegistrationCancelSuccess => '已取消報名。';

  @override
  String get eventRegistrationCheckInSuccess => '簽到成功。';

  @override
  String eventRegistrationCheckedInAt(String time) {
    return '簽到時間：$time';
  }

  @override
  String get eventRegistrationPartySizeLabel => '參加人數';

  @override
  String eventRegistrationPartySize(int count) {
    return '$count 人';
  }

  @override
  String get eventRegistrationNoteLabel => '備註';

  @override
  String get eventRegistrationNoteHint => '餐食需要、到達說明，或可協助事項';

  @override
  String eventRegistrationSpots(int registered, int capacity) {
    return '已報名 $registered/$capacity';
  }

  @override
  String eventRegistrationUnlimitedSpots(int registered) {
    return '已報名 $registered';
  }

  @override
  String eventRegistrationRemaining(int remaining) {
    return '剩餘 $remaining 個名額';
  }

  @override
  String get givingGuestBody => '登入後可查看自己的奉獻記錄和年度證明。';

  @override
  String get givingHistoryTitle => '奉獻記錄';

  @override
  String get givingTransactionsTitle => '最近交易';

  @override
  String get givingTransactionsEmptyBody => '暫時還沒有奉獻記錄。';

  @override
  String givingSummaryYear(int year) {
    return '$year 年';
  }

  @override
  String givingSummaryAmount(String amount) {
    return '總額 $amount';
  }

  @override
  String givingSummaryCount(int count) {
    return '$count 筆奉獻';
  }

  @override
  String get givingStatementSectionTitle => '年度證明';

  @override
  String get annualStatementsTitle => '年度證明';

  @override
  String get annualStatementsEmptyBody => '暫時還沒有年度證明。';

  @override
  String givingStatementLabel(int year) {
    return '$year 年證明';
  }

  @override
  String get prayerTitle => '代禱';

  @override
  String get prayerEmptyBody => '暫無公開代禱事項。';

  @override
  String get prayerSubmitTitle => '提交代禱事項';

  @override
  String get prayerSubmitAction => '提交';

  @override
  String get prayerGuestSubmitBody => '可以訪客身份提交。私密事項只給牧者和後台同工查看。';

  @override
  String get prayerMemberSubmitBody => '這條代禱會關聯到你的會員資料，之後可以查看處理狀態。';

  @override
  String get prayerTitleLabel => '標題';

  @override
  String get prayerBodyLabel => '代禱內容';

  @override
  String get prayerNameLabel => '姓名';

  @override
  String get prayerValidationError => '請填寫標題和代禱內容。';

  @override
  String get prayerSubmittedMessage => '代禱事項已提交，等待審核。';

  @override
  String get prayerMineLabel => '我的';

  @override
  String get prayerVisibilityPrivate => '私密';

  @override
  String get prayerVisibilityPublic => '公開';

  @override
  String get prayerVisibilityMembers => '會眾';

  @override
  String get prayerVisibilityGroup => '小組';

  @override
  String get prayerStatusPending => '待審核';

  @override
  String get prayerStatusApproved => '已通過';

  @override
  String get prayerStatusHidden => '已隱藏';

  @override
  String get prayerStatusArchived => '已歸檔';

  @override
  String get careTitle => '關懷';

  @override
  String get careEmptyBody => '暫時還沒有關懷請求。';

  @override
  String get careSubmitTitle => '請求牧養關懷';

  @override
  String get careSubmitAction => '請求關懷';

  @override
  String get careSubmitBody => '請簡要說明你希望牧者或關懷同工如何跟進。內部跟進備註只給授權同工查看。';

  @override
  String get careSignInRequired => '請先以會友身份登入後再提交關懷請求。';

  @override
  String get careTitleLabel => '標題';

  @override
  String get careBodyLabel => '你希望我們如何關懷你？';

  @override
  String get carePrivacyLabel => '隱私範圍';

  @override
  String get carePrivacyPastoralOnly => '僅牧者團隊';

  @override
  String get carePrivacyAssignedTeam => '指定關懷團隊';

  @override
  String get carePrivacyAdminRestricted => '僅受限管理員';

  @override
  String get careValidationError => '請填寫標題和關懷內容。';

  @override
  String get careSubmittedMessage => '關懷請求已提交。';

  @override
  String get careStatusSubmitted => '已提交';

  @override
  String get careStatusAssigned => '已分配';

  @override
  String get careStatusInProgress => '跟進中';

  @override
  String get careStatusResolved => '已解決';

  @override
  String get careStatusArchived => '已歸檔';

  @override
  String careNextFollowUp(String date) {
    return '下次跟進 $date';
  }

  @override
  String get givingTitle => '奉獻';

  @override
  String get givingCardTitle => '奉獻與年度證明';

  @override
  String get givingCardBody => '透過 Stripe 安全奉獻，完成後可在這裡查看已確認的奉獻記錄和年度證明。';

  @override
  String get givingCheckoutTitle => '現在奉獻';

  @override
  String get givingCheckoutBody => '付款由 Stripe 處理，App 不保存銀行卡或銀行帳戶資訊。';

  @override
  String get givingAmountLabel => '金額';

  @override
  String get givingFundLabel => '奉獻項目';

  @override
  String get givingFundsLoading => '正在載入奉獻項目...';

  @override
  String get givingFundsEmpty => '目前沒有可用的奉獻項目。';

  @override
  String get givingCategoryOffering => '奉獻';

  @override
  String get givingCategoryMissions => '宣教';

  @override
  String get givingCheckoutAction => '前往 Stripe';

  @override
  String get givingAmountError =>
      '請輸入 USD 1.00 至 USD 100,000.00 之間的金額，最多保留兩位小數。';

  @override
  String get givingCheckoutOpenError => '無法打開 Stripe 付款頁面。';

  @override
  String get givingCheckoutReturnSuccess => 'Stripe 付款流程已完成。確認入帳後會顯示在奉獻記錄中。';

  @override
  String get givingCheckoutReturnCancel => 'Stripe 付款已取消。';

  @override
  String get annualStatementTooltip => '年度證明';

  @override
  String get annualStatementPreviewAction => '預覽 CSV';

  @override
  String get annualStatementCopyCsvAction => '複製 CSV';

  @override
  String get annualStatementCopiedMessage => '證明 CSV 已複製。';

  @override
  String get annualStatementSavePdfAction => '保存 PDF';

  @override
  String get annualStatementSharePdfAction => '分享 PDF';

  @override
  String get annualStatementSharePdfText => '年度奉獻證明';

  @override
  String get annualStatementPdfSharedMessage => '年度證明 PDF 已分享。';

  @override
  String get annualStatementPdfOpenedMessage => '年度證明 PDF 已保存並打開。';

  @override
  String annualStatementPdfSavedMessage(String path) {
    return '年度證明 PDF 已保存到 $path。';
  }

  @override
  String get copyPathAction => '複製路徑';

  @override
  String get annualStatementExportTitle => '證明匯出';

  @override
  String get annualStatementStatusPendingLabel => '處理中';

  @override
  String get annualStatementStatusReadyLabel => '可用';

  @override
  String get annualStatementStatusSentLabel => '已發送';

  @override
  String get annualStatementStatusFailedLabel => '失敗';

  @override
  String get givingStatusPendingLabel => '處理中';

  @override
  String get givingStatusSucceededLabel => '成功';

  @override
  String get givingStatusFailedLabel => '失敗';

  @override
  String get givingStatusRefundedLabel => '已退款';

  @override
  String get bibleTtsReadyTitle => '朗讀聖經';

  @override
  String bibleTtsCurrentVerse(int verse) {
    return '正在朗讀第 $verse 節';
  }

  @override
  String bibleTtsPausedVerse(int verse) {
    return '已暫停在第 $verse 節，繼續會重讀本節。';
  }

  @override
  String bibleTtsRateLabel(double rate) {
    final intl.NumberFormat rateNumberFormat = intl.NumberFormat.compact(
      locale: localeName,
    );
    final String rateString = rateNumberFormat.format(rate);

    return '${rateString}x';
  }

  @override
  String get bibleTtsPlayTooltip => '朗讀';

  @override
  String get bibleTtsPauseTooltip => '暫停朗讀';

  @override
  String get bibleTtsStopTooltip => '停止朗讀';

  @override
  String get bibleTtsPreviousVerseTooltip => '上一節';

  @override
  String get bibleTtsNextVerseTooltip => '下一節';

  @override
  String get bibleTtsErrorTextMissing => '這段經文沒有可朗讀的文字。';

  @override
  String get bibleTtsErrorEngineUnavailable => '此裝置暫時無法使用文字朗讀。請檢查系統語音設定後重試。';

  @override
  String get bibleTtsErrorLanguageUnavailable => '系統尚未安裝這個聖經語言的語音。';

  @override
  String get bibleTtsErrorInterrupted => '朗讀已中斷。點擊播放可從目前經節繼續。';

  @override
  String get bibleTtsErrorStartFailed => '無法開始朗讀。請檢查裝置語音設定後重試。';

  @override
  String get newcomerCardTitle => '第一次來嗎？';

  @override
  String get newcomerCardBody => '我們很願意歡迎你、回答問題，並幫助你認識教會生活。';

  @override
  String get newcomerCardAction => '我是新朋友';

  @override
  String get newcomerSheetTitle => '歡迎來到 MBCG';

  @override
  String get newcomerSheetGuestBody => '留下簡單資料，教會同工會與你聯繫。';

  @override
  String get newcomerSheetMemberBody => '你也可以介紹自己，或請同工與你聯繫。';

  @override
  String get newcomerNameLabel => '姓名';

  @override
  String get newcomerEmailLabel => '電郵';

  @override
  String get newcomerPhoneLabel => '電話';

  @override
  String get newcomerInterestLabel => '你想了解什麼？';

  @override
  String get newcomerSubmitAction => '發送給教會同工';

  @override
  String get newcomerNameValidationError => '請輸入姓名。';

  @override
  String get newcomerContactValidationError => '請至少留下電郵或電話。';

  @override
  String get newcomerEmailValidationError => '請輸入有效的電郵地址。';

  @override
  String get newcomerSubmittedMessage => '謝謝，我們已經收到你的資料。';

  @override
  String get mineDiscipleshipTitle => '我的門徒成長路徑';

  @override
  String get mineDiscipleshipBody => '查看教會同工為你安排的下一步成長操練。';

  @override
  String get mineDiscipleshipEmpty => '目前還沒有分配成長路徑。';

  @override
  String get mineDiscipleshipLoadError => '無法載入你的成長路徑。';

  @override
  String mineDiscipleshipProgressChip(int completed, int total) {
    return '$completed/$total 個任務';
  }

  @override
  String get discipleshipStatusNotStarted => '未開始';

  @override
  String get discipleshipStatusInProgress => '進行中';

  @override
  String get discipleshipStatusBlocked => '受阻';

  @override
  String get discipleshipStatusCompleted => '已完成';

  @override
  String get discipleshipStatusPaused => '已暫停';

  @override
  String get discipleshipStatusCancelled => '已取消';
}
