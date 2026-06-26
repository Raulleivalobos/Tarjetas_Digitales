'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { validateRut, formatRut, generateCardNumber, generateQRData } from '@/lib/utils';
import {
  ArrowLeft,
  Save,
  User,
  Upload,
  Camera,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function NewBeneficiaryPage() {
  const { organization } = useAuth();
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    full_name: '',
    rut: '',
    email: '',
    phone: '',
    address: '',
    comuna: '',
    date_of_birth: '',
    status: 'active' as 'active' | 'inactive' | 'blocked',
    notes: '',
    custom_field_1_name: '',
    custom_field_1_value: '',
    custom_field_2_name: '',
    custom_field_2_value: '',
  });

  const [rutError, setRutError] = useState('');

  const handleRutChange = (value: string) => {
    const formatted = formatRut(value);
    setForm((prev) => ({ ...prev, rut: formatted }));

    if (value.replace(/[^0-9kK]/g, '').length >= 8) {
      if (!validateRut(value)) {
        setRutError('RUT inválido');
      } else {
        setRutError('');
      }
    } else {
      setRutError('');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    if ((!form.first_name.trim() && !form.last_name.trim() && !form.full_name.trim()) || !form.rut.trim()) {
      setError('Nombre y RUT son requeridos');
      return;
    }

    const cleanRut = form.rut.replace(/[^0-9kK]/g, '');
    if (!validateRut(cleanRut)) {
      setError('El RUT ingresado no es válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let photoUrl = null;

      // Upload photo if exists
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${organization.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, photoFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName);
          photoUrl = urlData.publicUrl;
        }
      }

      // Build custom fields
      const customFields: Record<string, string> = {};
      if (form.custom_field_1_name && form.custom_field_1_value) {
        customFields[form.custom_field_1_name] = form.custom_field_1_value;
      }
      if (form.custom_field_2_name && form.custom_field_2_value) {
        customFields[form.custom_field_2_name] = form.custom_field_2_value;
      }

      // Create beneficiary
      const { data: beneficiary, error: createError } = await supabase
        .from('beneficiaries')
        .insert({
          org_id: organization.id,
          first_name: form.first_name || null,
          last_name: form.last_name || null,
          full_name: form.full_name || `${form.first_name} ${form.last_name}`.trim(),
          rut: cleanRut,
          email: form.email || null,
          phone: form.phone || null,
          address: form.address || null,
          comuna: form.comuna || null,
          date_of_birth: form.date_of_birth || null,
          photo_url: photoUrl,
          custom_fields: customFields,
          status: form.status,
          notes: form.notes || null,
        })
        .select()
        .single();

      if (createError) {
        if (createError.code === '23505') {
          setError('Ya existe un socio con este RUT en tu organización');
        } else {
          setError(createError.message);
        }
        setLoading(false);
        return;
      }

      // Auto-create digital card
      if (beneficiary) {
        const cardNumber = generateCardNumber();
        const qrCode = `${organization.slug}-${beneficiary.id}`;
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        await supabase.from('digital_cards').insert({
          beneficiary_id: beneficiary.id,
          org_id: organization.id,
          card_number: cardNumber,
          qr_code: qrCode,
          status: 'active',
          expires_at: expiresAt.toISOString(),
        });
      }

      router.push('/dashboard/beneficiaries');
    } catch {
      setError('Ha ocurrido un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/beneficiaries"
          className="p-2 rounded-xl btn-ghost"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Nuevo Socio</h1>
          <p className="text-slate-400 text-sm mt-1">
            Completa la información del nuevo miembro
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Section */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Foto</h2>
          <div className="flex items-center gap-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-2xl bg-surface-900 border-2 border-dashed border-brand-500/20 flex items-center justify-center cursor-pointer hover:border-brand-500/40 transition-colors overflow-hidden"
            >
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Preview"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <Camera className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-[10px] text-slate-600 mt-1">Foto</p>
                </div>
              )}
            </div>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Subir foto
              </button>
              <p className="text-xs text-slate-500 mt-2">
                JPG, PNG o WebP. Max 5MB.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Información Personal
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombres *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => {
                      const newFirst = e.target.value;
                      setForm((prev) => ({ ...prev, first_name: newFirst, full_name: `${newFirst} ${prev.last_name}`.trim() }));
                    }}
                    placeholder="Juan Andrés"
                    className="glass-input w-full pl-11 pr-4 py-3 text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Apellidos *
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => {
                      const newLast = e.target.value;
                      setForm((prev) => ({ ...prev, last_name: newLast, full_name: `${prev.first_name} ${newLast}`.trim() }));
                  }}
                  placeholder="Pérez González"
                  className="glass-input w-full px-4 py-3 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                RUT *
              </label>
              <input
                type="text"
                value={form.rut}
                onChange={(e) => handleRutChange(e.target.value)}
                placeholder="12.345.678-9"
                className={`glass-input w-full px-4 py-3 text-sm ${
                  rutError ? '!border-red-500/50' : ''
                }`}
                required
              />
              {rutError && (
                <p className="text-red-400 text-xs mt-1">{rutError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                className="glass-input w-full px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="juan@email.com"
                className="glass-input w-full px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+56 9 1234 5678"
                className="glass-input w-full px-4 py-3 text-sm"
              />
            </div>

            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Av. Principal 123"
                  className="glass-input w-full px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Comuna
                </label>
                <input
                  type="text"
                  value={form.comuna || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, comuna: e.target.value }))}
                  placeholder="Providencia"
                  className="glass-input w-full px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Estado
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as 'active' | 'inactive' | 'blocked' }))}
                className="glass-input w-full px-4 py-3 text-sm"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="blocked">Bloqueado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Custom Fields */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-2">
            Campos Personalizados
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Agrega campos adicionales específicos de tu organización
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={form.custom_field_1_name}
                onChange={(e) => setForm((prev) => ({ ...prev, custom_field_1_name: e.target.value }))}
                placeholder="Nombre del campo"
                className="glass-input px-4 py-3 text-sm"
              />
              <input
                type="text"
                value={form.custom_field_1_value}
                onChange={(e) => setForm((prev) => ({ ...prev, custom_field_1_value: e.target.value }))}
                placeholder="Valor"
                className="glass-input px-4 py-3 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={form.custom_field_2_name}
                onChange={(e) => setForm((prev) => ({ ...prev, custom_field_2_name: e.target.value }))}
                placeholder="Nombre del campo"
                className="glass-input px-4 py-3 text-sm"
              />
              <input
                type="text"
                value={form.custom_field_2_value}
                onChange={(e) => setForm((prev) => ({ ...prev, custom_field_2_value: e.target.value }))}
                placeholder="Valor"
                className="glass-input px-4 py-3 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Notas</h2>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Observaciones adicionales..."
            rows={3}
            className="glass-input w-full px-4 py-3 text-sm resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/dashboard/beneficiaries"
            className="btn-secondary px-6 py-3 text-sm"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading || !!rutError}
            className="btn-primary px-8 py-3 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Beneficiario</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
