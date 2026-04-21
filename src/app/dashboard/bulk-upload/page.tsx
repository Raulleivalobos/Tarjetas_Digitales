'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { validateRut, formatRut, generateCardNumber } from '@/lib/utils';
import { BulkUploadRow, BulkUploadResult } from '@/lib/types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, FileText, AlertTriangle, Download } from 'lucide-react';

export default function BulkUploadPage() {
  const { organization } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<BulkUploadRow[]>([]);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const supabase = createClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setResult(null);

    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      Papa.parse<BulkUploadRow>(selected, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setPreview(results.data.slice(0, 5)); // Show first 5
        },
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<BulkUploadRow>(firstSheet);
        setPreview(jsonData.slice(0, 5));
      };
      reader.readAsArrayBuffer(selected);
    }
  };

  const processUpload = async () => {
    if (!file || !organization) return;
    setProcessing(true);
    setResult({ total: 0, success: 0, errors: [] });

    const ext = file.name.split('.').pop()?.toLowerCase();
    let dataToProcess: BulkUploadRow[] = [];

    if (ext === 'csv') {
      const text = await file.text();
      const parsed = Papa.parse<BulkUploadRow>(text, { header: true, skipEmptyLines: true });
      dataToProcess = parsed.data;
    } else {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      dataToProcess = XLSX.utils.sheet_to_json<BulkUploadRow>(firstSheet);
    }

    const currentResult: BulkUploadResult = { total: dataToProcess.length, success: 0, errors: [] };

    // Process sequentially to handle dependent inserts (beneficiary -> card) reliably
    for (let i = 0; i < dataToProcess.length; i++) {
      const row = dataToProcess[i];
      const rowNum = i + 2; // Assuming header is row 1

      try {
        // Validate
        if (!row.full_name || !row.rut) {
          currentResult.errors.push({ row: rowNum, field: 'general', message: 'Nombre y RUT son requeridos' });
          continue;
        }

        const cleanRut = String(row.rut).replace(/[^0-9kK]/g, '');
        if (!validateRut(cleanRut)) {
          currentResult.errors.push({ row: rowNum, field: 'rut', message: `RUT inválido: ${row.rut}` });
          continue;
        }

        // Check exists
        const { data: existing } = await supabase
          .from('beneficiaries')
          .select('id')
          .eq('org_id', organization.id)
          .eq('rut', cleanRut)
          .single();

        if (existing) {
          currentResult.errors.push({ row: rowNum, field: 'rut', message: `RUT ya registrado en la organización: ${formatRut(cleanRut)}` });
          continue;
        }

        // Insert
        const { data: ben, error: insertError } = await supabase
          .from('beneficiaries')
          .insert({
            org_id: organization.id,
            full_name: row.full_name,
            rut: cleanRut,
            email: row.email || null,
            phone: row.phone ? String(row.phone) : null,
            address: row.address || null,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (ben) {
          const cardNumber = generateCardNumber();
          const qrCode = `${organization.slug}-${ben.id}`;
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);

          await supabase.from('digital_cards').insert({
            beneficiary_id: ben.id,
            org_id: organization.id,
            card_number: cardNumber,
            qr_code: qrCode,
            status: 'active',
            expires_at: expiresAt.toISOString(),
          });

          currentResult.success++;
        }
      } catch (err: any) {
        currentResult.errors.push({ row: rowNum, field: 'system', message: err.message || 'Error inesperado' });
      }
    }

    setResult(currentResult);
    setProcessing(false);
    setFile(null);
    setPreview([]);
  };

  const downloadTemplate = () => {
    const csv = 'full_name,rut,email,phone,address\nJuan Perez,12345678-9,juan@ejemplo.com,+56912345678,Calle Falsa 123';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_beneficiarios.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Carga Masiva</h1>
          <p className="text-slate-400 mt-1">Importa múltiples beneficiarios desde Excel o CSV</p>
        </div>
        <button onClick={downloadTemplate} className="btn-secondary px-4 py-2 text-sm flex items-center gap-2">
          <Download className="w-4 h-4" /> Plantilla CSV
        </button>
      </div>

      <div className="glass-card p-8">
        {!processing && !result ? (
          <div className="space-y-8">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-brand-500/30 rounded-2xl cursor-pointer bg-surface-900/50 hover:bg-surface-900 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 text-brand-400 mb-4" />
                  <p className="mb-2 text-sm text-slate-300">
                    <span className="font-semibold text-brand-400">Haz clic para subir</span> o arrastra y suelta
                  </p>
                  <p className="text-xs text-slate-500">XLSX, XLS, CSV (MAX. 5MB)</p>
                </div>
                <input type="file" className="hidden" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileChange} />
              </label>
            </div>

            {file && (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between bg-surface-900 border border-brand-500/20 p-4 rounded-xl mb-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-brand-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => setFile(null)} className="text-sm text-red-400 hover:text-red-300">Quitar</button>
                </div>

                {preview.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-300">Vista Previa (primeras filas)</h3>
                    <div className="overflow-x-auto rounded-xl border border-brand-500/10">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Nombre</th>
                            <th>RUT</th>
                            <th>Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((row, i) => (
                            <tr key={i}>
                              <td>{row.full_name}</td>
                              <td className="font-mono">{row.rut}</td>
                              <td>{row.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button onClick={processUpload} className="btn-primary px-8 py-3 text-sm">
                    Procesar {file.name}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : processing ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
             <div className="w-16 h-16 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin mb-6" />
             <h3 className="text-xl font-medium text-white mb-2">Procesando archivo...</h3>
             <p className="text-slate-400">Esto puede tomar unos minutos dependiendo del tamaño del archivo. Por favor, no cierres esta página.</p>
          </div>
        ) : result ? (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-surface-900 border border-brand-500/10 p-4 rounded-xl text-center">
                 <p className="text-slate-400 text-sm mb-1">Total Registros</p>
                 <p className="text-3xl font-bold text-white">{result.total}</p>
               </div>
               <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center">
                 <p className="text-emerald-500/70 text-sm mb-1">Exitosos</p>
                 <p className="text-3xl font-bold text-emerald-400">{result.success}</p>
               </div>
               <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center">
                 <p className="text-red-500/70 text-sm mb-1">Errores</p>
                 <p className="text-3xl font-bold text-red-400">{result.errors.length}</p>
               </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Detalle de Errores
                </h3>
                <div className="bg-surface-900 border border-red-500/20 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-red-500/5 text-red-400 text-xs uppercase">
                      <tr>
                        <th className="px-6 py-3">Fila</th>
                        <th className="px-6 py-3">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((err, i) => (
                        <tr key={i} className="border-b border-red-500/10">
                          <td className="px-6 py-4 font-mono text-slate-300">{err.row}</td>
                          <td className="px-6 py-4 text-slate-400">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-8">
              <button onClick={() => setResult(null)} className="btn-secondary px-8 py-3">
                Subir Otro Archivo
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
