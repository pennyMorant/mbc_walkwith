export interface MediaReferenceValidator {
  assertPublicImageReference(mediaId: string): Promise<void>;
}
