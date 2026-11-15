import { DefaultArtifactClient } from '@actions/artifact';
import path from 'node:path';

const root = path.resolve('dist');
const files = [
  path.join(root, 'comedian-companion-debug.apk'),
  path.join(root, 'comedian-companion-debug.apk.sha256')
];

const client = new DefaultArtifactClient();
const result = await client.uploadArtifact(
  'comedian-companion-android-apk',
  files,
  root,
  { retentionDays: 7 }
);

console.log(`Uploaded artifact id=${result.id} size=${result.size}`);
