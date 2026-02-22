'use client';

import { useState, useRef, useCallback } from 'react';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface ParsedRow {
  photoUrl: string;
  displayName: string;
  fullName: string;
  interest: string;
  keyword1: string;
  keyword2: string;
  keyword3: string;
  email: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  bgColor: string;
}

interface UploadResult {
  success: number;
  failed: number;
  autoRegistered: number;
  errors: Array<{ row: number; error: string }>;
}

type ModalStep = 'select' | 'preview' | 'uploading' | 'result';

/**
 * Parse a CSV line handling quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      current += char;
      i++;
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (char === ',') {
        fields.push(current.trim());
        current = '';
        i++;
        continue;
      }
      current += char;
      i++;
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Parse CSV text into structured rows.
 */
function parseCsv(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) return [];

  const dataLines = lines.slice(1);
  const rows: ParsedRow[] = [];

  for (const line of dataLines) {
    const cols = parseCsvLine(line);
    if (cols.every((col) => col === '')) continue;

    rows.push({
      photoUrl: cols[0] || '',
      displayName: cols[1] || '',
      fullName: cols[2] || '',
      interest: cols[3] || '',
      keyword1: cols[4] || '',
      keyword2: cols[5] || '',
      keyword3: cols[6] || '',
      email: cols[7] || '',
      facebook: cols[8] || '',
      instagram: cols[9] || '',
      linkedin: cols[10] || '',
      bgColor: cols[11] || '',
    });
  }

  return rows;
}

function downloadSampleCSV() {
  const header =
    '사진 (정면 상반신까지 사진),이름 (명함 앞쪽),이름 (명함 뒤쪽),관심사,좋아하는 키워드 (1),좋아하는 키워드 (2),좋아하는 키워드 (3),이메일,SNS (Facebook),SNS (Instagram),SNS (Linkedin),좋아하는 컬러 (배경색)';
  const row1 =
    'https://example.com/photo1.jpg,홍길동,Gildong HONG,스타트업 컨설턴트,#스타트업,#AI,#혁신,gildong@example.com,facebook.com/gildong,@gildong,linkedin.com/in/gildong,블랙 #000000';
  const row2 =
    'https://example.com/photo2.jpg,김영희,Younghee KIM,디자이너,#UX,#브랜딩,#크리에이티브,younghee@example.com,,,linkedin.com/in/younghee,블루 #8db8da';

  const csvContent = '\uFEFF' + [header, row1, row2].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'namecard_bulk_sample.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function BulkUploadModal({ isOpen, onClose, onComplete }: BulkUploadModalProps) {
  const [step, setStep] = useState<ModalStep>('select');
  const [fileName, setFileName] = useState<string>('');
  const [rawCsv, setRawCsv] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setStep('select');
    setFileName('');
    setRawCsv('');
    setParsedRows([]);
    setResult(null);
    setDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const processFile = useCallback((file: File) => {
    if (!file) return;

    const validExtensions = ['.csv', '.xlsx', '.xls', '.txt'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(ext)) {
      alert('CSV 파일만 업로드할 수 있습니다.');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      setRawCsv(text);
      const rows = parseCsv(text);
      setParsedRows(rows);
      setStep('preview');
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!rawCsv) return;
    setStep('uploading');

    try {
      const res = await fetch('/api/admin/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: rawCsv }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setResult({
          success: 0,
          failed: parsedRows.length,
          errors: [{ row: 0, error: errorData.error || 'Upload failed' }],
        });
        setStep('result');
        return;
      }

      const data: UploadResult = await res.json();
      setResult(data);
      setStep('result');

      if (data.success > 0) {
        onComplete();
      }
    } catch {
      setResult({
        success: 0,
        failed: parsedRows.length,
        errors: [{ row: 0, error: 'Network error' }],
      });
      setStep('result');
    }
  }, [rawCsv, parsedRows.length, onComplete]);

  if (!isOpen) return null;

  const previewRows = parsedRows.slice(0, 5);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="CSV bulk upload"
    >
      <div
        className="bg-white rounded-xl shadow-xl border border-gray-100 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">CSV 대량 등록</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'select' && (
            <div>
              <div className="mb-3 flex justify-end">
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 underline transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                  </svg>
                  샘플 CSV 다운로드
                </button>
              </div>
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                aria-label="Drop CSV file here or click to browse"
              >
                <svg className="w-10 h-10 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm text-gray-600 mb-1">CSV 파일을 드래그하거나 클릭하여 선택하세요</p>
                <p className="text-xs text-gray-400">.csv 파일 지원</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                onChange={handleFileSelect}
                className="hidden"
                aria-hidden="true"
              />
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-2">CSV 컬럼 형식:</p>
                <p className="text-xs text-gray-400 font-mono">
                  사진URL, 이름(앞), 이름(뒤), 관심사, 키워드1, 키워드2, 키워드3, 이메일, 페이스북, 인스타그램, 링크드인, 배경색
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{fileName}</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    총 {parsedRows.length}건
                  </span>
                </div>
                <button onClick={resetState} className="text-xs text-gray-500 hover:text-gray-700 underline">
                  다른 파일 선택
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-medium text-gray-500 whitespace-nowrap">#</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500 whitespace-nowrap">이름(앞)</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500 whitespace-nowrap">이름(뒤)</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500 whitespace-nowrap">관심사</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500 whitespace-nowrap">키워드</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500 whitespace-nowrap">이메일</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500 whitespace-nowrap">배경색</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-gray-400">{idx + 1}</td>
                        <td className="py-2 px-3 text-gray-900 font-medium">{row.displayName || '-'}</td>
                        <td className="py-2 px-3 text-gray-700">{row.fullName || '-'}</td>
                        <td className="py-2 px-3 text-gray-700">{row.interest || '-'}</td>
                        <td className="py-2 px-3 text-gray-700">
                          {[row.keyword1, row.keyword2, row.keyword3].filter(Boolean).join(', ') || '-'}
                        </td>
                        <td className="py-2 px-3 text-gray-700 truncate max-w-[160px]">{row.email || '-'}</td>
                        <td className="py-2 px-3">
                          {row.bgColor ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="w-3 h-3 rounded-full border border-gray-200 inline-block"
                                style={{ backgroundColor: row.bgColor.match(/#[0-9A-Fa-f]{6}/)?.[0] || '#ccc' }}
                              />
                              <span className="text-gray-600">{row.bgColor}</span>
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedRows.length > 5 && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  ... 외 {parsedRows.length - 5}건 더 있음
                </p>
              )}
            </div>
          )}

          {step === 'uploading' && (
            <div className="text-center py-12">
              <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-gray-600">{parsedRows.length}건 등록 중...</p>
              <p className="text-xs text-gray-400 mt-1">잠시만 기다려 주세요</p>
            </div>
          )}

          {step === 'result' && result && (
            <div>
              {result.success > 0 && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <p className="text-sm text-green-800 font-medium">{result.success}건 등록 완료</p>
                    {result.autoRegistered > 0 && (
                      <p className="text-xs text-green-700 mt-1">{result.autoRegistered}명 자동 가입</p>
                    )}
                  </div>
                </div>
              )}

              {result.failed > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-sm text-red-800 font-medium">{result.failed}건 실패</p>
                  </div>
                  <ul className="space-y-1 ml-7">
                    {result.errors.map((err, idx) => (
                      <li key={idx} className="text-xs text-red-700">
                        {err.row > 0 ? `Row ${err.row}: ` : ''}{err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.success === 0 && result.failed === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">처리할 데이터가 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          {step === 'preview' && (
            <button
              onClick={handleUpload}
              className="min-h-[44px] px-6 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              전체 등록 ({parsedRows.length}건)
            </button>
          )}

          {(step === 'select' || step === 'result') && (
            <button
              onClick={handleClose}
              className="min-h-[44px] px-6 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
