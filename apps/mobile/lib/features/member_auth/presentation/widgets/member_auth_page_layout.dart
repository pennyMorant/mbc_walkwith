import 'package:flutter/material.dart';

class MemberAuthPageLayout extends StatelessWidget {
  const MemberAuthPageLayout({
    super.key,
    required this.title,
    this.body,
    required this.children,
  });

  final String title;
  final String? body;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.viewInsetsOf(context);
    return Scaffold(
      resizeToAvoidBottomInset: false,
      appBar: AppBar(),
      body: SafeArea(
        top: false,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final compact = constraints.maxHeight - viewInsets.bottom < 560;
            return SingleChildScrollView(
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              padding: EdgeInsets.fromLTRB(
                20,
                compact ? 4 : 20,
                20,
                viewInsets.bottom + 32,
              ),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 480),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _MemberAuthBrandHeader(compact: compact),
                      SizedBox(height: compact ? 18 : 24),
                      Text(
                        title,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.headlineSmall
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      if (body != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          body!,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurfaceVariant,
                                height: 1.4,
                              ),
                        ),
                      ],
                      SizedBox(height: compact ? 22 : 30),
                      ...children,
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _MemberAuthBrandHeader extends StatelessWidget {
  const _MemberAuthBrandHeader({required this.compact});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    final size = compact ? 56.0 : 72.0;
    return Center(
      child: Hero(
        tag: 'member_auth_brand',
        child: ClipRRect(
          borderRadius: BorderRadius.circular(compact ? 16 : 20),
          child: Image.asset(
            'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',
            key: const ValueKey('member_auth_brand_logo'),
            width: size,
            height: size,
            fit: BoxFit.cover,
            filterQuality: FilterQuality.high,
          ),
        ),
      ),
    );
  }
}
