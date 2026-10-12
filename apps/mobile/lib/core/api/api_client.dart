import 'dart:ui' as ui;

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import 'api_error.dart';
import 'api_client_support.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(config: ref.watch(appConfigProvider));
});

class ApiClient {
  ApiClient({
    required this.config,
    Dio? dio,
    String Function()? acceptLanguageProvider,
  }) : _acceptLanguageProvider =
           acceptLanguageProvider ?? defaultAcceptLanguageProvider,
       _dio =
           dio ??
           Dio(
             BaseOptions(
               baseUrl: config.apiBaseUrl,
               connectTimeout: const Duration(seconds: 10),
               receiveTimeout: const Duration(seconds: 20),
               sendTimeout: const Duration(seconds: 10),
               responseType: ResponseType.json,
               headers: const {
                 Headers.acceptHeader: 'application/json',
                 Headers.contentTypeHeader: 'application/json',
               },
             ),
           ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          options.headers['x-request-id'] = newApiRequestId();
          final acceptLanguage = _acceptLanguageProvider().trim();
          if (acceptLanguage.isNotEmpty) {
            options.headers['accept-language'] ??= acceptLanguage;
          }
          handler.next(options);
        },
      ),
    );
  }

  final AppConfig config;
  final Dio _dio;
  final String Function() _acceptLanguageProvider;

  Future<Map<String, Object?>> getJsonMap(String path) async {
    try {
      final response = await _dio.get<Object?>(path);
      final data = response.data;
      if (data is! Map<String, Object?>) {
        throw const ApiError(message: 'Expected JSON object response');
      }
      return data;
    } on DioException catch (error) {
      throw apiErrorFromDioException(error);
    }
  }

  Future<Map<String, Object?>> getJsonMapWithIdentity(
    String path, {
    String? accessToken,
    String? externalUserId,
  }) async {
    try {
      final response = await _dio.get<Object?>(
        path,
        options: Options(
          headers: apiIdentityHeaders(
            accessToken: accessToken,
            externalUserId: externalUserId,
          ),
        ),
      );
      final data = response.data;
      if (data is! Map<String, Object?>) {
        throw const ApiError(message: 'Expected JSON object response');
      }
      return data;
    } on DioException catch (error) {
      throw apiErrorFromDioException(error);
    }
  }

  Future<Map<String, Object?>> postJsonMap(
    String path,
    Map<String, Object?> body,
  ) async {
    try {
      final response = await _dio.post<Object?>(path, data: body);
      final data = response.data;
      if (data is! Map<String, Object?>) {
        throw const ApiError(message: 'Expected JSON object response');
      }
      return data;
    } on DioException catch (error) {
      throw apiErrorFromDioException(error);
    }
  }

  Future<Map<String, Object?>> putJsonMap(
    String path,
    Map<String, Object?> body,
  ) async {
    try {
      final response = await _dio.put<Object?>(path, data: body);
      final data = response.data;
      if (data is! Map<String, Object?>) {
        throw const ApiError(message: 'Expected JSON object response');
      }
      return data;
    } on DioException catch (error) {
      throw apiErrorFromDioException(error);
    }
  }

  Future<Map<String, Object?>> putJsonMapWithBearer(
    String path,
    Map<String, Object?> body,
    String accessToken,
  ) async {
    try {
      final response = await _dio.put<Object?>(
        path,
        data: body,
        options: Options(headers: {'authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data is! Map<String, Object?>) {
        throw const ApiError(message: 'Expected JSON object response');
      }
      return data;
    } on DioException catch (error) {
      throw apiErrorFromDioException(error);
    }
  }

  Future<Map<String, Object?>> patchJsonMapWithBearer(
    String path,
    Map<String, Object?> body,
    String accessToken,
  ) async {
    try {
      final response = await _dio.patch<Object?>(
        path,
        data: body,
        options: Options(headers: {'authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data is! Map<String, Object?>) {
        throw const ApiError(message: 'Expected JSON object response');
      }
      return data;
    } on DioException catch (error) {
      throw apiErrorFromDioException(error);
    }
  }

  Future<Map<String, Object?>> getJsonMapWithBearer(
    String path,
    String accessToken,
  ) async {
    try {
      final response = await _dio.get<Object?>(
        path,
        options: Options(headers: {'authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data is! Map<String, Object?>) {
        throw const ApiError(message: 'Expected JSON object response');
      }
      return data;
    } on DioException catch (error) {
      throw apiErrorFromDioException(error);
    }
  }

  Future<Map<String, Object?>> postJsonMapWithBearer(
    String path,
    Map<String, Object?> body,
    String accessToken,
  ) async {
    try {
      final response = await _dio.post<Object?>(
        path,
        data: body,
        options: Options(headers: {'authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data is! Map<String, Object?>) {
        throw const ApiError(message: 'Expected JSON object response');
      }
      return data;
    } on DioException catch (error) {
      throw apiErrorFromDioException(error);
    }
  }

  Future<Map<String, Object?>> postJsonMapWithIdentity(
    String path,
    Map<String, Object?> body, {
    String? accessToken,
    String? externalUserId,
  }) async {
    try {
      final response = await _dio.post<Object?>(
        path,
        data: body,
        options: Options(
          headers: apiIdentityHeaders(
            accessToken: accessToken,
            externalUserId: externalUserId,
          ),
        ),
      );
      final data = response.data;
      if (data is! Map<String, Object?>) {
        throw const ApiError(message: 'Expected JSON object response');
      }
      return data;
    } on DioException catch (error) {
      throw apiErrorFromDioException(error);
    }
  }

  Future<Map<String, Object?>> patchJsonMapWithIdentity(
    String path,
    Map<String, Object?> body, {
    String? accessToken,
    String? externalUserId,
  }) async {
    try {
      final response = await _dio.patch<Object?>(
        path,
        data: body,
        options: Options(
          headers: apiIdentityHeaders(
            accessToken: accessToken,
            externalUserId: externalUserId,
          ),
        ),
      );
      final data = response.data;
      if (data is! Map<String, Object?>) {
        throw const ApiError(message: 'Expected JSON object response');
      }
      return data;
    } on DioException catch (error) {
      throw apiErrorFromDioException(error);
    }
  }

  Future<Map<String, Object?>> deleteJsonMapWithIdentity(
    String path, {
    String? accessToken,
    String? externalUserId,
  }) async {
    try {
      final response = await _dio.delete<Object?>(
        path,
        options: Options(
          headers: apiIdentityHeaders(
            accessToken: accessToken,
            externalUserId: externalUserId,
          ),
        ),
      );
      final data = response.data;
      if (data is! Map<String, Object?>) {
        throw const ApiError(message: 'Expected JSON object response');
      }
      return data;
    } on DioException catch (error) {
      throw apiErrorFromDioException(error);
    }
  }
}

String defaultAcceptLanguageProvider() {
  return ui.PlatformDispatcher.instance.locale.toLanguageTag();
}
