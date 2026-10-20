import 'package:flutter/material.dart';

import '../../domain/life_post.dart';
import 'life_post_image_fallback.dart';

class LifePostImage extends StatelessWidget {
  const LifePostImage({
    super.key,
    required this.post,
    this.aspectRatio = 16 / 9,
    this.borderRadius = BorderRadius.zero,
  });

  final LifePost post;
  final double aspectRatio;
  final BorderRadius borderRadius;

  @override
  Widget build(BuildContext context) {
    final imageUrl = post.imageUrl?.trim();
    return AspectRatio(
      aspectRatio: aspectRatio,
      child: ClipRRect(
        borderRadius: borderRadius,
        child: imageUrl == null || imageUrl.isEmpty
            ? LifePostImageFallback(post: post)
            : LayoutBuilder(
                builder: (context, constraints) {
                  final devicePixelRatio = MediaQuery.devicePixelRatioOf(
                    context,
                  );
                  final cacheWidth = constraints.maxWidth.isFinite
                      ? (constraints.maxWidth * devicePixelRatio)
                            .round()
                            .clamp(1, 4096)
                            .toInt()
                      : null;
                  return Image.network(
                    imageUrl,
                    width: double.infinity,
                    height: double.infinity,
                    fit: BoxFit.cover,
                    filterQuality: FilterQuality.medium,
                    gaplessPlayback: true,
                    cacheWidth: cacheWidth,
                    excludeFromSemantics: true,
                    loadingBuilder: (context, child, progress) {
                      if (progress == null) {
                        return child;
                      }
                      final expectedBytes = progress.expectedTotalBytes;
                      final progressValue =
                          expectedBytes == null || expectedBytes <= 0
                          ? null
                          : (progress.cumulativeBytesLoaded / expectedBytes)
                                .clamp(0.0, 1.0);
                      return Stack(
                        fit: StackFit.expand,
                        children: [
                          LifePostImageFallback(post: post),
                          Align(
                            alignment: Alignment.bottomCenter,
                            child: LinearProgressIndicator(
                              minHeight: 2,
                              value: progressValue,
                            ),
                          ),
                        ],
                      );
                    },
                    errorBuilder: (context, error, stackTrace) {
                      return LifePostImageFallback(post: post);
                    },
                  );
                },
              ),
      ),
    );
  }
}

bool lifePostHasImage(LifePost post) =>
    post.imageUrl?.trim().isNotEmpty ?? false;
