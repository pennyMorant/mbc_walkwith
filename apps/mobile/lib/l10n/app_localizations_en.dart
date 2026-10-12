// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'MBCG';

  @override
  String get commonStatusUnknownLabel => 'Unknown status';

  @override
  String get commonVisibilityUnknownLabel => 'Unknown visibility';

  @override
  String get commonPrivacyUnknownLabel => 'Unknown privacy';

  @override
  String get tabStudy => 'Study';

  @override
  String get tabSermons => 'Sermons';

  @override
  String get tabLife => 'Life';

  @override
  String get tabMine => 'Mine';

  @override
  String get mineTitle => 'Mine';

  @override
  String get memberOptionalSignInTitle => 'Optional sign in';

  @override
  String get memberOptionalSignInBody =>
      'Keep using the app as a guest, or sign in for synced reading, prayer, and giving records later.';

  @override
  String get memberEmailLabel => 'Email';

  @override
  String get memberInvalidEmail => 'Enter a valid email address.';

  @override
  String get memberShowPasswordTooltip => 'Show password';

  @override
  String get memberHidePasswordTooltip => 'Hide password';

  @override
  String get memberNameLabel => 'Name';

  @override
  String get memberPasswordLabel => 'Password';

  @override
  String get memberConfirmPasswordLabel => 'Confirm password';

  @override
  String get memberCodeLabel => 'Code';

  @override
  String get memberVerifyEmailAction => 'Verify email';

  @override
  String get memberSignInAction => 'Sign in';

  @override
  String get memberContinueWithGoogle => 'Continue with Google';

  @override
  String get memberContinueWithApple => 'Continue with Apple';

  @override
  String get memberAuthAlternative => 'or';

  @override
  String get memberFederatedSetupUnavailable =>
      'Google and Apple sign-in are not configured yet.';

  @override
  String get memberFederatedSignInFailed =>
      'Sign-in could not be completed. Please try again.';

  @override
  String get memberLoginEmailTitle => 'Welcome back';

  @override
  String get memberLoginEmailBody => 'Sign in to continue your church life.';

  @override
  String get memberNextAction => 'Next';

  @override
  String get memberCreateAccountAction => 'Create account';

  @override
  String get memberPasswordTitle => 'Enter your password';

  @override
  String get memberForgotPasswordAction => 'Forgot password?';

  @override
  String get memberPasswordResetTitle => 'Reset password';

  @override
  String get memberPasswordResetRequestBody =>
      'We will send a verification code if this email can reset a password.';

  @override
  String get memberPasswordResetCodeBody =>
      'Enter the code from your email, then choose a new password.';

  @override
  String get memberPasswordResetAction => 'Reset password';

  @override
  String get memberPasswordResetComplete =>
      'Password updated. Sign in with your new password.';

  @override
  String get memberBackToSignInAction => 'Back to sign in';

  @override
  String get memberRegisterAction => 'Register';

  @override
  String get memberChangeEmailAction => 'Change email';

  @override
  String get memberPasswordMismatch => 'The passwords do not match.';

  @override
  String get memberSignOutAction => 'Sign out';

  @override
  String get memberRegistrationClosed =>
      'Member registration is currently closed. Please contact the church office.';

  @override
  String get memberRegistrationPendingApproval =>
      'Registration received. Please wait for church approval.';

  @override
  String get memberProfileTitle => 'My profile';

  @override
  String get memberProfileEditTitle => 'Profile details';

  @override
  String get memberProfileSaveAction => 'Save profile';

  @override
  String get memberProfileSaved => 'Profile saved.';

  @override
  String get memberProfileOpenAction => 'Edit profile';

  @override
  String get memberStatusLabel => 'Status';

  @override
  String get memberRoleLabel => 'Role';

  @override
  String get memberGroupLabel => 'Group';

  @override
  String get memberNoGroupLabel => 'No group';

  @override
  String get memberPhoneLabel => 'Phone';

  @override
  String get memberAddressLabel => 'Address';

  @override
  String get memberFaithStartYearLabel => 'Faith start year';

  @override
  String get memberBaptizedYearLabel => 'Baptized year';

  @override
  String get memberJoinedChurchAtLabel => 'Joined church date';

  @override
  String get memberEmergencyContactNameLabel => 'Emergency contact';

  @override
  String get memberEmergencyContactPhoneLabel => 'Emergency phone';

  @override
  String get mineGivingEntryTitle => 'Giving and annual statements';

  @override
  String get mineGivingEntryBody =>
      'Open giving history, confirmed records, and annual statement PDFs.';

  @override
  String get mineLifeOverviewTitle => 'My church life';

  @override
  String get mineLifeOverviewBody =>
      'Quick status for your groups, classes, serving, and care requests.';

  @override
  String get mineLifeGroupsLabel => 'groups';

  @override
  String get mineLifeCoursesLabel => 'classes';

  @override
  String mineLifeCoursesCountLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count classes',
      one: '1 class',
    );
    return '$_temp0';
  }

  @override
  String get mineLifeServingLabel => 'serving';

  @override
  String mineLifeServingCountLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count serving roles',
      one: '1 serving role',
    );
    return '$_temp0';
  }

  @override
  String get mineLifeCareLabel => 'care';

  @override
  String mineLifeOverviewMetricSemanticLabel(String label, int count) {
    return '$label: $count';
  }

  @override
  String get mineLifeOpenLifeAction => 'Open Life';

  @override
  String get preferencesTitle => 'Preferences';

  @override
  String get appearanceTitle => 'Appearance';

  @override
  String get themeModeSystem => 'System';

  @override
  String get themeModeLight => 'Light';

  @override
  String get themeModeDark => 'Dark';

  @override
  String get textSizeTitle => 'Text size';

  @override
  String get textSizeBody =>
      'Make app text easier to read for worship and church life.';

  @override
  String get textSizeSystem => 'System';

  @override
  String get textSizeStandard => 'Standard';

  @override
  String get textSizeLarge => 'Large';

  @override
  String get textSizeExtraLarge => 'Extra large';

  @override
  String get notificationPermissionTitle => 'Notification permission';

  @override
  String get notificationPermissionEnabledBody =>
      'Notifications are allowed. Use the switch to open system settings if you want to turn them off.';

  @override
  String get notificationPermissionDisabledBody =>
      'Notifications are off. Turn this on to request system permission.';

  @override
  String get aboutTitle => 'About';

  @override
  String get aboutChurchTitle => 'About church';

  @override
  String get churchAddressTitle => 'Address / map';

  @override
  String get churchPhoneTitle => 'Contact phone';

  @override
  String get churchEmailTitle => 'Contact email';

  @override
  String get privacyPolicyTitle => 'Privacy policy';

  @override
  String get termsOfUseTitle => 'Terms of use';

  @override
  String get appVersionTitle => 'App version';

  @override
  String appVersionValue(String version) {
    return 'Version $version';
  }

  @override
  String get periodPickerTooltip => 'Choose date range';

  @override
  String get periodThisWeek => 'This week';

  @override
  String get periodThisMonth => 'This month';

  @override
  String get periodPreviousAction => 'Previous';

  @override
  String get periodNextAction => 'Next';

  @override
  String get periodApplyAction => 'Apply';

  @override
  String get languageTitle => 'Language';

  @override
  String get systemLanguageLabel => 'System language';

  @override
  String get languageSystemBody =>
      'The app follows your system language. To change language, use the native system settings for this app.';

  @override
  String get openSystemSettingsAction => 'Open system settings';

  @override
  String get bibleTranslationLabel => 'Bible translation';

  @override
  String get studyTitle => 'Bible';

  @override
  String get bibleSearchTooltip => 'Search Scripture';

  @override
  String get bibleSearchTitle => 'Search Scripture';

  @override
  String get bibleSearchHint => 'Search a phrase or keywords';

  @override
  String get bibleSearchStartTitle => 'Search the Bible';

  @override
  String get bibleSearchStartBody =>
      'Enter a phrase, partial verse, or keywords. Results use the current app language\'s Bible translation.';

  @override
  String get bibleSearchNoResultsTitle => 'No matching verses';

  @override
  String get bibleSearchNoResultsBody =>
      'Try fewer words or another phrase. The search allows partial matches, but very short words may be ignored.';

  @override
  String get bibleSearchErrorTitle => 'Search failed';

  @override
  String get versePickerTooltip => 'Choose verse';

  @override
  String get versePickerTitle => 'Choose a verse';

  @override
  String get readerSettingsTooltip => 'Reader settings';

  @override
  String get readerSettingsTitle => 'Reader settings';

  @override
  String get readerAssistsTitle => 'Reading assists';

  @override
  String get chapterPeopleAssistTitle => 'Chapter people';

  @override
  String get chapterPeopleAssistBody =>
      'Show one chapter-level entry for biblical figures found in the current chapter.';

  @override
  String get chapterPlacesAssistTitle => 'Chapter places';

  @override
  String get chapterPlacesAssistBody =>
      'Show one chapter-level entry for biblical places found in the current chapter.';

  @override
  String get lexiconAssistTitle => 'Original-language words';

  @override
  String get lexiconAssistBody =>
      'Show original-language word insight when a verse has local lexicon data.';

  @override
  String get aiStudyHintsAssistTitle => 'AI study hints';

  @override
  String get aiStudyHintsAssistBody =>
      'Enable long-press verse explanations and related study hints.';

  @override
  String get chapterPeopleTooltip => 'People in this chapter';

  @override
  String get chapterPeopleTitle => 'People in this chapter';

  @override
  String get chapterPlacesTooltip => 'Places in this chapter';

  @override
  String get chapterPlacesTitle => 'Places in this chapter';

  @override
  String get continueReadingTitle => 'Continue reading';

  @override
  String get continueReadingAction => 'Continue';

  @override
  String get defaultContinueReadingTitle => 'Romans 8';

  @override
  String get defaultContinueReadingSubtitle => 'Resume from Romans 8';

  @override
  String continueReadingChapterSubtitle(String bookName, int chapter) {
    return 'Resume from $bookName $chapter';
  }

  @override
  String continueReadingVerseSubtitle(
    int chapter,
    String verse,
    String bookName,
  ) {
    return 'Last read $chapter:$verse · $bookName';
  }

  @override
  String get readingPlansTitle => 'My reading plan';

  @override
  String get readingPlansBody =>
      'Continue your current plan with local Scripture text and TTS.';

  @override
  String get readingPlanStartAction => 'Start';

  @override
  String get readingPlanContinueAction => 'Continue';

  @override
  String get readingPlanReadAction => 'Read';

  @override
  String get readingPlanCompleteDayAction => 'Mark complete';

  @override
  String get readingPlanCompletedLabel => 'Completed';

  @override
  String get readingPlanNoDaysBody => 'This plan has no daily references yet.';

  @override
  String get readingPlanLoadErrorTitle => 'Reading plans failed to load';

  @override
  String get readingPlanLoadErrorBody => 'Please refresh and try again.';

  @override
  String get readingPlanActionError =>
      'Could not update the reading plan. Please try again.';

  @override
  String readingPlanDaysLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count days',
      one: '1 day',
    );
    return '$_temp0';
  }

  @override
  String readingPlanDayLabel(int dayNumber) {
    return 'Day $dayNumber';
  }

  @override
  String readingPlanProgressLabel(int completed, int total) {
    return '$completed/$total completed';
  }

  @override
  String get mineReadingPlansTitle => 'My reading plans';

  @override
  String get mineReadingPlansBody =>
      'Your personal reading plans and completion progress.';

  @override
  String get mineReadingPlansEmpty =>
      'Start a plan from Study to keep your progress here.';

  @override
  String get mineReadingPlansOpenStudyAction => 'Open Study';

  @override
  String get readingPlanCurrentTab => 'Current';

  @override
  String get readingPlanHistoryTab => 'History';

  @override
  String get readingPlanCurrentEmpty => 'No reading plan is in progress.';

  @override
  String get readingPlanHistoryEmpty =>
      'Completed and abandoned plans will appear here.';

  @override
  String get readingPlanViewAllAction => 'View plans';

  @override
  String get readingPlanRestartAction => 'Start again';

  @override
  String get readingPlanLoadMoreAction => 'Load more';

  @override
  String get readingPlanPauseAction => 'Pause';

  @override
  String get readingPlanResumeAction => 'Resume';

  @override
  String get readingPlanAbandonAction => 'End plan';

  @override
  String get readingPlanAbandonConfirmBody =>
      'End this attempt and move it to history? Its progress will remain available.';

  @override
  String get readingPlanNotStartedLabel => 'Not started';

  @override
  String get readingPlanActiveLabel => 'In progress';

  @override
  String get readingPlanPausedLabel => 'Paused';

  @override
  String get readingPlanAbandonedLabel => 'Ended';

  @override
  String readingPlanAttemptLabel(int attempt) {
    return 'Attempt $attempt';
  }

  @override
  String readingPlanStartedOn(String date) {
    return 'Started $date';
  }

  @override
  String readingPlanEndedOn(String date) {
    return 'Ended $date';
  }

  @override
  String get readingPlanHistoryDetailTitle => 'Plan details';

  @override
  String get readingPlanNoteLabel => 'Note';

  @override
  String get readingPlanRestartedMessage =>
      'A new reading-plan attempt has started.';

  @override
  String mineReadingPlanProgressChip(int completed) {
    return '$completed done';
  }

  @override
  String get oldTestamentLabel => 'Old Testament';

  @override
  String get newTestamentLabel => 'New Testament';

  @override
  String bibleBookCountLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count books',
      one: '1 book',
    );
    return '$_temp0';
  }

  @override
  String bibleChapterCountLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count chapters',
      one: '1 chapter',
    );
    return '$_temp0';
  }

  @override
  String bibleChapterCountWithName(int count, String bookName) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count chapters',
      one: '1 chapter',
    );
    return '$_temp0 · $bookName';
  }

  @override
  String bibleChapterReference(String bookName, int chapter) {
    return '$bookName $chapter';
  }

  @override
  String bibleChapterButtonSemanticLabel(String bookName, int chapter) {
    return '$bookName chapter $chapter';
  }

  @override
  String get categoryLaw => 'Law';

  @override
  String get categoryOldTestamentHistory => 'History';

  @override
  String get categoryWisdom => 'Poetry and Wisdom';

  @override
  String get categoryMajorProphets => 'Major Prophets';

  @override
  String get categoryMinorProphets => 'Minor Prophets';

  @override
  String get categoryGospels => 'Gospels';

  @override
  String get categoryActs => 'History';

  @override
  String get categoryPaulineLetters => 'Pauline Letters';

  @override
  String get categoryGeneralLetters => 'General Letters';

  @override
  String get categoryApocalyptic => 'Apocalyptic';

  @override
  String get studyLoadErrorTitle => 'Bible catalog could not be loaded';

  @override
  String get studyLoadErrorBody =>
      'Try again later, or check that local Bible seed data is bundled correctly.';

  @override
  String get readerFallbackTitle => 'Study';

  @override
  String get previousChapterTooltip => 'Previous chapter';

  @override
  String get nextChapterTooltip => 'Next chapter';

  @override
  String get readerLoadErrorTitle => 'Chapter could not be loaded';

  @override
  String get readerLoadErrorBody =>
      'Try again later, or check that local Bible data has finished importing.';

  @override
  String get emptyChapterBody =>
      'No verses are available for this chapter yet.';

  @override
  String get verseActionsTooltip => 'Notes and highlights';

  @override
  String get verseActionsTitle => 'Verse tools';

  @override
  String get bookmarkVerseTitle => 'Bookmark this verse';

  @override
  String get highlightTitle => 'Highlight';

  @override
  String get highlightNone => 'None';

  @override
  String get highlightYellow => 'Gold';

  @override
  String get highlightGreen => 'Green';

  @override
  String get highlightBlue => 'Blue';

  @override
  String get highlightRose => 'Rose';

  @override
  String get noteTitle => 'Note';

  @override
  String get noteHint => 'Write a private study note';

  @override
  String get saveNoteAction => 'Save note';

  @override
  String get verseNotesMyNotesTab => 'My notes';

  @override
  String get verseNotesChurchNotesTab => 'Church notes';

  @override
  String get verseNotesPublishHint =>
      'Shared notes are visible to other people reading this verse in the app.';

  @override
  String get verseNotesDisplayNameHint => 'Display name for guests';

  @override
  String get verseNotesContentHint => 'Share a reflection on this verse';

  @override
  String get verseNotesPublishAction => 'Share';

  @override
  String get verseNotesUpdateAction => 'Update';

  @override
  String get verseNotesDeleteAction => 'Delete';

  @override
  String get verseNotesYourReflectionTitle => 'Your reflection';

  @override
  String get verseNotesSharedTitle => 'Shared reflections';

  @override
  String verseNotesCountLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count reflections',
      one: '1 reflection',
    );
    return '$_temp0';
  }

  @override
  String get verseNotesMineLabel => 'Mine';

  @override
  String get verseNotesEmptyState => 'No shared reflections yet.';

  @override
  String get verseNotesEmptyError => 'Write a reflection before sharing.';

  @override
  String get verseNotesGenericError => 'Could not load verse notes.';

  @override
  String get studyChapterLabel => 'Romans 8';

  @override
  String get translationLabel => 'CUV';

  @override
  String relatedSermonsLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count related sermons',
      one: '1 related sermon',
    );
    return '$_temp0';
  }

  @override
  String verseNumberLabel(int verse) {
    return 'Verse $verse';
  }

  @override
  String explanationTitleSuffix(String reference) {
    return '$reference explanation';
  }

  @override
  String get sourceLabel => 'Sources';

  @override
  String get relatedVersesLabel => 'Related verses';

  @override
  String get aiStudyDisclaimer =>
      'AI explanations are for study support. Please consult church leaders for important theological or pastoral questions.';

  @override
  String get aiStudySheetTitle => 'AI study help';

  @override
  String get aiStudyQuestionLabel => 'Question';

  @override
  String get aiStudyDefaultQuestion =>
      'Help me understand this verse in context.';

  @override
  String get aiStudyGenerateAction => 'Generate study help';

  @override
  String get aiStudyRetryAction => 'Ask again';

  @override
  String get aiStudyResultTitle => 'Study response';

  @override
  String get aiStudySignInTitle => 'Sign in required';

  @override
  String get aiStudySignInBody => 'Sign in from Mine to use AI study help.';

  @override
  String get aiStudyErrorTitle => 'AI study help is unavailable';

  @override
  String get aiStudyProviderDisabled =>
      'AI provider is not configured yet. Please try again after church staff enable it.';

  @override
  String get aiStudyProviderFailed =>
      'AI provider did not respond. Please try again later.';

  @override
  String get aiStudyRateLimited =>
      'Too many AI requests. Please wait a moment and try again.';

  @override
  String get lexiconLoveTitle => 'Love / agape';

  @override
  String get lexiconGoodTitle => 'Good / agathon';

  @override
  String get lexiconLoveBody =>
      'Greek ἀγάπη often describes God\'s active, steadfast, covenantal love.';

  @override
  String get lexiconGoodBody =>
      'Greek ἀγαθόν refers to a good or beneficial result. In Romans 8:28, the focus is not that every circumstance feels good, but that God works toward his good purpose.';

  @override
  String get confirmKnown => 'Got it';

  @override
  String get sermonsTitle => 'Sermons';

  @override
  String get searchSermonsTooltip => 'Search sermons';

  @override
  String get sermonFilterTooltip => 'Filter sermons';

  @override
  String get sermonFilterTitle => 'Filter sermons';

  @override
  String get sermonFilterSpeakerLabel => 'Speaker';

  @override
  String get sermonFilterSeriesLabel => 'Series';

  @override
  String get sermonFilterTopicLabel => 'Topic';

  @override
  String get sermonFilterClearAction => 'Clear filters';

  @override
  String get sermonFilterLoadError =>
      'Filters could not be loaded. Please try again.';

  @override
  String get sermonDetailTitle => 'Sermon detail';

  @override
  String get sermonContinueListeningTitle => 'Continue listening';

  @override
  String get sermonStudyNotesTitle => 'Sermon notes';

  @override
  String get sermonSummaryTitle => 'Summary';

  @override
  String get sermonOpenDetailAction => 'View sermon details';

  @override
  String get sermonOutlineTitle => 'Immersive outline';

  @override
  String get sermonReferencesTitle => 'Cited Scripture';

  @override
  String get sermonTranscriptTitle => 'Transcript';

  @override
  String get sermonSectionNotesLabel => 'Notes';

  @override
  String get sermonSectionReferencesLabel => 'Scripture';

  @override
  String get sermonSectionTranscriptLabel => 'Text';

  @override
  String get sermonPlaybackSpeedTitle => 'Playback speed';

  @override
  String get sermonTranscriptReadAction => 'Read transcript';

  @override
  String get sermonTranscriptCollapseAction => 'Show less';

  @override
  String get sermonAiAskAction => 'Ask about this sermon';

  @override
  String get sermonDiscussionTitle => 'Discussion guide';

  @override
  String get sermonDiscussionPrivateLabel => 'Private response';

  @override
  String get sermonDiscussionQuestionsTitle => 'Discussion questions';

  @override
  String get sermonDiscussionActionStepsTitle => 'Action steps';

  @override
  String get sermonDiscussionPrayerTitle => 'Prayer prompts';

  @override
  String get sermonDiscussionRespondAction => 'Write response';

  @override
  String get sermonDiscussionResponseTitle => 'Personal response';

  @override
  String get sermonDiscussionResponseHint =>
      'Write your reflection or next step';

  @override
  String get sermonDiscussionResponsePrivateNote =>
      'Your response is private by default.';

  @override
  String get sermonDiscussionSubmitAction => 'Submit';

  @override
  String get sermonDiscussionSubmitted => 'Response saved.';

  @override
  String get sermonDiscussionError =>
      'Could not save the response. Please try again.';

  @override
  String get sermonDiscussionLoadError =>
      'Could not load the discussion guide.';

  @override
  String get sermonDiscussionObservationChip => 'Observe';

  @override
  String get sermonDiscussionInterpretationChip => 'Interpret';

  @override
  String get sermonDiscussionApplicationChip => 'Apply';

  @override
  String get sermonDiscussionPrayerChip => 'Pray';

  @override
  String get sermonDiscussionActionChip => 'Act';

  @override
  String get sermonAiSheetTitle => 'Sermon Q&A';

  @override
  String get sermonAiDefaultQuestion =>
      'Help me understand the main point of this sermon.';

  @override
  String get sermonAiGenerateAction => 'Ask sermon question';

  @override
  String get relatedSermonsTitle => 'Related sermons';

  @override
  String get sermonLoadErrorTitle => 'Sermons could not be loaded';

  @override
  String get sermonLoadErrorBody =>
      'The app will fetch the sermon list from the backend again.';

  @override
  String get retryAction => 'Retry';

  @override
  String get sermonEmptyTitle => 'No sermons yet';

  @override
  String get sermonAudioMissing => 'Audio not uploaded yet';

  @override
  String get sermonAudioPreparing => 'Preparing audio';

  @override
  String get sermonAudioLoading => 'Loading audio';

  @override
  String get sermonAudioReady => 'Ready to play';

  @override
  String get sermonAudioUnavailable => 'Audio could not be loaded';

  @override
  String get rewindTooltip => 'Back 15 seconds';

  @override
  String get playTooltip => 'Play';

  @override
  String get forwardTooltip => 'Forward 30 seconds';

  @override
  String get lifeTitle => 'Church Life';

  @override
  String get notificationsTooltip => 'Notifications';

  @override
  String get notificationsPageTitle => 'Notifications';

  @override
  String get notificationInboxTitle => 'Recent notifications';

  @override
  String unreadCountSemanticLabel(String label, int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count unread items',
      one: '1 unread item',
    );
    return '$label, $_temp0';
  }

  @override
  String get notificationInboxEmptyTitle => 'No notifications yet';

  @override
  String get notificationInboxEmptyBody =>
      'New church updates will appear here after this device receives them.';

  @override
  String get notificationRefreshAction => 'Refresh notifications';

  @override
  String get notificationMarkAllReadAction => 'Mark all as read';

  @override
  String get notificationClearAction => 'Clear notifications';

  @override
  String get notificationDeviceUnavailableBody =>
      'Push notifications are unavailable until Firebase app configuration is added for this build.';

  @override
  String get weeklyBulletinTitle => 'Weekly bulletin';

  @override
  String get lifeSundayHeroEmptyBody =>
      'Sunday worship information will appear here after church staff publish it.';

  @override
  String get lifeTabWeek => 'This week';

  @override
  String get lifeTabEvents => 'Events';

  @override
  String get lifeTabGroups => 'Groups';

  @override
  String get lifeTabCourses => 'Courses';

  @override
  String get lifeTabServing => 'Serving';

  @override
  String get lifeTabPrayer => 'Prayer';

  @override
  String get lifeTabWeekEmpty =>
      'New church life cards will appear here when they are published.';

  @override
  String get lifeTabEventsEmpty =>
      'No open event cards are available right now.';

  @override
  String get lifeTabMemberSignInBody =>
      'Sign in from Mine to see member-only groups, courses, serving, and care cards.';

  @override
  String get lifeTabPrayerDisabled =>
      'Prayer requests are not enabled for this build yet.';

  @override
  String get lifeOpenDetailAction => 'View details';

  @override
  String get lifeUpdatesTitle => 'Latest updates';

  @override
  String get lifeParticipationTitle => 'My participation';

  @override
  String get lifeLoadErrorTitle => 'Church life could not be loaded';

  @override
  String get lifeLoadErrorBody =>
      'The app will fetch bulletin and life content from the backend again.';

  @override
  String get lifeSectionLoadError =>
      'This section could not be loaded. Please try again.';

  @override
  String get lifeEmptyTitle => 'No church life content yet';

  @override
  String get lifePostNoBody => 'Details will be added soon.';

  @override
  String get lifePostVisibilityMembers => 'Members';

  @override
  String get lifePostVisibilityGroup => 'Group';

  @override
  String get lifePostVisibilityPrivate => 'Private';

  @override
  String get lifePostTypeWeeklyBulletin => 'Bulletin';

  @override
  String get lifePostTypeSunday => 'Sunday';

  @override
  String get lifePostTypeAnnouncement => 'Announcement';

  @override
  String get lifePostTypeEvent => 'Event';

  @override
  String get lifePostTypeGroup => 'Group';

  @override
  String get lifePostTypeFellowship => 'Fellowship';

  @override
  String get lifePostTypeCourse => 'Course';

  @override
  String get lifePostTypeServing => 'Serving';

  @override
  String get lifePostTypePrayer => 'Prayer';

  @override
  String get lifePostTypeGiving => 'Giving';

  @override
  String get lifePostUnread => 'Unread';

  @override
  String get lifePostActionOpen => 'Open link';

  @override
  String get lifePostScheduleTbd => 'Time to be announced';

  @override
  String get myEventRegistrationsTitle => 'My registrations';

  @override
  String get groupsTitle => 'Groups and fellowships';

  @override
  String get groupsEmptyBody =>
      'No groups or fellowships are available right now.';

  @override
  String get groupApplyAction => 'Apply to join';

  @override
  String get groupAlreadyMember => 'You are a member';

  @override
  String get groupApplicationSubmitted => 'Application submitted';

  @override
  String get groupApplicationSubmitSuccess => 'Application submitted.';

  @override
  String get groupWithdrawAction => 'Withdraw application';

  @override
  String get groupApplicationWithdrawSuccess => 'Application withdrawn.';

  @override
  String get groupCapacityFull => 'Group is full';

  @override
  String get groupMyGroupsTitle => 'My groups';

  @override
  String get groupMyGroupsEmptyBody => 'You are not currently in a group.';

  @override
  String get groupSignInToViewMineBody =>
      'Sign in to view your groups across devices.';

  @override
  String groupMemberCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count members',
      one: '1 member',
    );
    return '$_temp0';
  }

  @override
  String groupMemberCapacity(int count, int capacity) {
    return '$count/$capacity members';
  }

  @override
  String get coursesTitle => 'Courses and classes';

  @override
  String get coursesEmptyBody => 'No courses are open right now.';

  @override
  String get courseMyCoursesTitle => 'My courses';

  @override
  String get courseMyCoursesEmptyBody =>
      'You do not have any course enrollments yet.';

  @override
  String get courseLessonsTitle => 'Course lessons';

  @override
  String get courseLessonsEmptyBody =>
      'No lessons have been published for this course yet.';

  @override
  String get courseSignInToEnrollBody =>
      'Sign in to enroll and keep your course progress across devices.';

  @override
  String get courseSignInToViewMineBody =>
      'Sign in to view your current and completed courses.';

  @override
  String get courseEnrollAction => 'Enroll';

  @override
  String get courseSubmittedAction => 'Submitted';

  @override
  String get courseEnrolledAction => 'Enrolled';

  @override
  String get courseWaitlistedAction => 'Waitlisted';

  @override
  String get courseCancelledAction => 'Cancelled';

  @override
  String get courseCompletedAction => 'Completed';

  @override
  String get courseEnrollmentSubmitSuccess => 'Course enrollment submitted.';

  @override
  String get courseStatusDraft => 'Draft';

  @override
  String get courseStatusOpen => 'Open';

  @override
  String get courseStatusClosed => 'Closed';

  @override
  String get courseStatusInProgress => 'In progress';

  @override
  String get courseStatusCompleted => 'Completed';

  @override
  String get courseStatusArchived => 'Archived';

  @override
  String courseLessonCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count lessons',
      one: '1 lesson',
    );
    return '$_temp0';
  }

  @override
  String get courseCapacityOpen => 'Open capacity';

  @override
  String courseCapacityLabel(int count, int capacity) {
    return '$count/$capacity seats';
  }

  @override
  String courseProgressLabel(int completed, int total) {
    return '$completed/$total lessons completed';
  }

  @override
  String get servingTitle => 'My serving';

  @override
  String get servingEmptyBody =>
      'No serving assignments are scheduled right now.';

  @override
  String get servingConfirmAction => 'Confirm';

  @override
  String get servingLeaveAction => 'Request leave';

  @override
  String get servingConfirmSuccess => 'Serving assignment confirmed.';

  @override
  String get servingLeaveSuccess => 'Leave request submitted.';

  @override
  String get servingStatusScheduled => 'Scheduled';

  @override
  String get servingStatusConfirmed => 'Confirmed';

  @override
  String get servingStatusDeclined => 'Leave requested';

  @override
  String get servingStatusSwapRequested => 'Swap requested';

  @override
  String get servingStatusCovered => 'Covered';

  @override
  String get servingStatusCancelled => 'Cancelled';

  @override
  String get servingScheduleTab => 'Schedule';

  @override
  String get servingAvailabilityTab => 'Availability';

  @override
  String get servingAvailabilityEmptyBody =>
      'No availability has been submitted yet.';

  @override
  String get servingAvailabilityAddAction => 'Add availability';

  @override
  String get servingAvailabilitySheetTitle => 'New availability';

  @override
  String get servingAvailabilityStatusLabel => 'Availability status';

  @override
  String get servingAvailabilityStatusAvailable => 'Available';

  @override
  String get servingAvailabilityStatusUnavailable => 'Unavailable';

  @override
  String get servingAvailabilityStatusPreferred => 'Preferred time';

  @override
  String get servingAvailabilityStartLabel => 'Starts';

  @override
  String get servingAvailabilityEndLabel => 'Ends';

  @override
  String get servingAvailabilityNoteHint => 'Optional note';

  @override
  String get servingAvailabilitySaveAction => 'Save availability';

  @override
  String get servingAvailabilityCreateSuccess => 'Availability saved.';

  @override
  String get servingAvailabilityInvalidRange =>
      'The end time must be later than the start time.';

  @override
  String get servingCheckInTitle => 'Arrival status';

  @override
  String get servingCheckInAction => 'Confirm arrival';

  @override
  String get servingCheckInSuccess => 'Arrival confirmed.';

  @override
  String get servingCheckInNotRecorded => 'Arrival has not been confirmed yet.';

  @override
  String get servingCheckInStatusPending => 'Pending';

  @override
  String get servingCheckInStatusCheckedIn => 'Arrived';

  @override
  String get servingCheckInStatusMissed => 'Missed';

  @override
  String get servingAssignmentNoteTitle => 'Serving note';

  @override
  String get servingResponseNoteTitle => 'My response';

  @override
  String get eventRegistrationTitle => 'Event registration';

  @override
  String get eventRegistrationRegisterAction => 'Register';

  @override
  String get eventRegistrationUpdateAction => 'Save changes';

  @override
  String get eventRegistrationCancelAction => 'Cancel registration';

  @override
  String get eventRegistrationCheckInAction => 'Check in';

  @override
  String get eventCheckInScanAction => 'Scan onsite code';

  @override
  String get eventCheckInScanTitle => 'Onsite check-in';

  @override
  String get eventCheckInScanPrompt =>
      'Scan the event check-in QR printed by a leader.';

  @override
  String get eventCheckInScanSuccessTitle => 'Checked in';

  @override
  String get eventCheckInScanViewEvent => 'View event';

  @override
  String get eventCheckInScanAgain => 'Scan another';

  @override
  String get eventCheckInScanSignInRequired =>
      'Sign in before scanning an onsite check-in QR.';

  @override
  String get eventCheckInQrInvalid =>
      'This check-in QR is invalid. Please scan again.';

  @override
  String get eventCheckInQrExpired =>
      'This check-in QR has expired. Please ask a leader.';

  @override
  String get eventCheckInQrDisabled =>
      'This check-in QR has been disabled. Please ask a leader.';

  @override
  String get eventCheckInQrRegistrationRequired =>
      'We could not find your event registration. Please register first or ask a leader.';

  @override
  String get eventRegistrationRegistered => 'You are registered';

  @override
  String get eventRegistrationCheckedIn => 'You are checked in';

  @override
  String get eventRegistrationSignInBody =>
      'Sign in to register for this event.';

  @override
  String get eventRegistrationFull => 'Registration is full.';

  @override
  String get eventRegistrationClosed => 'Registration is closed.';

  @override
  String get eventRegistrationUnavailable =>
      'This event is no longer available.';

  @override
  String get eventRegistrationNotFound =>
      'Your registration was not found. Refresh and try again.';

  @override
  String get eventRegistrationPartySizeInvalid =>
      'Choose a smaller party size.';

  @override
  String get eventRegistrationCheckInLocked =>
      'Checked-in registrations can only be changed by a leader.';

  @override
  String get eventRegistrationSuccess => 'Registration confirmed.';

  @override
  String get eventRegistrationUpdateSuccess => 'Registration updated.';

  @override
  String get eventRegistrationCancelSuccess => 'Registration canceled.';

  @override
  String get eventRegistrationCheckInSuccess => 'Checked in.';

  @override
  String eventRegistrationCheckedInAt(String time) {
    return 'Checked in at $time';
  }

  @override
  String get eventRegistrationPartySizeLabel => 'People attending';

  @override
  String eventRegistrationPartySize(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count people',
      one: '1 person',
    );
    return '$_temp0';
  }

  @override
  String get eventRegistrationNoteLabel => 'Note';

  @override
  String get eventRegistrationNoteHint =>
      'Meal needs, arrival notes, or how you can help';

  @override
  String eventRegistrationSpots(int registered, int capacity) {
    return '$registered/$capacity registered';
  }

  @override
  String eventRegistrationUnlimitedSpots(int registered) {
    return '$registered registered';
  }

  @override
  String eventRegistrationRemaining(int remaining) {
    return '$remaining spots left';
  }

  @override
  String get givingGuestBody =>
      'Sign in to see your own giving history and annual statements.';

  @override
  String get givingHistoryTitle => 'Giving history';

  @override
  String get givingTransactionsTitle => 'Recent transactions';

  @override
  String get givingTransactionsEmptyBody =>
      'No giving transactions are available yet.';

  @override
  String givingSummaryYear(int year) {
    return 'Year $year';
  }

  @override
  String givingSummaryAmount(String amount) {
    return 'Total $amount';
  }

  @override
  String givingSummaryCount(int count) {
    return '$count gifts';
  }

  @override
  String get givingStatementSectionTitle => 'Annual statements';

  @override
  String get annualStatementsTitle => 'Annual statements';

  @override
  String get annualStatementsEmptyBody =>
      'No annual statements are available yet.';

  @override
  String givingStatementLabel(int year) {
    return 'Statement $year';
  }

  @override
  String get prayerTitle => 'Prayer';

  @override
  String get prayerEmptyBody => 'No shared prayer requests yet.';

  @override
  String get prayerSubmitTitle => 'Submit a prayer request';

  @override
  String get prayerSubmitAction => 'Submit';

  @override
  String get prayerGuestSubmitBody =>
      'You can submit as a guest. Private requests only go to the pastoral/admin team.';

  @override
  String get prayerMemberSubmitBody =>
      'This request will be linked to your member profile so you can track its status.';

  @override
  String get prayerTitleLabel => 'Title';

  @override
  String get prayerBodyLabel => 'Prayer request';

  @override
  String get prayerNameLabel => 'Name';

  @override
  String get prayerValidationError =>
      'Please enter a title and prayer request.';

  @override
  String get prayerSubmittedMessage => 'Prayer request submitted for review.';

  @override
  String get prayerMineLabel => 'Mine';

  @override
  String get prayerVisibilityPrivate => 'Private';

  @override
  String get prayerVisibilityPublic => 'Public';

  @override
  String get prayerVisibilityMembers => 'Members';

  @override
  String get prayerVisibilityGroup => 'Group';

  @override
  String get prayerStatusPending => 'Pending';

  @override
  String get prayerStatusApproved => 'Approved';

  @override
  String get prayerStatusHidden => 'Hidden';

  @override
  String get prayerStatusArchived => 'Archived';

  @override
  String get careTitle => 'Care';

  @override
  String get careEmptyBody => 'No care requests yet.';

  @override
  String get careSubmitTitle => 'Request pastoral care';

  @override
  String get careSubmitAction => 'Request care';

  @override
  String get careSubmitBody =>
      'Share what would help the pastoral team care for you. Internal follow-up notes stay private to authorized staff.';

  @override
  String get careSignInRequired =>
      'Sign in as a member to request pastoral care.';

  @override
  String get careTitleLabel => 'Title';

  @override
  String get careBodyLabel => 'How can we care for you?';

  @override
  String get carePrivacyLabel => 'Privacy';

  @override
  String get carePrivacyPastoralOnly => 'Pastoral team only';

  @override
  String get carePrivacyAssignedTeam => 'Assigned care team';

  @override
  String get carePrivacyAdminRestricted => 'Restricted admins only';

  @override
  String get careValidationError => 'Please enter a title and care request.';

  @override
  String get careSubmittedMessage => 'Care request submitted.';

  @override
  String get careStatusSubmitted => 'Submitted';

  @override
  String get careStatusAssigned => 'Assigned';

  @override
  String get careStatusInProgress => 'In progress';

  @override
  String get careStatusResolved => 'Resolved';

  @override
  String get careStatusArchived => 'Archived';

  @override
  String careNextFollowUp(String date) {
    return 'Next follow-up $date';
  }

  @override
  String get givingTitle => 'Giving';

  @override
  String get givingCardTitle => 'Giving and annual statements';

  @override
  String get givingCardBody =>
      'Give securely through Stripe, then return here to review confirmed gifts and annual statements.';

  @override
  String get givingCheckoutTitle => 'Give now';

  @override
  String get givingCheckoutBody =>
      'Your payment is processed by Stripe. The app never stores card or bank details.';

  @override
  String get givingAmountLabel => 'Amount';

  @override
  String get givingFundLabel => 'Giving fund';

  @override
  String get givingFundsLoading => 'Loading giving funds...';

  @override
  String get givingFundsEmpty => 'No giving funds are available right now.';

  @override
  String get givingCategoryOffering => 'Offering';

  @override
  String get givingCategoryMissions => 'Missions';

  @override
  String get givingCheckoutAction => 'Continue to Stripe';

  @override
  String get givingAmountError =>
      'Enter an amount from USD 1.00 to USD 100,000.00 with no more than two decimal places.';

  @override
  String get givingCheckoutOpenError =>
      'Could not open the Stripe checkout page.';

  @override
  String get givingCheckoutReturnSuccess =>
      'Stripe checkout finished. Your gift will appear after payment confirmation.';

  @override
  String get givingCheckoutReturnCancel => 'Stripe checkout was canceled.';

  @override
  String get annualStatementTooltip => 'Annual statement';

  @override
  String get annualStatementPreviewAction => 'Preview CSV';

  @override
  String get annualStatementCopyCsvAction => 'Copy CSV';

  @override
  String get annualStatementCopiedMessage => 'Statement CSV copied.';

  @override
  String get annualStatementSavePdfAction => 'Save PDF';

  @override
  String get annualStatementSharePdfAction => 'Share PDF';

  @override
  String get annualStatementSharePdfText => 'Annual giving statement';

  @override
  String get annualStatementPdfSharedMessage => 'Statement PDF shared.';

  @override
  String get annualStatementPdfOpenedMessage =>
      'Statement PDF saved and opened.';

  @override
  String annualStatementPdfSavedMessage(String path) {
    return 'Statement PDF saved to $path.';
  }

  @override
  String get copyPathAction => 'Copy path';

  @override
  String get annualStatementExportTitle => 'Statement export';

  @override
  String get annualStatementStatusPendingLabel => 'Pending';

  @override
  String get annualStatementStatusReadyLabel => 'Ready';

  @override
  String get annualStatementStatusSentLabel => 'Sent';

  @override
  String get annualStatementStatusFailedLabel => 'Failed';

  @override
  String get givingStatusPendingLabel => 'Pending';

  @override
  String get givingStatusSucceededLabel => 'Succeeded';

  @override
  String get givingStatusFailedLabel => 'Failed';

  @override
  String get givingStatusRefundedLabel => 'Refunded';

  @override
  String get bibleTtsReadyTitle => 'Read aloud';

  @override
  String bibleTtsCurrentVerse(int verse) {
    return 'Reading verse $verse';
  }

  @override
  String bibleTtsPausedVerse(int verse) {
    return 'Paused at verse $verse. Resume will reread this verse.';
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
  String get bibleTtsPlayTooltip => 'Read aloud';

  @override
  String get bibleTtsPauseTooltip => 'Pause reading';

  @override
  String get bibleTtsStopTooltip => 'Stop reading';

  @override
  String get bibleTtsPreviousVerseTooltip => 'Previous verse';

  @override
  String get bibleTtsNextVerseTooltip => 'Next verse';

  @override
  String get bibleTtsErrorTextMissing => 'This passage has no readable text.';

  @override
  String get bibleTtsErrorEngineUnavailable =>
      'Text-to-speech is unavailable on this device. Check the system speech settings and try again.';

  @override
  String get bibleTtsErrorLanguageUnavailable =>
      'The system voice for this Bible language is not installed.';

  @override
  String get bibleTtsErrorInterrupted =>
      'Reading was interrupted. Tap play to continue from this verse.';

  @override
  String get bibleTtsErrorStartFailed =>
      'Reading could not start. Check the device speech settings and try again.';

  @override
  String get newcomerCardTitle => 'New here?';

  @override
  String get newcomerCardBody =>
      'We would love to welcome you, answer questions, and help you connect with church life.';

  @override
  String get newcomerCardAction => 'I\'m new';

  @override
  String get newcomerSheetTitle => 'Welcome to MBCG';

  @override
  String get newcomerSheetGuestBody =>
      'Leave a few details and our church team will follow up with you.';

  @override
  String get newcomerSheetMemberBody =>
      'You can also introduce yourself or ask our team to follow up with you.';

  @override
  String get newcomerNameLabel => 'Name';

  @override
  String get newcomerEmailLabel => 'Email';

  @override
  String get newcomerPhoneLabel => 'Phone';

  @override
  String get newcomerInterestLabel => 'What would you like to learn about?';

  @override
  String get newcomerSubmitAction => 'Send to church team';

  @override
  String get newcomerNameValidationError => 'Please enter your name.';

  @override
  String get newcomerContactValidationError =>
      'Please leave an email or phone number.';

  @override
  String get newcomerEmailValidationError =>
      'Please enter a valid email address.';

  @override
  String get newcomerSubmittedMessage =>
      'Thank you. We received your information.';

  @override
  String get mineDiscipleshipTitle => 'My discipleship journey';

  @override
  String get mineDiscipleshipBody =>
      'Follow the next steps assigned by the church team.';

  @override
  String get mineDiscipleshipEmpty =>
      'No discipleship journey is assigned yet.';

  @override
  String get mineDiscipleshipLoadError =>
      'Could not load your discipleship journey.';

  @override
  String mineDiscipleshipProgressChip(int completed, int total) {
    return '$completed/$total tasks';
  }

  @override
  String get discipleshipStatusNotStarted => 'Not started';

  @override
  String get discipleshipStatusInProgress => 'In progress';

  @override
  String get discipleshipStatusBlocked => 'Blocked';

  @override
  String get discipleshipStatusCompleted => 'Completed';

  @override
  String get discipleshipStatusPaused => 'Paused';

  @override
  String get discipleshipStatusCancelled => 'Cancelled';
}
