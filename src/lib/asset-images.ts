/** Category clusters — related types displayed beside each other */
export const CATEGORY_CLUSTERS: { id: string; order: number; keywords: string[] }[] = [
  { id: 'security', order: 1, keywords: ['dvr', 'cctv', 'camera', 'hikvision', 'surveillance'] },
  { id: 'nvr', order: 2, keywords: ['nvr', 'recorder'] },
  { id: 'access', order: 3, keywords: ['fingerprint', 'finger', 'figerprint', 'biometric', 'attendance'] },
  { id: 'network', order: 4, keywords: ['accesspoint', 'access point', 'router', 'switch', 'firewall', 'wifi', 'wireless'] },
  { id: 'desktop', order: 5, keywords: ['desktop', 'workstation', 'tower', 'optiplex', 'imac'] },
  { id: 'laptop', order: 6, keywords: ['laptop', 'notebook', 'macbook'] },
  { id: 'display', order: 7, keywords: ['monitor', 'screen', 'display', 'projector', 'tv'] },
  { id: 'printing', order: 8, keywords: ['printer', 'scanner', 'copier', 'mfp'] },
  { id: 'server', order: 9, keywords: ['server', 'rack', 'nas'] },
  { id: 'mobile', order: 10, keywords: ['phone', 'mobile', 'tablet', 'ipad', 'iphone'] },
  { id: 'storage', order: 11, keywords: ['ups', 'storage', 'hdd'] },
];

export type CategoryVisualType =
  | 'dvr' | 'nvr' | 'fingerprint' | 'accesspoint' | 'desktop' | 'laptop'
  | 'monitor' | 'printer' | 'server' | 'network' | 'phone' | 'default';

export interface CategoryVisualMeta {
  type: CategoryVisualType;
  gradient: string;
  imageUrl: string | null;
}

const VISUALS: Record<CategoryVisualType, Omit<CategoryVisualMeta, 'type'>> = {
  dvr: {
    gradient: 'from-slate-700 to-slate-900',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/CCTV_camera.jpg/320px-CCTV_camera.jpg',
  },
  nvr: {
    gradient: 'from-zinc-700 to-zinc-900',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Rack_server_in_a_data_center.jpg/320px-Rack_server_in_a_data_center.jpg',
  },
  fingerprint: {
    gradient: 'from-emerald-600 to-teal-800',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Fingerprint_System.svg/320px-Fingerprint_System.svg.png',
  },
  accesspoint: {
    gradient: 'from-blue-600 to-indigo-800',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Cisco_access_point.jpg/320px-Cisco_access_point.jpg',
  },
  desktop: {
    gradient: 'from-lotus-600 to-lotus-800',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Desktop_computer_system_unit.png/320px-Desktop_computer_system_unit.png',
  },
  laptop: {
    gradient: 'from-sky-600 to-blue-800',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Laptop_Yoga_730.png/320px-Laptop_Yoga_730.png',
  },
  monitor: {
    gradient: 'from-cyan-600 to-teal-800',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/LCD_monitor.jpg/320px-LCD_monitor.jpg',
  },
  printer: {
    gradient: 'from-amber-600 to-orange-800',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Laser_printer.jpg/320px-Laser_printer.jpg',
  },
  server: {
    gradient: 'from-gray-600 to-gray-900',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Full_size_rack.jpg/320px-Full_size_rack.jpg',
  },
  network: {
    gradient: 'from-violet-600 to-purple-800',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Network_switches.jpg/320px-Network_switches.jpg',
  },
  phone: {
    gradient: 'from-rose-500 to-pink-700',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Smartphone_icon.svg/320px-Smartphone_icon.svg.png',
  },
  default: {
    gradient: 'from-lotus-500 to-lotus-700',
    imageUrl: null,
  },
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function detectVisualType(
  category?: string | null,
  name?: string | null,
  device?: string | null,
  manufacturer?: string | null
): CategoryVisualType {
  const combined = normalize([category, name, device, manufacturer].filter(Boolean).join(' '));

  if (combined.includes('figerprint') || combined.includes('fingerprint') || combined.includes('biometric')) {
    return 'fingerprint';
  }
  if (combined.includes('nvr')) return 'nvr';
  if (combined.includes('dvr') || combined.includes('cctv') || combined.includes('hikvision')) return 'dvr';
  if (combined.includes('accesspoint') || combined.includes('wirelessap')) return 'accesspoint';
  if (combined.includes('desktop') || combined.includes('optiplex') || combined.includes('workstation') || combined.includes('towerpc')) {
    return 'desktop';
  }
  if (combined.includes('laptop') || combined.includes('notebook') || combined.includes('macbook')) return 'laptop';
  if (combined.includes('printer') || combined.includes('scanner') || combined.includes('copier')) return 'printer';
  if (combined.includes('monitor') || combined.includes('display') || combined.includes('projector')) return 'monitor';
  if (combined.includes('server') || combined.includes('rack')) return 'server';
  if (combined.includes('router') || combined.includes('switch') || combined.includes('firewall') || combined.includes('network')) {
    return 'network';
  }
  if (combined.includes('phone') || combined.includes('mobile') || combined.includes('tablet') || combined.includes('iphone')) {
    return 'phone';
  }
  if (combined.includes('pc') || combined.includes('computer') || combined.includes('corei')) return 'desktop';

  return 'default';
}

export function resolveCategoryVisual(
  category?: string | null,
  name?: string | null,
  device?: string | null,
  manufacturer?: string | null
): CategoryVisualMeta {
  const type = detectVisualType(category, name, device, manufacturer);
  return { type, ...VISUALS[type] };
}

export function detectCluster(text: string): string {
  const normalized = normalize(text);
  for (const cluster of CATEGORY_CLUSTERS) {
    if (cluster.keywords.some((kw) => normalized.includes(normalize(kw)))) {
      return cluster.id;
    }
  }
  return 'default';
}

export function getClusterOrder(clusterId: string): number {
  const cluster = CATEGORY_CLUSTERS.find((c) => c.id === clusterId);
  return cluster?.order ?? 99;
}

export function sortCategoryKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const orderA = getClusterOrder(detectCluster(a));
    const orderB = getClusterOrder(detectCluster(b));
    if (orderA !== orderB) return orderA - orderB;
    return a.localeCompare(b);
  });
}
