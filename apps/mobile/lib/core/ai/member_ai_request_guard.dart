class MemberAiRequestGuard {
  int _requestSerial = 0;
  bool _hasObservedMember = false;
  String? _memberId;

  int beginRequest() => ++_requestSerial;

  void invalidate() {
    _requestSerial += 1;
  }

  bool isCurrentRequest(int serial) => serial == _requestSerial;

  bool matchesQuestion(String requested, String current) {
    return requested.trim() == current.trim();
  }

  void seedMember(String memberId) {
    if (_hasObservedMember) {
      return;
    }
    _hasObservedMember = true;
    _memberId = memberId;
  }

  bool observeMember(String? memberId) {
    if (!_hasObservedMember) {
      _hasObservedMember = true;
      _memberId = memberId;
      return false;
    }
    if (_memberId == memberId) {
      return false;
    }
    _memberId = memberId;
    invalidate();
    return true;
  }
}
