class AppRouteNames {
  const AppRouteNames._();

  static const study = 'study';
  static const studySearch = 'studySearch';
  static const studyReader = 'studyReader';
  static const sermons = 'sermons';
  static const sermonDetail = 'sermonDetail';
  static const life = 'life';
  static const lifePostDetail = 'lifePostDetail';
  static const groupDetail = 'groupDetail';
  static const courseDetail = 'courseDetail';
  static const lifeCheckInScan = 'lifeCheckInScan';
  static const mine = 'mine';
  static const memberProfile = 'memberProfile';
  static const memberLoginEmail = 'memberLoginEmail';
  static const memberLoginPassword = 'memberLoginPassword';
  static const memberRegister = 'memberRegister';
  static const memberEmailVerification = 'memberEmailVerification';
  static const memberPasswordRecovery = 'memberPasswordRecovery';
  static const myGroups = 'myGroups';
  static const myCourses = 'myCourses';
  static const myServing = 'myServing';
  static const myReadingPlans = 'myReadingPlans';
  static const servingDetail = 'servingDetail';
  static const notifications = 'notifications';
  static const givingHistory = 'givingHistory';
  static const annualStatements = 'annualStatements';
}

class AppRoutePaths {
  const AppRoutePaths._();

  static const study = '/study';
  static const studySearch = '/study/search';
  static const studyReader = '/study/book/:bookId/:chapter';
  static const sermons = '/sermons';
  static const sermonDetail = '/sermons/:sermonId';
  static const life = '/life';
  static const lifePostDetail = '/life/posts/:postId';
  static const groupDetail = '/life/groups/:groupId';
  static const courseDetail = '/life/courses/:courseId';
  static const lifeCheckInScan = '/life/check-in';
  static const mine = '/mine';
  static const memberProfile = '/mine/profile';
  static const memberLoginEmail = '/auth/login';
  static const memberLoginPassword = '/auth/password';
  static const memberRegister = '/auth/register';
  static const memberEmailVerification = '/auth/verify-email';
  static const memberPasswordRecovery = '/auth/password-recovery';
  static const myGroups = '/mine/groups';
  static const myCourses = '/mine/courses';
  static const myServing = '/mine/serving';
  static const myReadingPlans = '/mine/reading-plans';
  static const servingDetail = '/mine/serving/:assignmentId';
  static const notifications = '/life/notifications';
  static const givingHistory = '/mine/giving';
  static const annualStatements = '/mine/giving/statements';
}
