enum GivingCheckoutReturn { finished, canceled }

GivingCheckoutReturn? parseGivingCheckoutReturn(String? value) {
  return switch (value) {
    'success' => GivingCheckoutReturn.finished,
    'cancel' => GivingCheckoutReturn.canceled,
    _ => null,
  };
}
