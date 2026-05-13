'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { validateRut, formatRut, generateCardNumber } from '@/lib/utils';
import { BulkUploadRow, BulkUploadResult } from '@/lib/types';
// xlsx (~200KB) and papaparse (~30KB) loaded dynamically when needed
import { Upload, FileText, AlertTriangle, Download, UserPlus, Users, Palette, Check, LayoutTemplate, Globe, Shield, ChevronDown, Phone, Mail, MapPin, Camera, Calendar, Fingerprint, ShieldAlert } from 'lucide-react';
import { CardDesign } from '@/lib/cardDesignTypes';
import { Modal } from '@/components/ui/Modal';
import dynamic from 'next/dynamic';
const CanvasPreview = dynamic(
  () => import('@/components/designer/CanvasPreview').then(m => m.CanvasPreview),
  { ssr: false, loading: () => <div className="w-full h-full animate-pulse bg-white/5 rounded-lg" /> }
);
import { useSearchParams } from 'next/navigation';
import { sendCertificateNotification } from '@/app/actions/email';

function IssuePageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { organization, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'manual' | 'masivo'>(tabParam === 'masivo' ? 'masivo' : 'manual');
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // Designs State
  const [designs, setDesigns] = useState<CardDesign[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<CardDesign | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Manual State
  const [manualForm, setManualForm] = useState({ 
    first_name: '',
    last_name: '',
    full_name: '', 
    rut: '', 
    email: '',
    phone: '',
    comuna: '',
    type: 'basic', // basic or blockchain
    language: 'es',
    status: 'active',
    expiryDate: '',
    customFields: {} as Record<string, string>
  });
  const [manualLoading, setManualLoading] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);
  const [manualError, setManualError] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(URL.createObjectURL(file));
      
      // Also set it in custom fields if "Foto" attribute exists
      if (selectedDesign) {
        const photoAttr = selectedDesign.attributes.find(a => a.label?.trim().toUpperCase() === 'FOTO');
        if (photoAttr) {
          setManualForm(prev => ({
            ...prev,
            customFields: { ...prev.customFields, [photoAttr.label]: 'Foto seleccionada' }
          }));
        }
      }
    }
  };

  // Load designs from Supabase
  useEffect(() => {
    async function loadDesigns() {
      if (!organization) return;
      try {
        const { data, error } = await supabase
          .from('card_designs')
          .select('id, name, description, background, attributes, additional_info, width, height, format, elements, thumbnail')
          .eq('org_id', organization.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error loading designs:', error);
        }
          
        if (!error && data) {
          // Filter out certificates by name (design_type column may not exist yet)
          const cardDesigns = data.filter((d: any) => 
            d.name && !d.name.toLowerCase().includes('certificado')
          );

          const mapped = cardDesigns.map(d => ({
            ...d,
            additionalInfo: d.additional_info || []
          })) as CardDesign[];
          
          setDesigns(mapped);
          if (mapped.length > 0) {
            setSelectedDesign(mapped[0]);
          }
        }
      } catch (e) {
        console.error('Error loading designs', e);
      }
    }
    
    loadDesigns();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization]);

  // Bulk State
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<BulkUploadRow[]>([]);
  const [result, setResult] = useState<BulkUploadResult | null>(null);

  // Auto-fetch beneficiary data when a valid RUT is typed
  useEffect(() => {
    if (!organization || !manualForm.rut) return;
    const cleanRut = String(manualForm.rut).replace(/[^0-9kK]/g, '');
    if (validateRut(cleanRut)) {
      const fetchBeneficiary = async () => {
        try {
          const { data, error } = await supabase
            .from('beneficiaries')
            .select('*')
            .eq('org_id', organization.id)
            .eq('rut', cleanRut)
            .maybeSingle();

          if (data && !error) {
            setManualForm(prev => ({
              ...prev,
              first_name: data.first_name || prev.first_name,
              last_name: data.last_name || prev.last_name,
              full_name: data.full_name || prev.full_name,
              email: data.email || prev.email,
              phone: data.phone || prev.phone,
              comuna: data.comuna || prev.comuna,
              status: data.status || prev.status,
              customFields: { ...prev.customFields, ...(data.custom_fields || {}) }
            }));
            
            // Si el beneficiario tiene una foto guardada y no hemos subido una nueva
            if (data.photo_url && !photoFile) {
              setPhotoPreview(data.photo_url);
              
              setManualForm(prev => {
                const currentFields = { ...prev.customFields };
                const designHasFoto = selectedDesign?.attributes?.some(a => ['FOTO', 'PHOTO'].includes(a.label?.trim().toUpperCase() || ''));
                if (designHasFoto) {
                  const photoKey = selectedDesign!.attributes!.find(a => ['FOTO', 'PHOTO'].includes(a.label?.trim().toUpperCase() || ''))!.label!;
                  currentFields[photoKey] = data.photo_url;
                }
                return { ...prev, customFields: currentFields };
              });
            }
          }
        } catch (err) {
          console.error("Error auto-fetching beneficiary:", err);
        }
      };
      fetchBeneficiary();
    }
  }, [manualForm.rut, organization, supabase, photoFile]);

  // -- Manual Logic --
  const handleManualSubmit = async (e?: React.FormEvent | React.MouseEvent, overrideStatus?: 'draft') => {
    if (e) e.preventDefault();
    if (!organization) return;
    
    setManualLoading(true);
    setManualError('');
    setManualSuccess(false);

    if (!manualForm.email) {
      setManualError('El correo electrónico es obligatorio para emitir la tarjeta.');
      setManualLoading(false);
      return;
    }

    try {
      const cleanRut = String(manualForm.rut).replace(/[^0-9kK]/g, '');
      if (!validateRut(cleanRut)) {
        throw new Error('RUT inválido');
      }

      // Check if exists
      const { data: existing } = await supabase
        .from('beneficiaries')
        .select('id')
        .eq('org_id', organization.id)
        .eq('rut', cleanRut)
        .maybeSingle();

      let beneficiaryId = existing?.id;

      let finalPhotoUrl = null;
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const filePath = `${organization.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, photoFile);
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath);
          
        finalPhotoUrl = publicUrlData.publicUrl;
      }

      if (!beneficiaryId) {
        const { data: ben, error: insertError } = await supabase
          .from('beneficiaries')
          .insert({
            org_id: organization.id,
            first_name: manualForm.first_name,
            last_name: manualForm.last_name,
            full_name: manualForm.full_name,
            rut: cleanRut,
            email: manualForm.email || null,
            phone: manualForm.phone || null,
            comuna: manualForm.comuna || null,
            photo_url: finalPhotoUrl,
            custom_fields: { ...manualForm.customFields },
            status: manualForm.status === 'inactive' ? 'inactive' : 'active'
          })
          .select()
          .single();

        if (insertError) throw insertError;
        beneficiaryId = ben.id;
      } else {
        const { error: updateError } = await supabase
          .from('beneficiaries')
          .update({
            first_name: manualForm.first_name,
            last_name: manualForm.last_name,
            full_name: manualForm.full_name,
            email: manualForm.email || null,
            phone: manualForm.phone || null,
            comuna: manualForm.comuna || null,
            photo_url: finalPhotoUrl || undefined,
            custom_fields: { ...manualForm.customFields },
            status: manualForm.status === 'inactive' ? 'inactive' : 'active'
          })
          .eq('id', beneficiaryId);
          
        if (updateError) throw updateError;
      }

      if (beneficiaryId) {
        const cardNumber = generateCardNumber();
        const qrCode = `${organization.slug}-${beneficiaryId}-${Math.random().toString(36).substring(2, 7)}`;
        const expiresAt = manualForm.expiryDate ? new Date(manualForm.expiryDate).toISOString() : null;

        // Verificar si ya tiene tarjeta
        const { data: existingCard } = await supabase
          .from('digital_cards')
          .select('id')
          .eq('beneficiary_id', beneficiaryId)
          .maybeSingle();

        const cardData = {
          org_id: organization.id,
          card_number: cardNumber,
          qr_code: qrCode,
          status: overrideStatus === 'draft' ? 'draft' : manualForm.status,
          expires_at: expiresAt,
          metadata: {
            design_id: selectedDesign?.id,
            credential_type: manualForm.type,
            language: manualForm.language
          }
        };

        let newCard;
        if (existingCard) {
          // Re-emitir tarjeta (actualizar)
          const { data, error: cardError } = await supabase
            .from('digital_cards')
            .update(cardData)
            .eq('id', existingCard.id)
            .select('id')
            .single();
          if (cardError) throw cardError;
          newCard = data;
        } else {
          // Emitir nueva tarjeta
          const { data, error: cardError } = await supabase
            .from('digital_cards')
            .insert({ ...cardData, beneficiary_id: beneficiaryId })
            .select('id')
            .single();
          if (cardError) throw cardError;
          newCard = data;
        }
        
        // Enviar notificación por email
        if (manualForm.email) {
          try {
            await sendCertificateNotification({
              to: manualForm.email,
              name: manualForm.full_name,
              type: 'TARJETA DIGITAL',
              folio: cardNumber,
              rut: formatRut(cleanRut),
              orgName: organization.name,
              url: `${window.location.origin}/validate/${organization.slug}/${newCard.id}`,
              customFields: manualForm.customFields
            });
          } catch (emailErr) {
            console.error('Error enviando notificación de tarjeta:', emailErr);
          }
        }
        
        setManualSuccess(true);
        setManualForm({ 
          first_name: '',
          last_name: '',
          full_name: '', 
          rut: '', 
          email: '', 
          phone: '',
          comuna: '',
          type: manualForm.type, 
          language: manualForm.language, 
          status: 'active',
          expiryDate: '',
          customFields: {} 
        });
        setPhotoFile(null);
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhotoPreview(null);
      }
    } catch (err) {
      setManualError((err as Error).message);
      setManualLoading(false);
    }
  };

  const getPopulatedDesign = () => {
    if (!selectedDesign || !selectedDesign.elements) return null;
    try {
      const elements = [...selectedDesign.elements];
      
      // Auto-inject QR if it doesn't exist in the design
      const hasQR = elements.some(el => el.type === 'qr');
      if (!hasQR) {
        elements.push({
          id: 'auto-qr',
          type: 'qr',
          x: 82,
          y: 65,
          width: 15,
          height: 15,
          zIndex: 50,
          data: {
            content: 'PREVIEW-QR-STABLE',
            isAttribute: true
          }
        } as any);
      }

      // Use a stable date for preview to avoid hydration mismatch
      const previewDate = '28-04-2024';

      return {
        ...selectedDesign,
        elements: elements.map((el: any) => {
          if (!el.data) return el;
          if (el.type === 'text' && el.data.isAttribute) {
            const attrKey = el.data.attributeKey?.trim();
            if (!attrKey) return el;
            
            const keyUpper = attrKey.toUpperCase();
            let val = el.data.content || '';
            
            // Safe access to custom fields
            const customVal = manualForm.customFields ? manualForm.customFields[attrKey] : undefined;
            
            if (keyUpper === 'NOMBRE RECEPTOR' || keyUpper === 'NOMBRE') val = customVal || manualForm.full_name || val;
            else if (keyUpper === 'NOMBRE INSTITUCIÓN' || keyUpper === 'ORGANIZACION') val = customVal || organization?.name || val;
            else if (keyUpper === 'RUT') val = customVal || formatRut(manualForm.rut) || val;
            else if (keyUpper === 'ID SOCIO') val = customVal || val;
            else if (keyUpper === 'FECHA' || keyUpper === 'FECHA EMISIÓN' || keyUpper === 'VÁLIDA DESDE') val = customVal || manualForm.expiryDate || previewDate;
            else if (keyUpper === 'STATUS SOCIO' || keyUpper === 'ESTADO' || keyUpper === 'STATUS') {
              const defaultStatus = manualForm.status === 'inactive' ? 'Inactivo' : 'Activo';
              val = customVal || defaultStatus;
            }
            else if (keyUpper === 'EMAIL' || keyUpper === 'CORREO') val = customVal || manualForm.email || val;
            else if (keyUpper === 'N° TARJETA' || keyUpper === 'NRO TARJETA' || keyUpper === 'HASH') {
              val = customVal || 'CS-PREVIEW-001';
            }
            else if (keyUpper === 'RUT INSTITUCIÓN' || keyUpper === 'RUT INSTITUCION') val = (organization?.settings as any)?.rut || val;
            else if (keyUpper === 'DIRECCIÓN INSTITUCIÓN' || keyUpper === 'DIRECCION') val = (organization?.settings as any)?.address || val;
            else if (keyUpper === 'COMUNA') val = (organization?.settings as any)?.commune || val;
            else if (keyUpper === 'REGIÓN' || keyUpper === 'REGION') val = (organization?.settings as any)?.region || val;
            else if (keyUpper === 'VILLA' || keyUpper === 'POBLACIÓN') val = (organization?.settings as any)?.villa || val;
            else if (customVal) val = customVal;
            
            return { ...el, data: { ...el.data, content: val } };
          }
          if (el.type === 'image' && el.data.isAttribute) {
            const attrKey = el.data.attributeKey;
            let src = el.data.src;
            if (attrKey === 'Foto' && photoPreview) {
              src = photoPreview;
            } else if ((attrKey === 'Logo' || attrKey?.toUpperCase() === 'LOGO INSTITUCIÓN') && organization?.logo_url) {
              src = organization.logo_url;
            }
            return { ...el, data: { ...el.data, src } };
          }
          if (el.type === 'qr') {
            return { ...el, data: { ...el.data, content: 'STABLE-PREVIEW-QR' } };
          }
          return el;
        }),
      };
    } catch (err) {
      console.error("Error populating design:", err);
      return selectedDesign;
    }
  };

  // Convert Excel serial date numbers to DD-MM-YYYY strings
  const excelSerialToDate = (serial: number): string => {
    const utcDays = Math.floor(serial - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}-${month}-${year}`;
  };

  // Detect and fix Excel serial dates in parsed row data
  const fixExcelDates = (rows: BulkUploadRow[]): BulkUploadRow[] => {
    const DATE_KEYS = ['fecha', 'válida desde', 'valida desde', 'fecha emisión', 'fecha emision', 'date', 'expiry', 'vencimiento'];
    return rows.map(row => {
      const fixed = { ...row };
      for (const [key, val] of Object.entries(fixed)) {
        if (val && DATE_KEYS.includes(key.toLowerCase()) && typeof val === 'number') {
          (fixed as any)[key] = excelSerialToDate(val);
        } else if (val && DATE_KEYS.includes(key.toLowerCase()) && typeof val === 'string' && /^\d{4,5}$/.test(val.trim())) {
          (fixed as any)[key] = excelSerialToDate(Number(val.trim()));
        }
      }
      return fixed;
    });
  };

  // -- Bulk Logic --
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setResult(null);

    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      const Papa = (await import('papaparse')).default;
      Papa.parse<BulkUploadRow>(selected, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setPreview(fixExcelDates(results.data).slice(0, 5));
        },
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const XLSX = await import('xlsx');
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<BulkUploadRow>(firstSheet);
        setPreview(fixExcelDates(jsonData).slice(0, 5));
      };
      reader.readAsArrayBuffer(selected);
    }
  };

  // Convert Google Drive sharing links to direct image URLs
  // Uses thumbnail endpoint which reliably serves images without redirects
  const convertGoogleDriveUrl = (url: string): string => {
    if (!url) return '';
    const trimmed = url.trim();
    // Format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    const fileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (fileMatch) {
      return `https://lh3.googleusercontent.com/d/${fileMatch[1]}=w800`;
    }
    // Format: https://drive.google.com/open?id=FILE_ID
    const openMatch = trimmed.match(/drive\.google\.com\/open\?id=([^&]+)/);
    if (openMatch) {
      return `https://lh3.googleusercontent.com/d/${openMatch[1]}=w800`;
    }
    // Format: https://drive.google.com/uc?export=view&id=FILE_ID (already converted)
    const ucMatch = trimmed.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
    if (ucMatch) {
      return `https://lh3.googleusercontent.com/d/${ucMatch[1]}=w800`;
    }
    // Already a direct link or other URL
    return trimmed;
  };

  const processUpload = async (status: 'active' | 'draft') => {
    if (!file || !organization) return;
    setProcessing(true);
    setResult({ total: 0, success: 0, errors: [] });

    try {

    const ext = file.name.split('.').pop()?.toLowerCase();
    let dataToProcess: BulkUploadRow[] = [];

    if (ext === 'csv') {
      const Papa = (await import('papaparse')).default;
      const text = await file.text();
      const parsed = Papa.parse<BulkUploadRow>(text, { header: true, skipEmptyLines: true });
      dataToProcess = fixExcelDates(parsed.data);
    } else {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      dataToProcess = fixExcelDates(XLSX.utils.sheet_to_json<BulkUploadRow>(firstSheet));
    }

    const currentResult: BulkUploadResult = { total: dataToProcess.length, success: 0, errors: [] };

    for (let i = 0; i < dataToProcess.length; i++) {
      const row = dataToProcess[i];
      const rowNum = i + 2;

      try {
        // Smart mapping for standard fields
        const rowData = row as any;
        const firstName = rowData.first_name || rowData.nombres || rowData.nombre;
        const lastName = rowData.last_name || rowData.apellidos || '';
        const fullName = rowData.full_name || (firstName ? `${firstName} ${lastName}`.trim() : null) || rowData['Nombre Completo'] || rowData['nombre completo'] || rowData['Nombre Receptor'] || rowData.recipient_name;
        const rut = rowData.rut || rowData.documento || rowData.recipient_rut || rowData.RUT;
        const email = rowData.email || rowData.correo || rowData['Email'] || rowData['Correo'];
        const phone = rowData.phone || rowData.telefono || rowData.celular || rowData['Teléfono'] || rowData['Celular'];
        const comuna = rowData.comuna || rowData.city || rowData.ciudad || rowData['Comuna'];
        
        // Normalize phone number to +56 9... format
        let normalizedPhone = phone ? String(phone).trim() : null;
        if (normalizedPhone) {
          const digits = normalizedPhone.replace(/\D/g, '');
          if (digits.length === 9) {
            normalizedPhone = `+56 ${digits}`;
          } else if (digits.length === 11 && digits.startsWith('56')) {
            normalizedPhone = `+${digits.substring(0, 2)} ${digits.substring(2)}`;
          } else if (digits.length === 12 && digits.startsWith('56')) {
            // Already has full code but maybe no spaces
            normalizedPhone = `+${digits.substring(0, 2)} ${digits.substring(2)}`;
          }
        }
        
        // Photo URL: support Google Drive sharing links (case-insensitive column matching)
        const PHOTO_KEYS = ['photo_url', 'foto', 'photo', 'imagen', 'image'];
        let rawPhotoUrl = '';
        for (const [key, val] of Object.entries(rowData)) {
          if (val && PHOTO_KEYS.includes(key.toLowerCase().trim())) {
            rawPhotoUrl = String(val);
            break;
          }
        }
        const photoUrlToSave = rawPhotoUrl ? convertGoogleDriveUrl(rawPhotoUrl) : null;
        
        // Collect custom fields from extra columns
        const STANDARD_KEYS = ['first_name', 'last_name', 'full_name', 'nombre', 'nombres', 'apellidos', 'rut', 'documento', 'email', 'correo', 'phone', 'telefono', 'celular', 'comuna', 'photo_url', 'foto', 'photo', 'imagen', 'image'];
        const customFieldsToSave: Record<string, string> = {};
        for (const [key, val] of Object.entries(rowData)) {
          if (val && !STANDARD_KEYS.includes(key.toLowerCase())) {
            customFieldsToSave[key] = String(val);
          }
        }

        const cleanRut = String(rut || '').replace(/[^0-9kK]/g, '');
        
        if (!fullName || !cleanRut) {
          currentResult.errors.push({ row: rowNum, field: 'general', message: 'Nombre y RUT requeridos' });
          continue;
        }

        if (!validateRut(cleanRut)) {
          currentResult.errors.push({ row: rowNum, field: 'rut', message: `RUT inválido: ${rut}` });
          continue;
        }

        const { data: existing } = await supabase
          .from('beneficiaries')
          .select('id')
          .eq('org_id', organization.id)
          .eq('rut', cleanRut)
          .maybeSingle();

        let beneficiaryId = existing?.id;

        if (!beneficiaryId) {
          const { data: ben, error: insertError } = await supabase
            .from('beneficiaries')
            .insert({
              org_id: organization.id,
              first_name: firstName || null,
              last_name: lastName || null,
              full_name: fullName || 'Sin Nombre',
              rut: cleanRut,
              email: email || null,
              phone: normalizedPhone || null,
              comuna: comuna || null,
              photo_url: photoUrlToSave,
              custom_fields: customFieldsToSave
            })
            .select()
            .single();

          if (insertError) throw insertError;
          beneficiaryId = ben.id;
        } else {
          // Update existing beneficiary with latest data
          await supabase
            .from('beneficiaries')
            .update({
              first_name: firstName || undefined,
              last_name: lastName || undefined,
              full_name: fullName || 'Sin Nombre',
              email: email || null,
              phone: normalizedPhone || null,
              comuna: comuna || null,
              photo_url: photoUrlToSave || undefined,
              custom_fields: customFieldsToSave,
              status: 'active'
            })
            .eq('id', beneficiaryId);
        }

        if (beneficiaryId) {
          const cardNumber = generateCardNumber();
          const qrCode = `${organization.slug}-${beneficiaryId}-${Math.random().toString(36).substring(2, 7)}`;
          const expiresAt = null; 

          const { data: newCard, error: cardError } = await supabase.from('digital_cards').insert({
            beneficiary_id: beneficiaryId,
            org_id: organization.id,
            card_number: cardNumber,
            qr_code: qrCode,
            status: status,
            expires_at: expiresAt,
            metadata: {
              design_id: selectedDesign?.id || null,
            }
          }).select('id').single();

          if (cardError) {
            currentResult.errors.push({ row: rowNum, field: 'card', message: `Error emitiendo tarjeta: ${cardError.message}` });
          } else {
            currentResult.success++;
            
            // Enviar notificación por email si existe
            if (email && newCard) {
              try {
                await sendCertificateNotification({
                  to: email,
                  name: fullName,
                  type: 'TARJETA DIGITAL',
                  folio: cardNumber,
                  rut: formatRut(cleanRut),
                  orgName: organization.name,
                  url: `${window.location.origin}/validate/${organization.slug}/${newCard.id}`
                });
              } catch (emailErr) {
                console.error(`Error enviando email a ${email}:`, emailErr);
              }
            }
          }
        }
      } catch (err) {
        const error = err as Error;
        currentResult.errors.push({ row: rowNum, field: 'system', message: error.message || 'Error' });
      }
    }

    setResult(currentResult);
    setProcessing(false);
    setFile(null);
    setPreview([]);
    } catch (globalErr) {
      console.error('Error fatal en carga masiva:', globalErr);
      setResult({ total: 0, success: 0, errors: [{ row: 0, field: 'system', message: (globalErr as Error).message || 'Error inesperado' }] });
      setProcessing(false);
      setFile(null);
      setPreview([]);
    }
  };

  // Build template headers from selected design's ACTIVE attributes only
  const getTemplateColumns = (): { headers: string[]; examples: string[] } => {
    // Always include base required fields
    const headers = ['first_name', 'last_name', 'rut', 'email', 'phone', 'comuna'];
    const examples = ['Juan Andrés', 'Pérez González', '12.345.678-9', 'juan@ejemplo.com', '+56912345678', 'Puente Alto'];

    if (selectedDesign && selectedDesign.attributes) {
      const SKIP_KEYS = ['NOMBRE', 'NOMBRE RECEPTOR', 'FULL_NAME', 'RUT', 'EMAIL', 'CORREO'];
      selectedDesign.attributes
        .filter(attr => attr.active)
        .forEach(attr => {
          const label = attr.label?.trim();
          const labelUpper = label?.toUpperCase();
          if (label && !SKIP_KEYS.includes(labelUpper || '')) {
            headers.push(label);
            // Generate contextual examples
            if (labelUpper === 'FOTO' || labelUpper === 'PHOTO') {
              examples.push('https://drive.google.com/file/d/ABC123/view?usp=sharing');
            } else if (labelUpper === 'FECHA' || labelUpper === 'FECHA EMISIÓN') {
              examples.push('01-01-2025');
            } else if (labelUpper === 'STATUS SOCIO' || labelUpper === 'ESTADO') {
              examples.push('Activo');
            } else if (labelUpper === 'ID SOCIO') {
              examples.push('001');
            } else if (labelUpper === 'NOMBRE INSTITUCIÓN' || labelUpper === 'ORGANIZACION') {
              examples.push(organization?.name || 'Mi Organización');
            } else if (labelUpper === 'DIRECCIÓN' || labelUpper === 'DIRECCION') {
              examples.push('Av. Principal 123, Santiago');
            } else if (labelUpper === 'PHONE' || labelUpper === 'CELULAR' || labelUpper === 'TELÉFONO') {
              examples.push('+56912345678');
            } else {
              examples.push(attr.placeholder || 'Valor...');
            }
          }
        });
    }

    // Always add photo_url column if no Foto attribute exists in design
    const hasPhotoAttr = headers.some(h => h.toUpperCase() === 'FOTO' || h.toUpperCase() === 'PHOTO');
    if (!hasPhotoAttr) {
      headers.push('photo_url');
      examples.push('https://drive.google.com/file/d/ABC123/view?usp=sharing');
    }

    return { headers, examples };
  };

  const downloadTemplate = async (format: 'csv' | 'xlsx') => {
    if (!organization) return;
    const { headers, examples } = getTemplateColumns();
    const data = [headers, examples];

    if (format === 'csv') {
      const csv = data.map(row => row.map(cell => 
        cell.includes(',') ? `"${cell}"` : cell
      ).join(',')).join('\n');
      const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
      const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plantilla_skardkey_${selectedDesign?.name.replace(/\s+/g, '_').toLowerCase() || 'general'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.aoa_to_sheet(data);
      // Set column widths for readability
      ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 5, 20) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
      XLSX.writeFile(wb, `plantilla_skardkey_${selectedDesign?.name.replace(/\s+/g, '_').toLowerCase() || 'general'}.xlsx`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase">Emitir Credenciales</h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            Crea y emite nuevas tarjetas para tus beneficiarios
          </p>
        </div>

      {/* Step 1: Seleccionar Diseño (Shared for both tabs) */}
      <div className="glass-card p-6 md:p-8 mb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-brand-500/10">
            <Palette className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-medium text-white">1. Seleccionar Diseño</h2>
          </div>
          
          {designs.length === 0 ? (
            <div className="p-4 bg-surface-900 border border-brand-500/10 rounded-xl text-center text-slate-400 text-sm">
              No hay diseños disponibles. Ve a la sección de Diseños para crear uno.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {designs.map(design => (
                <button
                  key={design.id}
                  type="button"
                  onClick={() => setSelectedDesign(design)}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                    selectedDesign?.id === design.id 
                      ? 'bg-brand-500/10 border-brand-500' 
                      : 'bg-surface-900 border-surface-700 hover:border-brand-500/50'
                  }`}
                >
                  {selectedDesign?.id === design.id && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="w-full aspect-[4/3] bg-surface-800 rounded-lg overflow-hidden border border-surface-700">
                    {design.thumbnail ? (
                      <img src={design.thumbnail} alt={design.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <LayoutTemplate className="w-8 h-8 text-surface-600" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-300 truncate w-full text-center">{design.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-surface-900/50 rounded-xl border border-brand-500/10 w-fit">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'manual'
              ? 'bg-brand-500/20 text-brand-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Envío Manual
        </button>
        <button
          onClick={() => setActiveTab('masivo')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'masivo'
              ? 'bg-brand-500/20 text-brand-300'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Envío Masivo
        </button>
      </div>

      <div className="glass-card p-6 md:p-8">
        {/* --- MANUAL TAB --- */}
        {activeTab === 'manual' && (
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            


            {/* Step 4 & 5: Datos del Receptor y Atributos Personalizados */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-brand-500/10">
                <Users className="w-5 h-5 text-brand-400" />
                <h2 className="text-lg font-medium text-white">2. Datos del Receptor</h2>
              </div>
              
              <div className="space-y-10 animate-fade-in-up">
              {/* Identity & Core Info */}
              <div className="glass-card-solid p-6 md:p-8 border-brand-500/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-brand-500/20 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-brand-500/20 pointer-events-none" />
                
                <div className="flex items-center gap-3 mb-6">
                  <Fingerprint className="w-5 h-5 text-brand-400" />
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] font-mono">Identidad del Receptor</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">Nombres *</label>
                    <input
                      type="text"
                      required
                      value={manualForm.first_name || ''}
                      onChange={e => {
                        const newFirst = e.target.value;
                        setManualForm({...manualForm, first_name: newFirst, full_name: `${newFirst} ${manualForm.last_name}`.trim()});
                      }}
                      className="glass-input w-full px-4 py-3 text-sm font-medium"
                      placeholder="Juan Andrés"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Apellidos *</label>
                    <input
                      type="text"
                      required
                      value={manualForm.last_name || ''}
                      onChange={e => {
                        const newLast = e.target.value;
                        setManualForm({...manualForm, last_name: newLast, full_name: `${manualForm.first_name} ${newLast}`.trim()});
                      }}
                      className="glass-input w-full px-4 py-3 text-sm font-medium"
                      placeholder="Pérez González"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
                      <ShieldAlert className="w-3 h-3" /> RUT *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualForm.rut || ''}
                      onChange={e => setManualForm({...manualForm, rut: formatRut(e.target.value)})}
                      className="glass-input w-full px-4 py-3 text-sm font-mono font-bold text-brand-400 tracking-wider"
                      placeholder="12.345.678-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
                      <Mail className="w-3 h-3" /> Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={manualForm.email || ''}
                      onChange={e => setManualForm({...manualForm, email: e.target.value})}
                      className="glass-input w-full px-4 py-3 text-sm"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>
              </div>

              {/* Secondary Info & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card-solid p-6 border-white/5 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest font-mono">Comunicación</h3>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Celular</label>
                    <div className="flex gap-2">
                      <div className="w-20 shrink-0 relative group">
                        <label className="absolute -top-1.5 left-2 px-1 bg-surface-950 text-[8px] font-bold text-slate-500 uppercase tracking-tighter z-10">País</label>
                        <div className="glass-input px-2 py-2 text-xs font-mono flex items-center justify-between cursor-default bg-brand-500/5">
                          <span className="text-white">CL +56</span>
                          <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
                        </div>
                      </div>
                      <div className="flex-1 relative group">
                        <label className="absolute -top-1.5 left-2 px-1 bg-surface-950 text-[8px] font-bold text-slate-500 uppercase tracking-tighter z-10">Teléfono</label>
                        <input
                          type="tel"
                          value={(manualForm.phone || '').replace('+56', '').trim()}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            setManualForm({...manualForm, phone: `+56 ${val}`});
                          }}
                          className="glass-input w-full px-3 py-2 text-xs font-mono text-brand-400"
                          placeholder="9 6236 9084"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card-solid p-6 border-white/5 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest font-mono">Ubicación</h3>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Comuna</label>
                    <input
                      type="text"
                      value={manualForm.comuna || ''}
                      onChange={e => setManualForm({...manualForm, comuna: e.target.value})}
                      className="glass-input w-full px-4 py-2.5 text-xs"
                      placeholder="Ej. Puente Alto"
                    />
                  </div>
                </div>
              </div>

              {/* Photos & Expiry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card-solid p-6 border-white/5 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Camera className="w-4 h-4 text-slate-500" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest font-mono">Fotografía</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="glass-input w-full px-4 py-2 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-brand-500/10 file:text-brand-400 hover:file:bg-brand-500/20 transition-all font-mono"
                    />
                    {photoPreview && (
                      <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden border-2 border-brand-500/20 shadow-lg">
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass-card-solid p-6 border-white/5 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <h3 className="text-[10px] font-black text-white uppercase tracking-widest font-mono">Vigencia</h3>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Fecha Expiración</label>
                    <input
                      type="date"
                      value={manualForm.expiryDate || ''}
                      onChange={e => setManualForm({...manualForm, expiryDate: e.target.value})}
                      className="glass-input w-full px-4 py-2.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Atributos dinámicos del diseño seleccionado */}
              {selectedDesign && (selectedDesign.attributes || []).filter(a => a.active).length > 0 && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-4 h-4 text-brand-400" />
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] font-mono">Atributos del Diseño</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 rounded-3xl border border-brand-500/10 bg-brand-500/[0.02] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 blur-3xl pointer-events-none" />
                    {selectedDesign.attributes
                      .filter(attr => attr.active)
                      .map(attr => {
                        const keyUpper = attr.label?.trim().toUpperCase();
                        let placeholder = attr.placeholder || 'Valor...';
                        let hint = '';

                        if (keyUpper === 'NOMBRE RECEPTOR' || keyUpper === 'NOMBRE') {
                          placeholder = manualForm.full_name || 'Autocompletado...';
                          hint = 'Auto-sync con Identidad';
                        } else if (keyUpper === 'RUT') {
                          placeholder = formatRut(manualForm.rut) || 'Autocompletado...';
                          hint = 'Auto-sync con RUT';
                        } else if (keyUpper === 'ID SOCIO') {
                          placeholder = 'Ej. 1234';
                          hint = 'Nº correlativo único';
                        } else if (keyUpper === 'FECHA') {
                          placeholder = 'DD-MM-AAAA';
                          hint = 'Fecha de emisión';
                        } else if (keyUpper === 'STATUS SOCIO' || keyUpper === 'ESTADO') {
                          const defaultStatus = manualForm.status === 'inactive' ? 'Inactivo' : 'Activo';
                          placeholder = defaultStatus;
                          hint = `Estado: ${defaultStatus}`;
                        } else if (keyUpper === 'EMAIL' || keyUpper === 'CORREO') {
                          placeholder = manualForm.email || 'Autocompletado...';
                          hint = 'Auto-sync con Email';
                        } else if (keyUpper === 'FOTO') {
                          placeholder = photoFile ? 'Foto cargada' : 'URL o Foto arriba';
                          hint = 'Usa el selector superior';
                        }

                        return (
                          <div key={attr.id} className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                              {attr.label}
                            </label>
                            <input
                              type="text"
                              value={manualForm.customFields[attr.label] || ''}
                              onChange={e => setManualForm({
                                ...manualForm, 
                                customFields: { ...manualForm.customFields, [attr.label]: e.target.value }
                              })}
                              className="glass-input w-full px-4 py-2.5 text-xs focus:ring-1 focus:ring-brand-500/30 transition-all font-medium"
                              placeholder={placeholder}
                              autoComplete="off"
                            />
                            {hint && <p className="text-[9px] font-bold text-brand-500/50 uppercase tracking-tighter font-mono">{hint}</p>}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* Step 6, 7 & 8: Opciones Adicionales */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-brand-500/10">
                <Shield className="w-5 h-5 text-brand-400" />
                <h2 className="text-lg font-medium text-white">3. Opciones de Emisión</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Credencial</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="credType" 
                        value="basic"
                        checked={manualForm.type === 'basic'}
                        onChange={(e) => setManualForm({...manualForm, type: e.target.value})}
                        className="text-brand-500 bg-surface-900 border-surface-700" 
                      />
                      <span className="text-sm text-slate-300">Básica</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="credType" 
                        value="blockchain"
                        checked={manualForm.type === 'blockchain'}
                        onChange={(e) => setManualForm({...manualForm, type: e.target.value})}
                        className="text-brand-500 bg-surface-900 border-surface-700" 
                      />
                      <span className="text-sm text-slate-300">Blockchain</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Idioma de Emails</label>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <select 
                      value={manualForm.language}
                      onChange={(e) => setManualForm({...manualForm, language: e.target.value})}
                      className="glass-input px-3 py-1.5 text-sm"
                    >
                      <option value="es">Español</option>
                      <option value="en">Inglés</option>
                      <option value="pt">Portugués</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Estado Inicial</label>
                  <div className="flex items-center gap-2">
                    <select 
                      value={manualForm.status}
                      onChange={(e) => setManualForm({...manualForm, status: e.target.value})}
                      className="glass-input px-3 py-1.5 text-sm w-full"
                    >
                      <option value="active">Activa (Por defecto)</option>
                      <option value="inactive">Inactiva</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Mensajes y Acciones */}
            {manualError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>{manualError}</p>
              </div>
            )}

            {manualSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                Credencial procesada exitosamente.
              </div>
            )}

            <div className="flex justify-end pt-6 border-t border-brand-500/10 mt-6">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(true)}
                disabled={manualLoading || !manualForm.full_name || !manualForm.rut || !manualForm.email || !selectedDesign}
                className="btn-primary px-8 py-2.5 font-medium"
              >
                Siguiente
              </button>
            </div>
          </form>
        )}

        {/* --- MASIVO TAB --- */}
        {activeTab === 'masivo' && (
          <div className="space-y-8">
            {/* Guía de Carga */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6 rounded-2xl bg-surface-900/50 border border-brand-500/10">
              {/* Left: Field Guide */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
                    <FileText className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Campos de la Plantilla</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                      {selectedDesign ? `Diseño: ${selectedDesign.name}` : 'Selecciona un diseño arriba'}
                    </p>
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {/* Base required fields */}
                  <li className="flex items-start gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-300">full_name <span className="text-red-400 text-[10px] ml-1">(REQUERIDO)</span></p>
                      <p className="text-[10px] text-slate-500">Nombre completo del socio.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-300">rut <span className="text-red-400 text-[10px] ml-1">(REQUERIDO)</span></p>
                      <p className="text-[10px] text-slate-500">Formato: 12.345.678-9 o 123456789</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-400">email <span className="text-slate-600 text-[10px] ml-1">(Opcional)</span></p>
                      <p className="text-[10px] text-slate-600">Correo electrónico del socio.</p>
                    </div>
                  </li>

                  {/* Dynamic fields from design */}
                  {selectedDesign && selectedDesign.attributes
                    .filter(attr => attr.active)
                    .filter(attr => !['NOMBRE', 'NOMBRE RECEPTOR', 'FULL_NAME', 'RUT', 'EMAIL', 'CORREO'].includes(attr.label?.trim().toUpperCase() || ''))
                    .map(attr => (
                      <li key={attr.id} className="flex items-start gap-3">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-brand-300">{attr.label} <span className="text-brand-500/50 text-[10px] ml-1">(Del diseño)</span></p>
                          <p className="text-[10px] text-slate-500">{attr.placeholder || 'Campo personalizado de la tarjeta.'}</p>
                        </div>
                      </li>
                    ))
                  }

                  {/* Photo URL */}
                  <li className="flex items-start gap-3 pt-2 mt-2 border-t border-white/5">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-300">photo_url / Foto <span className="text-emerald-500/50 text-[10px] ml-1">(Opcional)</span></p>
                      <p className="text-[10px] text-slate-500">URL de la foto. Soporta links de <span className="text-emerald-400 font-semibold">Google Drive</span> compartidos.</p>
                      <p className="text-[10px] text-slate-600 mt-1 font-mono bg-surface-950/80 px-2 py-1 rounded border border-white/5 break-all">https://drive.google.com/file/d/TU_ID/view?usp=sharing</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Right: Download */}
              <div className="lg:col-span-2 flex flex-col justify-center gap-4 bg-surface-950/50 p-6 rounded-xl border border-white/5 shadow-inner">
                <p className="text-xs text-slate-400 text-center mb-2">Descarga la plantilla con los campos exactos de tu diseño:</p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => downloadTemplate('xlsx')} 
                    disabled={!selectedDesign}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Excel (.xlsx)</span>
                  </button>
                  <button 
                    onClick={() => downloadTemplate('csv')} 
                    disabled={!selectedDesign}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-brand-500/5 border border-brand-500/20 hover:bg-brand-500/10 transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download className="w-5 h-5 text-brand-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest">CSV (.csv)</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 text-center mt-2">La carpeta de Google Drive debe estar compartida como &quot;Cualquiera con el enlace puede ver&quot;</p>
              </div>
            </div>

            <div>
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
                    <input type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileChange} />
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
                        <div className="overflow-x-auto rounded-xl border border-brand-500/10 max-h-96 overflow-y-auto">
                          <table className="data-table">
                            <thead className="sticky top-0 bg-surface-900 z-10">
                              <tr>
                                {preview.length > 0 && Object.keys(preview[0]).map(key => (
                                  <th key={key} className="whitespace-nowrap">{key}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {preview.map((row, i) => (
                                <tr key={i}>
                                  {Object.values(row).map((val, j) => (
                                    <td key={j} className="whitespace-nowrap max-w-[200px] truncate">
                                      {String(val || '')}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-4 pt-6 border-t border-brand-500/10 mt-6">
                      <button onClick={() => processUpload('draft')} className="btn-secondary px-6 py-2.5 text-sm">
                        Cargar para más tarde
                      </button>
                      <button onClick={() => processUpload('active')} className="btn-primary px-6 py-2.5 text-sm">
                        Emitir Todos
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : processing ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                 <div className="w-16 h-16 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin mb-6" />
                 <h3 className="text-xl font-medium text-white mb-2">Procesando archivo...</h3>
                 <p className="text-slate-400">Esto puede tomar unos minutos...</p>
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
      )}
    </div>

      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title="Verificación de Credencial"
        size="xl"
      >
        <div className="flex flex-col xl:flex-row gap-10 items-start">
          {/* Left Side: The Card Preview */}
          <div className="flex-1 w-full space-y-4">
            <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wider">Diseño Final</h3>
            <div className="p-4 bg-surface-950/60 rounded-3xl border border-white/5 shadow-inner">
              <div className="relative overflow-auto flex justify-center bg-[#050810] rounded-2xl shadow-2xl border border-brand-500/30 p-8 min-h-[350px]">
                {selectedDesign && (
                  <CanvasPreview
                    design={getPopulatedDesign()!}
                    selectedElementId={null}
                    scale={1.0}
                    readOnly={true}
                    organization={organization}
                  />
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center italic">
              Esta es una representación exacta de la credencial que se enviará.
            </p>
          </div>

          {/* Right Side: Data Summary */}
          <div className="w-full xl:w-80 space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wider">Datos del Socio</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase">Nombre Completo</label>
                <p className="text-white font-medium">{manualForm.full_name || 'No especificado'}</p>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase">RUT</label>
                <p className="text-white font-medium">{formatRut(manualForm.rut) || 'No especificado'}</p>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase">Email</label>
                <p className="text-white font-medium">{manualForm.email || 'Sin correo'}</p>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <label className="block text-[10px] text-slate-500 uppercase mb-2">Atributos Adicionales</label>
                <div className="space-y-2">
                  {Object.entries(manualForm.customFields).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-slate-400">{key}:</span>
                      <span className="text-white truncate max-w-[150px]">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-3">
              <button
                onClick={(e) => {
                  setPreviewModalOpen(false);
                  handleManualSubmit(e);
                }}
                className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
              >
                <Check className="w-5 h-5" />
                Confirmar y Emitir
              </button>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="w-full py-2 text-sm text-slate-500 hover:text-white transition-colors"
              >
                Corregir Datos
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function IssuePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm">Cargando módulo de emisión...</p>
      </div>
    }>
      <IssuePageContent />
    </Suspense>
  );
}
