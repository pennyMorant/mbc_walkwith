import 'package:flutter/material.dart';

import '../../../../theme/app_colors.dart';

class MemberAuthAccountRow extends StatelessWidget {
  const MemberAuthAccountRow({
    super.key,
    required this.email,
    required this.actionLabel,
    required this.onPressed,
  });

  final String email;
  final String actionLabel;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    const radius = BorderRadius.all(Radius.circular(16));
    return Semantics(
      button: true,
      label: '$email, $actionLabel',
      child: Material(
        key: const ValueKey('member_auth_account_row'),
        color: colorScheme.tintedCardColor,
        borderRadius: radius,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onPressed,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 56),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Icon(
                    Icons.alternate_email_rounded,
                    size: 20,
                    color: colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      email,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodyMedium
                          ?.copyWith(fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    Icons.edit_outlined,
                    size: 20,
                    color: onPressed == null
                        ? colorScheme.onSurface.withValues(alpha: 0.38)
                        : colorScheme.primary,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
