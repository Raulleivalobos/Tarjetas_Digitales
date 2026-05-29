'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { 
  Wallet, Coins, Plus, Calendar, ArrowUpRight, ArrowDownRight, 
  Settings, FileText, Download, Edit2, Trash2, TrendingUp, 
  DollarSign, Filter, Image as ImageIcon, Upload, Key, X, 
  Check, Landmark, AlertTriangle, Eye, ChevronLeft, ChevronRight, 
  Activity, PlusCircle, PenTool, Home, Megaphone, Gift, Utensils,
  Truck, Trash2 as TrashIcon, Trophy, Settings as SettingsIcon,
  Cpu, Wrench, Coffee, Heart, Award, FileSpreadsheet, Users
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { compressImage, exportFinanceReportToPDF, FinanceReportData } from '@/lib/financeUtils';

// Helper component to render Lucide Icons dynamically based on string name
const CategoryIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (Icons as any)[name] || Icons.Tag;
  return <IconComponent className={className} />;
};

const formatCLP = (val: number) => `$${Math.round(val).toLocaleString('es-CL')}`;

type Tab = 'dashboard' | 'accounts' | 'transactions' | 'reports' | 'settings';

interface FinanceSettings {
  id: string;
  org_id: string;
  period_year: number;
  initial_bank_balance: number;
  initial_cash_balance: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  org_id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  is_default: boolean;
}

interface Transaction {
  id: string;
  org_id: string;
  category_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  payment_method: 'bank' | 'cash';
  transaction_date: string;
  photo_url: string | null;
  created_at: string;
  created_by: string;
  category?: {
    name: string;
    icon: string;
  };
}

export default function FinancePage() {
  const { organization, membership, user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Database States
  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Filter & UI States
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [activeAccount, setActiveAccount] = useState<'bank' | 'cash'>('bank');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<'all' | 'bank' | 'cash'>('all');
  const [filterDateStart, setFilterDateStart] = useState<string>('');
  const [filterDateEnd, setFilterDateEnd] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Setup / Carga Inicial Modal
  const [initialBankInput, setInitialBankInput] = useState('0');
  const [initialCashInput, setInitialCashInput] = useState('0');

  // Form State for new Transaction
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategoryId, setTxCategoryId] = useState('');
  const [txMethod, setTxMethod] = useState<'bank' | 'cash'>('bank');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txDescription, setTxDescription] = useState('');
  const [txFile, setTxFile] = useState<File | null>(null);
  const [txFilePreview, setTxFilePreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  // Custom Category creation
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatIcon, setNewCatIcon] = useState('Tag');

  // Supabase Client Reference
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const role = membership?.role || '';
  const isReadOnly = !['owner', 'admin'].includes(role);

  // Pre-loaded List of Lucide Icons for selection
  const iconOptions = [
    { id: 'Tag', label: 'Etiqueta / General' },
    { id: 'Utensils', label: 'Alimentación / Comidas' },
    { id: 'Truck', label: 'Transporte / Flete' },
    { id: 'Megaphone', label: 'Marketing / Publicidad' },
    { id: 'Gift', label: 'Donaciones / Regalos' },
    { id: 'Home', label: 'Infraestructura / Arriendo' },
    { id: 'PenTool', label: 'Diseño / Creatividad' },
    { id: 'Landmark', label: 'Trámites Legales / Impuestos' },
    { id: 'Trash2', label: 'Desechos / Aseo' },
    { id: 'Trophy', label: 'Premios / Reconocimientos' },
    { id: 'Settings', label: 'Herramientas / Mantenimiento' },
    { id: 'Cpu', label: 'Tecnología / Equipamiento' },
    { id: 'Wrench', label: 'Reparaciones' },
    { id: 'Coffee', label: 'Insumos de Oficina' },
    { id: 'TrendingUp', label: 'Inversión / Rentabilidad' },
    { id: 'Users', label: 'Personal / Honorarios' },
    { id: 'Key', label: 'Seguros / Claves' },
    { id: 'Award', label: 'Certificaciones' },
    { id: 'Heart', label: 'Salud / Beneficios Médicos' },
    { id: 'FileText', label: 'Documentos / Papelería' },
    { id: 'Activity', label: 'Eventos / Actividades' },
    { id: 'Shield', label: 'Seguridad' },
    { id: 'AlertTriangle', label: 'Imprevistos / Emergencias' }
  ];

  // Fetch initial ledger data
  useEffect(() => {
    if (organization?.id) {
      fetchFinanceData();
    }
  }, [organization?.id, periodYear]);

  const fetchFinanceData = async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      // 1. Fetch settings for current year
      const { data: settingsData, error: settingsError } = await supabase
        .from('finance_settings')
        .select('*')
        .eq('org_id', organization.id)
        .eq('period_year', periodYear)
        .maybeSingle();

      if (settingsError) throw settingsError;
      setSettings(settingsData);
      
      if (settingsData) {
        setInitialBankInput(settingsData.initial_bank_balance.toString());
        setInitialCashInput(settingsData.initial_cash_balance.toString());
      } else {
        setInitialBankInput('0');
        setInitialCashInput('0');
      }

      // 2. Fetch categories
      const { data: catData, error: catError } = await supabase
        .from('finance_categories')
        .select('*')
        .eq('org_id', organization.id)
        .order('name');

      if (catError) throw catError;
      setCategories(catData || []);

      // 3. Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from('finance_transactions')
        .select(`
          *,
          category:finance_categories(name, icon)
        `)
        .eq('org_id', organization.id)
        .order('transaction_date', { ascending: false });

      if (txError) throw txError;
      
      const enrichedTx = (txData || []).map((t: any) => ({
        ...t,
        category: t.category ? {
          name: t.category.name,
          icon: t.category.icon
        } : { name: 'Sin Categoría', icon: 'Tag' }
      }));

      setTransactions(enrichedTx);
    } catch (err: any) {
      console.error('Error fetching finance data:', err);
      showNotification(err.message || 'Error al conectar con la base de datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // Create initial ledger settings
  const handleSetupInitialBalances = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id || isReadOnly) return;
    setSaving(true);

    try {
      const bankBal = parseFloat(initialBankInput) || 0;
      const cashBal = parseFloat(initialCashInput) || 0;

      const { data, error } = await supabase
        .from('finance_settings')
        .upsert({
          org_id: organization.id,
          period_year: periodYear,
          initial_bank_balance: bankBal,
          initial_cash_balance: cashBal,
        }, {
          onConflict: 'org_id,period_year'
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setSettings(data);
        showNotification('Módulo de Finanzas inicializado correctamente para el período.', 'success');
        await fetchFinanceData();
      } else {
        throw new Error('No se recibieron datos de respuesta al guardar la configuración.');
      }
    } catch (err: any) {
      console.error('Error initialising balances:', err);
      const errorMsg = err?.message || err?.details || 'Error al inicializar saldos. Verifica que las tablas de finanzas estén configuradas en la base de datos.';
      showNotification(errorMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Image change handler with on-the-fly browser canvas compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/jpeg/) && !file.type.match(/image\/jpg/) && !file.type.match(/image\/png/)) {
      showNotification('Formato no permitido. Solo se aceptan imágenes JPG, JPEG o PNG.', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showNotification('El archivo original supera los 2MB de límite.', 'error');
      return;
    }

    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setTxFile(compressed);
      
      const previewUrl = URL.createObjectURL(compressed);
      setTxFilePreview(previewUrl);
      
      const reduction = Math.round(((file.size - compressed.size) / file.size) * 100);
      showNotification(`Imagen optimizada con éxito (reducción del ${reduction}%). Ocupa solo ${Math.round(compressed.size / 1024)} KB.`, 'success');
    } catch (err) {
      console.error('Compression failed:', err);
      showNotification('Error al optimizar imagen. Subiendo archivo original.', 'error');
      setTxFile(file);
      setTxFilePreview(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  };

  // Create new transaction
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id || isReadOnly) return;
    if (!txAmount || parseFloat(txAmount) <= 0) {
      showNotification('Por favor, ingresa un monto válido superior a cero.', 'error');
      return;
    }
    if (!txCategoryId) {
      showNotification('Por favor, selecciona una categoría.', 'error');
      return;
    }

    setSaving(true);
    let photoUrl = null;

    try {
      // 1. Upload receipt to storage if selected
      if (txFile) {
        setCompressing(true);
        const fileExt = 'jpg'; // We always compress down to JPG
        const filePath = `${organization.id}/receipt-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('finance_receipts')
          .upload(filePath, txFile, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('finance_receipts')
          .getPublicUrl(filePath);

        photoUrl = publicUrl;
      }

      // 2. Insert transaction log
      const amountNum = parseFloat(txAmount);
      const { error: insertError } = await supabase
        .from('finance_transactions')
        .insert({
          org_id: organization.id,
          category_id: txCategoryId,
          description: txDescription,
          amount: amountNum,
          type: txType,
          payment_method: txMethod,
          transaction_date: txDate,
          photo_url: photoUrl,
          created_by: user?.id || membership?.user_id
        });

      if (insertError) throw insertError;

      showNotification('Transacción registrada exitosamente.', 'success');
      
      // Close modal and reset form
      setIsModalOpen(false);
      setTxAmount('');
      setTxDescription('');
      setTxFile(null);
      setTxFilePreview(null);
      setTxCategoryId('');
      
      // Refresh ledger data
      await fetchFinanceData();
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      showNotification(err.message || 'Error al guardar la transacción', 'error');
    } finally {
      setSaving(false);
      setCompressing(false);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: string, photoUrl: string | null) => {
    if (isReadOnly) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar este movimiento contable? Esta acción no se puede deshacer.')) return;

    setSaving(true);
    try {
      // 1. Delete associated image from storage if exists
      if (photoUrl) {
        try {
          const pathParts = photoUrl.split('/finance_receipts/');
          if (pathParts.length > 1) {
            const storagePath = pathParts[1];
            await supabase.storage
              .from('finance_receipts')
              .remove([storagePath]);
          }
        } catch (storageErr) {
          console.warn('Could not remove file from storage, proceeding to delete db row:', storageErr);
        }
      }

      // 2. Delete DB Row
      const { error } = await supabase
        .from('finance_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showNotification('Movimiento eliminado correctamente.', 'success');
      await fetchFinanceData();
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      showNotification(err.message || 'Error al eliminar movimiento', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Custom Category creation handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id || isReadOnly) return;
    if (!newCatName.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('finance_categories')
        .insert({
          org_id: organization.id,
          name: newCatName.trim(),
          type: newCatType,
          icon: newCatIcon
        });

      if (error) throw error;
      showNotification(`Categoría "${newCatName}" creada exitosamente.`, 'success');
      setNewCatName('');
      
      // Refresh categories
      await fetchFinanceData();
    } catch (err: any) {
      console.error('Error creating category:', err);
      showNotification(err.message || 'Error al crear la categoría', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Ledger Calculations
  const initialBank = settings?.initial_bank_balance || 0;
  const initialCash = settings?.initial_cash_balance || 0;

  const totalIncomesBank = transactions
    .filter(t => t.type === 'income' && t.payment_method === 'bank')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpensesBank = transactions
    .filter(t => t.type === 'expense' && t.payment_method === 'bank')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncomesCash = transactions
    .filter(t => t.type === 'income' && t.payment_method === 'cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpensesCash = transactions
    .filter(t => t.type === 'expense' && t.payment_method === 'cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const finalBankBalance = initialBank + totalIncomesBank - totalExpensesBank;
  const finalCashBalance = initialCash + totalIncomesCash - totalExpensesCash;

  const totalIncomes = totalIncomesBank + totalIncomesCash;
  const totalExpenses = totalExpensesBank + totalExpensesCash;
  const finalTotalNetBalance = finalBankBalance + finalCashBalance;

  // Chart Data compilation (Group transactions by month)
  const getMonthlyChartData = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyMap = Array.from({ length: 12 }, (_, i) => ({
      name: months[i],
      ingresos: 0,
      egresos: 0,
      balance: 0
    }));

    transactions.forEach(t => {
      const date = new Date(t.transaction_date);
      // Ensure date falls within selected year
      if (date.getFullYear() === periodYear) {
        const monthIndex = date.getMonth();
        if (t.type === 'income') {
          monthlyMap[monthIndex].ingresos += t.amount;
        } else {
          monthlyMap[monthIndex].egresos += t.amount;
        }
      }
    });

    return monthlyMap.map(m => ({
      ...m,
      balance: m.ingresos - m.egresos
    }));
  };

  // Pie chart expense category distribution data
  const getExpensesByCategoriesData = () => {
    const catMap: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const catName = t.category?.name || 'Otros';
        catMap[catName] = (catMap[catName] || 0) + t.amount;
      });

    const colors = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#64748b'];

    return Object.entries(catMap).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length]
    })).sort((a, b) => b.value - a.value);
  };

  // Filters logic
  const filteredTransactions = transactions.filter(t => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const descMatch = t.description?.toLowerCase().includes(query);
      const catMatch = t.category?.name?.toLowerCase().includes(query);
      const amountMatch = t.amount.toString().includes(query);
      if (!descMatch && !catMatch && !amountMatch) return false;
    }
    // 2. Type
    if (filterType !== 'all' && t.type !== filterType) return false;
    // 3. Category
    if (filterCategory !== 'all' && t.category_id !== filterCategory) return false;
    // 4. Method
    if (filterMethod !== 'all' && t.payment_method !== filterMethod) return false;
    // 5. Date Start
    if (filterDateStart && t.transaction_date < filterDateStart) return false;
    // 6. Date End
    if (filterDateEnd && t.transaction_date > filterDateEnd) return false;

    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Compile detailed PDF report
  const handleGeneratePdfReport = async (rangeType: 'month' | 'range' | 'full', monthSelect?: number) => {
    if (!organization) return;
    setSaving(true);
    
    try {
      let startLimit = '';
      let endLimit = '';
      let rangeText = '';

      if (rangeType === 'month' && monthSelect !== undefined) {
        const year = periodYear;
        const month = monthSelect;
        startLimit = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        endLimit = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        
        const monthNames = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        rangeText = `Período Mensual: ${monthNames[month]} ${year}`;
      } else if (rangeType === 'range') {
        if (!filterDateStart || !filterDateEnd) {
          showNotification('Por favor, selecciona fecha de inicio y fin para el informe.', 'error');
          setSaving(false);
          return;
        }
        startLimit = filterDateStart;
        endLimit = filterDateEnd;
        rangeText = `Rango de Fechas: ${filterDateStart.split('-').reverse().join('/')} al ${filterDateEnd.split('-').reverse().join('/')}`;
      } else {
        startLimit = `${periodYear}-01-01`;
        endLimit = `${periodYear}-12-31`;
        rangeText = `Resumen Consolidado Anual: ${periodYear}`;
      }

      // Filter transactions for the PDF scope
      const scopeTxs = transactions.filter(t => {
        if (startLimit && t.transaction_date < startLimit) return false;
        if (endLimit && t.transaction_date > endLimit) return false;
        return true;
      });

      // Calculate scope aggregates
      const scopeIncomeBank = scopeTxs.filter(t => t.type === 'income' && t.payment_method === 'bank').reduce((s, t) => s + t.amount, 0);
      const scopeIncomeCash = scopeTxs.filter(t => t.type === 'income' && t.payment_method === 'cash').reduce((s, t) => s + t.amount, 0);
      const scopeExpenseBank = scopeTxs.filter(t => t.type === 'expense' && t.payment_method === 'bank').reduce((s, t) => s + t.amount, 0);
      const scopeExpenseCash = scopeTxs.filter(t => t.type === 'expense' && t.payment_method === 'cash').reduce((s, t) => s + t.amount, 0);

      // Group scope categories
      const catMap: Record<string, { type: 'income' | 'expense'; amount: number }> = {};
      scopeTxs.forEach(t => {
        const catName = t.category?.name || 'Sin Categoría';
        if (!catMap[catName]) {
          catMap[catName] = { type: t.type, amount: 0 };
        }
        catMap[catName].amount += t.amount;
      });
      const scopeCategories = Object.entries(catMap).map(([name, val]) => ({
        name,
        type: val.type,
        amount: val.amount
      }));

      // Map rows
      const scopeTxRows = scopeTxs.map(t => ({
        date: t.transaction_date.split('-').reverse().join('/'),
        description: t.description,
        category: t.category?.name || 'Otros',
        method: t.payment_method,
        type: t.type,
        amount: t.amount,
        hasReceipt: !!t.photo_url
      }));

      const reportPayload: FinanceReportData = {
        orgName: organization.name,
        orgRut: (organization.settings as any)?.rut || '',
        orgType: organization.org_type || 'jjvv',
        logoUrl: organization.logo_url || undefined,
        address: (organization.settings as any)?.address || '',
        villa: (organization.settings as any)?.villa || '',
        commune: (organization.settings as any)?.commune || '',
        periodYear,
        dateRangeText: rangeText,
        initialBank: rangeType === 'full' ? initialBank : 0, // Simplified relative balances
        initialCash: rangeType === 'full' ? initialCash : 0,
        totalIncomeBank: scopeIncomeBank,
        totalIncomeCash: scopeIncomeCash,
        totalExpenseBank: scopeExpenseBank,
        totalExpenseCash: scopeExpenseCash,
        finalBank: (rangeType === 'full' ? initialBank : 0) + scopeIncomeBank - scopeExpenseBank,
        finalCash: (rangeType === 'full' ? initialCash : 0) + scopeIncomeCash - scopeExpenseCash,
        categorySummaries: scopeCategories,
        transactions: scopeTxRows,
        signatures: (organization.settings as any)?.signatures
      };

      const success = await exportFinanceReportToPDF(reportPayload);
      if (success) {
        showNotification('Reporte PDF descargado con éxito.', 'success');
      } else {
        showNotification('Ocurrió un error al generar el PDF.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showNotification('Error al compilar el reporte contable.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Loading screen
  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Cargando datos contables...</p>
      </div>
    );
  }

  // Not Setup / Settings State
  if (!settings) {
    return (
      <div className="max-w-xl mx-auto space-y-6 py-12 animate-fade-in">
        <div className="text-center">
          <div className="w-20 h-20 bg-brand-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-brand-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <Wallet className="w-10 h-10 text-brand-400" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">Activar Módulo de Finanzas</h1>
          <p className="text-slate-400 mt-2 text-sm max-w-md mx-auto">
            Para iniciar el control contable de la institución, primero debes configurar los saldos iniciales del período contable actual ({periodYear}).
          </p>
        </div>

        {isReadOnly ? (
          <div className="glass-card p-8 border-amber-500/20 bg-amber-500/[0.02] flex flex-col items-center text-center gap-4 mt-8">
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-md font-bold text-white">Configuración Pendiente</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-xs">
                El módulo de finanzas requiere ser activado por un Administrador o Propietario fijando los saldos iniciales de las cuentas.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSetupInitialBalances} className="glass-card p-6 md:p-8 space-y-6 mt-8">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-brand-500/10 pb-4">
              <Coins className="w-5 h-5 text-brand-400" />
              Carga Inicial del Período {periodYear}
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Saldo Inicial Cuenta Bancaria
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    value={initialBankInput}
                    onChange={(e) => setInitialBankInput(e.target.value)}
                    className="glass-input w-full pl-8 pr-4 py-3 text-sm font-semibold"
                    placeholder="0"
                    required
                    min="0"
                  />
                </div>
                <p className="text-[10px] text-slate-500 ml-1">
                  Saldo disponible en la cuenta del banco al inicio del año contable.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                  Saldo Inicial Efectivo (Caja Chica)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    value={initialCashInput}
                    onChange={(e) => setInitialCashInput(e.target.value)}
                    className="glass-input w-full pl-8 pr-4 py-3 text-sm font-semibold"
                    placeholder="0"
                    required
                    min="0"
                  />
                </div>
                <p className="text-[10px] text-slate-500 ml-1">
                  Monto físico disponible en efectivo para gastos menores de caja chica.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex gap-3 text-amber-300 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>
                <strong>IMPORTANTE:</strong> Una vez guardada la carga inicial, estos saldos quedarán <strong>bloqueados y fijos</strong> para garantizar la confiabilidad y cuadratura contable de los reportes.
              </span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                  Guardando Carga Inicial...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Guardar y Activar Finanzas
                </>
              )}
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-fade-in">
      {/* Title & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Coins className="w-7 h-7 text-brand-400" />
            Gestión y Auditoría de Finanzas
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Control contable de ingresos, egresos y conciliación bancaria.</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Período Contable:</label>
          <select
            value={periodYear}
            onChange={(e) => setPeriodYear(parseInt(e.target.value))}
            className="glass-input px-4 py-2 text-sm font-semibold focus:border-brand-500 cursor-pointer appearance-none bg-surface-900 border-brand-500/30"
          >
            <option value={2026}>Año 2026</option>
            <option value={2027}>Año 2027</option>
            <option value={2028}>Año 2028</option>
          </select>
        </div>
      </div>

      {/* Grid KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Balance */}
        <div className="glass-card p-5 relative overflow-hidden bg-brand-500/[0.02]">
          <div className="absolute right-4 top-4 bg-brand-500/10 p-2.5 rounded-xl border border-brand-500/20">
            <TrendingUp className="w-5 h-5 text-brand-400" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldo Neto Consolidado</span>
          <h3 className="text-2xl font-black text-white mt-2 leading-none">
            {formatCLP(finalTotalNetBalance)}
          </h3>
          <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-400">
            <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 font-semibold">Conciliado</span>
            <span>Banco + Caja Chica</span>
          </div>
        </div>

        {/* Total Incomes */}
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute right-4 top-4 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <ArrowUpRight className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ingresos del Periodo</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-2 leading-none">
            {formatCLP(totalIncomes)}
          </h3>
          <p className="text-[10px] text-slate-500 mt-4 font-semibold uppercase tracking-wider">
            Total entradas de caja
          </p>
        </div>

        {/* Total Expenses */}
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute right-4 top-4 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
            <ArrowDownRight className="w-5 h-5 text-rose-400" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gastos del Periodo</span>
          <h3 className="text-2xl font-black text-rose-400 mt-2 leading-none">
            {formatCLP(totalExpenses)}
          </h3>
          <p className="text-[10px] text-slate-500 mt-4 font-semibold uppercase tracking-wider">
            Total salidas registradas
          </p>
        </div>

        {/* Initial Balances Reference */}
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute right-4 top-4 bg-slate-500/10 p-2.5 rounded-xl border border-white/5">
            <Landmark className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldos Iniciales Fijos</span>
          <h3 className="text-2xl font-black text-slate-300 mt-2 leading-none">
            {formatCLP(initialBank + initialCash)}
          </h3>
          <div className="flex items-center gap-1.5 mt-4 text-[10px] text-amber-400">
            <Key className="w-3 h-3 shrink-0" />
            <span>Configuración bloqueada</span>
          </div>
        </div>
      </div>

      {/* Tabs Menu & Register Trigger */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-brand-500/10 pb-1">
        {/* Tabs Switer */}
        <div className="flex overflow-x-auto gap-2 p-1 bg-surface-900/60 rounded-xl border border-white/5 max-w-max">
          {(['dashboard', 'accounts', 'transactions', 'reports', 'settings'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab
                  ? 'bg-brand-500/15 text-brand-300 border border-brand-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              {tab === 'dashboard' && <Activity className="w-3.5 h-3.5" />}
              {tab === 'accounts' && <Landmark className="w-3.5 h-3.5" />}
              {tab === 'transactions' && <ArrowUpRight className="w-3.5 h-3.5" />}
              {tab === 'reports' && <FileText className="w-3.5 h-3.5" />}
              {tab === 'settings' && <Settings className="w-3.5 h-3.5" />}
              {tab === 'dashboard' ? 'Panel' : tab === 'accounts' ? 'Cuentas' : tab === 'transactions' ? 'Movimientos' : tab === 'reports' ? 'Informes' : 'Configuración'}
            </button>
          ))}
        </div>

        {/* Quick Add Button */}
        {!isReadOnly && (
          <button
            onClick={() => {
              if (categories.length === 0) {
                showNotification('Primero debes tener al menos una categoría creada en Configuración.', 'error');
                return;
              }
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-[0_8px_20px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Registrar Movimiento
          </button>
        )}
      </div>

      {/* TAB CONTENT VIEWS */}
      
      {/* 1. Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Main Chart */}
          <div className="glass-card p-6 lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-md font-bold text-white">Flujo de Caja Mensual</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ingresos vs Gastos del ejercicio contable {periodYear}</p>
            </div>
            
            <div className="h-[320px] w-full text-xs font-bold font-mono">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getMonthlyChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(99,102,241,0.2)', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: any) => [`$${Number(value || 0).toLocaleString('es-CL')}`]}
                  />
                  <Legend />
                  <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="egresos" fill="#f43f5e" name="Gastos" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expense categories Pie Chart */}
          <div className="glass-card p-6 flex flex-col justify-between gap-6">
            <div>
              <h3 className="text-md font-bold text-white">Distribución de Gastos</h3>
              <p className="text-xs text-slate-400 mt-0.5">Estructura por categorías acumuladas</p>
            </div>

            {getExpensesByCategoriesData().length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                <Coins className="w-10 h-10 text-slate-700 mb-2" />
                <span className="text-xs font-semibold text-slate-500">Sin gastos registrados</span>
                <p className="text-[10px] text-slate-600 max-w-xs mt-1">Registra egresos en movimientos para visualizar la distribución contable.</p>
              </div>
            ) : (
              <>
                <div className="h-[200px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getExpensesByCategoriesData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {getExpensesByCategoriesData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`$${Number(value || 0).toLocaleString('es-CL')}`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Central Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gastos Totales</span>
                    <span className="text-md font-extrabold text-white leading-tight">{formatCLP(totalExpenses)}</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="max-h-[120px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
                  {getExpensesByCategoriesData().slice(0, 5).map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-300 truncate font-semibold">{item.name}</span>
                      </div>
                      <span className="font-mono text-slate-400 font-bold shrink-0">{formatCLP(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-6 animate-fade-in">
          {/* Account Sub-selector */}
          <div className="flex gap-3 bg-surface-900/40 p-1.5 rounded-xl border border-white/5 max-w-max">
            <button
              onClick={() => setActiveAccount('bank')}
              className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeAccount === 'bank'
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/20 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Landmark className="w-4 h-4" />
              Cuenta Bancaria ({formatCLP(finalBankBalance)})
            </button>
            <button
              onClick={() => setActiveAccount('cash')}
              className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeAccount === 'cash'
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/20 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coins className="w-4 h-4" />
              Caja Chica / Efectivo ({formatCLP(finalCashBalance)})
            </button>
          </div>

          {/* Selected Account detail and recent ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Card Stats */}
            <div className="glass-card p-6 flex flex-col justify-between h-56 relative overflow-hidden bg-brand-500/[0.01]">
              <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] rotate-[15deg]">
                {activeAccount === 'bank' ? (
                  <Landmark className="w-44 h-44 text-white" />
                ) : (
                  <Coins className="w-44 h-44 text-white" />
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {activeAccount === 'bank' ? 'Libro Mayor Bancario' : 'Control Caja Chica'}
                </span>
                <h3 className="text-xl font-bold text-white">
                  {activeAccount === 'bank' ? 'Conciliación Bancaria' : 'Fondo Fijo Efectivo'}
                </h3>
              </div>

              <div className="my-4">
                <span className="text-xs text-slate-400 font-semibold block">Saldo Disponible</span>
                <span className="text-3xl font-black text-white tracking-tight leading-none mt-1">
                  {activeAccount === 'bank' ? formatCLP(finalBankBalance) : formatCLP(finalCashBalance)}
                </span>
              </div>

              <div className="flex gap-4 border-t border-white/5 pt-4 text-[10px] text-slate-400 font-semibold">
                <div>
                  <span className="text-slate-500 uppercase tracking-wider block">Saldo Inicial</span>
                  <span className="text-slate-300 font-mono">{formatCLP(activeAccount === 'bank' ? initialBank : initialCash)}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase tracking-wider block">Entradas</span>
                  <span className="text-emerald-500 font-mono">+{formatCLP(activeAccount === 'bank' ? totalIncomesBank : totalIncomesCash)}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase tracking-wider block">Salidas</span>
                  <span className="text-rose-500 font-mono">-{formatCLP(activeAccount === 'bank' ? totalExpensesBank : totalExpensesCash)}</span>
                </div>
              </div>
            </div>

            {/* Account Ledger Listing */}
            <div className="glass-card p-6 lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-md font-bold text-white">
                  Movimientos Contables del Mes ({activeAccount === 'bank' ? 'Banco' : 'Efectivo'})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Historial secuencial de depósitos y débitos</p>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {transactions.filter(t => t.payment_method === activeAccount).length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-white/[0.005]">
                    <Activity className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-slate-500">Sin movimientos registrados para esta cuenta</span>
                  </div>
                ) : (
                  transactions
                    .filter(t => t.payment_method === activeAccount)
                    .map(t => (
                      <div key={t.id} className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 border ${
                            t.type === 'income' 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          }`}>
                            <CategoryIcon name={t.category?.icon || 'Tag'} className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{t.description || t.category?.name}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 font-semibold">
                              <span>{t.transaction_date.split('-').reverse().join('/')}</span>
                              <span>•</span>
                              <span className="text-slate-400">{t.category?.name}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-4">
                          <span className={`font-mono text-xs font-extrabold ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatCLP(t.amount)}
                          </span>
                          {t.photo_url && (
                            <a href={t.photo_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-brand-500/20 transition-all text-slate-400 hover:text-white">
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="glass-card p-6 space-y-6 animate-fade-in">
          {/* Advanced filters banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white/[0.01] p-4 rounded-2xl border border-white/5">
            {/* Search input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Búsqueda rápida</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por descripción, monto..."
                className="glass-input w-full px-3 py-2 text-xs"
              />
            </div>

            {/* Filter by Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de movimiento</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="glass-input w-full px-3 py-2 text-xs cursor-pointer appearance-none bg-surface-900"
              >
                <option value="all">Todos los flujos</option>
                <option value="income">Ingresos (+)</option>
                <option value="expense">Egresos (-)</option>
              </select>
            </div>

            {/* Filter by Category */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Categorías</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="glass-input w-full px-3 py-2 text-xs cursor-pointer appearance-none bg-surface-900"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type === 'income' ? 'Ingreso' : 'Gasto'})</option>
                ))}
              </select>
            </div>

            {/* Filter by Account */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Medio de Pago</label>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value as any)}
                className="glass-input w-full px-3 py-2 text-xs cursor-pointer appearance-none bg-surface-900"
              >
                <option value="all">Todas las cuentas</option>
                <option value="bank">Cuenta Bancaria</option>
                <option value="cash">Caja Efectivo</option>
              </select>
            </div>
          </div>

          {/* Date range row */}
          <div className="flex flex-col sm:flex-row gap-4 items-end bg-white/[0.01] p-4 rounded-2xl border border-white/5">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Fecha de Inicio</label>
                <input
                  type="date"
                  value={filterDateStart}
                  onChange={(e) => setFilterDateStart(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Fecha de Término</label>
                <input
                  type="date"
                  value={filterDateEnd}
                  onChange={(e) => setFilterDateEnd(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-xs"
                />
              </div>
            </div>
            {(filterType !== 'all' || filterCategory !== 'all' || filterMethod !== 'all' || filterDateStart || filterDateEnd || searchQuery) && (
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterCategory('all');
                  setFilterMethod('all');
                  setFilterDateStart('');
                  setFilterDateEnd('');
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all shrink-0 h-10 flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Limpiar Filtros
              </button>
            )}
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/5 text-slate-400 border-b border-white/10 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Descripción / Detalle</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Medio de Pago</th>
                  <th className="p-4 text-right">Monto</th>
                  <th className="p-4 text-center">Boleta / JPG</th>
                  {!isReadOnly && <th className="p-4 text-center">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500 font-semibold bg-white/[0.002]">
                      No se encontraron movimientos contables que coincidan con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-mono font-semibold">{t.transaction_date.split('-').reverse().join('/')}</td>
                      <td className="p-4 font-bold text-white max-w-[240px] truncate">{t.description}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <CategoryIcon name={t.category?.icon || 'Tag'} className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t.category?.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {t.type === 'income' ? 'Ingreso' : 'Gasto'}
                        </span>
                      </td>
                      <td className="p-4 font-medium">
                        {t.payment_method === 'bank' ? (
                          <span className="flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5 text-brand-400" />Banco</span>
                        ) : (
                          <span className="flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-amber-500" />Caja Efectivo</span>
                        )}
                      </td>
                      <td className="p-4 text-right font-mono font-black text-sm">
                        <span className={t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}>
                          {t.type === 'income' ? '+' : '-'}{formatCLP(t.amount)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {t.photo_url ? (
                          <a href={t.photo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-brand-400 hover:text-brand-300 font-bold border border-brand-500/20 bg-brand-500/5 px-2.5 py-1 rounded-lg hover:bg-brand-500/10 transition-all">
                            <Eye className="w-3 h-3" />
                            Ver Boleta
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">Sin Boleta</span>
                        )}
                      </td>
                      {!isReadOnly && (
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDeleteTransaction(t.id, t.photo_url)}
                            className="p-1.5 rounded-lg border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30 text-red-400 transition-all"
                            title="Eliminar transacción"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <span className="text-xs text-slate-500 font-semibold">
                Mostrando {currentPage} de {totalPages} páginas ({filteredTransactions.length} movimientos)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Reports Tab */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Quick Exports Card */}
          <div className="glass-card p-6 space-y-6">
            <div>
              <h3 className="text-md font-bold text-white">Descarga de Balances Mensuales</h3>
              <p className="text-xs text-slate-400 mt-0.5">Exportación en 1 clic del rendimiento contable por meses</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
              ].map((month, idx) => {
                // Check if there are transactions in that month
                const hasTxs = transactions.some(t => {
                  const d = new Date(t.transaction_date);
                  return d.getFullYear() === periodYear && d.getMonth() === idx;
                });

                return (
                  <button
                    key={month}
                    disabled={!hasTxs || saving}
                    onClick={() => handleGeneratePdfReport('month', idx)}
                    className="p-3 text-left rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] disabled:opacity-30 hover:border-brand-500/20 text-slate-300 hover:text-white transition-all disabled:pointer-events-none group flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold block">{month}</span>
                      <span className="text-[9px] text-slate-500 font-mono mt-0.5 block">
                        {hasTxs ? 'Libro cerrado' : 'Sin movimientos'}
                      </span>
                    </div>
                    {hasTxs && (
                      <Download className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 transition-colors" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full consolidations and ranges */}
          <div className="glass-card p-6 flex flex-col justify-between gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-bold text-white">Rendición por Rango de Fechas</h3>
                <p className="text-xs text-slate-400 mt-0.5">Genera un informe financiero acumulado personalizado</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={filterDateStart}
                    onChange={(e) => setFilterDateStart(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Fecha de Término</label>
                  <input
                    type="date"
                    value={filterDateEnd}
                    onChange={(e) => setFilterDateEnd(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-slate-400 text-xs">
                El informe exportado contendrá el desglose de saldos conciliados, balances de ingresos y gastos ordenados por categoría contable, firmas oficiales autorizadas y el diario mayor contable de movimientos con su respectiva validación de boletas.
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              <button
                disabled={saving || !filterDateStart || !filterDateEnd}
                onClick={() => handleGeneratePdfReport('range')}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-[0_8px_20px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                    Generando Reporte de Fechas...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Exportar Reporte por Rango
                  </>
                )}
              </button>

              <button
                disabled={saving}
                onClick={() => handleGeneratePdfReport('full')}
                className="w-full py-3 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Exportar Balance Consolidado Anual ({periodYear})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Settings Tab */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Add custom Category Panel */}
          <div className="glass-card p-6 flex flex-col justify-between gap-6">
            <form onSubmit={handleCreateCategory} className="space-y-6">
              <div>
                <h3 className="text-md font-bold text-white">Añadir Categoría Contable</h3>
                <p className="text-xs text-slate-400 mt-0.5">Define rubros contables personalizados para la organización</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre de la Categoría</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ej. Artículos de Deporte, Subvención Estatal..."
                    className="glass-input w-full px-3 py-2 text-xs font-semibold"
                    required
                    disabled={isReadOnly}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de flujo</label>
                    <select
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value as any)}
                      className="glass-input w-full px-3 py-2 text-xs cursor-pointer appearance-none bg-surface-900"
                      disabled={isReadOnly}
                    >
                      <option value="expense">Gasto (-)</option>
                      <option value="income">Ingreso (+)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Ícono visual</label>
                    <select
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                      className="glass-input w-full px-3 py-2 text-xs cursor-pointer appearance-none bg-surface-900 font-medium"
                      disabled={isReadOnly}
                    >
                      {iconOptions.map(icon => (
                        <option key={icon.id} value={icon.id}>{icon.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live Icon preview */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/5 bg-white/[0.01]">
                  <div className="p-2.5 rounded-lg border border-white/5 bg-white/5 text-brand-400">
                    <CategoryIcon name={newCatIcon} className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">Previsualización de Ícono</span>
                    <span className="text-xs font-extrabold text-white">{newCatName || 'Nueva Categoría'}</span>
                  </div>
                </div>
              </div>

              {!isReadOnly ? (
                <button
                  type="submit"
                  disabled={saving || !newCatName}
                  className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-[0_8px_20px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Crear Nueva Categoría
                </button>
              ) : (
                <p className="text-[10px] text-slate-500 text-center font-semibold">
                  Acceso restringido para roles de auditoría o visualización.
                </p>
              )}
            </form>
          </div>

          {/* Locked Config balances panel and Categories list */}
          <div className="glass-card p-6 flex flex-col justify-between gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-bold text-white">Configuración del Período {periodYear}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Saldos iniciales de resguardo auditivo</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Banco Inicial Fijo</span>
                  <span className="text-lg font-black text-white font-mono mt-1 block">{formatCLP(initialBank)}</span>
                </div>
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Efectivo Inicial Fijo</span>
                  <span className="text-lg font-black text-white font-mono mt-1 block">{formatCLP(initialCash)}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex gap-2 text-amber-300 text-[10px]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Los saldos iniciales son inmutables una vez registrados para evitar descuadres y distorsiones contables. En caso de error crítico, contacta al soporte técnico.
                </span>
              </div>
            </div>

            {/* Custom categories counter */}
            <div className="border-t border-white/5 pt-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Resumen de Categorías ({categories.length})</span>
              <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto custom-scrollbar">
                {categories.map(c => (
                  <span key={c.id} className="inline-flex items-center gap-1 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-300">
                    <CategoryIcon name={c.icon} className="w-3 h-3 text-slate-400" />
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRO DE MOVIMIENTO MODAL (REGISTRAR MODAL) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg glass-card p-6 md:p-8 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-400" />
                Registrar Movimiento Contable
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setTxFile(null);
                  setTxFilePreview(null);
                }}
                className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTransaction} className="space-y-6">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-3 p-1 bg-surface-900 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('expense');
                    setTxCategoryId('');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    txType === 'expense'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <ArrowDownRight className="w-3.5 h-3.5 inline mr-1" />
                  Registrar Gasto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('income');
                    setTxCategoryId('');
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    txType === 'income'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 inline mr-1" />
                  Registrar Ingreso
                </button>
              </div>

              {/* Amount and Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monto del flujo</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      placeholder="Ej. 15000"
                      className="glass-input w-full pl-8 pr-4 py-2.5 text-sm font-semibold"
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha del movimiento</label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="glass-input w-full px-3 py-2.5 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Category & Account */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoría contable</label>
                  <select
                    value={txCategoryId}
                    onChange={(e) => setTxCategoryId(e.target.value)}
                    className="glass-input w-full px-3 py-2.5 text-sm cursor-pointer appearance-none bg-surface-900 border-white/5"
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories
                      .filter(c => c.type === txType)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Origen / Destino de fondos</label>
                  <select
                    value={txMethod}
                    onChange={(e) => setTxMethod(e.target.value as any)}
                    className="glass-input w-full px-3 py-2.5 text-sm cursor-pointer appearance-none bg-surface-900 border-white/5"
                    required
                  >
                    <option value="bank">Cuenta Bancaria</option>
                    <option value="cash">Caja Efectivo (Caja Chica)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción / Glosa</label>
                <input
                  type="text"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder="Ej. Compra de insumos deportivos para taller infantil..."
                  className="glass-input w-full px-4 py-2.5 text-sm"
                  required
                />
              </div>

              {/* Receipt File Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Adjuntar Boleta o Factura (JPG / PNG, Máx 2MB)</label>
                
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex-1 w-full">
                    <label className="flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] hover:bg-white/[0.02] hover:border-brand-500/30 transition-all cursor-pointer text-center relative group">
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileChange} 
                        accept="image/jpeg,image/jpg,image/png" 
                      />
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-brand-400 transition-colors mb-2" />
                      <span className="text-xs font-bold text-slate-300">Seleccionar Boleta</span>
                      <span className="text-[9px] text-slate-500 mt-1 uppercase">JPG, PNG (SE REDUCIRÁ A ~150KB)</span>
                    </label>
                  </div>

                  {/* Thumbnail Preview */}
                  {txFilePreview && (
                    <div className="w-24 h-24 rounded-2xl border border-white/10 bg-white/5 overflow-hidden shrink-0 relative group">
                      <img src={txFilePreview} className="w-full h-full object-cover" alt="Preview" />
                      <button
                        type="button"
                        onClick={() => {
                          setTxFile(null);
                          setTxFilePreview(null);
                        }}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 hover:text-red-300"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end border-t border-white/10 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setTxFile(null);
                    setTxFilePreview(null);
                  }}
                  className="px-5 py-2.5 border border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all"
                  disabled={saving || compressing}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || compressing}
                  className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-500/20 flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Registrar Movimiento
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
