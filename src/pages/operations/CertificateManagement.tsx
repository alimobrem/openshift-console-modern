import React, { useState } from 'react';
import { Label, Button, Modal, ModalVariant, ModalHeader, ModalBody, ModalFooter } from '@patternfly/react-core';
import { useNavigate } from 'react-router-dom';
import ResourceListPage, { type ColumnDef } from '@/components/ResourceListPage';
import { useK8sResource, ageFromTimestamp, type K8sMeta } from '@/hooks/useK8sResource';
import { useUIStore } from '@/store/useUIStore';

const BASE = '/api/kubernetes';

interface CertInfo {
  issuer: string;
  subject: string;
  notBefore: string;
  notAfter: string;
  daysUntilExpiry: number;
  sans: string[];
}

interface CertRow {
  name: string;
  namespace: string;
  issuer: string;
  subject: string;
  expires: string;
  daysLeft: number;
  status: string;
  age: string;
  certPem: string;
  sans: string[];
}

interface RawSecret extends K8sMeta {
  type: string;
  data?: Record<string, string>;
}

// --- Lightweight X.509 PEM parser ---
function parsePemCert(base64Data: string): CertInfo | null {
  try {
    const pem = atob(base64Data);
    // Find certificate boundaries if present
    const derStart = pem.indexOf('-----BEGIN CERTIFICATE-----');
    let der: string;
    if (derStart >= 0) {
      const lines = pem.split('\n').filter((l) => !l.startsWith('-----') && l.trim().length > 0);
      der = atob(lines.join(''));
    } else {
      // Already raw DER
      der = pem;
    }

    // Parse ASN.1 to find validity dates and subject/issuer
    // X.509 structure: SEQUENCE { tbsCertificate SEQUENCE { version, serialNumber, signature, issuer, validity { notBefore, notAfter }, subject, ... } }
    const bytes = new Uint8Array(der.length);
    for (let i = 0; i < der.length; i++) bytes[i] = der.charCodeAt(i);

    let issuer = '';
    let subject = '';
    let notBefore = '';
    let notAfter = '';
    const sans: string[] = [];

    // Find time values (UTCTime tag=0x17 or GeneralizedTime tag=0x18)
    const times: string[] = [];
    for (let i = 0; i < bytes.length - 2; i++) {
      if (bytes[i] === 0x17 || bytes[i] === 0x18) { // UTCTime or GeneralizedTime
        const len = bytes[i + 1];
        if (len > 10 && len < 20 && i + 2 + len <= bytes.length) {
          const timeStr = String.fromCharCode(...bytes.slice(i + 2, i + 2 + len));
          if (/^\d{2,4}\d{2}\d{2}\d{2}\d{2}\d{2}Z?$/.test(timeStr)) {
            let year: number, rest: string;
            if (bytes[i] === 0x18) { // GeneralizedTime YYYYMMDD...
              year = parseInt(timeStr.slice(0, 4));
              rest = timeStr.slice(4);
            } else { // UTCTime YYMMDD...
              const yy = parseInt(timeStr.slice(0, 2));
              year = yy >= 50 ? 1900 + yy : 2000 + yy;
              rest = timeStr.slice(2);
            }
            const month = rest.slice(0, 2);
            const day = rest.slice(2, 4);
            const hour = rest.slice(4, 6);
            const min = rest.slice(6, 8);
            const sec = rest.slice(8, 10);
            times.push(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`);
          }
        }
      }
    }

    if (times.length >= 2) {
      notBefore = times[0];
      notAfter = times[1];
    }

    // Extract CN from issuer/subject (look for OID 2.5.4.3 = 55 04 03)
    const cnOid = [0x55, 0x04, 0x03];
    const cnPositions: number[] = [];
    for (let i = 0; i < bytes.length - 5; i++) {
      if (bytes[i] === cnOid[0] && bytes[i + 1] === cnOid[1] && bytes[i + 2] === cnOid[2]) {
        // Next TLV should be the CN string
        const strTag = bytes[i + 3];
        if (strTag === 0x0c || strTag === 0x13 || strTag === 0x16) { // UTF8String, PrintableString, IA5String
          const strLen = bytes[i + 4];
          if (strLen > 0 && i + 5 + strLen <= bytes.length) {
            cnPositions.push(i);
            const cn = String.fromCharCode(...bytes.slice(i + 5, i + 5 + strLen));
            if (!issuer) issuer = cn;
            else if (!subject) subject = cn;
          }
        }
      }
    }
    // If only one CN found, it's likely the subject (self-signed)
    if (cnPositions.length === 1) {
      subject = issuer;
      issuer = subject + ' (self-signed)';
    }

    // Extract SANs (OID 2.5.29.17 = 55 1D 11)
    const sanOid = [0x55, 0x1d, 0x11];
    for (let i = 0; i < bytes.length - 5; i++) {
      if (bytes[i] === sanOid[0] && bytes[i + 1] === sanOid[1] && bytes[i + 2] === sanOid[2]) {
        // Skip ahead to find DNS names (tag 0x82 for dNSName)
        for (let j = i + 3; j < Math.min(i + 500, bytes.length - 2); j++) {
          if (bytes[j] === 0x82) { // dNSName
            const sanLen = bytes[j + 1];
            if (sanLen > 0 && j + 2 + sanLen <= bytes.length) {
              sans.push(String.fromCharCode(...bytes.slice(j + 2, j + 2 + sanLen)));
              j += 1 + sanLen;
            }
          }
        }
        break;
      }
    }

    const daysUntilExpiry = notAfter
      ? Math.floor((new Date(notAfter).getTime() - Date.now()) / 86400000)
      : -1;

    return {
      issuer: issuer || 'Unknown',
      subject: subject || 'Unknown',
      notBefore,
      notAfter,
      daysUntilExpiry,
      sans,
    };
  } catch {
    return null;
  }
}

function getExpiryStatus(daysLeft: number): { label: string; color: 'green' | 'orange' | 'red' | 'grey' } {
  if (daysLeft < 0) return { label: 'Expired', color: 'red' };
  if (daysLeft <= 30) return { label: `${daysLeft}d left`, color: 'red' };
  if (daysLeft <= 90) return { label: `${daysLeft}d left`, color: 'orange' };
  return { label: `${daysLeft}d left`, color: 'green' };
}

function formatDate(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function CertificateManagement() {
  const navigate = useNavigate();
  const addToast = useUIStore((s) => s.addToast);
  const [detailCert, setDetailCert] = useState<CertRow | null>(null);

  const { data: allSecrets, loading, refetch } = useK8sResource<RawSecret, CertRow | null>(
    '/api/v1/secrets',
    (item) => {
      if (item.type !== 'kubernetes.io/tls') return null;
      const certData = item.data?.['tls.crt'] ?? '';
      const parsed = certData ? parsePemCert(certData) : null;
      return {
        name: item.metadata.name,
        namespace: item.metadata.namespace ?? '',
        issuer: parsed?.issuer ?? 'Unknown',
        subject: parsed?.subject ?? 'Unknown',
        expires: parsed?.notAfter ? formatDate(parsed.notAfter) : '-',
        daysLeft: parsed?.daysUntilExpiry ?? -1,
        status: parsed ? getExpiryStatus(parsed.daysUntilExpiry).label : 'Unknown',
        age: ageFromTimestamp(item.metadata.creationTimestamp),
        certPem: certData ? atob(certData) : '',
        sans: parsed?.sans ?? [],
      };
    },
  );

  const data = allSecrets.filter((item): item is CertRow => item !== null);

  const handleRenew = async (cert: CertRow) => {
    try {
      const res = await fetch(`${BASE}/api/v1/namespaces/${encodeURIComponent(cert.namespace)}/secrets/${encodeURIComponent(cert.name)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      addToast({ type: 'success', title: `Certificate ${cert.name} renewed`, description: 'Secret deleted — cert-manager or CA will recreate it' });
      refetch();
    } catch (err) {
      addToast({ type: 'error', title: 'Renew failed', description: err instanceof Error ? err.message : String(err) });
    }
  };

  const handleDownload = (cert: CertRow) => {
    const blob = new Blob([cert.certPem], { type: 'application/x-pem-file' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.name}.pem`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast({ type: 'success', title: 'Certificate downloaded' });
  };

  const columns: ColumnDef<CertRow>[] = [
    { title: 'Name', key: 'name' },
    { title: 'Namespace', key: 'namespace' },
    { title: 'Subject', key: 'subject' },
    { title: 'Expires', key: 'expires' },
    {
      title: 'Status', key: 'status',
      render: (cert) => {
        const { color } = getExpiryStatus(cert.daysLeft);
        return <Label color={color}>{cert.status}</Label>;
      },
      sortable: false,
    },
    { title: 'Age', key: 'age' },
    {
      title: 'Actions', key: 'actions',
      render: (cert) => (
        <span className="os-certs__actions" onClick={(e) => e.stopPropagation()}>
          <Button variant="link" size="sm" isInline onClick={(e) => { e.stopPropagation(); setDetailCert(cert); }}>
            Details
          </Button>
          {' '}
          <Button variant="link" size="sm" isInline onClick={(e) => { e.stopPropagation(); handleDownload(cert); }}>
            Download
          </Button>
          {' '}
          <Button variant="link" size="sm" isInline onClick={(e) => { e.stopPropagation(); handleRenew(cert); }}>
            Renew
          </Button>
        </span>
      ),
      sortable: false,
    },
  ];

  return (
    <>
      <ResourceListPage
        title="Certificate Management"
        description="View TLS certificates, check expiry, download, and renew"
        columns={columns}
        data={data}
        loading={loading}
        getRowKey={(cert) => `${cert.namespace}-${cert.name}`}
        onRowClick={(cert) => setDetailCert(cert)}
        nameField="name"
        statusField="status"
        filterFn={(cert, s) =>
          cert.name.toLowerCase().includes(s.toLowerCase()) ||
          cert.namespace.toLowerCase().includes(s.toLowerCase()) ||
          cert.subject.toLowerCase().includes(s.toLowerCase())
        }
      />

      <Modal
        variant={ModalVariant.medium}
        isOpen={!!detailCert}
        onClose={() => setDetailCert(null)}
        aria-label="Certificate Details"
      >
        <ModalHeader title={`Certificate: ${detailCert?.name ?? ''}`} />
        <ModalBody>
          {detailCert && (
            <div className="os-cert-detail">
              <div className="os-cert-detail__row"><strong>Name</strong><span>{detailCert.name}</span></div>
              <div className="os-cert-detail__row"><strong>Namespace</strong><span>{detailCert.namespace}</span></div>
              <div className="os-cert-detail__row"><strong>Subject (CN)</strong><span>{detailCert.subject}</span></div>
              <div className="os-cert-detail__row"><strong>Issuer</strong><span>{detailCert.issuer}</span></div>
              <div className="os-cert-detail__row"><strong>Expires</strong><span>{detailCert.expires}</span></div>
              <div className="os-cert-detail__row">
                <strong>Status</strong>
                <Label color={getExpiryStatus(detailCert.daysLeft).color}>{detailCert.status}</Label>
              </div>
              <div className="os-cert-detail__row"><strong>Age</strong><span>{detailCert.age}</span></div>
              {detailCert.sans.length > 0 && (
                <div className="os-cert-detail__section">
                  <strong>Subject Alternative Names ({detailCert.sans.length})</strong>
                  <div className="os-cert-detail__sans">
                    {detailCert.sans.map((san) => (
                      <Label key={san} color="blue" className="os-cert-detail__san">{san}</Label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {detailCert && (
            <>
              <Button variant="primary" onClick={() => { handleDownload(detailCert); }}>Download PEM</Button>
              <Button variant="secondary" onClick={() => { handleRenew(detailCert); setDetailCert(null); }}>Renew</Button>
              <Button variant="link" onClick={() => navigate(`/workloads/secrets/${detailCert.namespace}/${detailCert.name}`)}>View Secret</Button>
            </>
          )}
          <Button variant="link" onClick={() => setDetailCert(null)}>Close</Button>
        </ModalFooter>
      </Modal>

      <style>{`
        .os-cert-detail { display: flex; flex-direction: column; gap: 12px; }
        .os-cert-detail__row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--pf-t--global--border--color--default, #d2d2d2); }
        .os-cert-detail__row strong { min-width: 160px; }
        .os-cert-detail__section { margin-top: 8px; }
        .os-cert-detail__section strong { display: block; margin-bottom: 8px; }
        .os-cert-detail__sans { display: flex; flex-wrap: wrap; gap: 6px; }
        .os-cert-detail__san { font-size: 12px !important; }
        .os-certs__actions { display: flex; gap: 4px; }
      `}</style>
    </>
  );
}
