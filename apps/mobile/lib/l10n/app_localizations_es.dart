// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get appTitle => 'MBCG';

  @override
  String get commonStatusUnknownLabel => 'Estado desconocido';

  @override
  String get commonVisibilityUnknownLabel => 'Visibilidad desconocida';

  @override
  String get commonPrivacyUnknownLabel => 'Privacidad desconocida';

  @override
  String get tabStudy => 'Estudio';

  @override
  String get tabSermons => 'Sermones';

  @override
  String get tabLife => 'Vida';

  @override
  String get tabMine => 'Mi perfil';

  @override
  String get mineTitle => 'Mi perfil';

  @override
  String get memberOptionalSignInTitle => 'Inicio de sesión opcional';

  @override
  String get memberOptionalSignInBody =>
      'Sigue usando la app como invitado, o inicia sesión más adelante para sincronizar lectura, oración y registros de ofrendas.';

  @override
  String get memberEmailLabel => 'Correo';

  @override
  String get memberInvalidEmail => 'Ingresa un correo electrónico válido.';

  @override
  String get memberShowPasswordTooltip => 'Mostrar contraseña';

  @override
  String get memberHidePasswordTooltip => 'Ocultar contraseña';

  @override
  String get memberNameLabel => 'Nombre';

  @override
  String get memberPasswordLabel => 'Contraseña';

  @override
  String get memberConfirmPasswordLabel => 'Confirmar contraseña';

  @override
  String get memberCodeLabel => 'Código';

  @override
  String get memberVerifyEmailAction => 'Verificar correo';

  @override
  String get memberSignInAction => 'Iniciar sesión';

  @override
  String get memberContinueWithGoogle => 'Continuar con Google';

  @override
  String get memberContinueWithApple => 'Continuar con Apple';

  @override
  String get memberAuthAlternative => 'o';

  @override
  String get memberFederatedSetupUnavailable =>
      'El inicio con Google y Apple aún no está configurado.';

  @override
  String get memberFederatedSignInFailed =>
      'No se pudo completar el inicio de sesión. Inténtalo de nuevo.';

  @override
  String get memberLoginEmailTitle => 'Bienvenido de nuevo';

  @override
  String get memberLoginEmailBody =>
      'Inicia sesión para continuar tu vida en la iglesia.';

  @override
  String get memberNextAction => 'Siguiente';

  @override
  String get memberCreateAccountAction => 'Crear cuenta';

  @override
  String get memberPasswordTitle => 'Ingresa tu contraseña';

  @override
  String get memberForgotPasswordAction => '¿Olvidaste tu contraseña?';

  @override
  String get memberPasswordResetTitle => 'Restablecer contraseña';

  @override
  String get memberPasswordResetRequestBody =>
      'Enviaremos un código si este correo puede restablecer una contraseña.';

  @override
  String get memberPasswordResetCodeBody =>
      'Ingresa el código de tu correo y elige una nueva contraseña.';

  @override
  String get memberPasswordResetAction => 'Restablecer contraseña';

  @override
  String get memberPasswordResetComplete =>
      'Contraseña actualizada. Inicia sesión con tu nueva contraseña.';

  @override
  String get memberBackToSignInAction => 'Volver a iniciar sesión';

  @override
  String get memberRegisterAction => 'Registrarse';

  @override
  String get memberChangeEmailAction => 'Cambiar correo';

  @override
  String get memberPasswordMismatch => 'Las contraseñas no coinciden.';

  @override
  String get memberSignOutAction => 'Cerrar sesión';

  @override
  String get memberRegistrationClosed =>
      'El registro de miembros está cerrado. Contacta a la oficina de la iglesia.';

  @override
  String get memberRegistrationPendingApproval =>
      'Registro recibido. Espera la aprobación de la iglesia.';

  @override
  String get memberProfileTitle => 'Mi perfil';

  @override
  String get memberProfileEditTitle => 'Detalles del perfil';

  @override
  String get memberProfileSaveAction => 'Guardar perfil';

  @override
  String get memberProfileSaved => 'Perfil guardado.';

  @override
  String get memberProfileOpenAction => 'Editar perfil';

  @override
  String get memberStatusLabel => 'Estado';

  @override
  String get memberRoleLabel => 'Rol';

  @override
  String get memberGroupLabel => 'Grupo';

  @override
  String get memberNoGroupLabel => 'Sin grupo';

  @override
  String get memberPhoneLabel => 'Teléfono';

  @override
  String get memberAddressLabel => 'Dirección';

  @override
  String get memberFaithStartYearLabel => 'Año de fe';

  @override
  String get memberBaptizedYearLabel => 'Año de bautismo';

  @override
  String get memberJoinedChurchAtLabel => 'Fecha de ingreso';

  @override
  String get memberEmergencyContactNameLabel => 'Contacto de emergencia';

  @override
  String get memberEmergencyContactPhoneLabel => 'Teléfono de emergencia';

  @override
  String get mineGivingEntryTitle => 'Ofrendas y comprobantes anuales';

  @override
  String get mineGivingEntryBody =>
      'Abre historial de ofrendas, registros confirmados y PDFs anuales.';

  @override
  String get mineLifeOverviewTitle => 'Mi vida de iglesia';

  @override
  String get mineLifeOverviewBody =>
      'Estado rápido de tus grupos, clases, servicio y solicitudes de cuidado.';

  @override
  String get mineLifeGroupsLabel => 'grupos';

  @override
  String get mineLifeCoursesLabel => 'clases';

  @override
  String mineLifeCoursesCountLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count clases',
      one: '1 clase',
    );
    return '$_temp0';
  }

  @override
  String get mineLifeServingLabel => 'servicio';

  @override
  String mineLifeServingCountLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count servicios',
      one: '1 servicio',
    );
    return '$_temp0';
  }

  @override
  String get mineLifeCareLabel => 'cuidado';

  @override
  String mineLifeOverviewMetricSemanticLabel(String label, int count) {
    return '$label: $count';
  }

  @override
  String get mineLifeOpenLifeAction => 'Abrir Vida';

  @override
  String get preferencesTitle => 'Preferencias';

  @override
  String get appearanceTitle => 'Apariencia';

  @override
  String get themeModeSystem => 'Sistema';

  @override
  String get themeModeLight => 'Claro';

  @override
  String get themeModeDark => 'Oscuro';

  @override
  String get textSizeTitle => 'Tamaño del texto';

  @override
  String get textSizeBody =>
      'Haz que el texto sea más fácil de leer para la adoración y la vida de la iglesia.';

  @override
  String get textSizeSystem => 'Sistema';

  @override
  String get textSizeStandard => 'Normal';

  @override
  String get textSizeLarge => 'Grande';

  @override
  String get textSizeExtraLarge => 'Muy grande';

  @override
  String get notificationPermissionTitle => 'Permiso de notificaciones';

  @override
  String get notificationPermissionEnabledBody =>
      'Las notificaciones están permitidas. Usa el interruptor para abrir la configuración del sistema si quieres desactivarlas.';

  @override
  String get notificationPermissionDisabledBody =>
      'Las notificaciones están desactivadas. Activa esto para solicitar el permiso del sistema.';

  @override
  String get aboutTitle => 'Acerca de';

  @override
  String get aboutChurchTitle => 'Acerca de la iglesia';

  @override
  String get churchAddressTitle => 'Dirección / mapa';

  @override
  String get churchPhoneTitle => 'Teléfono';

  @override
  String get churchEmailTitle => 'Correo de contacto';

  @override
  String get privacyPolicyTitle => 'Política de privacidad';

  @override
  String get termsOfUseTitle => 'Términos de uso';

  @override
  String get appVersionTitle => 'Versión de la App';

  @override
  String appVersionValue(String version) {
    return 'Versión $version';
  }

  @override
  String get periodPickerTooltip => 'Elegir rango de fechas';

  @override
  String get periodThisWeek => 'Esta semana';

  @override
  String get periodThisMonth => 'Este mes';

  @override
  String get periodPreviousAction => 'Anterior';

  @override
  String get periodNextAction => 'Siguiente';

  @override
  String get periodApplyAction => 'Aplicar';

  @override
  String get languageTitle => 'Idioma';

  @override
  String get systemLanguageLabel => 'Idioma del sistema';

  @override
  String get languageSystemBody =>
      'La app sigue el idioma del sistema. Para cambiarlo, usa la configuración nativa de esta app.';

  @override
  String get openSystemSettingsAction => 'Abrir configuración del sistema';

  @override
  String get bibleTranslationLabel => 'Traducción bíblica';

  @override
  String get studyTitle => 'Biblia';

  @override
  String get bibleSearchTooltip => 'Buscar en la Biblia';

  @override
  String get bibleSearchTitle => 'Buscar en la Biblia';

  @override
  String get bibleSearchHint => 'Busca una frase o palabras clave';

  @override
  String get bibleSearchStartTitle => 'Buscar la Biblia';

  @override
  String get bibleSearchStartBody =>
      'Escribe una frase, parte de un versículo o palabras clave. Los resultados usan la traducción bíblica del idioma actual.';

  @override
  String get bibleSearchNoResultsTitle => 'No hay versículos coincidentes';

  @override
  String get bibleSearchNoResultsBody =>
      'Prueba con menos palabras u otra frase. La búsqueda permite coincidencias parciales, pero puede ignorar palabras muy cortas.';

  @override
  String get bibleSearchErrorTitle => 'La búsqueda falló';

  @override
  String get versePickerTooltip => 'Elegir versículo';

  @override
  String get versePickerTitle => 'Elegir un versículo';

  @override
  String get readerSettingsTooltip => 'Ajustes de lectura';

  @override
  String get readerSettingsTitle => 'Ajustes de lectura';

  @override
  String get readerAssistsTitle => 'Ayudas de lectura';

  @override
  String get chapterPeopleAssistTitle => 'Personas del capítulo';

  @override
  String get chapterPeopleAssistBody =>
      'Muestra una entrada del capítulo para figuras bíblicas encontradas en este capítulo.';

  @override
  String get chapterPlacesAssistTitle => 'Lugares del capítulo';

  @override
  String get chapterPlacesAssistBody =>
      'Muestra una entrada del capítulo para lugares bíblicos encontrados en este capítulo.';

  @override
  String get lexiconAssistTitle => 'Palabras del idioma original';

  @override
  String get lexiconAssistBody =>
      'Muestra información de palabras originales cuando un versículo tiene datos locales de léxico.';

  @override
  String get aiStudyHintsAssistTitle => 'Ayudas de estudio con IA';

  @override
  String get aiStudyHintsAssistBody =>
      'Activa explicaciones al mantener presionado un versículo y ayudas relacionadas.';

  @override
  String get chapterPeopleTooltip => 'Personas en este capítulo';

  @override
  String get chapterPeopleTitle => 'Personas en este capítulo';

  @override
  String get chapterPlacesTooltip => 'Lugares en este capítulo';

  @override
  String get chapterPlacesTitle => 'Lugares en este capítulo';

  @override
  String get continueReadingTitle => 'Continuar leyendo';

  @override
  String get continueReadingAction => 'Continuar';

  @override
  String get defaultContinueReadingTitle => 'Romanos 8';

  @override
  String get defaultContinueReadingSubtitle => 'Continuar desde Romanos 8';

  @override
  String continueReadingChapterSubtitle(String bookName, int chapter) {
    return 'Continuar desde $bookName $chapter';
  }

  @override
  String continueReadingVerseSubtitle(
    int chapter,
    String verse,
    String bookName,
  ) {
    return 'Última lectura $chapter:$verse · $bookName';
  }

  @override
  String get readingPlansTitle => 'Mi plan de lectura';

  @override
  String get readingPlansBody =>
      'Continúa tu plan actual con el texto bíblico local y TTS.';

  @override
  String get readingPlanStartAction => 'Comenzar';

  @override
  String get readingPlanContinueAction => 'Continuar';

  @override
  String get readingPlanReadAction => 'Leer';

  @override
  String get readingPlanCompleteDayAction => 'Marcar completo';

  @override
  String get readingPlanCompletedLabel => 'Completado';

  @override
  String get readingPlanNoDaysBody =>
      'Este plan aún no tiene referencias diarias.';

  @override
  String get readingPlanLoadErrorTitle => 'No se pudieron cargar los planes';

  @override
  String get readingPlanLoadErrorBody => 'Actualiza e inténtalo de nuevo.';

  @override
  String get readingPlanActionError =>
      'No se pudo actualizar el plan. Inténtalo de nuevo.';

  @override
  String readingPlanDaysLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count días',
      one: '1 día',
    );
    return '$_temp0';
  }

  @override
  String readingPlanDayLabel(int dayNumber) {
    return 'Día $dayNumber';
  }

  @override
  String readingPlanProgressLabel(int completed, int total) {
    return '$completed/$total completados';
  }

  @override
  String get mineReadingPlansTitle => 'Mis planes de lectura';

  @override
  String get mineReadingPlansBody =>
      'Tus planes personales de lectura y su progreso.';

  @override
  String get mineReadingPlansEmpty =>
      'Comienza un plan desde Estudio para ver tu progreso aquí.';

  @override
  String get mineReadingPlansOpenStudyAction => 'Abrir Estudio';

  @override
  String get readingPlanCurrentTab => 'Actuales';

  @override
  String get readingPlanHistoryTab => 'Historial';

  @override
  String get readingPlanCurrentEmpty =>
      'No hay ningún plan de lectura en curso.';

  @override
  String get readingPlanHistoryEmpty =>
      'Los planes completados o finalizados aparecerán aquí.';

  @override
  String get readingPlanViewAllAction => 'Ver planes';

  @override
  String get readingPlanRestartAction => 'Comenzar de nuevo';

  @override
  String get readingPlanLoadMoreAction => 'Cargar más';

  @override
  String get readingPlanPauseAction => 'Pausar';

  @override
  String get readingPlanResumeAction => 'Reanudar';

  @override
  String get readingPlanAbandonAction => 'Finalizar plan';

  @override
  String get readingPlanAbandonConfirmBody =>
      '¿Finalizar este intento y moverlo al historial? Su progreso seguirá disponible.';

  @override
  String get readingPlanNotStartedLabel => 'Sin comenzar';

  @override
  String get readingPlanActiveLabel => 'En curso';

  @override
  String get readingPlanPausedLabel => 'En pausa';

  @override
  String get readingPlanAbandonedLabel => 'Finalizado';

  @override
  String readingPlanAttemptLabel(int attempt) {
    return 'Intento $attempt';
  }

  @override
  String readingPlanStartedOn(String date) {
    return 'Comenzado el $date';
  }

  @override
  String readingPlanEndedOn(String date) {
    return 'Finalizado el $date';
  }

  @override
  String get readingPlanHistoryDetailTitle => 'Detalles del plan';

  @override
  String get readingPlanNoteLabel => 'Nota';

  @override
  String get readingPlanRestartedMessage =>
      'Se inició un nuevo intento del plan de lectura.';

  @override
  String mineReadingPlanProgressChip(int completed) {
    return '$completed hechos';
  }

  @override
  String get oldTestamentLabel => 'Antiguo Testamento';

  @override
  String get newTestamentLabel => 'Nuevo Testamento';

  @override
  String bibleBookCountLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count libros',
      one: '1 libro',
    );
    return '$_temp0';
  }

  @override
  String bibleChapterCountLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count capítulos',
      one: '1 capítulo',
    );
    return '$_temp0';
  }

  @override
  String bibleChapterCountWithName(int count, String bookName) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count capítulos',
      one: '1 capítulo',
    );
    return '$_temp0 · $bookName';
  }

  @override
  String bibleChapterReference(String bookName, int chapter) {
    return '$bookName $chapter';
  }

  @override
  String bibleChapterButtonSemanticLabel(String bookName, int chapter) {
    return '$bookName, capítulo $chapter';
  }

  @override
  String get categoryLaw => 'Ley';

  @override
  String get categoryOldTestamentHistory => 'Historia';

  @override
  String get categoryWisdom => 'Poesía y sabiduría';

  @override
  String get categoryMajorProphets => 'Profetas mayores';

  @override
  String get categoryMinorProphets => 'Profetas menores';

  @override
  String get categoryGospels => 'Evangelios';

  @override
  String get categoryActs => 'Historia';

  @override
  String get categoryPaulineLetters => 'Cartas paulinas';

  @override
  String get categoryGeneralLetters => 'Cartas generales';

  @override
  String get categoryApocalyptic => 'Apocalíptica';

  @override
  String get studyLoadErrorTitle => 'No se pudo cargar el catálogo bíblico';

  @override
  String get studyLoadErrorBody =>
      'Intenta de nuevo más tarde, o revisa que los datos bíblicos locales estén incluidos correctamente.';

  @override
  String get readerFallbackTitle => 'Estudio';

  @override
  String get previousChapterTooltip => 'Capítulo anterior';

  @override
  String get nextChapterTooltip => 'Capítulo siguiente';

  @override
  String get readerLoadErrorTitle => 'No se pudo cargar el capítulo';

  @override
  String get readerLoadErrorBody =>
      'Intenta de nuevo más tarde, o revisa que los datos bíblicos locales hayan terminado de importarse.';

  @override
  String get emptyChapterBody =>
      'Aún no hay versículos disponibles para este capítulo.';

  @override
  String get verseActionsTooltip => 'Notas y resaltados';

  @override
  String get verseActionsTitle => 'Herramientas del versículo';

  @override
  String get bookmarkVerseTitle => 'Guardar este versículo';

  @override
  String get highlightTitle => 'Resaltar';

  @override
  String get highlightNone => 'Ninguno';

  @override
  String get highlightYellow => 'Dorado';

  @override
  String get highlightGreen => 'Verde';

  @override
  String get highlightBlue => 'Azul';

  @override
  String get highlightRose => 'Rosa';

  @override
  String get noteTitle => 'Nota';

  @override
  String get noteHint => 'Escribe una nota privada de estudio';

  @override
  String get saveNoteAction => 'Guardar nota';

  @override
  String get verseNotesMyNotesTab => 'Mis notas';

  @override
  String get verseNotesChurchNotesTab => 'Notas de la iglesia';

  @override
  String get verseNotesPublishHint =>
      'Las notas compartidas son visibles para otras personas que leen este versículo en la app.';

  @override
  String get verseNotesDisplayNameHint => 'Nombre visible para visitantes';

  @override
  String get verseNotesContentHint =>
      'Comparte una reflexión sobre este versículo';

  @override
  String get verseNotesPublishAction => 'Compartir';

  @override
  String get verseNotesUpdateAction => 'Actualizar';

  @override
  String get verseNotesDeleteAction => 'Eliminar';

  @override
  String get verseNotesYourReflectionTitle => 'Tu reflexión';

  @override
  String get verseNotesSharedTitle => 'Reflexiones compartidas';

  @override
  String verseNotesCountLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count reflexiones',
      one: '1 reflexión',
    );
    return '$_temp0';
  }

  @override
  String get verseNotesMineLabel => 'Mía';

  @override
  String get verseNotesEmptyState => 'Aún no hay reflexiones compartidas.';

  @override
  String get verseNotesEmptyError =>
      'Escribe una reflexión antes de compartir.';

  @override
  String get verseNotesGenericError =>
      'No se pudieron cargar las notas del versículo.';

  @override
  String get studyChapterLabel => 'Romanos 8';

  @override
  String get translationLabel => 'RVR';

  @override
  String relatedSermonsLabel(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count sermones relacionados',
      one: '1 sermón relacionado',
    );
    return '$_temp0';
  }

  @override
  String verseNumberLabel(int verse) {
    return 'Versículo $verse';
  }

  @override
  String explanationTitleSuffix(String reference) {
    return 'Explicación de $reference';
  }

  @override
  String get sourceLabel => 'Fuentes';

  @override
  String get relatedVersesLabel => 'Versículos relacionados';

  @override
  String get aiStudyDisclaimer =>
      'Las explicaciones de IA son apoyo para el estudio. Consulta a líderes de la iglesia para preguntas teológicas o pastorales importantes.';

  @override
  String get aiStudySheetTitle => 'Ayuda de estudio con IA';

  @override
  String get aiStudyQuestionLabel => 'Pregunta';

  @override
  String get aiStudyDefaultQuestion =>
      'Ayúdame a entender este versículo en contexto.';

  @override
  String get aiStudyGenerateAction => 'Generar ayuda de estudio';

  @override
  String get aiStudyRetryAction => 'Preguntar de nuevo';

  @override
  String get aiStudyResultTitle => 'Respuesta de estudio';

  @override
  String get aiStudySignInTitle => 'Inicio de sesión requerido';

  @override
  String get aiStudySignInBody =>
      'Inicia sesión desde Mi perfil para usar la ayuda de estudio con IA.';

  @override
  String get aiStudyErrorTitle =>
      'La ayuda de estudio con IA no está disponible';

  @override
  String get aiStudyProviderDisabled =>
      'El proveedor de IA aún no está configurado. Intenta de nuevo cuando el equipo de la iglesia lo habilite.';

  @override
  String get aiStudyProviderFailed =>
      'El proveedor de IA no respondió. Intenta de nuevo más tarde.';

  @override
  String get aiStudyRateLimited =>
      'Demasiadas solicitudes de IA. Espera un momento e intenta de nuevo.';

  @override
  String get lexiconLoveTitle => 'Amor / ágape';

  @override
  String get lexiconGoodTitle => 'Bueno / agathon';

  @override
  String get lexiconLoveBody =>
      'El griego ἀγάπη suele describir el amor activo, firme y de pacto de Dios.';

  @override
  String get lexiconGoodBody =>
      'El griego ἀγαθόν se refiere a un resultado bueno o beneficioso. En Romanos 8:28, el enfoque no es que cada circunstancia se sienta bien, sino que Dios obra hacia su buen propósito.';

  @override
  String get confirmKnown => 'Entendido';

  @override
  String get sermonsTitle => 'Sermones';

  @override
  String get searchSermonsTooltip => 'Buscar sermones';

  @override
  String get sermonFilterTooltip => 'Filtrar sermones';

  @override
  String get sermonFilterTitle => 'Filtrar sermones';

  @override
  String get sermonFilterSpeakerLabel => 'Predicador';

  @override
  String get sermonFilterSeriesLabel => 'Serie';

  @override
  String get sermonFilterTopicLabel => 'Tema';

  @override
  String get sermonFilterClearAction => 'Borrar filtros';

  @override
  String get sermonFilterLoadError =>
      'No se pudieron cargar los filtros. Inténtalo de nuevo.';

  @override
  String get sermonDetailTitle => 'Detalle del sermón';

  @override
  String get sermonContinueListeningTitle => 'Continuar escuchando';

  @override
  String get sermonStudyNotesTitle => 'Notas del sermón';

  @override
  String get sermonSummaryTitle => 'Resumen';

  @override
  String get sermonOpenDetailAction => 'Ver detalles del sermón';

  @override
  String get sermonOutlineTitle => 'Bosquejo inmersivo';

  @override
  String get sermonReferencesTitle => 'Escritura citada';

  @override
  String get sermonTranscriptTitle => 'Transcripción';

  @override
  String get sermonSectionNotesLabel => 'Notas';

  @override
  String get sermonSectionReferencesLabel => 'Biblia';

  @override
  String get sermonSectionTranscriptLabel => 'Texto';

  @override
  String get sermonPlaybackSpeedTitle => 'Velocidad de reproducción';

  @override
  String get sermonTranscriptReadAction => 'Leer transcripción';

  @override
  String get sermonTranscriptCollapseAction => 'Mostrar menos';

  @override
  String get sermonAiAskAction => 'Preguntar sobre este sermón';

  @override
  String get sermonDiscussionTitle => 'Guía de discusión';

  @override
  String get sermonDiscussionPrivateLabel => 'Respuesta privada';

  @override
  String get sermonDiscussionQuestionsTitle => 'Preguntas de discusión';

  @override
  String get sermonDiscussionActionStepsTitle => 'Pasos de acción';

  @override
  String get sermonDiscussionPrayerTitle => 'Motivos de oración';

  @override
  String get sermonDiscussionRespondAction => 'Escribir respuesta';

  @override
  String get sermonDiscussionResponseTitle => 'Respuesta personal';

  @override
  String get sermonDiscussionResponseHint =>
      'Escribe tu reflexión o próximo paso';

  @override
  String get sermonDiscussionResponsePrivateNote =>
      'Tu respuesta es privada por defecto.';

  @override
  String get sermonDiscussionSubmitAction => 'Enviar';

  @override
  String get sermonDiscussionSubmitted => 'Respuesta guardada.';

  @override
  String get sermonDiscussionError =>
      'No se pudo guardar la respuesta. Inténtalo de nuevo.';

  @override
  String get sermonDiscussionLoadError =>
      'No se pudo cargar la guía de discusión.';

  @override
  String get sermonDiscussionObservationChip => 'Observar';

  @override
  String get sermonDiscussionInterpretationChip => 'Interpretar';

  @override
  String get sermonDiscussionApplicationChip => 'Aplicar';

  @override
  String get sermonDiscussionPrayerChip => 'Orar';

  @override
  String get sermonDiscussionActionChip => 'Actuar';

  @override
  String get sermonAiSheetTitle => 'Preguntas del sermón';

  @override
  String get sermonAiDefaultQuestion =>
      'Ayúdame a entender el punto principal de este sermón.';

  @override
  String get sermonAiGenerateAction => 'Hacer pregunta del sermón';

  @override
  String get relatedSermonsTitle => 'Sermones relacionados';

  @override
  String get sermonLoadErrorTitle => 'No se pudieron cargar los sermones';

  @override
  String get sermonLoadErrorBody =>
      'La app volverá a pedir la lista de sermones al backend.';

  @override
  String get retryAction => 'Reintentar';

  @override
  String get sermonEmptyTitle => 'Aún no hay sermones';

  @override
  String get sermonAudioMissing => 'Audio no subido aún';

  @override
  String get sermonAudioPreparing => 'Preparando audio';

  @override
  String get sermonAudioLoading => 'Cargando audio';

  @override
  String get sermonAudioReady => 'Listo para reproducir';

  @override
  String get sermonAudioUnavailable => 'No se pudo cargar el audio';

  @override
  String get rewindTooltip => 'Retroceder 15 segundos';

  @override
  String get playTooltip => 'Reproducir';

  @override
  String get forwardTooltip => 'Avanzar 30 segundos';

  @override
  String get lifeTitle => 'Vida de iglesia';

  @override
  String get notificationsTooltip => 'Notificaciones';

  @override
  String get notificationsPageTitle => 'Notificaciones';

  @override
  String get notificationInboxTitle => 'Notificaciones recientes';

  @override
  String unreadCountSemanticLabel(String label, int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count elementos sin leer',
      one: '1 elemento sin leer',
    );
    return '$label, $_temp0';
  }

  @override
  String get notificationInboxEmptyTitle => 'Aún no hay notificaciones';

  @override
  String get notificationInboxEmptyBody =>
      'Las nuevas actualizaciones de la iglesia aparecerán aquí cuando este dispositivo las reciba.';

  @override
  String get notificationRefreshAction => 'Actualizar notificaciones';

  @override
  String get notificationMarkAllReadAction => 'Marcar todo como leído';

  @override
  String get notificationClearAction => 'Borrar notificaciones';

  @override
  String get notificationDeviceUnavailableBody =>
      'Las notificaciones push no están disponibles hasta agregar la configuración de Firebase para esta compilación.';

  @override
  String get weeklyBulletinTitle => 'Boletín semanal';

  @override
  String get lifeSundayHeroEmptyBody =>
      'La información del culto dominical aparecerá aquí cuando el equipo la publique.';

  @override
  String get lifeTabWeek => 'Esta semana';

  @override
  String get lifeTabEvents => 'Eventos';

  @override
  String get lifeTabGroups => 'Grupos';

  @override
  String get lifeTabCourses => 'Cursos';

  @override
  String get lifeTabServing => 'Servicio';

  @override
  String get lifeTabPrayer => 'Oración';

  @override
  String get lifeTabWeekEmpty =>
      'Las nuevas tarjetas de vida de iglesia aparecerán aquí cuando se publiquen.';

  @override
  String get lifeTabEventsEmpty =>
      'No hay tarjetas de eventos abiertas en este momento.';

  @override
  String get lifeTabMemberSignInBody =>
      'Inicia sesión desde Mi perfil para ver grupos, cursos, servicio y cuidado para miembros.';

  @override
  String get lifeTabPrayerDisabled =>
      'Las solicitudes de oración aún no están activadas en esta compilación.';

  @override
  String get lifeOpenDetailAction => 'Ver detalles';

  @override
  String get lifeUpdatesTitle => 'Actualizaciones';

  @override
  String get lifeParticipationTitle => 'Mi participación';

  @override
  String get lifeLoadErrorTitle => 'No se pudo cargar Vida';

  @override
  String get lifeLoadErrorBody =>
      'La app volverá a pedir contenido de vida al backend.';

  @override
  String get lifeSectionLoadError =>
      'No se pudo cargar esta sección. Inténtalo de nuevo.';

  @override
  String get lifeEmptyTitle => 'Aún no hay contenido de vida';

  @override
  String get lifePostNoBody => 'Sin contenido adicional.';

  @override
  String get lifePostVisibilityMembers => 'Miembros';

  @override
  String get lifePostVisibilityGroup => 'Grupo';

  @override
  String get lifePostVisibilityPrivate => 'Privado';

  @override
  String get lifePostTypeWeeklyBulletin => 'Boletín';

  @override
  String get lifePostTypeSunday => 'Domingo';

  @override
  String get lifePostTypeAnnouncement => 'Anuncio';

  @override
  String get lifePostTypeEvent => 'Evento';

  @override
  String get lifePostTypeGroup => 'Grupo';

  @override
  String get lifePostTypeFellowship => 'Compañerismo';

  @override
  String get lifePostTypeCourse => 'Curso';

  @override
  String get lifePostTypeServing => 'Servicio';

  @override
  String get lifePostTypePrayer => 'Oración';

  @override
  String get lifePostTypeGiving => 'Ofrenda';

  @override
  String get lifePostUnread => 'No leído';

  @override
  String get lifePostActionOpen => 'Abrir';

  @override
  String get lifePostScheduleTbd => 'Horario por definir';

  @override
  String get myEventRegistrationsTitle => 'Mis inscripciones';

  @override
  String get groupsTitle => 'Grupos';

  @override
  String get groupsEmptyBody => 'No hay grupos disponibles ahora.';

  @override
  String get groupApplyAction => 'Solicitar unirse';

  @override
  String get groupAlreadyMember => 'Ya eres miembro';

  @override
  String get groupApplicationSubmitted => 'Solicitud enviada';

  @override
  String get groupApplicationSubmitSuccess => 'Solicitud de grupo enviada.';

  @override
  String get groupWithdrawAction => 'Retirar solicitud';

  @override
  String get groupApplicationWithdrawSuccess => 'Solicitud retirada.';

  @override
  String get groupCapacityFull => 'El grupo está completo';

  @override
  String get groupMyGroupsTitle => 'Mis grupos';

  @override
  String get groupMyGroupsEmptyBody =>
      'Actualmente no perteneces a ningún grupo.';

  @override
  String get groupSignInToViewMineBody =>
      'Inicia sesión para ver tus grupos en todos tus dispositivos.';

  @override
  String groupMemberCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count miembros',
      one: '1 miembro',
    );
    return '$_temp0';
  }

  @override
  String groupMemberCapacity(int count, int capacity) {
    return '$count/$capacity miembros';
  }

  @override
  String get coursesTitle => 'Cursos';

  @override
  String get coursesEmptyBody => 'No hay cursos abiertos ahora.';

  @override
  String get courseMyCoursesTitle => 'Mis cursos';

  @override
  String get courseMyCoursesEmptyBody =>
      'Todavía no tienes inscripciones en cursos.';

  @override
  String get courseLessonsTitle => 'Lecciones del curso';

  @override
  String get courseLessonsEmptyBody =>
      'Todavía no se han publicado lecciones para este curso.';

  @override
  String get courseSignInToEnrollBody =>
      'Inicia sesión para inscribirte y sincronizar tu progreso entre dispositivos.';

  @override
  String get courseSignInToViewMineBody =>
      'Inicia sesión para ver tus cursos actuales y completados.';

  @override
  String get courseEnrollAction => 'Inscribirse';

  @override
  String get courseSubmittedAction => 'Enviada';

  @override
  String get courseEnrolledAction => 'Inscrito';

  @override
  String get courseWaitlistedAction => 'En lista de espera';

  @override
  String get courseCancelledAction => 'Cancelada';

  @override
  String get courseCompletedAction => 'Completado';

  @override
  String get courseEnrollmentSubmitSuccess => 'Inscripción al curso enviada.';

  @override
  String get courseStatusDraft => 'Borrador';

  @override
  String get courseStatusOpen => 'Abierto';

  @override
  String get courseStatusClosed => 'Cerrado';

  @override
  String get courseStatusInProgress => 'En progreso';

  @override
  String get courseStatusCompleted => 'Completado';

  @override
  String get courseStatusArchived => 'Archivado';

  @override
  String courseLessonCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count lecciones',
      one: '1 lección',
    );
    return '$_temp0';
  }

  @override
  String get courseCapacityOpen => 'Cupo abierto';

  @override
  String courseCapacityLabel(int count, int capacity) {
    return '$count/$capacity inscritos';
  }

  @override
  String courseProgressLabel(int completed, int total) {
    return '$completed/$total lecciones';
  }

  @override
  String get servingTitle => 'Servicio';

  @override
  String get servingEmptyBody =>
      'No hay asignaciones de servicio programadas ahora.';

  @override
  String get servingConfirmAction => 'Confirmar';

  @override
  String get servingLeaveAction => 'Dejar';

  @override
  String get servingConfirmSuccess => 'Servicio confirmado.';

  @override
  String get servingLeaveSuccess => 'Se actualizó tu respuesta de servicio.';

  @override
  String get servingStatusScheduled => 'Programado';

  @override
  String get servingStatusConfirmed => 'Confirmado';

  @override
  String get servingStatusDeclined => 'Rechazado';

  @override
  String get servingStatusSwapRequested => 'Cambio solicitado';

  @override
  String get servingStatusCovered => 'Con reemplazo';

  @override
  String get servingStatusCancelled => 'Cancelado';

  @override
  String get servingScheduleTab => 'Turnos';

  @override
  String get servingAvailabilityTab => 'Disponibilidad';

  @override
  String get servingAvailabilityEmptyBody =>
      'Aún no has indicado tu disponibilidad.';

  @override
  String get servingAvailabilityAddAction => 'Agregar disponibilidad';

  @override
  String get servingAvailabilitySheetTitle => 'Nueva disponibilidad';

  @override
  String get servingAvailabilityStatusLabel => 'Estado de disponibilidad';

  @override
  String get servingAvailabilityStatusAvailable => 'Disponible';

  @override
  String get servingAvailabilityStatusUnavailable => 'No disponible';

  @override
  String get servingAvailabilityStatusPreferred => 'Horario preferido';

  @override
  String get servingAvailabilityStartLabel => 'Inicio';

  @override
  String get servingAvailabilityEndLabel => 'Fin';

  @override
  String get servingAvailabilityNoteHint => 'Nota opcional';

  @override
  String get servingAvailabilitySaveAction => 'Guardar disponibilidad';

  @override
  String get servingAvailabilityCreateSuccess => 'Disponibilidad guardada.';

  @override
  String get servingAvailabilityInvalidRange =>
      'La hora de fin debe ser posterior a la hora de inicio.';

  @override
  String get servingCheckInTitle => 'Estado de llegada';

  @override
  String get servingCheckInAction => 'Confirmar llegada';

  @override
  String get servingCheckInSuccess => 'Llegada confirmada.';

  @override
  String get servingCheckInNotRecorded => 'La llegada aún no está confirmada.';

  @override
  String get servingCheckInStatusPending => 'Pendiente';

  @override
  String get servingCheckInStatusCheckedIn => 'Presente';

  @override
  String get servingCheckInStatusMissed => 'Ausente';

  @override
  String get servingAssignmentNoteTitle => 'Nota de servicio';

  @override
  String get servingResponseNoteTitle => 'Mi respuesta';

  @override
  String get eventRegistrationTitle => 'Inscripción al evento';

  @override
  String get eventRegistrationRegisterAction => 'Inscribirse';

  @override
  String get eventRegistrationUpdateAction => 'Actualizar inscripción';

  @override
  String get eventRegistrationCancelAction => 'Cancelar inscripción';

  @override
  String get eventRegistrationCheckInAction => 'Registrar llegada';

  @override
  String get eventCheckInScanAction => 'Escanear codigo';

  @override
  String get eventCheckInScanTitle => 'Registro presencial';

  @override
  String get eventCheckInScanPrompt =>
      'Escanea el QR de asistencia impreso por un lider.';

  @override
  String get eventCheckInScanSuccessTitle => 'Asistencia registrada';

  @override
  String get eventCheckInScanViewEvent => 'Ver evento';

  @override
  String get eventCheckInScanAgain => 'Escanear otro';

  @override
  String get eventCheckInScanSignInRequired =>
      'Inicia sesion antes de escanear un QR de asistencia.';

  @override
  String get eventCheckInQrInvalid =>
      'Este QR de asistencia no es valido. Escanealo de nuevo.';

  @override
  String get eventCheckInQrExpired =>
      'Este QR de asistencia vencio. Consulta a un lider.';

  @override
  String get eventCheckInQrDisabled =>
      'Este QR de asistencia fue desactivado. Consulta a un lider.';

  @override
  String get eventCheckInQrRegistrationRequired =>
      'No encontramos tu registro del evento. Registrate primero o consulta a un lider.';

  @override
  String get eventRegistrationRegistered => 'Inscrito';

  @override
  String get eventRegistrationCheckedIn => 'Llegada registrada';

  @override
  String get eventRegistrationSignInBody =>
      'Inicia sesión para administrar esta inscripción.';

  @override
  String get eventRegistrationFull => 'El evento está lleno.';

  @override
  String get eventRegistrationClosed => 'La inscripción está cerrada.';

  @override
  String get eventRegistrationUnavailable =>
      'La inscripción no está disponible.';

  @override
  String get eventRegistrationNotFound => 'No se encontró la inscripción.';

  @override
  String get eventRegistrationPartySizeInvalid =>
      'El tamaño del grupo no es válido.';

  @override
  String get eventRegistrationCheckInLocked =>
      'El registro de llegada aún no está abierto.';

  @override
  String get eventRegistrationSuccess => 'Inscripción enviada.';

  @override
  String get eventRegistrationUpdateSuccess => 'Inscripción actualizada.';

  @override
  String get eventRegistrationCancelSuccess => 'Inscripción cancelada.';

  @override
  String get eventRegistrationCheckInSuccess => 'Llegada registrada.';

  @override
  String eventRegistrationCheckedInAt(String time) {
    return 'Registrado a las $time';
  }

  @override
  String get eventRegistrationPartySizeLabel => 'Tamaño del grupo';

  @override
  String eventRegistrationPartySize(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count personas',
      one: '1 persona',
    );
    return '$_temp0';
  }

  @override
  String get eventRegistrationNoteLabel => 'Nota';

  @override
  String get eventRegistrationNoteHint =>
      'Comparte detalles útiles para el equipo.';

  @override
  String eventRegistrationSpots(int registered, int capacity) {
    return '$registered/$capacity inscritos';
  }

  @override
  String eventRegistrationUnlimitedSpots(int registered) {
    return '$registered inscritos · cupos sin límite';
  }

  @override
  String eventRegistrationRemaining(int remaining) {
    return '$remaining cupos restantes';
  }

  @override
  String get givingGuestBody =>
      'Inicia sesión para ver historial de ofrendas y comprobantes anuales.';

  @override
  String get givingHistoryTitle => 'Historial de ofrendas';

  @override
  String get givingTransactionsTitle => 'Transacciones de ofrenda';

  @override
  String get givingTransactionsEmptyBody => 'Aún no hay ofrendas confirmadas.';

  @override
  String givingSummaryYear(int year) {
    return 'Año $year';
  }

  @override
  String givingSummaryAmount(String amount) {
    return 'Total $amount';
  }

  @override
  String givingSummaryCount(int count) {
    return '$count ofrendas';
  }

  @override
  String get givingStatementSectionTitle => 'Comprobantes anuales';

  @override
  String get annualStatementsTitle => 'Comprobantes anuales';

  @override
  String get annualStatementsEmptyBody => 'Aún no hay comprobantes anuales.';

  @override
  String givingStatementLabel(int year) {
    return 'Comprobante de ofrenda $year';
  }

  @override
  String get prayerTitle => 'Oración';

  @override
  String get prayerEmptyBody => 'Aún no hay solicitudes de oración visibles.';

  @override
  String get prayerSubmitTitle => 'Enviar solicitud de oración';

  @override
  String get prayerSubmitAction => 'Enviar solicitud';

  @override
  String get prayerGuestSubmitBody =>
      'Puedes enviar una solicitud de oración como invitado.';

  @override
  String get prayerMemberSubmitBody =>
      'Tu solicitud se vinculará con tu cuenta de miembro.';

  @override
  String get prayerTitleLabel => 'Título';

  @override
  String get prayerBodyLabel => 'Solicitud';

  @override
  String get prayerNameLabel => 'Nombre';

  @override
  String get prayerValidationError => 'Agrega título y solicitud.';

  @override
  String get prayerSubmittedMessage => 'Solicitud de oración enviada.';

  @override
  String get prayerMineLabel => 'Mías';

  @override
  String get prayerVisibilityPrivate => 'Privada';

  @override
  String get prayerVisibilityPublic => 'Pública';

  @override
  String get prayerVisibilityMembers => 'Miembros';

  @override
  String get prayerVisibilityGroup => 'Grupo';

  @override
  String get prayerStatusPending => 'Pendiente';

  @override
  String get prayerStatusApproved => 'Aprobada';

  @override
  String get prayerStatusHidden => 'Oculta';

  @override
  String get prayerStatusArchived => 'Archivada';

  @override
  String get careTitle => 'Cuidado';

  @override
  String get careEmptyBody => 'Aún no hay solicitudes de cuidado.';

  @override
  String get careSubmitTitle => 'Solicitar cuidado';

  @override
  String get careSubmitAction => 'Enviar solicitud';

  @override
  String get careSubmitBody => 'Comparte cómo el equipo puede acompañarte.';

  @override
  String get careSignInRequired =>
      'Inicia sesión para enviar una solicitud de cuidado.';

  @override
  String get careTitleLabel => 'Título';

  @override
  String get careBodyLabel => 'Detalle';

  @override
  String get carePrivacyLabel => 'Privacidad';

  @override
  String get carePrivacyPastoralOnly => 'Solo pastoral';

  @override
  String get carePrivacyAssignedTeam => 'Equipo asignado';

  @override
  String get carePrivacyAdminRestricted => 'Administración restringida';

  @override
  String get careValidationError => 'Agrega título y detalle.';

  @override
  String get careSubmittedMessage => 'Solicitud de cuidado enviada.';

  @override
  String get careStatusSubmitted => 'Enviada';

  @override
  String get careStatusAssigned => 'Asignada';

  @override
  String get careStatusInProgress => 'En progreso';

  @override
  String get careStatusResolved => 'Resuelta';

  @override
  String get careStatusArchived => 'Archivada';

  @override
  String careNextFollowUp(String date) {
    return 'Próximo seguimiento $date';
  }

  @override
  String get givingTitle => 'Ofrendas';

  @override
  String get givingCardTitle => 'Ofrendar';

  @override
  String get givingCardBody => 'Apoya la obra de la iglesia de forma segura.';

  @override
  String get givingCheckoutTitle => 'Ofrenda en línea';

  @override
  String get givingCheckoutBody => 'El pago se abre en una página segura.';

  @override
  String get givingAmountLabel => 'Monto';

  @override
  String get givingFundLabel => 'Fondo';

  @override
  String get givingFundsLoading => 'Cargando fondos...';

  @override
  String get givingFundsEmpty => 'No hay fondos disponibles.';

  @override
  String get givingCategoryOffering => 'Ofrenda general';

  @override
  String get givingCategoryMissions => 'Misiones';

  @override
  String get givingCheckoutAction => 'Continuar a pago';

  @override
  String get givingAmountError =>
      'Introduce un importe de USD 1,00 a USD 100.000,00 con un máximo de dos decimales.';

  @override
  String get givingCheckoutOpenError => 'No se pudo abrir el pago.';

  @override
  String get givingCheckoutReturnSuccess =>
      'Gracias. Tu ofrenda se está confirmando.';

  @override
  String get givingCheckoutReturnCancel => 'El pago fue cancelado.';

  @override
  String get annualStatementTooltip => 'Comprobante anual';

  @override
  String get annualStatementPreviewAction => 'Vista previa';

  @override
  String get annualStatementCopyCsvAction => 'Copiar CSV';

  @override
  String get annualStatementCopiedMessage => 'CSV copiado.';

  @override
  String get annualStatementSavePdfAction => 'Guardar PDF';

  @override
  String get annualStatementSharePdfAction => 'Compartir PDF';

  @override
  String get annualStatementSharePdfText => 'Comprobante anual de ofrendas';

  @override
  String get annualStatementPdfSharedMessage => 'PDF compartido.';

  @override
  String get annualStatementPdfOpenedMessage => 'PDF abierto.';

  @override
  String annualStatementPdfSavedMessage(String path) {
    return 'PDF guardado en $path.';
  }

  @override
  String get copyPathAction => 'Copiar ruta';

  @override
  String get annualStatementExportTitle => 'Exportar comprobante';

  @override
  String get annualStatementStatusPendingLabel => 'Pendiente';

  @override
  String get annualStatementStatusReadyLabel => 'Listo';

  @override
  String get annualStatementStatusSentLabel => 'Enviado';

  @override
  String get annualStatementStatusFailedLabel => 'Falló';

  @override
  String get givingStatusPendingLabel => 'Pendiente';

  @override
  String get givingStatusSucceededLabel => 'Confirmada';

  @override
  String get givingStatusFailedLabel => 'Fallida';

  @override
  String get givingStatusRefundedLabel => 'Reembolsada';

  @override
  String get bibleTtsReadyTitle => 'Lectura en voz alta lista';

  @override
  String bibleTtsCurrentVerse(int verse) {
    return 'Leyendo el versículo $verse';
  }

  @override
  String bibleTtsPausedVerse(int verse) {
    return 'Pausado en el versículo $verse. Al continuar se volverá a leer este versículo.';
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
  String get bibleTtsPlayTooltip => 'Reproducir lectura';

  @override
  String get bibleTtsPauseTooltip => 'Pausar lectura';

  @override
  String get bibleTtsStopTooltip => 'Detener lectura';

  @override
  String get bibleTtsPreviousVerseTooltip => 'Versículo anterior';

  @override
  String get bibleTtsNextVerseTooltip => 'Versículo siguiente';

  @override
  String get bibleTtsErrorTextMissing =>
      'Este pasaje no tiene texto disponible para leer.';

  @override
  String get bibleTtsErrorEngineUnavailable =>
      'La lectura de texto no está disponible en este dispositivo. Revisa la configuración de voz del sistema e inténtalo de nuevo.';

  @override
  String get bibleTtsErrorLanguageUnavailable =>
      'La voz del sistema para el idioma de esta Biblia no está instalada.';

  @override
  String get bibleTtsErrorInterrupted =>
      'La lectura se interrumpió. Pulsa reproducir para continuar desde este versículo.';

  @override
  String get bibleTtsErrorStartFailed =>
      'No se pudo iniciar la lectura. Revisa la configuración de voz del dispositivo e inténtalo de nuevo.';

  @override
  String get newcomerCardTitle => '¿Eres nuevo?';

  @override
  String get newcomerCardBody =>
      'Queremos darte la bienvenida, responder preguntas y ayudarte a conectar con la vida de la iglesia.';

  @override
  String get newcomerCardAction => 'Soy nuevo';

  @override
  String get newcomerSheetTitle => 'Bienvenido a MBCG';

  @override
  String get newcomerSheetGuestBody =>
      'Déjanos algunos datos y el equipo de la iglesia te contactará.';

  @override
  String get newcomerSheetMemberBody =>
      'También puedes presentarte o pedir que nuestro equipo te contacte.';

  @override
  String get newcomerNameLabel => 'Nombre';

  @override
  String get newcomerEmailLabel => 'Correo';

  @override
  String get newcomerPhoneLabel => 'Teléfono';

  @override
  String get newcomerInterestLabel => '¿Qué te gustaría conocer?';

  @override
  String get newcomerSubmitAction => 'Enviar al equipo';

  @override
  String get newcomerNameValidationError => 'Ingresa tu nombre.';

  @override
  String get newcomerContactValidationError => 'Deja un correo o teléfono.';

  @override
  String get newcomerEmailValidationError => 'Ingresa un correo válido.';

  @override
  String get newcomerSubmittedMessage => 'Gracias. Recibimos tu información.';

  @override
  String get mineDiscipleshipTitle => 'Mi camino de discipulado';

  @override
  String get mineDiscipleshipBody =>
      'Sigue los próximos pasos asignados por el equipo de la iglesia.';

  @override
  String get mineDiscipleshipEmpty =>
      'Aún no tienes un camino de discipulado asignado.';

  @override
  String get mineDiscipleshipLoadError =>
      'No se pudo cargar tu camino de discipulado.';

  @override
  String mineDiscipleshipProgressChip(int completed, int total) {
    return '$completed/$total tareas';
  }

  @override
  String get discipleshipStatusNotStarted => 'No iniciado';

  @override
  String get discipleshipStatusInProgress => 'En progreso';

  @override
  String get discipleshipStatusBlocked => 'Bloqueado';

  @override
  String get discipleshipStatusCompleted => 'Completado';

  @override
  String get discipleshipStatusPaused => 'Pausado';

  @override
  String get discipleshipStatusCancelled => 'Cancelado';
}
