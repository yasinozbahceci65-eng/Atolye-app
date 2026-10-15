/*
# Fix consultation photo upload validation

1. Purpose
- Ensure consultation photos uploaded from Expo native devices are accepted consistently.
- Native Expo files are uploaded as binary data, so the client-provided metadata key is not used as the policy decision.

2. Storage changes
- Update the existing `consult_photos_insert` policy for the `consult-photos` bucket.
- Keep the upload path restricted to the `consult/` folder.

3. Security
- The `consult-photos` bucket continues to enforce its server-side allowed MIME types: JPEG, PNG, and WebP.
- Anonymous and authenticated users can only insert into the consultation folder.
- No update or delete permissions are added.

4. Important notes
- Existing consultation photos are unchanged.
- The app validates the photo type and 8 MB size limit before upload.
*/

DROP POLICY IF EXISTS "consult_photos_insert" ON storage.objects;

CREATE POLICY "consult_photos_insert"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'consult-photos'
  AND (storage.foldername(name))[1] = 'consult'
);
