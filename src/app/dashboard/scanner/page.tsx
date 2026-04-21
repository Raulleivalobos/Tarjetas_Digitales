'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, ScanLine, Camera, AlertCircle, CheckCircle, Gift, User } from 'lucide-react';
import { QRValidationResult, BenefitAssignment } from '@/lib/types';
import { DigitalCardView } from '@/components/cards/DigitalCardView';
import { formatDate } from '@/lib/utils';
import Image from 'next/image';

export default function ScannerPage() {
  const { user, organization } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [validationResult, setValidationResult] = useState<QRValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [processingBenefit, setProcessingBenefit] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (scanning) {
      scanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(handleScanSuccess, handleScanError);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  const handleScanSuccess = async (decodedText: string) => {
    // Expected format: orgSlug-cardId
    if (!scanning) return;
    setScanning(false); // Stop scanner once we get a read
    await validateQRCode(decodedText);
  };

  const handleScanError = () => {
    // Ignore routine errors
  };

  const validateQRCode = async (qrData: string) => {
    if (!organization || !user) return;
    setValidating(true);
    setValidationResult(null);

    try {
      // 1. Find Card
      const { data: card, error: cardError } = await supabase
        .from('digital_cards')
        .select('*, beneficiaries(*)')
        .eq('qr_code', qrData)
        .single();

      if (cardError || !card) {
        await logValidation('scan', 'failed', 'Invalid QR Code', null, null);
        setValidationResult({ valid: false, error: 'Código QR no reconocido' });
        setValidating(false);
        return;
      }

      // Check if card belongs to this org
      if (card.org_id !== organization.id) {
        await logValidation('scan', 'denied', 'Wrong Organization', card.id, card.beneficiary_id);
        setValidationResult({ valid: false, error: 'Tarjeta no pertenece a esta organización' });
        setValidating(false);
        return;
      }

      const isValid = card.status === 'active' && card.beneficiaries.status === 'active';

      // 2. Fetch available benefits if valid
      let availableBenefits: BenefitAssignment[] = [];
      if (isValid) {
        const { data: assignments } = await supabase
          .from('benefit_assignments')
          .select('*, benefits(*)')
          .eq('beneficiary_id', card.beneficiary_id)
          .eq('status', 'pending');

        if (assignments) {
          availableBenefits = assignments.map((a: any) => ({
            ...a,
            benefit: a.benefits,
          }));
        }
      }

      // 3. Log Scan
      await logValidation(
        'validate',
        isValid ? 'success' : 'failed',
        `Card status: ${card.status}`,
        card.id,
        card.beneficiary_id
      );

      setValidationResult({
        valid: isValid,
        card,
        beneficiary: card.beneficiaries,
        organization,
        availableBenefits,
        error: !isValid ? 'Tarjeta o beneficiario inactivo/bloqueado' : undefined,
      });

    } catch (error) {
      setValidationResult({ valid: false, error: 'Error de conexión' });
    } finally {
      setValidating(false);
    }
  };

  const logValidation = async (
    action: string,
    result: string,
    details: string,
    cardId: string | null,
    beneficiaryId: string | null
  ) => {
    if (!organization || !user) return;
    await supabase.from('validation_logs').insert({
      org_id: organization.id,
      validated_by: user.id,
      action,
      result,
      card_id: cardId,
      beneficiary_id: beneficiaryId,
      metadata: { details },
    });
  };

  const handleUseBenefit = async (assignmentId: string) => {
    if (!organization || !user || !validationResult?.card) return;
    setProcessingBenefit(assignmentId);

    const { error } = await supabase
      .from('benefit_assignments')
      .update({
        status: 'used',
        used_at: new Date().toISOString(),
        validated_by: user.id,
      })
      .eq('id', assignmentId);

    if (!error) {
      await logValidation('mark_used', 'success', `Assignment ${assignmentId}`, validationResult.card.id, validationResult.beneficiary?.id || null);
      
      // Update local state
      setValidationResult(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          availableBenefits: prev.availableBenefits?.filter(b => b.id !== assignmentId),
        };
      });
    }
    
    setProcessingBenefit(null);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Escáner QR</h1>
        <p className="text-slate-400">Valida identidades y entrega beneficios</p>
      </div>

      {!scanning && !validationResult && !validating && (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-brand-500/20 rounded-full animate-ping opacity-75" />
            <ScanLine className="w-10 h-10 text-brand-400 relative z-10" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Listo para escanear</h2>
          <p className="text-slate-400 mb-8 max-w-sm mx-auto">
            Apunta la cámara al código QR de la tarjeta digital del beneficiario
          </p>
          <button
            onClick={() => setScanning(true)}
            className="btn-primary px-8 py-3 text-sm flex items-center justify-center gap-2 mx-auto w-full sm:w-auto"
          >
            <Camera className="w-5 h-5" />
            Iniciar Cámara
          </button>
        </div>
      )}

      {scanning && (
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Cámara activa
            </h3>
            <button
              onClick={() => setScanning(false)}
              className="btn-secondary px-4 py-1.5 text-xs"
            >
              Cancelar
            </button>
          </div>
          <div id="reader" className="rounded-xl overflow-hidden bg-black aspect-square max-w-sm mx-auto border-2 border-brand-500/30"></div>
        </div>
      )}

      {validating && (
        <div className="glass-card p-12 text-center">
          <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-medium">Validando tarjeta...</p>
        </div>
      )}

      {validationResult && !validating && (
        <div className="space-y-6">
          <div className={`p-4 rounded-xl border flex items-center gap-4 ${
            validationResult.valid 
              ? 'bg-emerald-500/10 border-emerald-500/20' 
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            {validationResult.valid ? (
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-400" />
            )}
            <div>
              <h2 className={`font-bold text-lg ${validationResult.valid ? 'text-emerald-400' : 'text-red-400'}`}>
                {validationResult.valid ? 'Identidad Validada' : 'Validación Fallida'}
              </h2>
              <p className={validationResult.valid ? 'text-emerald-500/70' : 'text-red-500/70'}>
                {validationResult.error || 'La tarjeta es válida y está activa'}
              </p>
            </div>
          </div>

          {validationResult.beneficiary && validationResult.card && validationResult.organization && (
            <div className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4">Datos del Beneficiario</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-surface-900 overflow-hidden border border-brand-500/20">
                   {validationResult.beneficiary.photo_url ? (
                      <Image src={validationResult.beneficiary.photo_url} alt="" width={64} height={64} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 text-slate-600" />
                      </div>
                    )}
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{validationResult.beneficiary.full_name}</p>
                  <p className="text-slate-400 font-mono text-sm">{validationResult.beneficiary.rut}</p>
                </div>
              </div>
              <DigitalCardView 
                beneficiary={validationResult.beneficiary} 
                card={validationResult.card} 
                organization={validationResult.organization}
                showQR={false}
                compact
              />
            </div>
          )}

          {validationResult.valid && (
            <div className="glass-card p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-brand-400" />
                Beneficios Disponibles
              </h3>
              
              {validationResult.availableBenefits && validationResult.availableBenefits.length > 0 ? (
                <div className="space-y-3">
                  {validationResult.availableBenefits.map((assignment) => (
                    <div key={assignment.id} className="p-4 rounded-xl border border-brand-500/10 bg-surface-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{assignment.benefit?.name}</p>
                        <p className="text-xs text-slate-400">Válido hasta: {assignment.benefit?.end_date ? formatDate(assignment.benefit.end_date) : 'Sin límite'}</p>
                      </div>
                      <button
                        onClick={() => handleUseBenefit(assignment.id)}
                        disabled={processingBenefit === assignment.id}
                        className="btn-primary px-4 py-2 text-sm whitespace-nowrap disabled:opacity-50"
                      >
                        {processingBenefit === assignment.id ? 'Procesando...' : 'Entregar Beneficio'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 bg-surface-900/30 rounded-xl">
                  No hay beneficios pendientes de entrega.
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center pt-4">
            <button
              onClick={() => {
                setValidationResult(null);
                setScanning(true);
              }}
              className="btn-secondary px-8 py-3 flex items-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              Escanear Otra Tarjeta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
