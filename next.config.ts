import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;

// Локальная разработка через Cloudflare-адаптер: даёт доступ к биндингам
// воркера в `next dev`. В продакшене запускается .open-next/worker.js.
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();
