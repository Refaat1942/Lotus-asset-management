/** Category clusters — related types are displayed beside each other */
export const CATEGORY_CLUSTERS: { id: string; order: number; keywords: string[] }[] = [
  { id: 'security', order: 1, keywords: ['dvr', 'cctv', 'camera', 'hikvision', 'surveillance', 'nvr', 'recorder'] },
  { id: 'access', order: 2, keywords: ['fingerprint', 'finger', 'biometric', 'access', 'attendance', 'reader', 'figerprint'] },
  { id: 'computing', order: 3, keywords: ['laptop', 'notebook', 'desktop', 'pc', 'computer', 'workstation', 'imac', 'macbook'] },
  { id: 'display', order: 4, keywords: ['monitor', 'screen', 'display', 'projector', 'tv', 'television'] },
  { id: 'printing', order: 5, keywords: ['printer', 'scanner', 'copier', 'mfp', 'plotter'] },
  { id: 'network', order: 6, keywords: ['router', 'switch', 'firewall', 'access point', 'wifi', 'network', 'modem'] },
  { id: 'server', order: 7, keywords: ['server', 'rack', 'nas', 'storage', 'ups'] },
  { id: 'mobile', order: 8, keywords: ['phone', 'mobile', 'tablet', 'ipad', 'iphone', 'smartphone'] },
  { id: 'peripheral', order: 9, keywords: ['keyboard', 'mouse', 'headset', 'webcam', 'speaker'] },
  { id: 'furniture', order: 10, keywords: ['desk', 'chair', 'furniture', 'cabinet'] },
];

const IMAGE_BY_CLUSTER: Record<string, string> = {
  security: 'https://images.unsplash.com/photo-1557591627-c25405b722c2?w=400&h=400&fit=crop&q=80',
  access: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=400&fit=crop&q=80',
  computing: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop&q=80',
  display: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop&q=80',
  printing: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop&q=80',
  network: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=400&fit=crop&q=80',
  server: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=400&fit=crop&q=80',
  mobile: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&q=80',
  peripheral: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop&q=80',
  furniture: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=400&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400&h=400&fit=crop&q=80',
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
}

export function detectCluster(text: string): string {
  const normalized = normalize(text);
  for (const cluster of CATEGORY_CLUSTERS) {
    if (cluster.keywords.some((kw) => normalized.includes(kw))) {
      return cluster.id;
    }
  }
  return 'default';
}

export function getClusterOrder(clusterId: string): number {
  const cluster = CATEGORY_CLUSTERS.find((c) => c.id === clusterId);
  return cluster?.order ?? 99;
}

export function getAssetImageUrl(category?: string | null, name?: string | null, device?: string | null, manufacturer?: string | null): string {
  const combined = [category, name, device, manufacturer].filter(Boolean).join(' ');
  const clusterId = detectCluster(combined);
  return IMAGE_BY_CLUSTER[clusterId] || IMAGE_BY_CLUSTER.default;
}

export function sortCategoryKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const orderA = getClusterOrder(detectCluster(a));
    const orderB = getClusterOrder(detectCluster(b));
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });
}

export async function fetchWikiImage(query: string): Promise<string | null> {
  try {
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`,
      { next: { revalidate: 86400 } }
    );
    const searchData = await searchRes.json();
    const title = searchData?.query?.search?.[0]?.title;
    if (!title) return null;

    const imgRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=400&origin=*`,
      { next: { revalidate: 86400 } }
    );
    const imgData = await imgRes.json();
    const pages = imgData?.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0] as { thumbnail?: { source: string } };
    return page?.thumbnail?.source || null;
  } catch {
    return null;
  }
}
