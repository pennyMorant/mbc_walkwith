import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_es.dart';
import 'app_localizations_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('es'),
    Locale('zh'),
    Locale.fromSubtags(languageCode: 'zh', scriptCode: 'Hans'),
    Locale.fromSubtags(languageCode: 'zh', scriptCode: 'Hant'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In zh, this message translates to:
  /// **'MBCG'**
  String get appTitle;

  /// No description provided for @commonStatusUnknownLabel.
  ///
  /// In zh, this message translates to:
  /// **'未知状态'**
  String get commonStatusUnknownLabel;

  /// No description provided for @commonVisibilityUnknownLabel.
  ///
  /// In zh, this message translates to:
  /// **'未知可见性'**
  String get commonVisibilityUnknownLabel;

  /// No description provided for @commonPrivacyUnknownLabel.
  ///
  /// In zh, this message translates to:
  /// **'未知隐私范围'**
  String get commonPrivacyUnknownLabel;

  /// No description provided for @tabStudy.
  ///
  /// In zh, this message translates to:
  /// **'读经'**
  String get tabStudy;

  /// No description provided for @tabSermons.
  ///
  /// In zh, this message translates to:
  /// **'讲道'**
  String get tabSermons;

  /// No description provided for @tabLife.
  ///
  /// In zh, this message translates to:
  /// **'生活'**
  String get tabLife;

  /// No description provided for @tabMine.
  ///
  /// In zh, this message translates to:
  /// **'我的'**
  String get tabMine;

  /// No description provided for @mineTitle.
  ///
  /// In zh, this message translates to:
  /// **'我的'**
  String get mineTitle;

  /// No description provided for @memberOptionalSignInTitle.
  ///
  /// In zh, this message translates to:
  /// **'可选登录'**
  String get memberOptionalSignInTitle;

  /// No description provided for @memberOptionalSignInBody.
  ///
  /// In zh, this message translates to:
  /// **'你可以继续以访客使用；登录后可在后续同步读经、祷告和奉献记录。'**
  String get memberOptionalSignInBody;

  /// No description provided for @memberEmailLabel.
  ///
  /// In zh, this message translates to:
  /// **'邮箱'**
  String get memberEmailLabel;

  /// No description provided for @memberInvalidEmail.
  ///
  /// In zh, this message translates to:
  /// **'请输入有效的邮箱地址。'**
  String get memberInvalidEmail;

  /// No description provided for @memberShowPasswordTooltip.
  ///
  /// In zh, this message translates to:
  /// **'显示密码'**
  String get memberShowPasswordTooltip;

  /// No description provided for @memberHidePasswordTooltip.
  ///
  /// In zh, this message translates to:
  /// **'隐藏密码'**
  String get memberHidePasswordTooltip;

  /// No description provided for @memberNameLabel.
  ///
  /// In zh, this message translates to:
  /// **'姓名'**
  String get memberNameLabel;

  /// No description provided for @memberPasswordLabel.
  ///
  /// In zh, this message translates to:
  /// **'密码'**
  String get memberPasswordLabel;

  /// No description provided for @memberConfirmPasswordLabel.
  ///
  /// In zh, this message translates to:
  /// **'确认密码'**
  String get memberConfirmPasswordLabel;

  /// No description provided for @memberCodeLabel.
  ///
  /// In zh, this message translates to:
  /// **'验证码'**
  String get memberCodeLabel;

  /// No description provided for @memberVerifyEmailAction.
  ///
  /// In zh, this message translates to:
  /// **'验证邮箱'**
  String get memberVerifyEmailAction;

  /// No description provided for @memberSignInAction.
  ///
  /// In zh, this message translates to:
  /// **'登录'**
  String get memberSignInAction;

  /// No description provided for @memberContinueWithGoogle.
  ///
  /// In zh, this message translates to:
  /// **'使用 Google 继续'**
  String get memberContinueWithGoogle;

  /// No description provided for @memberContinueWithApple.
  ///
  /// In zh, this message translates to:
  /// **'使用 Apple 继续'**
  String get memberContinueWithApple;

  /// No description provided for @memberAuthAlternative.
  ///
  /// In zh, this message translates to:
  /// **'或'**
  String get memberAuthAlternative;

  /// No description provided for @memberFederatedSetupUnavailable.
  ///
  /// In zh, this message translates to:
  /// **'Google 与 Apple 登录尚未完成配置。'**
  String get memberFederatedSetupUnavailable;

  /// No description provided for @memberFederatedSignInFailed.
  ///
  /// In zh, this message translates to:
  /// **'登录未能完成，请重试。'**
  String get memberFederatedSignInFailed;

  /// No description provided for @memberLoginEmailTitle.
  ///
  /// In zh, this message translates to:
  /// **'欢迎回来'**
  String get memberLoginEmailTitle;

  /// No description provided for @memberLoginEmailBody.
  ///
  /// In zh, this message translates to:
  /// **'登录后继续参与教会生活。'**
  String get memberLoginEmailBody;

  /// No description provided for @memberNextAction.
  ///
  /// In zh, this message translates to:
  /// **'下一步'**
  String get memberNextAction;

  /// No description provided for @memberCreateAccountAction.
  ///
  /// In zh, this message translates to:
  /// **'创建账号'**
  String get memberCreateAccountAction;

  /// No description provided for @memberPasswordTitle.
  ///
  /// In zh, this message translates to:
  /// **'输入密码'**
  String get memberPasswordTitle;

  /// No description provided for @memberForgotPasswordAction.
  ///
  /// In zh, this message translates to:
  /// **'忘记密码？'**
  String get memberForgotPasswordAction;

  /// No description provided for @memberPasswordResetTitle.
  ///
  /// In zh, this message translates to:
  /// **'重设密码'**
  String get memberPasswordResetTitle;

  /// No description provided for @memberPasswordResetRequestBody.
  ///
  /// In zh, this message translates to:
  /// **'如该邮箱可重设密码，我们会发送验证码。'**
  String get memberPasswordResetRequestBody;

  /// No description provided for @memberPasswordResetCodeBody.
  ///
  /// In zh, this message translates to:
  /// **'请输入邮件中的验证码，然后设置新密码。'**
  String get memberPasswordResetCodeBody;

  /// No description provided for @memberPasswordResetAction.
  ///
  /// In zh, this message translates to:
  /// **'重设密码'**
  String get memberPasswordResetAction;

  /// No description provided for @memberPasswordResetComplete.
  ///
  /// In zh, this message translates to:
  /// **'密码已更新，请使用新密码登录。'**
  String get memberPasswordResetComplete;

  /// No description provided for @memberBackToSignInAction.
  ///
  /// In zh, this message translates to:
  /// **'返回登录'**
  String get memberBackToSignInAction;

  /// No description provided for @memberRegisterAction.
  ///
  /// In zh, this message translates to:
  /// **'注册'**
  String get memberRegisterAction;

  /// No description provided for @memberChangeEmailAction.
  ///
  /// In zh, this message translates to:
  /// **'更换邮箱'**
  String get memberChangeEmailAction;

  /// No description provided for @memberPasswordMismatch.
  ///
  /// In zh, this message translates to:
  /// **'两次输入的密码不一致。'**
  String get memberPasswordMismatch;

  /// No description provided for @memberSignOutAction.
  ///
  /// In zh, this message translates to:
  /// **'退出登录'**
  String get memberSignOutAction;

  /// No description provided for @memberRegistrationClosed.
  ///
  /// In zh, this message translates to:
  /// **'会员注册暂时关闭，请联系教会办公室。'**
  String get memberRegistrationClosed;

  /// No description provided for @memberRegistrationPendingApproval.
  ///
  /// In zh, this message translates to:
  /// **'注册已收到，请等待教会审核。'**
  String get memberRegistrationPendingApproval;

  /// No description provided for @memberProfileTitle.
  ///
  /// In zh, this message translates to:
  /// **'我的资料'**
  String get memberProfileTitle;

  /// No description provided for @memberProfileEditTitle.
  ///
  /// In zh, this message translates to:
  /// **'资料详情'**
  String get memberProfileEditTitle;

  /// No description provided for @memberProfileSaveAction.
  ///
  /// In zh, this message translates to:
  /// **'保存资料'**
  String get memberProfileSaveAction;

  /// No description provided for @memberProfileSaved.
  ///
  /// In zh, this message translates to:
  /// **'资料已保存。'**
  String get memberProfileSaved;

  /// No description provided for @memberProfileOpenAction.
  ///
  /// In zh, this message translates to:
  /// **'编辑资料'**
  String get memberProfileOpenAction;

  /// No description provided for @memberStatusLabel.
  ///
  /// In zh, this message translates to:
  /// **'状态'**
  String get memberStatusLabel;

  /// No description provided for @memberRoleLabel.
  ///
  /// In zh, this message translates to:
  /// **'身份'**
  String get memberRoleLabel;

  /// No description provided for @memberGroupLabel.
  ///
  /// In zh, this message translates to:
  /// **'小组'**
  String get memberGroupLabel;

  /// No description provided for @memberNoGroupLabel.
  ///
  /// In zh, this message translates to:
  /// **'未加入小组'**
  String get memberNoGroupLabel;

  /// No description provided for @memberPhoneLabel.
  ///
  /// In zh, this message translates to:
  /// **'电话'**
  String get memberPhoneLabel;

  /// No description provided for @memberAddressLabel.
  ///
  /// In zh, this message translates to:
  /// **'地址'**
  String get memberAddressLabel;

  /// No description provided for @memberFaithStartYearLabel.
  ///
  /// In zh, this message translates to:
  /// **'信主年份'**
  String get memberFaithStartYearLabel;

  /// No description provided for @memberBaptizedYearLabel.
  ///
  /// In zh, this message translates to:
  /// **'受洗年份'**
  String get memberBaptizedYearLabel;

  /// No description provided for @memberJoinedChurchAtLabel.
  ///
  /// In zh, this message translates to:
  /// **'加入教会日期'**
  String get memberJoinedChurchAtLabel;

  /// No description provided for @memberEmergencyContactNameLabel.
  ///
  /// In zh, this message translates to:
  /// **'紧急联系人'**
  String get memberEmergencyContactNameLabel;

  /// No description provided for @memberEmergencyContactPhoneLabel.
  ///
  /// In zh, this message translates to:
  /// **'紧急联系人电话'**
  String get memberEmergencyContactPhoneLabel;

  /// No description provided for @mineGivingEntryTitle.
  ///
  /// In zh, this message translates to:
  /// **'奉献与年度证明'**
  String get mineGivingEntryTitle;

  /// No description provided for @mineGivingEntryBody.
  ///
  /// In zh, this message translates to:
  /// **'查看奉献记录、已确认数据和年度证明 PDF。'**
  String get mineGivingEntryBody;

  /// No description provided for @mineLifeOverviewTitle.
  ///
  /// In zh, this message translates to:
  /// **'我的教会生活'**
  String get mineLifeOverviewTitle;

  /// No description provided for @mineLifeOverviewBody.
  ///
  /// In zh, this message translates to:
  /// **'快速查看你的小组、课程、服事和关怀请求状态。'**
  String get mineLifeOverviewBody;

  /// No description provided for @mineLifeGroupsLabel.
  ///
  /// In zh, this message translates to:
  /// **'小组'**
  String get mineLifeGroupsLabel;

  /// No description provided for @mineLifeCoursesLabel.
  ///
  /// In zh, this message translates to:
  /// **'课程'**
  String get mineLifeCoursesLabel;

  /// No description provided for @mineLifeCoursesCountLabel.
  ///
  /// In zh, this message translates to:
  /// **'{count} 门课程'**
  String mineLifeCoursesCountLabel(int count);

  /// No description provided for @mineLifeServingLabel.
  ///
  /// In zh, this message translates to:
  /// **'服事'**
  String get mineLifeServingLabel;

  /// No description provided for @mineLifeServingCountLabel.
  ///
  /// In zh, this message translates to:
  /// **'{count} 项服事'**
  String mineLifeServingCountLabel(int count);

  /// No description provided for @mineLifeCareLabel.
  ///
  /// In zh, this message translates to:
  /// **'关怀'**
  String get mineLifeCareLabel;

  /// No description provided for @mineLifeOverviewMetricSemanticLabel.
  ///
  /// In zh, this message translates to:
  /// **'{label}：{count}'**
  String mineLifeOverviewMetricSemanticLabel(String label, int count);

  /// No description provided for @mineLifeOpenLifeAction.
  ///
  /// In zh, this message translates to:
  /// **'打开生活'**
  String get mineLifeOpenLifeAction;

  /// No description provided for @preferencesTitle.
  ///
  /// In zh, this message translates to:
  /// **'偏好'**
  String get preferencesTitle;

  /// No description provided for @appearanceTitle.
  ///
  /// In zh, this message translates to:
  /// **'外观'**
  String get appearanceTitle;

  /// No description provided for @themeModeSystem.
  ///
  /// In zh, this message translates to:
  /// **'跟随系统'**
  String get themeModeSystem;

  /// No description provided for @themeModeLight.
  ///
  /// In zh, this message translates to:
  /// **'浅色'**
  String get themeModeLight;

  /// No description provided for @themeModeDark.
  ///
  /// In zh, this message translates to:
  /// **'深色'**
  String get themeModeDark;

  /// No description provided for @textSizeTitle.
  ///
  /// In zh, this message translates to:
  /// **'字体大小'**
  String get textSizeTitle;

  /// No description provided for @textSizeBody.
  ///
  /// In zh, this message translates to:
  /// **'让读经、敬拜和教会生活内容更容易阅读。'**
  String get textSizeBody;

  /// No description provided for @textSizeSystem.
  ///
  /// In zh, this message translates to:
  /// **'跟随系统'**
  String get textSizeSystem;

  /// No description provided for @textSizeStandard.
  ///
  /// In zh, this message translates to:
  /// **'标准'**
  String get textSizeStandard;

  /// No description provided for @textSizeLarge.
  ///
  /// In zh, this message translates to:
  /// **'大'**
  String get textSizeLarge;

  /// No description provided for @textSizeExtraLarge.
  ///
  /// In zh, this message translates to:
  /// **'特大'**
  String get textSizeExtraLarge;

  /// No description provided for @notificationPermissionTitle.
  ///
  /// In zh, this message translates to:
  /// **'通知权限'**
  String get notificationPermissionTitle;

  /// No description provided for @notificationPermissionEnabledBody.
  ///
  /// In zh, this message translates to:
  /// **'系统已允许通知。需要关闭时，请通过开关进入系统设置。'**
  String get notificationPermissionEnabledBody;

  /// No description provided for @notificationPermissionDisabledBody.
  ///
  /// In zh, this message translates to:
  /// **'系统通知权限未开启。打开开关后会请求系统权限。'**
  String get notificationPermissionDisabledBody;

  /// No description provided for @aboutTitle.
  ///
  /// In zh, this message translates to:
  /// **'关于'**
  String get aboutTitle;

  /// No description provided for @aboutChurchTitle.
  ///
  /// In zh, this message translates to:
  /// **'关于教会'**
  String get aboutChurchTitle;

  /// No description provided for @churchAddressTitle.
  ///
  /// In zh, this message translates to:
  /// **'地址 / 地图'**
  String get churchAddressTitle;

  /// No description provided for @churchPhoneTitle.
  ///
  /// In zh, this message translates to:
  /// **'联系电话'**
  String get churchPhoneTitle;

  /// No description provided for @churchEmailTitle.
  ///
  /// In zh, this message translates to:
  /// **'联系邮箱'**
  String get churchEmailTitle;

  /// No description provided for @privacyPolicyTitle.
  ///
  /// In zh, this message translates to:
  /// **'隐私政策'**
  String get privacyPolicyTitle;

  /// No description provided for @termsOfUseTitle.
  ///
  /// In zh, this message translates to:
  /// **'使用条款'**
  String get termsOfUseTitle;

  /// No description provided for @appVersionTitle.
  ///
  /// In zh, this message translates to:
  /// **'App 版本'**
  String get appVersionTitle;

  /// No description provided for @appVersionValue.
  ///
  /// In zh, this message translates to:
  /// **'版本 {version}'**
  String appVersionValue(String version);

  /// No description provided for @periodPickerTooltip.
  ///
  /// In zh, this message translates to:
  /// **'选择日期范围'**
  String get periodPickerTooltip;

  /// No description provided for @periodThisWeek.
  ///
  /// In zh, this message translates to:
  /// **'本周'**
  String get periodThisWeek;

  /// No description provided for @periodThisMonth.
  ///
  /// In zh, this message translates to:
  /// **'本月'**
  String get periodThisMonth;

  /// No description provided for @periodPreviousAction.
  ///
  /// In zh, this message translates to:
  /// **'上一段'**
  String get periodPreviousAction;

  /// No description provided for @periodNextAction.
  ///
  /// In zh, this message translates to:
  /// **'下一段'**
  String get periodNextAction;

  /// No description provided for @periodApplyAction.
  ///
  /// In zh, this message translates to:
  /// **'应用'**
  String get periodApplyAction;

  /// No description provided for @languageTitle.
  ///
  /// In zh, this message translates to:
  /// **'语言'**
  String get languageTitle;

  /// No description provided for @systemLanguageLabel.
  ///
  /// In zh, this message translates to:
  /// **'系统语言'**
  String get systemLanguageLabel;

  /// No description provided for @languageSystemBody.
  ///
  /// In zh, this message translates to:
  /// **'App 默认跟随系统语言。需要切换语言时，请在系统原生设置中修改此 App 的语言。'**
  String get languageSystemBody;

  /// No description provided for @openSystemSettingsAction.
  ///
  /// In zh, this message translates to:
  /// **'打开系统设置'**
  String get openSystemSettingsAction;

  /// No description provided for @bibleTranslationLabel.
  ///
  /// In zh, this message translates to:
  /// **'圣经版本'**
  String get bibleTranslationLabel;

  /// No description provided for @studyTitle.
  ///
  /// In zh, this message translates to:
  /// **'读经'**
  String get studyTitle;

  /// No description provided for @bibleSearchTooltip.
  ///
  /// In zh, this message translates to:
  /// **'搜索经文'**
  String get bibleSearchTooltip;

  /// No description provided for @bibleSearchTitle.
  ///
  /// In zh, this message translates to:
  /// **'搜索经文'**
  String get bibleSearchTitle;

  /// No description provided for @bibleSearchHint.
  ///
  /// In zh, this message translates to:
  /// **'输入一句经文或关键词'**
  String get bibleSearchHint;

  /// No description provided for @bibleSearchStartTitle.
  ///
  /// In zh, this message translates to:
  /// **'搜索整本圣经'**
  String get bibleSearchStartTitle;

  /// No description provided for @bibleSearchStartBody.
  ///
  /// In zh, this message translates to:
  /// **'可以输入一句话、半句经文或几个关键词。搜索会使用当前 App 语言对应的圣经版本。'**
  String get bibleSearchStartBody;

  /// No description provided for @bibleSearchNoResultsTitle.
  ///
  /// In zh, this message translates to:
  /// **'没有找到匹配经文'**
  String get bibleSearchNoResultsTitle;

  /// No description provided for @bibleSearchNoResultsBody.
  ///
  /// In zh, this message translates to:
  /// **'可以减少关键词，或换一种说法。搜索会尝试宽松匹配，但太短的词可能会被忽略。'**
  String get bibleSearchNoResultsBody;

  /// No description provided for @bibleSearchErrorTitle.
  ///
  /// In zh, this message translates to:
  /// **'搜索失败'**
  String get bibleSearchErrorTitle;

  /// No description provided for @versePickerTooltip.
  ///
  /// In zh, this message translates to:
  /// **'选择经节'**
  String get versePickerTooltip;

  /// No description provided for @versePickerTitle.
  ///
  /// In zh, this message translates to:
  /// **'选择经节'**
  String get versePickerTitle;

  /// No description provided for @readerSettingsTooltip.
  ///
  /// In zh, this message translates to:
  /// **'阅读设置'**
  String get readerSettingsTooltip;

  /// No description provided for @readerSettingsTitle.
  ///
  /// In zh, this message translates to:
  /// **'阅读设置'**
  String get readerSettingsTitle;

  /// No description provided for @readerAssistsTitle.
  ///
  /// In zh, this message translates to:
  /// **'阅读辅助'**
  String get readerAssistsTitle;

  /// No description provided for @chapterPeopleAssistTitle.
  ///
  /// In zh, this message translates to:
  /// **'本章人物'**
  String get chapterPeopleAssistTitle;

  /// No description provided for @chapterPeopleAssistBody.
  ///
  /// In zh, this message translates to:
  /// **'在当前章节统一显示本章出现的圣经人物入口，不在每节反复标注。'**
  String get chapterPeopleAssistBody;

  /// No description provided for @chapterPlacesAssistTitle.
  ///
  /// In zh, this message translates to:
  /// **'本章地名'**
  String get chapterPlacesAssistTitle;

  /// No description provided for @chapterPlacesAssistBody.
  ///
  /// In zh, this message translates to:
  /// **'在当前章节统一显示本章出现的圣经地名入口，不在每节反复标注。'**
  String get chapterPlacesAssistBody;

  /// No description provided for @lexiconAssistTitle.
  ///
  /// In zh, this message translates to:
  /// **'原文词汇'**
  String get lexiconAssistTitle;

  /// No description provided for @lexiconAssistBody.
  ///
  /// In zh, this message translates to:
  /// **'经文有本地原文资料时，显示词汇解释入口。'**
  String get lexiconAssistBody;

  /// No description provided for @aiStudyHintsAssistTitle.
  ///
  /// In zh, this message translates to:
  /// **'AI 解经提示'**
  String get aiStudyHintsAssistTitle;

  /// No description provided for @aiStudyHintsAssistBody.
  ///
  /// In zh, this message translates to:
  /// **'启用长按经文释义和相关学习提示。'**
  String get aiStudyHintsAssistBody;

  /// No description provided for @chapterPeopleTooltip.
  ///
  /// In zh, this message translates to:
  /// **'本章人物'**
  String get chapterPeopleTooltip;

  /// No description provided for @chapterPeopleTitle.
  ///
  /// In zh, this message translates to:
  /// **'本章人物'**
  String get chapterPeopleTitle;

  /// No description provided for @chapterPlacesTooltip.
  ///
  /// In zh, this message translates to:
  /// **'本章地名'**
  String get chapterPlacesTooltip;

  /// No description provided for @chapterPlacesTitle.
  ///
  /// In zh, this message translates to:
  /// **'本章地名'**
  String get chapterPlacesTitle;

  /// No description provided for @continueReadingTitle.
  ///
  /// In zh, this message translates to:
  /// **'继续阅读'**
  String get continueReadingTitle;

  /// No description provided for @continueReadingAction.
  ///
  /// In zh, this message translates to:
  /// **'继续'**
  String get continueReadingAction;

  /// No description provided for @defaultContinueReadingTitle.
  ///
  /// In zh, this message translates to:
  /// **'罗马书 8'**
  String get defaultContinueReadingTitle;

  /// No description provided for @defaultContinueReadingSubtitle.
  ///
  /// In zh, this message translates to:
  /// **'从罗马书 8 继续'**
  String get defaultContinueReadingSubtitle;

  /// No description provided for @continueReadingChapterSubtitle.
  ///
  /// In zh, this message translates to:
  /// **'从 {bookName} {chapter} 继续'**
  String continueReadingChapterSubtitle(String bookName, int chapter);

  /// No description provided for @continueReadingVerseSubtitle.
  ///
  /// In zh, this message translates to:
  /// **'上次读到 {chapter}:{verse} · {bookName}'**
  String continueReadingVerseSubtitle(
    int chapter,
    String verse,
    String bookName,
  );

  /// No description provided for @readingPlansTitle.
  ///
  /// In zh, this message translates to:
  /// **'我的读经计划'**
  String get readingPlansTitle;

  /// No description provided for @readingPlansBody.
  ///
  /// In zh, this message translates to:
  /// **'继续当前计划，使用本地经文阅读或朗读。'**
  String get readingPlansBody;

  /// No description provided for @readingPlanStartAction.
  ///
  /// In zh, this message translates to:
  /// **'开始'**
  String get readingPlanStartAction;

  /// No description provided for @readingPlanContinueAction.
  ///
  /// In zh, this message translates to:
  /// **'继续'**
  String get readingPlanContinueAction;

  /// No description provided for @readingPlanReadAction.
  ///
  /// In zh, this message translates to:
  /// **'阅读'**
  String get readingPlanReadAction;

  /// No description provided for @readingPlanCompleteDayAction.
  ///
  /// In zh, this message translates to:
  /// **'标记完成'**
  String get readingPlanCompleteDayAction;

  /// No description provided for @readingPlanCompletedLabel.
  ///
  /// In zh, this message translates to:
  /// **'已完成'**
  String get readingPlanCompletedLabel;

  /// No description provided for @readingPlanNoDaysBody.
  ///
  /// In zh, this message translates to:
  /// **'这个计划还没有每日经文引用。'**
  String get readingPlanNoDaysBody;

  /// No description provided for @readingPlanLoadErrorTitle.
  ///
  /// In zh, this message translates to:
  /// **'读经计划载入失败'**
  String get readingPlanLoadErrorTitle;

  /// No description provided for @readingPlanLoadErrorBody.
  ///
  /// In zh, this message translates to:
  /// **'请刷新后再试一次。'**
  String get readingPlanLoadErrorBody;

  /// No description provided for @readingPlanActionError.
  ///
  /// In zh, this message translates to:
  /// **'读经计划更新失败，请再试一次。'**
  String get readingPlanActionError;

  /// No description provided for @readingPlanDaysLabel.
  ///
  /// In zh, this message translates to:
  /// **'{count} 天'**
  String readingPlanDaysLabel(int count);

  /// No description provided for @readingPlanDayLabel.
  ///
  /// In zh, this message translates to:
  /// **'第 {dayNumber} 天'**
  String readingPlanDayLabel(int dayNumber);

  /// No description provided for @readingPlanProgressLabel.
  ///
  /// In zh, this message translates to:
  /// **'已完成 {completed}/{total}'**
  String readingPlanProgressLabel(int completed, int total);

  /// No description provided for @mineReadingPlansTitle.
  ///
  /// In zh, this message translates to:
  /// **'我的读经计划'**
  String get mineReadingPlansTitle;

  /// No description provided for @mineReadingPlansBody.
  ///
  /// In zh, this message translates to:
  /// **'查看我的读经计划和完成进度。'**
  String get mineReadingPlansBody;

  /// No description provided for @mineReadingPlansEmpty.
  ///
  /// In zh, this message translates to:
  /// **'从读经页面开始一个计划后，进度会显示在这里。'**
  String get mineReadingPlansEmpty;

  /// No description provided for @mineReadingPlansOpenStudyAction.
  ///
  /// In zh, this message translates to:
  /// **'打开读经'**
  String get mineReadingPlansOpenStudyAction;

  /// No description provided for @readingPlanCurrentTab.
  ///
  /// In zh, this message translates to:
  /// **'进行中'**
  String get readingPlanCurrentTab;

  /// No description provided for @readingPlanHistoryTab.
  ///
  /// In zh, this message translates to:
  /// **'历史'**
  String get readingPlanHistoryTab;

  /// No description provided for @readingPlanCurrentEmpty.
  ///
  /// In zh, this message translates to:
  /// **'当前没有进行中的读经计划。'**
  String get readingPlanCurrentEmpty;

  /// No description provided for @readingPlanHistoryEmpty.
  ///
  /// In zh, this message translates to:
  /// **'已完成或已结束的计划会显示在这里。'**
  String get readingPlanHistoryEmpty;

  /// No description provided for @readingPlanViewAllAction.
  ///
  /// In zh, this message translates to:
  /// **'查看计划'**
  String get readingPlanViewAllAction;

  /// No description provided for @readingPlanRestartAction.
  ///
  /// In zh, this message translates to:
  /// **'重新开始'**
  String get readingPlanRestartAction;

  /// No description provided for @readingPlanLoadMoreAction.
  ///
  /// In zh, this message translates to:
  /// **'加载更多'**
  String get readingPlanLoadMoreAction;

  /// No description provided for @readingPlanPauseAction.
  ///
  /// In zh, this message translates to:
  /// **'暂停'**
  String get readingPlanPauseAction;

  /// No description provided for @readingPlanResumeAction.
  ///
  /// In zh, this message translates to:
  /// **'继续'**
  String get readingPlanResumeAction;

  /// No description provided for @readingPlanAbandonAction.
  ///
  /// In zh, this message translates to:
  /// **'结束计划'**
  String get readingPlanAbandonAction;

  /// No description provided for @readingPlanAbandonConfirmBody.
  ///
  /// In zh, this message translates to:
  /// **'结束本次计划并移入历史吗？已保存的进度仍会保留。'**
  String get readingPlanAbandonConfirmBody;

  /// No description provided for @readingPlanNotStartedLabel.
  ///
  /// In zh, this message translates to:
  /// **'未开始'**
  String get readingPlanNotStartedLabel;

  /// No description provided for @readingPlanActiveLabel.
  ///
  /// In zh, this message translates to:
  /// **'进行中'**
  String get readingPlanActiveLabel;

  /// No description provided for @readingPlanPausedLabel.
  ///
  /// In zh, this message translates to:
  /// **'已暂停'**
  String get readingPlanPausedLabel;

  /// No description provided for @readingPlanAbandonedLabel.
  ///
  /// In zh, this message translates to:
  /// **'已结束'**
  String get readingPlanAbandonedLabel;

  /// No description provided for @readingPlanAttemptLabel.
  ///
  /// In zh, this message translates to:
  /// **'第 {attempt} 次'**
  String readingPlanAttemptLabel(int attempt);

  /// No description provided for @readingPlanStartedOn.
  ///
  /// In zh, this message translates to:
  /// **'开始于 {date}'**
  String readingPlanStartedOn(String date);

  /// No description provided for @readingPlanEndedOn.
  ///
  /// In zh, this message translates to:
  /// **'结束于 {date}'**
  String readingPlanEndedOn(String date);

  /// No description provided for @readingPlanHistoryDetailTitle.
  ///
  /// In zh, this message translates to:
  /// **'计划详情'**
  String get readingPlanHistoryDetailTitle;

  /// No description provided for @readingPlanNoteLabel.
  ///
  /// In zh, this message translates to:
  /// **'笔记'**
  String get readingPlanNoteLabel;

  /// No description provided for @readingPlanRestartedMessage.
  ///
  /// In zh, this message translates to:
  /// **'新的读经计划已开始。'**
  String get readingPlanRestartedMessage;

  /// No description provided for @mineReadingPlanProgressChip.
  ///
  /// In zh, this message translates to:
  /// **'已完成 {completed}'**
  String mineReadingPlanProgressChip(int completed);

  /// No description provided for @oldTestamentLabel.
  ///
  /// In zh, this message translates to:
  /// **'旧约'**
  String get oldTestamentLabel;

  /// No description provided for @newTestamentLabel.
  ///
  /// In zh, this message translates to:
  /// **'新约'**
  String get newTestamentLabel;

  /// No description provided for @bibleBookCountLabel.
  ///
  /// In zh, this message translates to:
  /// **'{count} 卷'**
  String bibleBookCountLabel(int count);

  /// No description provided for @bibleChapterCountLabel.
  ///
  /// In zh, this message translates to:
  /// **'{count} 章'**
  String bibleChapterCountLabel(int count);

  /// No description provided for @bibleChapterCountWithName.
  ///
  /// In zh, this message translates to:
  /// **'{count} 章 · {bookName}'**
  String bibleChapterCountWithName(int count, String bookName);

  /// No description provided for @bibleChapterReference.
  ///
  /// In zh, this message translates to:
  /// **'{bookName} {chapter}'**
  String bibleChapterReference(String bookName, int chapter);

  /// No description provided for @bibleChapterButtonSemanticLabel.
  ///
  /// In zh, this message translates to:
  /// **'{bookName}第 {chapter} 章'**
  String bibleChapterButtonSemanticLabel(String bookName, int chapter);

  /// No description provided for @categoryLaw.
  ///
  /// In zh, this message translates to:
  /// **'摩西五经'**
  String get categoryLaw;

  /// No description provided for @categoryOldTestamentHistory.
  ///
  /// In zh, this message translates to:
  /// **'历史书'**
  String get categoryOldTestamentHistory;

  /// No description provided for @categoryWisdom.
  ///
  /// In zh, this message translates to:
  /// **'诗歌智慧书'**
  String get categoryWisdom;

  /// No description provided for @categoryMajorProphets.
  ///
  /// In zh, this message translates to:
  /// **'大先知书'**
  String get categoryMajorProphets;

  /// No description provided for @categoryMinorProphets.
  ///
  /// In zh, this message translates to:
  /// **'小先知书'**
  String get categoryMinorProphets;

  /// No description provided for @categoryGospels.
  ///
  /// In zh, this message translates to:
  /// **'福音书'**
  String get categoryGospels;

  /// No description provided for @categoryActs.
  ///
  /// In zh, this message translates to:
  /// **'历史书'**
  String get categoryActs;

  /// No description provided for @categoryPaulineLetters.
  ///
  /// In zh, this message translates to:
  /// **'保罗书信'**
  String get categoryPaulineLetters;

  /// No description provided for @categoryGeneralLetters.
  ///
  /// In zh, this message translates to:
  /// **'普通书信'**
  String get categoryGeneralLetters;

  /// No description provided for @categoryApocalyptic.
  ///
  /// In zh, this message translates to:
  /// **'启示文学'**
  String get categoryApocalyptic;

  /// No description provided for @studyLoadErrorTitle.
  ///
  /// In zh, this message translates to:
  /// **'圣经目录载入失败'**
  String get studyLoadErrorTitle;

  /// No description provided for @studyLoadErrorBody.
  ///
  /// In zh, this message translates to:
  /// **'请稍后重试，或检查本地圣经种子数据是否已正确打包。'**
  String get studyLoadErrorBody;

  /// No description provided for @readerFallbackTitle.
  ///
  /// In zh, this message translates to:
  /// **'读经'**
  String get readerFallbackTitle;

  /// No description provided for @previousChapterTooltip.
  ///
  /// In zh, this message translates to:
  /// **'上一章'**
  String get previousChapterTooltip;

  /// No description provided for @nextChapterTooltip.
  ///
  /// In zh, this message translates to:
  /// **'下一章'**
  String get nextChapterTooltip;

  /// No description provided for @readerLoadErrorTitle.
  ///
  /// In zh, this message translates to:
  /// **'章节载入失败'**
  String get readerLoadErrorTitle;

  /// No description provided for @readerLoadErrorBody.
  ///
  /// In zh, this message translates to:
  /// **'请稍后重试，或检查本地圣经数据是否完成导入。'**
  String get readerLoadErrorBody;

  /// No description provided for @emptyChapterBody.
  ///
  /// In zh, this message translates to:
  /// **'这一章暂时没有可显示的经文。'**
  String get emptyChapterBody;

  /// No description provided for @verseActionsTooltip.
  ///
  /// In zh, this message translates to:
  /// **'笔记与高亮'**
  String get verseActionsTooltip;

  /// No description provided for @verseActionsTitle.
  ///
  /// In zh, this message translates to:
  /// **'经文工具'**
  String get verseActionsTitle;

  /// No description provided for @bookmarkVerseTitle.
  ///
  /// In zh, this message translates to:
  /// **'收藏这一节'**
  String get bookmarkVerseTitle;

  /// No description provided for @highlightTitle.
  ///
  /// In zh, this message translates to:
  /// **'高亮'**
  String get highlightTitle;

  /// No description provided for @highlightNone.
  ///
  /// In zh, this message translates to:
  /// **'无'**
  String get highlightNone;

  /// No description provided for @highlightYellow.
  ///
  /// In zh, this message translates to:
  /// **'金色'**
  String get highlightYellow;

  /// No description provided for @highlightGreen.
  ///
  /// In zh, this message translates to:
  /// **'绿色'**
  String get highlightGreen;

  /// No description provided for @highlightBlue.
  ///
  /// In zh, this message translates to:
  /// **'蓝色'**
  String get highlightBlue;

  /// No description provided for @highlightRose.
  ///
  /// In zh, this message translates to:
  /// **'玫瑰色'**
  String get highlightRose;

  /// No description provided for @noteTitle.
  ///
  /// In zh, this message translates to:
  /// **'笔记'**
  String get noteTitle;

  /// No description provided for @noteHint.
  ///
  /// In zh, this message translates to:
  /// **'写下私人读经笔记'**
  String get noteHint;

  /// No description provided for @saveNoteAction.
  ///
  /// In zh, this message translates to:
  /// **'保存笔记'**
  String get saveNoteAction;

  /// No description provided for @verseNotesMyNotesTab.
  ///
  /// In zh, this message translates to:
  /// **'我的笔记'**
  String get verseNotesMyNotesTab;

  /// No description provided for @verseNotesChurchNotesTab.
  ///
  /// In zh, this message translates to:
  /// **'教会心得'**
  String get verseNotesChurchNotesTab;

  /// No description provided for @verseNotesPublishHint.
  ///
  /// In zh, this message translates to:
  /// **'发布后，其他使用此 App 的人读到这节经文时可以看到。'**
  String get verseNotesPublishHint;

  /// No description provided for @verseNotesDisplayNameHint.
  ///
  /// In zh, this message translates to:
  /// **'访客显示名'**
  String get verseNotesDisplayNameHint;

  /// No description provided for @verseNotesContentHint.
  ///
  /// In zh, this message translates to:
  /// **'分享你对这节经文的心得'**
  String get verseNotesContentHint;

  /// No description provided for @verseNotesPublishAction.
  ///
  /// In zh, this message translates to:
  /// **'分享'**
  String get verseNotesPublishAction;

  /// No description provided for @verseNotesUpdateAction.
  ///
  /// In zh, this message translates to:
  /// **'更新'**
  String get verseNotesUpdateAction;

  /// No description provided for @verseNotesDeleteAction.
  ///
  /// In zh, this message translates to:
  /// **'删除'**
  String get verseNotesDeleteAction;

  /// No description provided for @verseNotesYourReflectionTitle.
  ///
  /// In zh, this message translates to:
  /// **'我的心得'**
  String get verseNotesYourReflectionTitle;

  /// No description provided for @verseNotesSharedTitle.
  ///
  /// In zh, this message translates to:
  /// **'公开心得'**
  String get verseNotesSharedTitle;

  /// No description provided for @verseNotesCountLabel.
  ///
  /// In zh, this message translates to:
  /// **'{count} 条心得'**
  String verseNotesCountLabel(int count);

  /// No description provided for @verseNotesMineLabel.
  ///
  /// In zh, this message translates to:
  /// **'我的'**
  String get verseNotesMineLabel;

  /// No description provided for @verseNotesEmptyState.
  ///
  /// In zh, this message translates to:
  /// **'这节经文还没有公开心得。'**
  String get verseNotesEmptyState;

  /// No description provided for @verseNotesEmptyError.
  ///
  /// In zh, this message translates to:
  /// **'请先写下心得。'**
  String get verseNotesEmptyError;

  /// No description provided for @verseNotesGenericError.
  ///
  /// In zh, this message translates to:
  /// **'经文心得加载失败。'**
  String get verseNotesGenericError;

  /// No description provided for @studyChapterLabel.
  ///
  /// In zh, this message translates to:
  /// **'罗马书 8'**
  String get studyChapterLabel;

  /// No description provided for @translationLabel.
  ///
  /// In zh, this message translates to:
  /// **'和合本'**
  String get translationLabel;

  /// No description provided for @relatedSermonsLabel.
  ///
  /// In zh, this message translates to:
  /// **'{count} 篇相关讲道'**
  String relatedSermonsLabel(int count);

  /// No description provided for @verseNumberLabel.
  ///
  /// In zh, this message translates to:
  /// **'第 {verse} 节'**
  String verseNumberLabel(int verse);

  /// No description provided for @explanationTitleSuffix.
  ///
  /// In zh, this message translates to:
  /// **'{reference} 释义'**
  String explanationTitleSuffix(String reference);

  /// No description provided for @sourceLabel.
  ///
  /// In zh, this message translates to:
  /// **'依据来源'**
  String get sourceLabel;

  /// No description provided for @relatedVersesLabel.
  ///
  /// In zh, this message translates to:
  /// **'相关经文'**
  String get relatedVersesLabel;

  /// No description provided for @aiStudyDisclaimer.
  ///
  /// In zh, this message translates to:
  /// **'AI 解释供学习参考，重要神学或牧养问题请咨询牧者。'**
  String get aiStudyDisclaimer;

  /// No description provided for @aiStudySheetTitle.
  ///
  /// In zh, this message translates to:
  /// **'AI 查经辅助'**
  String get aiStudySheetTitle;

  /// No description provided for @aiStudyQuestionLabel.
  ///
  /// In zh, this message translates to:
  /// **'问题'**
  String get aiStudyQuestionLabel;

  /// No description provided for @aiStudyDefaultQuestion.
  ///
  /// In zh, this message translates to:
  /// **'请帮助我按上下文理解这节经文。'**
  String get aiStudyDefaultQuestion;

  /// No description provided for @aiStudyGenerateAction.
  ///
  /// In zh, this message translates to:
  /// **'生成查经辅助'**
  String get aiStudyGenerateAction;

  /// No description provided for @aiStudyRetryAction.
  ///
  /// In zh, this message translates to:
  /// **'重新提问'**
  String get aiStudyRetryAction;

  /// No description provided for @aiStudyResultTitle.
  ///
  /// In zh, this message translates to:
  /// **'学习回应'**
  String get aiStudyResultTitle;

  /// No description provided for @aiStudySignInTitle.
  ///
  /// In zh, this message translates to:
  /// **'需要登录'**
  String get aiStudySignInTitle;

  /// No description provided for @aiStudySignInBody.
  ///
  /// In zh, this message translates to:
  /// **'请先在“我的”页面登录，再使用 AI 查经辅助。'**
  String get aiStudySignInBody;

  /// No description provided for @aiStudyErrorTitle.
  ///
  /// In zh, this message translates to:
  /// **'AI 查经辅助暂不可用'**
  String get aiStudyErrorTitle;

  /// No description provided for @aiStudyProviderDisabled.
  ///
  /// In zh, this message translates to:
  /// **'AI 服务还没有配置完成，请等教会同工开启后再试。'**
  String get aiStudyProviderDisabled;

  /// No description provided for @aiStudyProviderFailed.
  ///
  /// In zh, this message translates to:
  /// **'AI 服务暂时没有响应，请稍后重试。'**
  String get aiStudyProviderFailed;

  /// No description provided for @aiStudyRateLimited.
  ///
  /// In zh, this message translates to:
  /// **'AI 请求太频繁了，请稍等后再试。'**
  String get aiStudyRateLimited;

  /// No description provided for @lexiconLoveTitle.
  ///
  /// In zh, this message translates to:
  /// **'爱 / agape'**
  String get lexiconLoveTitle;

  /// No description provided for @lexiconGoodTitle.
  ///
  /// In zh, this message translates to:
  /// **'益处 / agathon'**
  String get lexiconGoodTitle;

  /// No description provided for @lexiconLoveBody.
  ///
  /// In zh, this message translates to:
  /// **'希腊文 ἀγάπη，常用于表达出于神主动、坚定、盟约性的爱。'**
  String get lexiconLoveBody;

  /// No description provided for @lexiconGoodBody.
  ///
  /// In zh, this message translates to:
  /// **'希腊文 ἀγαθόν，指良善、有益处的结果。罗马书 8:28 的重点不是环境本身舒服，而是神最终成就的良善目的。'**
  String get lexiconGoodBody;

  /// No description provided for @confirmKnown.
  ///
  /// In zh, this message translates to:
  /// **'知道了'**
  String get confirmKnown;

  /// No description provided for @sermonsTitle.
  ///
  /// In zh, this message translates to:
  /// **'讲道'**
  String get sermonsTitle;

  /// No description provided for @searchSermonsTooltip.
  ///
  /// In zh, this message translates to:
  /// **'搜索讲道'**
  String get searchSermonsTooltip;

  /// No description provided for @sermonFilterTooltip.
  ///
  /// In zh, this message translates to:
  /// **'筛选讲道'**
  String get sermonFilterTooltip;

  /// No description provided for @sermonFilterTitle.
  ///
  /// In zh, this message translates to:
  /// **'筛选讲道'**
  String get sermonFilterTitle;

  /// No description provided for @sermonFilterSpeakerLabel.
  ///
  /// In zh, this message translates to:
  /// **'讲员'**
  String get sermonFilterSpeakerLabel;

  /// No description provided for @sermonFilterSeriesLabel.
  ///
  /// In zh, this message translates to:
  /// **'系列'**
  String get sermonFilterSeriesLabel;

  /// No description provided for @sermonFilterTopicLabel.
  ///
  /// In zh, this message translates to:
  /// **'主题'**
  String get sermonFilterTopicLabel;

  /// No description provided for @sermonFilterClearAction.
  ///
  /// In zh, this message translates to:
  /// **'清除筛选'**
  String get sermonFilterClearAction;

  /// No description provided for @sermonFilterLoadError.
  ///
  /// In zh, this message translates to:
  /// **'筛选条件暂时无法加载，请稍后重试。'**
  String get sermonFilterLoadError;

  /// No description provided for @sermonDetailTitle.
  ///
  /// In zh, this message translates to:
  /// **'讲道详情'**
  String get sermonDetailTitle;

  /// No description provided for @sermonContinueListeningTitle.
  ///
  /// In zh, this message translates to:
  /// **'继续收听'**
  String get sermonContinueListeningTitle;

  /// No description provided for @sermonStudyNotesTitle.
  ///
  /// In zh, this message translates to:
  /// **'讲义'**
  String get sermonStudyNotesTitle;

  /// No description provided for @sermonSummaryTitle.
  ///
  /// In zh, this message translates to:
  /// **'讲道重点'**
  String get sermonSummaryTitle;

  /// No description provided for @sermonOpenDetailAction.
  ///
  /// In zh, this message translates to:
  /// **'查看讲道详情'**
  String get sermonOpenDetailAction;

  /// No description provided for @sermonOutlineTitle.
  ///
  /// In zh, this message translates to:
  /// **'沉浸式讲义'**
  String get sermonOutlineTitle;

  /// No description provided for @sermonReferencesTitle.
  ///
  /// In zh, this message translates to:
  /// **'讲道引用经文'**
  String get sermonReferencesTitle;

  /// No description provided for @sermonTranscriptTitle.
  ///
  /// In zh, this message translates to:
  /// **'讲道文本'**
  String get sermonTranscriptTitle;

  /// No description provided for @sermonSectionNotesLabel.
  ///
  /// In zh, this message translates to:
  /// **'讲义'**
  String get sermonSectionNotesLabel;

  /// No description provided for @sermonSectionReferencesLabel.
  ///
  /// In zh, this message translates to:
  /// **'经文'**
  String get sermonSectionReferencesLabel;

  /// No description provided for @sermonSectionTranscriptLabel.
  ///
  /// In zh, this message translates to:
  /// **'文稿'**
  String get sermonSectionTranscriptLabel;

  /// No description provided for @sermonPlaybackSpeedTitle.
  ///
  /// In zh, this message translates to:
  /// **'播放速度'**
  String get sermonPlaybackSpeedTitle;

  /// No description provided for @sermonTranscriptReadAction.
  ///
  /// In zh, this message translates to:
  /// **'阅读文本'**
  String get sermonTranscriptReadAction;

  /// No description provided for @sermonTranscriptCollapseAction.
  ///
  /// In zh, this message translates to:
  /// **'收起'**
  String get sermonTranscriptCollapseAction;

  /// No description provided for @sermonAiAskAction.
  ///
  /// In zh, this message translates to:
  /// **'询问这篇讲道'**
  String get sermonAiAskAction;

  /// No description provided for @sermonDiscussionTitle.
  ///
  /// In zh, this message translates to:
  /// **'讲道讨论包'**
  String get sermonDiscussionTitle;

  /// No description provided for @sermonDiscussionPrivateLabel.
  ///
  /// In zh, this message translates to:
  /// **'私密回应'**
  String get sermonDiscussionPrivateLabel;

  /// No description provided for @sermonDiscussionQuestionsTitle.
  ///
  /// In zh, this message translates to:
  /// **'讨论问题'**
  String get sermonDiscussionQuestionsTitle;

  /// No description provided for @sermonDiscussionActionStepsTitle.
  ///
  /// In zh, this message translates to:
  /// **'行动回应'**
  String get sermonDiscussionActionStepsTitle;

  /// No description provided for @sermonDiscussionPrayerTitle.
  ///
  /// In zh, this message translates to:
  /// **'祷告方向'**
  String get sermonDiscussionPrayerTitle;

  /// No description provided for @sermonDiscussionRespondAction.
  ///
  /// In zh, this message translates to:
  /// **'写回应'**
  String get sermonDiscussionRespondAction;

  /// No description provided for @sermonDiscussionResponseTitle.
  ///
  /// In zh, this message translates to:
  /// **'个人回应'**
  String get sermonDiscussionResponseTitle;

  /// No description provided for @sermonDiscussionResponseHint.
  ///
  /// In zh, this message translates to:
  /// **'写下你的心得或下一步行动'**
  String get sermonDiscussionResponseHint;

  /// No description provided for @sermonDiscussionResponsePrivateNote.
  ///
  /// In zh, this message translates to:
  /// **'你的回应默认只对自己可见。'**
  String get sermonDiscussionResponsePrivateNote;

  /// No description provided for @sermonDiscussionSubmitAction.
  ///
  /// In zh, this message translates to:
  /// **'提交'**
  String get sermonDiscussionSubmitAction;

  /// No description provided for @sermonDiscussionSubmitted.
  ///
  /// In zh, this message translates to:
  /// **'回应已保存。'**
  String get sermonDiscussionSubmitted;

  /// No description provided for @sermonDiscussionError.
  ///
  /// In zh, this message translates to:
  /// **'回应保存失败，请再试一次。'**
  String get sermonDiscussionError;

  /// No description provided for @sermonDiscussionLoadError.
  ///
  /// In zh, this message translates to:
  /// **'讨论材料加载失败。'**
  String get sermonDiscussionLoadError;

  /// No description provided for @sermonDiscussionObservationChip.
  ///
  /// In zh, this message translates to:
  /// **'观察'**
  String get sermonDiscussionObservationChip;

  /// No description provided for @sermonDiscussionInterpretationChip.
  ///
  /// In zh, this message translates to:
  /// **'解释'**
  String get sermonDiscussionInterpretationChip;

  /// No description provided for @sermonDiscussionApplicationChip.
  ///
  /// In zh, this message translates to:
  /// **'应用'**
  String get sermonDiscussionApplicationChip;

  /// No description provided for @sermonDiscussionPrayerChip.
  ///
  /// In zh, this message translates to:
  /// **'祷告'**
  String get sermonDiscussionPrayerChip;

  /// No description provided for @sermonDiscussionActionChip.
  ///
  /// In zh, this message translates to:
  /// **'行动'**
  String get sermonDiscussionActionChip;

  /// No description provided for @sermonAiSheetTitle.
  ///
  /// In zh, this message translates to:
  /// **'讲道问答'**
  String get sermonAiSheetTitle;

  /// No description provided for @sermonAiDefaultQuestion.
  ///
  /// In zh, this message translates to:
  /// **'请帮助我理解这篇讲道的重点。'**
  String get sermonAiDefaultQuestion;

  /// No description provided for @sermonAiGenerateAction.
  ///
  /// In zh, this message translates to:
  /// **'生成讲道回答'**
  String get sermonAiGenerateAction;

  /// No description provided for @relatedSermonsTitle.
  ///
  /// In zh, this message translates to:
  /// **'相关讲道'**
  String get relatedSermonsTitle;

  /// No description provided for @sermonLoadErrorTitle.
  ///
  /// In zh, this message translates to:
  /// **'讲道数据暂时无法加载'**
  String get sermonLoadErrorTitle;

  /// No description provided for @sermonLoadErrorBody.
  ///
  /// In zh, this message translates to:
  /// **'稍后会从后端重新获取讲道列表。'**
  String get sermonLoadErrorBody;

  /// No description provided for @retryAction.
  ///
  /// In zh, this message translates to:
  /// **'重试'**
  String get retryAction;

  /// No description provided for @sermonEmptyTitle.
  ///
  /// In zh, this message translates to:
  /// **'暂无讲道内容'**
  String get sermonEmptyTitle;

  /// No description provided for @sermonAudioMissing.
  ///
  /// In zh, this message translates to:
  /// **'暂未上传音频'**
  String get sermonAudioMissing;

  /// No description provided for @sermonAudioPreparing.
  ///
  /// In zh, this message translates to:
  /// **'正在准备音频'**
  String get sermonAudioPreparing;

  /// No description provided for @sermonAudioLoading.
  ///
  /// In zh, this message translates to:
  /// **'正在加载音频'**
  String get sermonAudioLoading;

  /// No description provided for @sermonAudioReady.
  ///
  /// In zh, this message translates to:
  /// **'可以播放'**
  String get sermonAudioReady;

  /// No description provided for @sermonAudioUnavailable.
  ///
  /// In zh, this message translates to:
  /// **'音频暂时无法加载'**
  String get sermonAudioUnavailable;

  /// No description provided for @rewindTooltip.
  ///
  /// In zh, this message translates to:
  /// **'后退 15 秒'**
  String get rewindTooltip;

  /// No description provided for @playTooltip.
  ///
  /// In zh, this message translates to:
  /// **'播放'**
  String get playTooltip;

  /// No description provided for @forwardTooltip.
  ///
  /// In zh, this message translates to:
  /// **'前进 30 秒'**
  String get forwardTooltip;

  /// No description provided for @lifeTitle.
  ///
  /// In zh, this message translates to:
  /// **'教会生活'**
  String get lifeTitle;

  /// No description provided for @notificationsTooltip.
  ///
  /// In zh, this message translates to:
  /// **'通知'**
  String get notificationsTooltip;

  /// No description provided for @notificationsPageTitle.
  ///
  /// In zh, this message translates to:
  /// **'通知'**
  String get notificationsPageTitle;

  /// No description provided for @notificationInboxTitle.
  ///
  /// In zh, this message translates to:
  /// **'最近通知'**
  String get notificationInboxTitle;

  /// No description provided for @unreadCountSemanticLabel.
  ///
  /// In zh, this message translates to:
  /// **'{label}，{count} 条未读'**
  String unreadCountSemanticLabel(String label, int count);

  /// No description provided for @notificationInboxEmptyTitle.
  ///
  /// In zh, this message translates to:
  /// **'暂无通知'**
  String get notificationInboxEmptyTitle;

  /// No description provided for @notificationInboxEmptyBody.
  ///
  /// In zh, this message translates to:
  /// **'这台设备收到新的教会更新后会显示在这里。'**
  String get notificationInboxEmptyBody;

  /// No description provided for @notificationRefreshAction.
  ///
  /// In zh, this message translates to:
  /// **'刷新通知'**
  String get notificationRefreshAction;

  /// No description provided for @notificationMarkAllReadAction.
  ///
  /// In zh, this message translates to:
  /// **'全部标为已读'**
  String get notificationMarkAllReadAction;

  /// No description provided for @notificationClearAction.
  ///
  /// In zh, this message translates to:
  /// **'清空通知'**
  String get notificationClearAction;

  /// No description provided for @notificationDeviceUnavailableBody.
  ///
  /// In zh, this message translates to:
  /// **'当前构建还没有接入 Firebase 应用配置，暂时无法启用推送。'**
  String get notificationDeviceUnavailableBody;

  /// No description provided for @weeklyBulletinTitle.
  ///
  /// In zh, this message translates to:
  /// **'本周周报'**
  String get weeklyBulletinTitle;

  /// No description provided for @lifeSundayHeroEmptyBody.
  ///
  /// In zh, this message translates to:
  /// **'同工发布本周主日信息后，会显示在这里。'**
  String get lifeSundayHeroEmptyBody;

  /// No description provided for @lifeTabWeek.
  ///
  /// In zh, this message translates to:
  /// **'本周'**
  String get lifeTabWeek;

  /// No description provided for @lifeTabEvents.
  ///
  /// In zh, this message translates to:
  /// **'活动'**
  String get lifeTabEvents;

  /// No description provided for @lifeTabGroups.
  ///
  /// In zh, this message translates to:
  /// **'小组'**
  String get lifeTabGroups;

  /// No description provided for @lifeTabCourses.
  ///
  /// In zh, this message translates to:
  /// **'课程'**
  String get lifeTabCourses;

  /// No description provided for @lifeTabServing.
  ///
  /// In zh, this message translates to:
  /// **'服事'**
  String get lifeTabServing;

  /// No description provided for @lifeTabPrayer.
  ///
  /// In zh, this message translates to:
  /// **'代祷'**
  String get lifeTabPrayer;

  /// No description provided for @lifeTabWeekEmpty.
  ///
  /// In zh, this message translates to:
  /// **'新的教会生活卡片发布后会显示在这里。'**
  String get lifeTabWeekEmpty;

  /// No description provided for @lifeTabEventsEmpty.
  ///
  /// In zh, this message translates to:
  /// **'当前暂无开放的活动卡片。'**
  String get lifeTabEventsEmpty;

  /// No description provided for @lifeTabMemberSignInBody.
  ///
  /// In zh, this message translates to:
  /// **'请到“我的”登录后查看会友专属的小组、课程、服事和关怀卡片。'**
  String get lifeTabMemberSignInBody;

  /// No description provided for @lifeTabPrayerDisabled.
  ///
  /// In zh, this message translates to:
  /// **'当前构建暂未启用代祷请求。'**
  String get lifeTabPrayerDisabled;

  /// No description provided for @lifeOpenDetailAction.
  ///
  /// In zh, this message translates to:
  /// **'查看详情'**
  String get lifeOpenDetailAction;

  /// No description provided for @lifeUpdatesTitle.
  ///
  /// In zh, this message translates to:
  /// **'最新动态'**
  String get lifeUpdatesTitle;

  /// No description provided for @lifeParticipationTitle.
  ///
  /// In zh, this message translates to:
  /// **'我的参与'**
  String get lifeParticipationTitle;

  /// No description provided for @lifeLoadErrorTitle.
  ///
  /// In zh, this message translates to:
  /// **'教会生活数据暂时无法加载'**
  String get lifeLoadErrorTitle;

  /// No description provided for @lifeLoadErrorBody.
  ///
  /// In zh, this message translates to:
  /// **'稍后会从后端重新获取周报和生活信息。'**
  String get lifeLoadErrorBody;

  /// No description provided for @lifeSectionLoadError.
  ///
  /// In zh, this message translates to:
  /// **'此区域暂时无法加载，请重试。'**
  String get lifeSectionLoadError;

  /// No description provided for @lifeEmptyTitle.
  ///
  /// In zh, this message translates to:
  /// **'暂无教会生活内容'**
  String get lifeEmptyTitle;

  /// No description provided for @lifePostNoBody.
  ///
  /// In zh, this message translates to:
  /// **'详细内容会稍后补充。'**
  String get lifePostNoBody;

  /// No description provided for @lifePostVisibilityMembers.
  ///
  /// In zh, this message translates to:
  /// **'会众可见'**
  String get lifePostVisibilityMembers;

  /// No description provided for @lifePostVisibilityGroup.
  ///
  /// In zh, this message translates to:
  /// **'小组可见'**
  String get lifePostVisibilityGroup;

  /// No description provided for @lifePostVisibilityPrivate.
  ///
  /// In zh, this message translates to:
  /// **'私密'**
  String get lifePostVisibilityPrivate;

  /// No description provided for @lifePostTypeWeeklyBulletin.
  ///
  /// In zh, this message translates to:
  /// **'周报'**
  String get lifePostTypeWeeklyBulletin;

  /// No description provided for @lifePostTypeSunday.
  ///
  /// In zh, this message translates to:
  /// **'主日'**
  String get lifePostTypeSunday;

  /// No description provided for @lifePostTypeAnnouncement.
  ///
  /// In zh, this message translates to:
  /// **'公告'**
  String get lifePostTypeAnnouncement;

  /// No description provided for @lifePostTypeEvent.
  ///
  /// In zh, this message translates to:
  /// **'活动'**
  String get lifePostTypeEvent;

  /// No description provided for @lifePostTypeGroup.
  ///
  /// In zh, this message translates to:
  /// **'小组'**
  String get lifePostTypeGroup;

  /// No description provided for @lifePostTypeFellowship.
  ///
  /// In zh, this message translates to:
  /// **'团契'**
  String get lifePostTypeFellowship;

  /// No description provided for @lifePostTypeCourse.
  ///
  /// In zh, this message translates to:
  /// **'课程'**
  String get lifePostTypeCourse;

  /// No description provided for @lifePostTypeServing.
  ///
  /// In zh, this message translates to:
  /// **'服事'**
  String get lifePostTypeServing;

  /// No description provided for @lifePostTypePrayer.
  ///
  /// In zh, this message translates to:
  /// **'代祷'**
  String get lifePostTypePrayer;

  /// No description provided for @lifePostTypeGiving.
  ///
  /// In zh, this message translates to:
  /// **'奉献'**
  String get lifePostTypeGiving;

  /// No description provided for @lifePostUnread.
  ///
  /// In zh, this message translates to:
  /// **'未读'**
  String get lifePostUnread;

  /// No description provided for @lifePostActionOpen.
  ///
  /// In zh, this message translates to:
  /// **'打开链接'**
  String get lifePostActionOpen;

  /// No description provided for @lifePostScheduleTbd.
  ///
  /// In zh, this message translates to:
  /// **'时间待定'**
  String get lifePostScheduleTbd;

  /// No description provided for @myEventRegistrationsTitle.
  ///
  /// In zh, this message translates to:
  /// **'我的报名'**
  String get myEventRegistrationsTitle;

  /// No description provided for @groupsTitle.
  ///
  /// In zh, this message translates to:
  /// **'小组与团契'**
  String get groupsTitle;

  /// No description provided for @groupsEmptyBody.
  ///
  /// In zh, this message translates to:
  /// **'目前暂无可加入的小组或团契。'**
  String get groupsEmptyBody;

  /// No description provided for @groupApplyAction.
  ///
  /// In zh, this message translates to:
  /// **'申请加入'**
  String get groupApplyAction;

  /// No description provided for @groupAlreadyMember.
  ///
  /// In zh, this message translates to:
  /// **'你已在小组中'**
  String get groupAlreadyMember;

  /// No description provided for @groupApplicationSubmitted.
  ///
  /// In zh, this message translates to:
  /// **'申请已提交'**
  String get groupApplicationSubmitted;

  /// No description provided for @groupApplicationSubmitSuccess.
  ///
  /// In zh, this message translates to:
  /// **'申请已提交。'**
  String get groupApplicationSubmitSuccess;

  /// No description provided for @groupWithdrawAction.
  ///
  /// In zh, this message translates to:
  /// **'撤回申请'**
  String get groupWithdrawAction;

  /// No description provided for @groupApplicationWithdrawSuccess.
  ///
  /// In zh, this message translates to:
  /// **'申请已撤回。'**
  String get groupApplicationWithdrawSuccess;

  /// No description provided for @groupCapacityFull.
  ///
  /// In zh, this message translates to:
  /// **'小组已满员'**
  String get groupCapacityFull;

  /// No description provided for @groupMyGroupsTitle.
  ///
  /// In zh, this message translates to:
  /// **'我的小组'**
  String get groupMyGroupsTitle;

  /// No description provided for @groupMyGroupsEmptyBody.
  ///
  /// In zh, this message translates to:
  /// **'你目前还没有加入小组。'**
  String get groupMyGroupsEmptyBody;

  /// No description provided for @groupSignInToViewMineBody.
  ///
  /// In zh, this message translates to:
  /// **'登录后可在不同设备查看你的小组。'**
  String get groupSignInToViewMineBody;

  /// No description provided for @groupMemberCount.
  ///
  /// In zh, this message translates to:
  /// **'{count} 位成员'**
  String groupMemberCount(int count);

  /// No description provided for @groupMemberCapacity.
  ///
  /// In zh, this message translates to:
  /// **'{count}/{capacity} 位成员'**
  String groupMemberCapacity(int count, int capacity);

  /// No description provided for @coursesTitle.
  ///
  /// In zh, this message translates to:
  /// **'课程与学习'**
  String get coursesTitle;

  /// No description provided for @coursesEmptyBody.
  ///
  /// In zh, this message translates to:
  /// **'目前暂无开放的课程。'**
  String get coursesEmptyBody;

  /// No description provided for @courseMyCoursesTitle.
  ///
  /// In zh, this message translates to:
  /// **'我的课程'**
  String get courseMyCoursesTitle;

  /// No description provided for @courseMyCoursesEmptyBody.
  ///
  /// In zh, this message translates to:
  /// **'你目前还没有课程报名记录。'**
  String get courseMyCoursesEmptyBody;

  /// No description provided for @courseLessonsTitle.
  ///
  /// In zh, this message translates to:
  /// **'课程课次'**
  String get courseLessonsTitle;

  /// No description provided for @courseLessonsEmptyBody.
  ///
  /// In zh, this message translates to:
  /// **'这门课程尚未发布课次。'**
  String get courseLessonsEmptyBody;

  /// No description provided for @courseSignInToEnrollBody.
  ///
  /// In zh, this message translates to:
  /// **'登录后可报名课程，并在不同设备同步学习进度。'**
  String get courseSignInToEnrollBody;

  /// No description provided for @courseSignInToViewMineBody.
  ///
  /// In zh, this message translates to:
  /// **'登录后可查看正在学习和已经完成的课程。'**
  String get courseSignInToViewMineBody;

  /// No description provided for @courseEnrollAction.
  ///
  /// In zh, this message translates to:
  /// **'报名课程'**
  String get courseEnrollAction;

  /// No description provided for @courseSubmittedAction.
  ///
  /// In zh, this message translates to:
  /// **'已提交'**
  String get courseSubmittedAction;

  /// No description provided for @courseEnrolledAction.
  ///
  /// In zh, this message translates to:
  /// **'已报名'**
  String get courseEnrolledAction;

  /// No description provided for @courseWaitlistedAction.
  ///
  /// In zh, this message translates to:
  /// **'候补中'**
  String get courseWaitlistedAction;

  /// No description provided for @courseCancelledAction.
  ///
  /// In zh, this message translates to:
  /// **'已取消'**
  String get courseCancelledAction;

  /// No description provided for @courseCompletedAction.
  ///
  /// In zh, this message translates to:
  /// **'已完成'**
  String get courseCompletedAction;

  /// No description provided for @courseEnrollmentSubmitSuccess.
  ///
  /// In zh, this message translates to:
  /// **'课程报名已提交。'**
  String get courseEnrollmentSubmitSuccess;

  /// No description provided for @courseStatusDraft.
  ///
  /// In zh, this message translates to:
  /// **'草稿'**
  String get courseStatusDraft;

  /// No description provided for @courseStatusOpen.
  ///
  /// In zh, this message translates to:
  /// **'开放报名'**
  String get courseStatusOpen;

  /// No description provided for @courseStatusClosed.
  ///
  /// In zh, this message translates to:
  /// **'已关闭'**
  String get courseStatusClosed;

  /// No description provided for @courseStatusInProgress.
  ///
  /// In zh, this message translates to:
  /// **'进行中'**
  String get courseStatusInProgress;

  /// No description provided for @courseStatusCompleted.
  ///
  /// In zh, this message translates to:
  /// **'已完成'**
  String get courseStatusCompleted;

  /// No description provided for @courseStatusArchived.
  ///
  /// In zh, this message translates to:
  /// **'已归档'**
  String get courseStatusArchived;

  /// No description provided for @courseLessonCount.
  ///
  /// In zh, this message translates to:
  /// **'{count} 个课次'**
  String courseLessonCount(int count);

  /// No description provided for @courseCapacityOpen.
  ///
  /// In zh, this message translates to:
  /// **'名额开放'**
  String get courseCapacityOpen;

  /// No description provided for @courseCapacityLabel.
  ///
  /// In zh, this message translates to:
  /// **'{count}/{capacity} 个名额'**
  String courseCapacityLabel(int count, int capacity);

  /// No description provided for @courseProgressLabel.
  ///
  /// In zh, this message translates to:
  /// **'已完成 {completed}/{total} 个课次'**
  String courseProgressLabel(int completed, int total);

  /// No description provided for @servingTitle.
  ///
  /// In zh, this message translates to:
  /// **'我的服事'**
  String get servingTitle;

  /// No description provided for @servingEmptyBody.
  ///
  /// In zh, this message translates to:
  /// **'目前暂无服事安排。'**
  String get servingEmptyBody;

  /// No description provided for @servingConfirmAction.
  ///
  /// In zh, this message translates to:
  /// **'确认服事'**
  String get servingConfirmAction;

  /// No description provided for @servingLeaveAction.
  ///
  /// In zh, this message translates to:
  /// **'请假'**
  String get servingLeaveAction;

  /// No description provided for @servingConfirmSuccess.
  ///
  /// In zh, this message translates to:
  /// **'服事已确认。'**
  String get servingConfirmSuccess;

  /// No description provided for @servingLeaveSuccess.
  ///
  /// In zh, this message translates to:
  /// **'请假请求已提交。'**
  String get servingLeaveSuccess;

  /// No description provided for @servingStatusScheduled.
  ///
  /// In zh, this message translates to:
  /// **'待确认'**
  String get servingStatusScheduled;

  /// No description provided for @servingStatusConfirmed.
  ///
  /// In zh, this message translates to:
  /// **'已确认'**
  String get servingStatusConfirmed;

  /// No description provided for @servingStatusDeclined.
  ///
  /// In zh, this message translates to:
  /// **'已请假'**
  String get servingStatusDeclined;

  /// No description provided for @servingStatusSwapRequested.
  ///
  /// In zh, this message translates to:
  /// **'申请换班'**
  String get servingStatusSwapRequested;

  /// No description provided for @servingStatusCovered.
  ///
  /// In zh, this message translates to:
  /// **'已有替补'**
  String get servingStatusCovered;

  /// No description provided for @servingStatusCancelled.
  ///
  /// In zh, this message translates to:
  /// **'已取消'**
  String get servingStatusCancelled;

  /// No description provided for @servingScheduleTab.
  ///
  /// In zh, this message translates to:
  /// **'排班'**
  String get servingScheduleTab;

  /// No description provided for @servingAvailabilityTab.
  ///
  /// In zh, this message translates to:
  /// **'可用时间'**
  String get servingAvailabilityTab;

  /// No description provided for @servingAvailabilityEmptyBody.
  ///
  /// In zh, this message translates to:
  /// **'尚未提交可用时间。'**
  String get servingAvailabilityEmptyBody;

  /// No description provided for @servingAvailabilityAddAction.
  ///
  /// In zh, this message translates to:
  /// **'添加可用时间'**
  String get servingAvailabilityAddAction;

  /// No description provided for @servingAvailabilitySheetTitle.
  ///
  /// In zh, this message translates to:
  /// **'新的可用时间'**
  String get servingAvailabilitySheetTitle;

  /// No description provided for @servingAvailabilityStatusLabel.
  ///
  /// In zh, this message translates to:
  /// **'可用状态'**
  String get servingAvailabilityStatusLabel;

  /// No description provided for @servingAvailabilityStatusAvailable.
  ///
  /// In zh, this message translates to:
  /// **'可以服事'**
  String get servingAvailabilityStatusAvailable;

  /// No description provided for @servingAvailabilityStatusUnavailable.
  ///
  /// In zh, this message translates to:
  /// **'无法服事'**
  String get servingAvailabilityStatusUnavailable;

  /// No description provided for @servingAvailabilityStatusPreferred.
  ///
  /// In zh, this message translates to:
  /// **'优先时段'**
  String get servingAvailabilityStatusPreferred;

  /// No description provided for @servingAvailabilityStartLabel.
  ///
  /// In zh, this message translates to:
  /// **'开始时间'**
  String get servingAvailabilityStartLabel;

  /// No description provided for @servingAvailabilityEndLabel.
  ///
  /// In zh, this message translates to:
  /// **'结束时间'**
  String get servingAvailabilityEndLabel;

  /// No description provided for @servingAvailabilityNoteHint.
  ///
  /// In zh, this message translates to:
  /// **'补充说明（可选）'**
  String get servingAvailabilityNoteHint;

  /// No description provided for @servingAvailabilitySaveAction.
  ///
  /// In zh, this message translates to:
  /// **'保存可用时间'**
  String get servingAvailabilitySaveAction;

  /// No description provided for @servingAvailabilityCreateSuccess.
  ///
  /// In zh, this message translates to:
  /// **'可用时间已保存。'**
  String get servingAvailabilityCreateSuccess;

  /// No description provided for @servingAvailabilityInvalidRange.
  ///
  /// In zh, this message translates to:
  /// **'结束时间必须晚于开始时间。'**
  String get servingAvailabilityInvalidRange;

  /// No description provided for @servingCheckInTitle.
  ///
  /// In zh, this message translates to:
  /// **'到岗状态'**
  String get servingCheckInTitle;

  /// No description provided for @servingCheckInAction.
  ///
  /// In zh, this message translates to:
  /// **'确认到岗'**
  String get servingCheckInAction;

  /// No description provided for @servingCheckInSuccess.
  ///
  /// In zh, this message translates to:
  /// **'到岗已确认。'**
  String get servingCheckInSuccess;

  /// No description provided for @servingCheckInNotRecorded.
  ///
  /// In zh, this message translates to:
  /// **'尚未确认到岗。'**
  String get servingCheckInNotRecorded;

  /// No description provided for @servingCheckInStatusPending.
  ///
  /// In zh, this message translates to:
  /// **'待到岗'**
  String get servingCheckInStatusPending;

  /// No description provided for @servingCheckInStatusCheckedIn.
  ///
  /// In zh, this message translates to:
  /// **'已到岗'**
  String get servingCheckInStatusCheckedIn;

  /// No description provided for @servingCheckInStatusMissed.
  ///
  /// In zh, this message translates to:
  /// **'未到岗'**
  String get servingCheckInStatusMissed;

  /// No description provided for @servingAssignmentNoteTitle.
  ///
  /// In zh, this message translates to:
  /// **'服事说明'**
  String get servingAssignmentNoteTitle;

  /// No description provided for @servingResponseNoteTitle.
  ///
  /// In zh, this message translates to:
  /// **'我的回复'**
  String get servingResponseNoteTitle;

  /// No description provided for @eventRegistrationTitle.
  ///
  /// In zh, this message translates to:
  /// **'活动报名'**
  String get eventRegistrationTitle;

  /// No description provided for @eventRegistrationRegisterAction.
  ///
  /// In zh, this message translates to:
  /// **'报名'**
  String get eventRegistrationRegisterAction;

  /// No description provided for @eventRegistrationUpdateAction.
  ///
  /// In zh, this message translates to:
  /// **'保存修改'**
  String get eventRegistrationUpdateAction;

  /// No description provided for @eventRegistrationCancelAction.
  ///
  /// In zh, this message translates to:
  /// **'取消报名'**
  String get eventRegistrationCancelAction;

  /// No description provided for @eventRegistrationCheckInAction.
  ///
  /// In zh, this message translates to:
  /// **'签到'**
  String get eventRegistrationCheckInAction;

  /// No description provided for @eventCheckInScanAction.
  ///
  /// In zh, this message translates to:
  /// **'扫描现场码'**
  String get eventCheckInScanAction;

  /// No description provided for @eventCheckInScanTitle.
  ///
  /// In zh, this message translates to:
  /// **'现场签到'**
  String get eventCheckInScanTitle;

  /// No description provided for @eventCheckInScanPrompt.
  ///
  /// In zh, this message translates to:
  /// **'请扫描同工打印的活动签到二维码。'**
  String get eventCheckInScanPrompt;

  /// No description provided for @eventCheckInScanSuccessTitle.
  ///
  /// In zh, this message translates to:
  /// **'签到成功'**
  String get eventCheckInScanSuccessTitle;

  /// No description provided for @eventCheckInScanViewEvent.
  ///
  /// In zh, this message translates to:
  /// **'查看活动'**
  String get eventCheckInScanViewEvent;

  /// No description provided for @eventCheckInScanAgain.
  ///
  /// In zh, this message translates to:
  /// **'继续扫描'**
  String get eventCheckInScanAgain;

  /// No description provided for @eventCheckInScanSignInRequired.
  ///
  /// In zh, this message translates to:
  /// **'请先登录，再扫描现场签到二维码。'**
  String get eventCheckInScanSignInRequired;

  /// No description provided for @eventCheckInQrInvalid.
  ///
  /// In zh, this message translates to:
  /// **'这个签到二维码无效，请重新扫描。'**
  String get eventCheckInQrInvalid;

  /// No description provided for @eventCheckInQrExpired.
  ///
  /// In zh, this message translates to:
  /// **'这个签到二维码已过期，请联系同工。'**
  String get eventCheckInQrExpired;

  /// No description provided for @eventCheckInQrDisabled.
  ///
  /// In zh, this message translates to:
  /// **'这个签到二维码已停用，请联系同工。'**
  String get eventCheckInQrDisabled;

  /// No description provided for @eventCheckInQrRegistrationRequired.
  ///
  /// In zh, this message translates to:
  /// **'没有找到你的活动报名，请先报名或联系同工。'**
  String get eventCheckInQrRegistrationRequired;

  /// No description provided for @eventRegistrationRegistered.
  ///
  /// In zh, this message translates to:
  /// **'你已报名'**
  String get eventRegistrationRegistered;

  /// No description provided for @eventRegistrationCheckedIn.
  ///
  /// In zh, this message translates to:
  /// **'你已签到'**
  String get eventRegistrationCheckedIn;

  /// No description provided for @eventRegistrationSignInBody.
  ///
  /// In zh, this message translates to:
  /// **'登录后即可报名参加这个活动。'**
  String get eventRegistrationSignInBody;

  /// No description provided for @eventRegistrationFull.
  ///
  /// In zh, this message translates to:
  /// **'报名名额已满。'**
  String get eventRegistrationFull;

  /// No description provided for @eventRegistrationClosed.
  ///
  /// In zh, this message translates to:
  /// **'报名已截止。'**
  String get eventRegistrationClosed;

  /// No description provided for @eventRegistrationUnavailable.
  ///
  /// In zh, this message translates to:
  /// **'这个活动目前不可报名或不可查看。'**
  String get eventRegistrationUnavailable;

  /// No description provided for @eventRegistrationNotFound.
  ///
  /// In zh, this message translates to:
  /// **'没有找到你的报名记录，请刷新后再试。'**
  String get eventRegistrationNotFound;

  /// No description provided for @eventRegistrationPartySizeInvalid.
  ///
  /// In zh, this message translates to:
  /// **'请选择更少的参加人数。'**
  String get eventRegistrationPartySizeInvalid;

  /// No description provided for @eventRegistrationCheckInLocked.
  ///
  /// In zh, this message translates to:
  /// **'已签到的报名只能由同工修改。'**
  String get eventRegistrationCheckInLocked;

  /// No description provided for @eventRegistrationSuccess.
  ///
  /// In zh, this message translates to:
  /// **'报名成功。'**
  String get eventRegistrationSuccess;

  /// No description provided for @eventRegistrationUpdateSuccess.
  ///
  /// In zh, this message translates to:
  /// **'报名信息已更新。'**
  String get eventRegistrationUpdateSuccess;

  /// No description provided for @eventRegistrationCancelSuccess.
  ///
  /// In zh, this message translates to:
  /// **'已取消报名。'**
  String get eventRegistrationCancelSuccess;

  /// No description provided for @eventRegistrationCheckInSuccess.
  ///
  /// In zh, this message translates to:
  /// **'签到成功。'**
  String get eventRegistrationCheckInSuccess;

  /// No description provided for @eventRegistrationCheckedInAt.
  ///
  /// In zh, this message translates to:
  /// **'签到时间：{time}'**
  String eventRegistrationCheckedInAt(String time);

  /// No description provided for @eventRegistrationPartySizeLabel.
  ///
  /// In zh, this message translates to:
  /// **'参加人数'**
  String get eventRegistrationPartySizeLabel;

  /// No description provided for @eventRegistrationPartySize.
  ///
  /// In zh, this message translates to:
  /// **'{count} 人'**
  String eventRegistrationPartySize(int count);

  /// No description provided for @eventRegistrationNoteLabel.
  ///
  /// In zh, this message translates to:
  /// **'备注'**
  String get eventRegistrationNoteLabel;

  /// No description provided for @eventRegistrationNoteHint.
  ///
  /// In zh, this message translates to:
  /// **'餐食需要、到达说明，或可协助事项'**
  String get eventRegistrationNoteHint;

  /// No description provided for @eventRegistrationSpots.
  ///
  /// In zh, this message translates to:
  /// **'已报名 {registered}/{capacity}'**
  String eventRegistrationSpots(int registered, int capacity);

  /// No description provided for @eventRegistrationUnlimitedSpots.
  ///
  /// In zh, this message translates to:
  /// **'已报名 {registered}'**
  String eventRegistrationUnlimitedSpots(int registered);

  /// No description provided for @eventRegistrationRemaining.
  ///
  /// In zh, this message translates to:
  /// **'剩余 {remaining} 个名额'**
  String eventRegistrationRemaining(int remaining);

  /// No description provided for @givingGuestBody.
  ///
  /// In zh, this message translates to:
  /// **'登录后可查看自己的奉献记录和年度证明。'**
  String get givingGuestBody;

  /// No description provided for @givingHistoryTitle.
  ///
  /// In zh, this message translates to:
  /// **'奉献记录'**
  String get givingHistoryTitle;

  /// No description provided for @givingTransactionsTitle.
  ///
  /// In zh, this message translates to:
  /// **'最近交易'**
  String get givingTransactionsTitle;

  /// No description provided for @givingTransactionsEmptyBody.
  ///
  /// In zh, this message translates to:
  /// **'暂时还没有奉献记录。'**
  String get givingTransactionsEmptyBody;

  /// No description provided for @givingSummaryYear.
  ///
  /// In zh, this message translates to:
  /// **'{year} 年'**
  String givingSummaryYear(int year);

  /// No description provided for @givingSummaryAmount.
  ///
  /// In zh, this message translates to:
  /// **'总额 {amount}'**
  String givingSummaryAmount(String amount);

  /// No description provided for @givingSummaryCount.
  ///
  /// In zh, this message translates to:
  /// **'{count} 笔奉献'**
  String givingSummaryCount(int count);

  /// No description provided for @givingStatementSectionTitle.
  ///
  /// In zh, this message translates to:
  /// **'年度证明'**
  String get givingStatementSectionTitle;

  /// No description provided for @annualStatementsTitle.
  ///
  /// In zh, this message translates to:
  /// **'年度证明'**
  String get annualStatementsTitle;

  /// No description provided for @annualStatementsEmptyBody.
  ///
  /// In zh, this message translates to:
  /// **'暂时还没有年度证明。'**
  String get annualStatementsEmptyBody;

  /// No description provided for @givingStatementLabel.
  ///
  /// In zh, this message translates to:
  /// **'{year} 年证明'**
  String givingStatementLabel(int year);

  /// No description provided for @prayerTitle.
  ///
  /// In zh, this message translates to:
  /// **'代祷'**
  String get prayerTitle;

  /// No description provided for @prayerEmptyBody.
  ///
  /// In zh, this message translates to:
  /// **'暂无公开代祷事项。'**
  String get prayerEmptyBody;

  /// No description provided for @prayerSubmitTitle.
  ///
  /// In zh, this message translates to:
  /// **'提交代祷事项'**
  String get prayerSubmitTitle;

  /// No description provided for @prayerSubmitAction.
  ///
  /// In zh, this message translates to:
  /// **'提交'**
  String get prayerSubmitAction;

  /// No description provided for @prayerGuestSubmitBody.
  ///
  /// In zh, this message translates to:
  /// **'可以访客身份提交。私密事项只给牧者和后台同工查看。'**
  String get prayerGuestSubmitBody;

  /// No description provided for @prayerMemberSubmitBody.
  ///
  /// In zh, this message translates to:
  /// **'这条代祷会关联到你的会员资料，之后可以查看处理状态。'**
  String get prayerMemberSubmitBody;

  /// No description provided for @prayerTitleLabel.
  ///
  /// In zh, this message translates to:
  /// **'标题'**
  String get prayerTitleLabel;

  /// No description provided for @prayerBodyLabel.
  ///
  /// In zh, this message translates to:
  /// **'代祷内容'**
  String get prayerBodyLabel;

  /// No description provided for @prayerNameLabel.
  ///
  /// In zh, this message translates to:
  /// **'姓名'**
  String get prayerNameLabel;

  /// No description provided for @prayerValidationError.
  ///
  /// In zh, this message translates to:
  /// **'请填写标题和代祷内容。'**
  String get prayerValidationError;

  /// No description provided for @prayerSubmittedMessage.
  ///
  /// In zh, this message translates to:
  /// **'代祷事项已提交，等待审核。'**
  String get prayerSubmittedMessage;

  /// No description provided for @prayerMineLabel.
  ///
  /// In zh, this message translates to:
  /// **'我的'**
  String get prayerMineLabel;

  /// No description provided for @prayerVisibilityPrivate.
  ///
  /// In zh, this message translates to:
  /// **'私密'**
  String get prayerVisibilityPrivate;

  /// No description provided for @prayerVisibilityPublic.
  ///
  /// In zh, this message translates to:
  /// **'公开'**
  String get prayerVisibilityPublic;

  /// No description provided for @prayerVisibilityMembers.
  ///
  /// In zh, this message translates to:
  /// **'会众'**
  String get prayerVisibilityMembers;

  /// No description provided for @prayerVisibilityGroup.
  ///
  /// In zh, this message translates to:
  /// **'小组'**
  String get prayerVisibilityGroup;

  /// No description provided for @prayerStatusPending.
  ///
  /// In zh, this message translates to:
  /// **'待审核'**
  String get prayerStatusPending;

  /// No description provided for @prayerStatusApproved.
  ///
  /// In zh, this message translates to:
  /// **'已通过'**
  String get prayerStatusApproved;

  /// No description provided for @prayerStatusHidden.
  ///
  /// In zh, this message translates to:
  /// **'已隐藏'**
  String get prayerStatusHidden;

  /// No description provided for @prayerStatusArchived.
  ///
  /// In zh, this message translates to:
  /// **'已归档'**
  String get prayerStatusArchived;

  /// No description provided for @careTitle.
  ///
  /// In zh, this message translates to:
  /// **'关怀'**
  String get careTitle;

  /// No description provided for @careEmptyBody.
  ///
  /// In zh, this message translates to:
  /// **'暂时还没有关怀请求。'**
  String get careEmptyBody;

  /// No description provided for @careSubmitTitle.
  ///
  /// In zh, this message translates to:
  /// **'请求牧养关怀'**
  String get careSubmitTitle;

  /// No description provided for @careSubmitAction.
  ///
  /// In zh, this message translates to:
  /// **'请求关怀'**
  String get careSubmitAction;

  /// No description provided for @careSubmitBody.
  ///
  /// In zh, this message translates to:
  /// **'请简要说明你希望牧者或关怀同工如何跟进。内部跟进备注只给授权同工查看。'**
  String get careSubmitBody;

  /// No description provided for @careSignInRequired.
  ///
  /// In zh, this message translates to:
  /// **'请先以会友身份登录后再提交关怀请求。'**
  String get careSignInRequired;

  /// No description provided for @careTitleLabel.
  ///
  /// In zh, this message translates to:
  /// **'标题'**
  String get careTitleLabel;

  /// No description provided for @careBodyLabel.
  ///
  /// In zh, this message translates to:
  /// **'你希望我们如何关怀你？'**
  String get careBodyLabel;

  /// No description provided for @carePrivacyLabel.
  ///
  /// In zh, this message translates to:
  /// **'隐私范围'**
  String get carePrivacyLabel;

  /// No description provided for @carePrivacyPastoralOnly.
  ///
  /// In zh, this message translates to:
  /// **'仅牧者团队'**
  String get carePrivacyPastoralOnly;

  /// No description provided for @carePrivacyAssignedTeam.
  ///
  /// In zh, this message translates to:
  /// **'指定关怀团队'**
  String get carePrivacyAssignedTeam;

  /// No description provided for @carePrivacyAdminRestricted.
  ///
  /// In zh, this message translates to:
  /// **'仅受限管理员'**
  String get carePrivacyAdminRestricted;

  /// No description provided for @careValidationError.
  ///
  /// In zh, this message translates to:
  /// **'请填写标题和关怀内容。'**
  String get careValidationError;

  /// No description provided for @careSubmittedMessage.
  ///
  /// In zh, this message translates to:
  /// **'关怀请求已提交。'**
  String get careSubmittedMessage;

  /// No description provided for @careStatusSubmitted.
  ///
  /// In zh, this message translates to:
  /// **'已提交'**
  String get careStatusSubmitted;

  /// No description provided for @careStatusAssigned.
  ///
  /// In zh, this message translates to:
  /// **'已分配'**
  String get careStatusAssigned;

  /// No description provided for @careStatusInProgress.
  ///
  /// In zh, this message translates to:
  /// **'跟进中'**
  String get careStatusInProgress;

  /// No description provided for @careStatusResolved.
  ///
  /// In zh, this message translates to:
  /// **'已解决'**
  String get careStatusResolved;

  /// No description provided for @careStatusArchived.
  ///
  /// In zh, this message translates to:
  /// **'已归档'**
  String get careStatusArchived;

  /// No description provided for @careNextFollowUp.
  ///
  /// In zh, this message translates to:
  /// **'下次跟进 {date}'**
  String careNextFollowUp(String date);

  /// No description provided for @givingTitle.
  ///
  /// In zh, this message translates to:
  /// **'奉献'**
  String get givingTitle;

  /// No description provided for @givingCardTitle.
  ///
  /// In zh, this message translates to:
  /// **'奉献与年度证明'**
  String get givingCardTitle;

  /// No description provided for @givingCardBody.
  ///
  /// In zh, this message translates to:
  /// **'通过 Stripe 安全奉献，完成后可在这里查看已确认的奉献记录和年度证明。'**
  String get givingCardBody;

  /// No description provided for @givingCheckoutTitle.
  ///
  /// In zh, this message translates to:
  /// **'现在奉献'**
  String get givingCheckoutTitle;

  /// No description provided for @givingCheckoutBody.
  ///
  /// In zh, this message translates to:
  /// **'付款由 Stripe 处理，App 不保存银行卡或银行账户信息。'**
  String get givingCheckoutBody;

  /// No description provided for @givingAmountLabel.
  ///
  /// In zh, this message translates to:
  /// **'金额'**
  String get givingAmountLabel;

  /// No description provided for @givingFundLabel.
  ///
  /// In zh, this message translates to:
  /// **'奉献项目'**
  String get givingFundLabel;

  /// No description provided for @givingFundsLoading.
  ///
  /// In zh, this message translates to:
  /// **'正在加载奉献项目...'**
  String get givingFundsLoading;

  /// No description provided for @givingFundsEmpty.
  ///
  /// In zh, this message translates to:
  /// **'当前没有可用的奉献项目。'**
  String get givingFundsEmpty;

  /// No description provided for @givingCategoryOffering.
  ///
  /// In zh, this message translates to:
  /// **'奉献'**
  String get givingCategoryOffering;

  /// No description provided for @givingCategoryMissions.
  ///
  /// In zh, this message translates to:
  /// **'宣教'**
  String get givingCategoryMissions;

  /// No description provided for @givingCheckoutAction.
  ///
  /// In zh, this message translates to:
  /// **'前往 Stripe'**
  String get givingCheckoutAction;

  /// No description provided for @givingAmountError.
  ///
  /// In zh, this message translates to:
  /// **'请输入 USD 1.00 至 USD 100,000.00 之间的金额，最多保留两位小数。'**
  String get givingAmountError;

  /// No description provided for @givingCheckoutOpenError.
  ///
  /// In zh, this message translates to:
  /// **'无法打开 Stripe 付款页面。'**
  String get givingCheckoutOpenError;

  /// No description provided for @givingCheckoutReturnSuccess.
  ///
  /// In zh, this message translates to:
  /// **'Stripe 付款流程已完成。确认入账后会显示在奉献记录中。'**
  String get givingCheckoutReturnSuccess;

  /// No description provided for @givingCheckoutReturnCancel.
  ///
  /// In zh, this message translates to:
  /// **'Stripe 付款已取消。'**
  String get givingCheckoutReturnCancel;

  /// No description provided for @annualStatementTooltip.
  ///
  /// In zh, this message translates to:
  /// **'年度证明'**
  String get annualStatementTooltip;

  /// No description provided for @annualStatementPreviewAction.
  ///
  /// In zh, this message translates to:
  /// **'预览 CSV'**
  String get annualStatementPreviewAction;

  /// No description provided for @annualStatementCopyCsvAction.
  ///
  /// In zh, this message translates to:
  /// **'复制 CSV'**
  String get annualStatementCopyCsvAction;

  /// No description provided for @annualStatementCopiedMessage.
  ///
  /// In zh, this message translates to:
  /// **'证明 CSV 已复制。'**
  String get annualStatementCopiedMessage;

  /// No description provided for @annualStatementSavePdfAction.
  ///
  /// In zh, this message translates to:
  /// **'保存 PDF'**
  String get annualStatementSavePdfAction;

  /// No description provided for @annualStatementSharePdfAction.
  ///
  /// In zh, this message translates to:
  /// **'分享 PDF'**
  String get annualStatementSharePdfAction;

  /// No description provided for @annualStatementSharePdfText.
  ///
  /// In zh, this message translates to:
  /// **'年度奉献证明'**
  String get annualStatementSharePdfText;

  /// No description provided for @annualStatementPdfSharedMessage.
  ///
  /// In zh, this message translates to:
  /// **'年度证明 PDF 已分享。'**
  String get annualStatementPdfSharedMessage;

  /// No description provided for @annualStatementPdfOpenedMessage.
  ///
  /// In zh, this message translates to:
  /// **'年度证明 PDF 已保存并打开。'**
  String get annualStatementPdfOpenedMessage;

  /// No description provided for @annualStatementPdfSavedMessage.
  ///
  /// In zh, this message translates to:
  /// **'年度证明 PDF 已保存到 {path}。'**
  String annualStatementPdfSavedMessage(String path);

  /// No description provided for @copyPathAction.
  ///
  /// In zh, this message translates to:
  /// **'复制路径'**
  String get copyPathAction;

  /// No description provided for @annualStatementExportTitle.
  ///
  /// In zh, this message translates to:
  /// **'证明导出'**
  String get annualStatementExportTitle;

  /// No description provided for @annualStatementStatusPendingLabel.
  ///
  /// In zh, this message translates to:
  /// **'处理中'**
  String get annualStatementStatusPendingLabel;

  /// No description provided for @annualStatementStatusReadyLabel.
  ///
  /// In zh, this message translates to:
  /// **'可用'**
  String get annualStatementStatusReadyLabel;

  /// No description provided for @annualStatementStatusSentLabel.
  ///
  /// In zh, this message translates to:
  /// **'已发送'**
  String get annualStatementStatusSentLabel;

  /// No description provided for @annualStatementStatusFailedLabel.
  ///
  /// In zh, this message translates to:
  /// **'失败'**
  String get annualStatementStatusFailedLabel;

  /// No description provided for @givingStatusPendingLabel.
  ///
  /// In zh, this message translates to:
  /// **'处理中'**
  String get givingStatusPendingLabel;

  /// No description provided for @givingStatusSucceededLabel.
  ///
  /// In zh, this message translates to:
  /// **'成功'**
  String get givingStatusSucceededLabel;

  /// No description provided for @givingStatusFailedLabel.
  ///
  /// In zh, this message translates to:
  /// **'失败'**
  String get givingStatusFailedLabel;

  /// No description provided for @givingStatusRefundedLabel.
  ///
  /// In zh, this message translates to:
  /// **'已退款'**
  String get givingStatusRefundedLabel;

  /// No description provided for @bibleTtsReadyTitle.
  ///
  /// In zh, this message translates to:
  /// **'朗读圣经'**
  String get bibleTtsReadyTitle;

  /// No description provided for @bibleTtsCurrentVerse.
  ///
  /// In zh, this message translates to:
  /// **'正在朗读第 {verse} 节'**
  String bibleTtsCurrentVerse(int verse);

  /// No description provided for @bibleTtsPausedVerse.
  ///
  /// In zh, this message translates to:
  /// **'已暂停在第 {verse} 节，继续会重读本节。'**
  String bibleTtsPausedVerse(int verse);

  /// No description provided for @bibleTtsRateLabel.
  ///
  /// In zh, this message translates to:
  /// **'{rate}x'**
  String bibleTtsRateLabel(double rate);

  /// No description provided for @bibleTtsPlayTooltip.
  ///
  /// In zh, this message translates to:
  /// **'朗读'**
  String get bibleTtsPlayTooltip;

  /// No description provided for @bibleTtsPauseTooltip.
  ///
  /// In zh, this message translates to:
  /// **'暂停朗读'**
  String get bibleTtsPauseTooltip;

  /// No description provided for @bibleTtsStopTooltip.
  ///
  /// In zh, this message translates to:
  /// **'停止朗读'**
  String get bibleTtsStopTooltip;

  /// No description provided for @bibleTtsPreviousVerseTooltip.
  ///
  /// In zh, this message translates to:
  /// **'上一节'**
  String get bibleTtsPreviousVerseTooltip;

  /// No description provided for @bibleTtsNextVerseTooltip.
  ///
  /// In zh, this message translates to:
  /// **'下一节'**
  String get bibleTtsNextVerseTooltip;

  /// No description provided for @bibleTtsErrorTextMissing.
  ///
  /// In zh, this message translates to:
  /// **'这段经文没有可朗读的文字。'**
  String get bibleTtsErrorTextMissing;

  /// No description provided for @bibleTtsErrorEngineUnavailable.
  ///
  /// In zh, this message translates to:
  /// **'此设备暂时无法使用文字朗读。请检查系统语音设置后重试。'**
  String get bibleTtsErrorEngineUnavailable;

  /// No description provided for @bibleTtsErrorLanguageUnavailable.
  ///
  /// In zh, this message translates to:
  /// **'系统尚未安装这个圣经语言的语音。'**
  String get bibleTtsErrorLanguageUnavailable;

  /// No description provided for @bibleTtsErrorInterrupted.
  ///
  /// In zh, this message translates to:
  /// **'朗读已中断。点击播放可从当前经节继续。'**
  String get bibleTtsErrorInterrupted;

  /// No description provided for @bibleTtsErrorStartFailed.
  ///
  /// In zh, this message translates to:
  /// **'无法开始朗读。请检查设备语音设置后重试。'**
  String get bibleTtsErrorStartFailed;

  /// No description provided for @newcomerCardTitle.
  ///
  /// In zh, this message translates to:
  /// **'第一次来吗？'**
  String get newcomerCardTitle;

  /// No description provided for @newcomerCardBody.
  ///
  /// In zh, this message translates to:
  /// **'我们很愿意欢迎你、回答问题，并帮助你认识教会生活。'**
  String get newcomerCardBody;

  /// No description provided for @newcomerCardAction.
  ///
  /// In zh, this message translates to:
  /// **'我是新朋友'**
  String get newcomerCardAction;

  /// No description provided for @newcomerSheetTitle.
  ///
  /// In zh, this message translates to:
  /// **'欢迎来到 MBCG'**
  String get newcomerSheetTitle;

  /// No description provided for @newcomerSheetGuestBody.
  ///
  /// In zh, this message translates to:
  /// **'留下简单资料，教会同工会与你联系。'**
  String get newcomerSheetGuestBody;

  /// No description provided for @newcomerSheetMemberBody.
  ///
  /// In zh, this message translates to:
  /// **'你也可以介绍自己，或请同工与你联系。'**
  String get newcomerSheetMemberBody;

  /// No description provided for @newcomerNameLabel.
  ///
  /// In zh, this message translates to:
  /// **'姓名'**
  String get newcomerNameLabel;

  /// No description provided for @newcomerEmailLabel.
  ///
  /// In zh, this message translates to:
  /// **'邮箱'**
  String get newcomerEmailLabel;

  /// No description provided for @newcomerPhoneLabel.
  ///
  /// In zh, this message translates to:
  /// **'电话'**
  String get newcomerPhoneLabel;

  /// No description provided for @newcomerInterestLabel.
  ///
  /// In zh, this message translates to:
  /// **'你想了解什么？'**
  String get newcomerInterestLabel;

  /// No description provided for @newcomerSubmitAction.
  ///
  /// In zh, this message translates to:
  /// **'发送给教会同工'**
  String get newcomerSubmitAction;

  /// No description provided for @newcomerNameValidationError.
  ///
  /// In zh, this message translates to:
  /// **'请输入姓名。'**
  String get newcomerNameValidationError;

  /// No description provided for @newcomerContactValidationError.
  ///
  /// In zh, this message translates to:
  /// **'请至少留下邮箱或电话。'**
  String get newcomerContactValidationError;

  /// No description provided for @newcomerEmailValidationError.
  ///
  /// In zh, this message translates to:
  /// **'请输入有效的邮箱地址。'**
  String get newcomerEmailValidationError;

  /// No description provided for @newcomerSubmittedMessage.
  ///
  /// In zh, this message translates to:
  /// **'谢谢，我们已经收到你的资料。'**
  String get newcomerSubmittedMessage;

  /// No description provided for @mineDiscipleshipTitle.
  ///
  /// In zh, this message translates to:
  /// **'我的门徒成长路径'**
  String get mineDiscipleshipTitle;

  /// No description provided for @mineDiscipleshipBody.
  ///
  /// In zh, this message translates to:
  /// **'查看教会同工为你安排的下一步成长操练。'**
  String get mineDiscipleshipBody;

  /// No description provided for @mineDiscipleshipEmpty.
  ///
  /// In zh, this message translates to:
  /// **'当前还没有分配成长路径。'**
  String get mineDiscipleshipEmpty;

  /// No description provided for @mineDiscipleshipLoadError.
  ///
  /// In zh, this message translates to:
  /// **'无法加载你的成长路径。'**
  String get mineDiscipleshipLoadError;

  /// No description provided for @mineDiscipleshipProgressChip.
  ///
  /// In zh, this message translates to:
  /// **'{completed}/{total} 个任务'**
  String mineDiscipleshipProgressChip(int completed, int total);

  /// No description provided for @discipleshipStatusNotStarted.
  ///
  /// In zh, this message translates to:
  /// **'未开始'**
  String get discipleshipStatusNotStarted;

  /// No description provided for @discipleshipStatusInProgress.
  ///
  /// In zh, this message translates to:
  /// **'进行中'**
  String get discipleshipStatusInProgress;

  /// No description provided for @discipleshipStatusBlocked.
  ///
  /// In zh, this message translates to:
  /// **'受阻'**
  String get discipleshipStatusBlocked;

  /// No description provided for @discipleshipStatusCompleted.
  ///
  /// In zh, this message translates to:
  /// **'已完成'**
  String get discipleshipStatusCompleted;

  /// No description provided for @discipleshipStatusPaused.
  ///
  /// In zh, this message translates to:
  /// **'已暂停'**
  String get discipleshipStatusPaused;

  /// No description provided for @discipleshipStatusCancelled.
  ///
  /// In zh, this message translates to:
  /// **'已取消'**
  String get discipleshipStatusCancelled;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'es', 'zh'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when language+script codes are specified.
  switch (locale.languageCode) {
    case 'zh':
      {
        switch (locale.scriptCode) {
          case 'Hans':
            return AppLocalizationsZhHans();
          case 'Hant':
            return AppLocalizationsZhHant();
        }
        break;
      }
  }

  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
    case 'zh':
      return AppLocalizationsZh();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
