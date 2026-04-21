import type { Scan, ScanSchedule, User, Vulnerability } from '../models/domain.models';

export const MOCK_USERS: User[] = [
  { id: '1', username: 'admin', email: 'admin@quiubox.local', role: 'admin' },
  { id: '2', username: 'usuario', email: 'usuario@quiubox.local', role: 'user' },
];

const now = new Date();
const iso = (d: Date) => d.toISOString();

export const INITIAL_SCANS: Scan[] = [
  {
    id: 'scan-1',
    target: '192.168.1.0/24',
    scanType: 'combined',
    status: 'completed',
    startedAt: iso(new Date(now.getTime() - 86400000)),
    finishedAt: iso(new Date(now.getTime() - 86000000)),
    criticalCount: 2,
    mediumCount: 4,
    lowCount: 3,
  },
  {
    id: 'scan-2',
    target: '10.0.0.5',
    scanType: 'nmap',
    status: 'completed',
    startedAt: iso(new Date(now.getTime() - 172800000)),
    finishedAt: iso(new Date(now.getTime() - 172700000)),
    criticalCount: 0,
    mediumCount: 1,
    lowCount: 2,
  },
];

export const INITIAL_SCHEDULES: ScanSchedule[] = [
  {
    id: 'sch-1',
    target: '192.168.10.0/24',
    scanType: 'openvas',
    frequency: 'weekly',
    nextRunAt: iso(new Date(now.getTime() + 86400000)),
    enabled: true,
  },
];

export const INITIAL_VULNERABILITIES: Vulnerability[] = [
  {
    id: 'vuln-1',
    scanId: 'scan-1',
    title: 'OpenSSH con versión con CVE conocido',
    severity: 'critical',
    cve: 'CVE-2023-12345',
    summary: 'Versión de OpenSSH susceptible a bypass de autenticación en ciertas configuraciones.',
    recommendations: [
      {
        id: 'r1',
        title: 'Actualizar OpenSSH',
        description: 'Actualizar a la última versión estable del paquete openssh-server en el sistema operativo.',
      },
      {
        id: 'r2',
        title: 'Restringir acceso',
        description: 'Limitar el acceso SSH mediante firewall y listas de IPs permitidas.',
      },
    ],
    nvd: {
      cveId: 'CVE-2023-12345',
      cvssScore: 9.8,
      description: 'Detalle sintético desde NVD (mock).',
      referenceUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2023-12345',
    },
  },
  {
    id: 'vuln-2',
    scanId: 'scan-1',
    title: 'Servicio HTTP sin cabeceras de seguridad',
    severity: 'high',
    cve: undefined,
    summary: 'Faltan cabeceras HSTS y CSP en el servidor web expuesto.',
    recommendations: [
      {
        id: 'r3',
        title: 'Configurar HSTS y CSP',
        description: 'Añadir cabeceras Strict-Transport-Security y Content-Security-Policy acordes al sitio.',
      },
    ],
    nvd: undefined,
  },
  {
    id: 'vuln-3',
    scanId: 'scan-2',
    title: 'Puerto SMB expuesto',
    severity: 'medium',
    summary: 'El puerto 445 está accesible desde redes no confiables.',
    recommendations: [
      {
        id: 'r4',
        title: 'Cerrar o filtrar SMB',
        description: 'Restringir el acceso al puerto 445 mediante firewall perimetral.',
      },
    ],
  },
];
