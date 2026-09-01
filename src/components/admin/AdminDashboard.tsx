import { useState, useEffect, useCallback, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Save, AlertCircle, CheckCircle, Upload, Trash2, Palette, Eye, Undo2, Image as ImageIcon, History, Download, FileUp, RotateCcw, ArrowDown, ArrowUp, GripVertical, ShieldCheck } from 'lucide-react';
import MonthPicker from '@/components/admin/MonthPicker';
import ImageCropper from '@/components/admin/ImageCropper';
import { normalizeExperiences, sortExperiences, toStructuredExperiences } from '@/lib/experience';

const tabs = ['hero', 'about', 'status', 'contact', 'featured', 'technologies', 'sectionTitles', 'experience', 'certifications', 'languages', 'projects', 'social', 'meta', 'footer', 'uploads', 'activity'] as const;

type Tab = typeof tabs[number];
type AdminLanguage = 'es' | 'en';
type MessageType = '' | 'success' | 'error';
// The CMS permits heterogeneous JSON sections; this dynamic boundary is contained in the editor.
type EditorItem = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type EditorContent = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type UploadTargetValue = 'cv-es' | 'cv-en' | 'hero-photo';

type Message = { type: MessageType; text: string };
type UploadTarget = {
  value: UploadTargetValue;
  label: string;
  accept: string;
  allowedTypes: string[];
};
type UploadRecord = {
  filename: string;
  document_type: string;
  language: string;
  original_name: string;
  size: number;
  is_active: boolean;
  slot?: string;
  created_at?: string;
  uploaded_at?: string;
};
type AuditEntry = {
  id: string | number;
  action: string;
  section?: Tab;
  created_at: string | number;
  changes?: { after?: unknown; user?: string };
};
type Operations = { database: string; lastActivity?: string | number };
type Experience = EditorItem & {
  company: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  position: Record<AdminLanguage, string>;
  responsibilities: Record<AdminLanguage, string[]>;
};
type SimpleLocalizedEditorConfig = {
  itemLabel: string;
  fields: string[];
  createItem: () => EditorItem;
};

const navGroups: { label: Record<AdminLanguage, string>; tabs: Tab[] }[] = [
  { label: { es: 'Inicio', en: 'Start' }, tabs: ['hero', 'status'] },
  { label: { es: 'Sobre mí', en: 'About me' }, tabs: ['about'] },
  { label: { es: 'Perfil profesional', en: 'Professional profile' }, tabs: ['experience', 'technologies', 'languages', 'certifications', 'sectionTitles'] },
  { label: { es: 'Proyecto', en: 'Project' }, tabs: ['featured'] },
  { label: { es: 'Contacto', en: 'Contact' }, tabs: ['contact', 'social', 'projects', 'footer'] },
  { label: { es: 'Administración', en: 'Administration' }, tabs: ['meta', 'uploads', 'activity'] },
];

const hiddenFieldsBySection: Partial<Record<Tab, string[]>> = {
  hero: ['greeting', 'cta'],
  status: ['status', 'available'],
  featured: ['title', 'cta'],
  projects: ['title', 'description'],
  sectionTitles: ['hero', 'experience'],
};

const sectionLabels = {
  hero: 'Start',
  about: 'About me',
  status: 'Start: status',
  contact: 'Contact',
  featured: 'Project',
  technologies: 'Professional profile: technologies',
  sectionTitles: 'Professional profile: labels',
  experience: 'Professional profile: experience',
  certifications: 'Professional profile: certifications',
  languages: 'Professional profile: languages',
  projects: 'Contact: projects',
  social: 'Contact: social links',
  meta: 'Search metadata',
  footer: 'Rail credits',
  uploads: 'Uploads',
  activity: 'History & backups',
};

const sectionLabelsEs = {
  hero: 'Inicio', about: 'Sobre mí', status: 'Inicio: estado', contact: 'Contacto', featured: 'Proyecto',
  technologies: 'Perfil profesional: tecnologías', sectionTitles: 'Perfil profesional: etiquetas', experience: 'Perfil profesional: experiencia',
  certifications: 'Perfil profesional: certificaciones', languages: 'Perfil profesional: idiomas', projects: 'Contacto: proyectos', social: 'Contacto: redes sociales',
  meta: 'Metadatos de búsqueda', footer: 'Créditos laterales', uploads: 'Archivos', activity: 'Historial y copias',
};

const fieldLabels = {
  es: 'Spanish',
  en: 'English',
  status: 'Section label',
  available: 'Status text',
  statusDetail: 'Status details',
  indicatorColor: 'Indicator colour',
  company: 'Company',
  url: 'Button link URL',
  position: 'Position',
  period: 'Period',
  responsibilities: 'Responsibilities',
  name: 'Name',
  issuer: 'Issuer',
  level: 'Level',
  icon: 'Icon',
  title: 'Page title',
  description: 'Meta description',
};

const getFieldLabel = (key: string) => fieldLabels[key as keyof typeof fieldLabels] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());

const isLongText = (key: string, value: string) => value.length > 100 || ['description', 'description2', 'paragraph1', 'paragraph2', 'paragraphFullStack', 'statusDetail', 'cta'].includes(key);

const uploadTargets: UploadTarget[] = [
  { value: 'cv-es', label: 'CV (Spanish)', accept: 'application/pdf', allowedTypes: ['application/pdf'] },
  { value: 'cv-en', label: 'CV (English)', accept: 'application/pdf', allowedTypes: ['application/pdf'] },
  { value: 'hero-photo', label: 'Hero photo', accept: 'image/jpeg,image/png,image/webp', allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] },
];

const getUploadTarget = (target: string) => uploadTargets.find((option) => option.value === target);

const getResponseError = async (response: Response, fallback: string): Promise<string> => {
  try {
    const data = await response.json();
    return typeof data?.error === 'string' ? data.error : fallback;
  } catch {
    return fallback;
  }
};

const adminCopy = {
  en: {
    sections: 'Sections', editing: 'Editing', logout: 'Logout', saved: 'Saved', save: 'Save changes',
    discard: 'Discard', preview: 'Preview', history: 'History & backups', status: 'Operations status',
    closeSessions: 'Close other sessions', database: 'Database', active: 'Active',
  },
  es: {
    sections: 'Secciones', editing: 'Editando', logout: 'Cerrar sesión', saved: 'Guardado', save: 'Guardar cambios',
    discard: 'Descartar', preview: 'Vista previa', history: 'Historial y copias', status: 'Estado operativo',
    closeSessions: 'Cerrar otras sesiones', database: 'Base de datos', active: 'Activa',
  },
};

const isHttpUrl = (value: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

const getSectionLabel = (section: string | undefined, language: AdminLanguage) => {
  if (!section) return '';
  const labels = language === 'es' ? sectionLabelsEs : sectionLabels;
  return labels[section as keyof typeof labels] || section;
};

const createExperience = (): Experience => {
  const now = new Date();
  const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return {
    company: '',
    startDate,
    endDate: '',
    isCurrent: false,
    position: { es: '', en: '' },
    responsibilities: { es: [''], en: [''] },
  };
};

const AdminDashboard = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<EditorContent | null>(null);
  const [savedContent, setSavedContent] = useState<EditorContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message>({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState<Tab>('hero');
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedUploadTarget, setSelectedUploadTarget] = useState<UploadTargetValue>('cv-es');
  const [croppingFile, setCroppingFile] = useState<File | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [adminLanguage, setAdminLanguage] = useState<AdminLanguage>('es');
  const [operations, setOperations] = useState<Operations | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const copy = adminCopy[adminLanguage];

  const showMessage = (type: MessageType, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const fetchContent = useCallback(async () => {
    try {
      const response = await fetch('/api/content');
      if (!response.ok) throw new Error(await getResponseError(response, 'Failed to load content'));
      const data = await response.json();
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Received invalid content');
      const normalizedContent = {
        ...data,
        experience: Array.isArray(data.experience) ? normalizeExperiences(data.experience) : [],
      };
      setContent(normalizedContent as EditorContent);
      setSavedContent(normalizedContent as EditorContent);
    } catch (err) {
      showMessage('error', 'Failed to load content');
    }
  }, []);

  const fetchUploads = useCallback(async () => {
    try {
      const response = await fetch('/api/uploads?history=1', { credentials: 'include' });
      if (!response.ok) throw new Error(await getResponseError(response, 'Failed to load uploads'));
      const data = await response.json();
      setUploads(Array.isArray(data) ? data as UploadRecord[] : []);
    } catch (err) {
      console.error('Failed to load uploads:', err);
      setUploads([]);
      showMessage('error', err instanceof Error ? err.message : 'Failed to load uploads');
    }
  }, []);

  const fetchAudit = useCallback(async () => {
    try {
      const response = await fetch('/api/content/audit?limit=30', { credentials: 'include' });
      if (!response.ok) throw new Error(await getResponseError(response, 'Failed to load activity'));
      const data = await response.json();
      setAuditEntries(Array.isArray(data) ? data as AuditEntry[] : []);
    } catch (err) {
      console.error('Failed to load audit log:', err);
      setAuditEntries([]);
    }
  }, []);

  const fetchOperations = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/operations', { credentials: 'include' });
      if (!response.ok) throw new Error(await getResponseError(response, 'Failed to load operations status'));
      setOperations(await response.json() as Operations);
    } catch (err) {
      setOperations({ database: 'unavailable' });
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/status', {
          credentials: 'include',
        });
        const data = await response.json();

        if (data.authenticated) {
          setAuthenticated(true);
          // Fetch content and uploads
          await fetchContent();
          await fetchUploads();
          await fetchAudit();
          await fetchOperations();
        } else {
          window.location.assign('/admin/');
        }
      } catch (err) {
        window.location.assign('/admin/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [fetchAudit, fetchContent, fetchOperations, fetchUploads]);

  const isDirty = Boolean(content && savedContent && JSON.stringify(content[activeTab]) !== JSON.stringify(savedContent[activeTab]));

  useEffect(() => {
    if (!isDirty) return undefined;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isDirty]);

  const handleSave = async () => {
    if (!content) return;

    const experiences = activeTab === 'experience' && Array.isArray(content.experience)
      ? normalizeExperiences(content.experience)
      : [];

    if (experiences.some((item) => item.startDate && item.endDate && item.endDate < item.startDate)) {
      showMessage('error', 'An end date cannot be before its start date');
      return;
    }

    const sectionData = activeTab === 'experience'
      ? sortExperiences(toStructuredExperiences(experiences))
      : content[activeTab];

    setSaving(true);
    try {
      const response = await fetch(`/api/content/${activeTab}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: sectionData }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await getResponseError(response, 'Failed to save content'));
      }

      setContent((currentContent) => ({
        ...currentContent,
        [activeTab]: sectionData,
      }));
      setSavedContent((currentContent) => ({
        ...currentContent,
        [activeTab]: sectionData,
      }));
      showMessage('success', 'Content saved successfully');
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      window.location.assign('/admin/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const updateContent = (key: string, value: unknown) => {
    if (!content) return;

    const updated = { ...content };
    if (typeof updated[activeTab] === 'object') {
      updated[activeTab] = {
        ...updated[activeTab],
        [key]: value,
      };
    } else {
      updated[activeTab] = value;
    }
    setContent(updated);
  };

  const updateNestedContent = (groupKey: string, key: string, value: unknown) => {
    if (!content) return;

    setContent({
      ...content,
      [activeTab]: {
        ...content[activeTab],
        [groupKey]: {
          ...content[activeTab][groupKey],
          [key]: value,
        },
      },
    });
  };

  const setActiveSection = (value: unknown) => {
    if (!content) return;

    setContent({
      ...content,
      [activeTab]: value,
    });
  };

  const updateTechnologies = (items: string[]) => {
    if (!content) return;

    setContent({
      ...content,
      technologies: {
        ...content.technologies,
        items,
      },
    });
  };

  const updateArrayItem = (index: number, updater: (item: EditorItem) => EditorItem) => {
    const currentSection = content?.[activeTab];
    if (!Array.isArray(currentSection)) return;

    setActiveSection(currentSection.map((item, itemIndex) => (
      itemIndex === index ? updater(item) : item
    )));
  };

  const addArrayItem = (item: EditorItem) => {
    const currentSection = content?.[activeTab];
    if (!Array.isArray(currentSection)) return;

    setActiveSection([...currentSection, item]);
  };

  const addExperience = () => {
    const experiences = Array.isArray(content?.experience) ? content.experience : [];
    setActiveSection([createExperience(), ...experiences]);
  };

  const removeArrayItem = (index: number) => {
    const currentSection = content?.[activeTab];
    if (!Array.isArray(currentSection)) return;

    setActiveSection(currentSection.filter((_, itemIndex) => itemIndex !== index));
  };

  const moveArrayItem = (fromIndex: number, toIndex: number) => {
    const currentSection = content?.[activeTab];
    if (!Array.isArray(currentSection) || toIndex < 0 || toIndex >= currentSection.length || fromIndex === toIndex) return;
    const items = [...currentSection];
    const [item] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, item);
    setActiveSection(items);
  };

  const moveTechnology = (fromIndex: number, toIndex: number) => {
    const items = content?.technologies?.items || [];
    if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return;
    const nextItems = [...items];
    const [item] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, item);
    updateTechnologies(nextItems);
  };

  const renderReorderControls = (index: number, count: number, onMove: (fromIndex: number, toIndex: number) => void = moveArrayItem) => (
    <div className="flex items-center gap-1" aria-label="Reorder item">
      <GripVertical className="h-4 w-4 text-gray-500" aria-hidden="true" />
      <button type="button" onClick={() => onMove(index, index - 1)} disabled={index === 0} className="rounded-lg p-2 text-gray-300 hover:bg-white/10 disabled:opacity-30" aria-label="Move item up">
        <ArrowUp className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => onMove(index, index + 1)} disabled={index === count - 1} className="rounded-lg p-2 text-gray-300 hover:bg-white/10 disabled:opacity-30" aria-label="Move item down">
        <ArrowDown className="h-4 w-4" />
      </button>
    </div>
  );

  const updateLocalizedField = (index: number, field: string, language: AdminLanguage, value: string) => {
    updateArrayItem(index, (item) => ({
      ...item,
      [field]: {
        ...item[field],
        [language]: value,
      },
    }));
  };

  const updateLocalizedListField = (index: number, field: string, language: AdminLanguage, listIndex: number, value: string) => {
    updateArrayItem(index, (item) => ({
      ...item,
      [field]: {
        ...item[field],
        [language]: (item[field][language] as string[]).map((entry, entryIndex) => (
          entryIndex === listIndex ? value : entry
        )),
      },
    }));
  };

  const addLocalizedListField = (index: number, field: string, language: AdminLanguage) => {
    updateArrayItem(index, (item) => ({
      ...item,
      [field]: {
        ...item[field],
        [language]: [...item[field][language], ''],
      },
    }));
  };

  const removeLocalizedListField = (index: number, field: string, language: AdminLanguage, listIndex: number) => {
    updateArrayItem(index, (item) => ({
      ...item,
      [field]: {
        ...item[field],
        [language]: (item[field][language] as string[]).filter((_entry, entryIndex) => entryIndex !== listIndex),
      },
    }));
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const target = getUploadTarget(selectedUploadTarget);
    if (!target) {
      showMessage('error', 'Choose a valid upload target');
      return;
    }

    if (!target.allowedTypes.includes(file.type)) {
      showMessage('error', target.value.startsWith('cv-')
        ? 'CV uploads must be PDF files'
        : 'Hero photos must be JPEG, PNG, or WebP files');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      showMessage('error', 'File size must be less than 10MB');
      return;
    }

    if (target.value === 'hero-photo') {
      setCroppingFile(file);
      e.target.value = '';
      return;
    }

    await uploadFile(file, target);
    e.target.value = '';
  };

  const uploadFile = async (file: File, target: UploadTarget) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('target', target.value);

    setUploading(true);
    try {
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await getResponseError(response, 'Upload failed'));
      }

      showMessage('success', `${target.label} uploaded successfully`);
      await fetchUploads();
    } catch (err) {
      showMessage('error', `Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleActivateUpload = async (filename: string) => {
    try {
      const response = await fetch(`/api/uploads/${encodeURIComponent(filename)}/activate`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await getResponseError(response, 'Failed to activate image'));
      await fetchUploads();
      showMessage('success', 'Image is now active on the portfolio');
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to activate image');
    }
  };

  const handleDiscard = () => {
    if (!savedContent || !isDirty) return;
    setContent((currentContent) => ({ ...currentContent, [activeTab]: savedContent[activeTab] }));
    showMessage('success', 'Unsaved changes discarded');
  };

  const handleTabChange = (tab: Tab) => {
    if (tab !== activeTab && isDirty && !confirm('You have unsaved changes. Switch sections and keep them as a draft?')) return;
    setActiveTab(tab);
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/content/export', { credentials: 'include' });
      if (!response.ok) throw new Error(await getResponseError(response, 'Failed to export content'));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'marioscorner-content.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to export content');
    }
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      const response = await fetch('/api/content/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imported),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await getResponseError(response, 'Failed to import content'));
      await fetchContent();
      await fetchAudit();
      showMessage('success', 'Content imported successfully');
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to import content');
    } finally {
      event.target.value = '';
    }
  };

  const handleRestore = async (entry: AuditEntry) => {
    if (!entry.section || !entry.changes?.after || !confirm(`Restore ${entry.section} to this saved version?`)) return;
    try {
      const response = await fetch(`/api/content/${entry.section}/restore/${entry.id}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(await getResponseError(response, 'Failed to restore content'));
      await fetchContent();
      await fetchAudit();
      setActiveTab(entry.section);
      showMessage('success', `${sectionLabels[entry.section] || entry.section} restored`);
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to restore content');
    }
  };

  const handleCloseOtherSessions = async () => {
    if (!confirm('Close every other active admin session?')) return;
    try {
      const response = await fetch('/api/auth/logout-other-sessions', { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error(await getResponseError(response, 'Failed to close other sessions'));
      showMessage('success', 'Other sessions closed');
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Failed to close other sessions');
    }
  };

  const handleDeleteUpload = async (filename: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/uploads/${filename}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await getResponseError(response, 'Delete failed'));
      }

      showMessage('success', 'File deleted successfully');
      await fetchUploads();
    } catch (err) {
      showMessage('error', 'Failed to delete file');
    }
  };

  const renderLocalizedInputs = (item: EditorItem, index: number, field: string) => (
    <div className="grid gap-4 md:grid-cols-2">
      {(['es', 'en'] as const).map((language) => (
        <div key={`${field}-${language}`}>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            {getFieldLabel(field)} ({getFieldLabel(language)})
          </label>
          <input
            type="text"
            value={item[field]?.[language] || ''}
            onChange={(e) => updateLocalizedField(index, field, language, e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-primary"
          />
        </div>
      ))}
    </div>
  );

  const renderTechnologiesEditor = () => {
    const items: string[] = Array.isArray(content?.technologies?.items) ? content.technologies.items : [];

    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Technology List</h3>
            <p className="text-sm text-gray-400">Add, remove, or rename the skills shown on the portfolio.</p>
          </div>
          <button
            type="button"
            onClick={() => updateTechnologies([...items, ''])}
            className="rounded-full border border-primary/30 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            Add technology
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => { if (dragIndex !== null) moveTechnology(dragIndex, index); setDragIndex(null); }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={item}
                onChange={(e) => updateTechnologies(items.map((entry, entryIndex) => (
                  entryIndex === index ? e.target.value : entry
                )))}
                className="w-full rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-primary"
                placeholder="Technology name"
              />
              <button
                type="button"
                onClick={() => updateTechnologies(items.filter((_, entryIndex) => entryIndex !== index))}
                className="rounded-xl border border-red-500/30 px-3 text-red-300 transition-colors hover:bg-red-500/10"
                aria-label="Remove technology"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {renderReorderControls(index, items.length, moveTechnology)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderExperienceEditor = () => {
    const items: Experience[] = Array.isArray(content?.experience) ? content.experience : [];

    return (
      <div className="space-y-5">
        {items.map((item, index) => (
          <div
            key={`${item.company}-${index}`}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => { if (dragIndex !== null) moveArrayItem(dragIndex, index); setDragIndex(null); }}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Experience #{index + 1}</h3>
                <p className="text-sm text-gray-400">Company, role, dates, and responsibilities.</p>
              </div>
              <div className="flex items-center gap-2">
                {renderReorderControls(index, items.length)}
                <button type="button" onClick={() => removeArrayItem(index)} className="rounded-xl border border-red-500/30 px-3 py-2 text-red-300 transition-colors hover:bg-red-500/10" aria-label="Remove experience">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
              <div className="space-y-5">
                <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Company</label>
                <input
                  type="text"
                  value={item.company || ''}
                  onChange={(e) => updateArrayItem(index, (current) => ({ ...current, company: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-primary"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300" htmlFor={`experience-start-date-${index}`}>
                      Start date
                    </label>
                    <MonthPicker
                      id={`experience-start-date-${index}`}
                      value={item.startDate || ''}
                      onChange={(startDate) => updateArrayItem(index, (current) => ({ ...current, startDate }))}
                      placeholder="Select start month"
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3 text-sm font-medium text-gray-300">
                    <input
                      type="checkbox"
                      checked={item.isCurrent === true}
                      onChange={(e) => updateArrayItem(index, (current) => ({
                        ...current,
                        isCurrent: e.target.checked,
                        endDate: e.target.checked ? '' : current.endDate,
                      }))}
                      className="h-4 w-4 accent-primary"
                    />
                    Current experience
                  </label>
                </div>
                {!item.isCurrent && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300" htmlFor={`experience-end-date-${index}`}>
                      End date
                    </label>
                    <MonthPicker
                      id={`experience-end-date-${index}`}
                      value={item.endDate || ''}
                      onChange={(endDate) => updateArrayItem(index, (current) => ({ ...current, endDate }))}
                      placeholder="Select end month"
                    />
                  </div>
                )}
                {renderLocalizedInputs(item, index, 'position')}
              <div className="grid gap-5 md:grid-cols-2">
                {(['es', 'en'] as const).map((language) => (
                  <div key={`responsibilities-${language}`} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <label className="block text-sm font-medium text-gray-300">
                        Responsibilities ({getFieldLabel(language)})
                      </label>
                      <button
                        type="button"
                        onClick={() => addLocalizedListField(index, 'responsibilities', language)}
                        className="rounded-full border border-primary/30 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                      >
                        Add
                      </button>
                    </div>
                    {(item.responsibilities?.[language] || []).map((responsibility, listIndex) => (
                      <div key={`${language}-${listIndex}`} className="flex gap-2">
                        <textarea
                          value={responsibility}
                          onChange={(e) => updateLocalizedListField(index, 'responsibilities', language, listIndex, e.target.value)}
                          className="min-h-20 w-full resize-y rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => removeLocalizedListField(index, 'responsibilities', language, listIndex)}
                          className="self-start rounded-xl border border-red-500/30 px-3 py-3 text-red-300 transition-colors hover:bg-red-500/10"
                          aria-label="Remove responsibility"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addExperience}
          className="w-full rounded-2xl border border-dashed border-primary/40 px-4 py-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          Add experience
        </button>
      </div>
    );
  };

  const renderSocialEditor = () => {
    const items: EditorItem[] = Array.isArray(content?.social) ? content.social : [];

    return (
      <div className="space-y-5">
        {items.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => { if (dragIndex !== null) moveArrayItem(dragIndex, index); setDragIndex(null); }}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Social link #{index + 1}</h3>
                <p className="text-sm text-gray-400">Choose the name, destination, and icon shown in the hero.</p>
              </div>
              <div className="flex items-center gap-2">
                {renderReorderControls(index, items.length)}
                <button type="button" onClick={() => removeArrayItem(index)} className="rounded-xl border border-red-500/30 px-3 py-2 text-red-300 transition-colors hover:bg-red-500/10" aria-label="Remove social link">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Name</label>
                <input
                  type="text"
                  value={item.name || ''}
                  onChange={(e) => updateArrayItem(index, (current) => ({ ...current, name: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3 text-white outline-none transition-colors focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Target URL</label>
                <input
                  type="url"
                  value={item.url || ''}
                  onChange={(e) => updateArrayItem(index, (current) => ({ ...current, url: e.target.value }))}
                  aria-invalid={Boolean(item.url && !isHttpUrl(item.url))}
                  aria-describedby={item.url && !isHttpUrl(item.url) ? `social-url-error-${index}` : undefined}
                  className={`w-full rounded-xl border bg-gray-900/80 px-4 py-3 text-white outline-none transition-colors focus:border-primary ${item.url && !isHttpUrl(item.url) ? 'border-red-400' : 'border-white/10'}`}
                  placeholder="https://"
                />
                {item.url && !isHttpUrl(item.url) && <p id={`social-url-error-${index}`} className="mt-1 text-xs text-red-300">Use a full http:// or https:// URL.</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Icon</label>
                <select
                  value={item.icon || 'Globe2'}
                  onChange={(e) => updateArrayItem(index, (current) => ({ ...current, icon: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3 text-white outline-none transition-colors focus:border-primary"
                >
                  <option value="FaLinkedin">LinkedIn</option>
                  <option value="FaGithub">GitHub</option>
                  <option value="FaInstagram">Instagram</option>
                  <option value="Globe2">Website</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem({ name: '', url: '', icon: 'Globe2' })}
          className="w-full rounded-2xl border border-dashed border-primary/40 px-4 py-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          Add social link
        </button>
      </div>
    );
  };

  const renderSimpleLocalizedArrayEditor = (config: SimpleLocalizedEditorConfig) => {
    const items: EditorItem[] = Array.isArray(content?.[activeTab]) ? content[activeTab] : [];

    return (
      <div className="space-y-5">
        {items.map((item, index) => (
          <div
            key={`${activeTab}-${index}`}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => { if (dragIndex !== null) moveArrayItem(dragIndex, index); setDragIndex(null); }}
            className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{config.itemLabel} #{index + 1}</h3>
                <p className="text-sm text-gray-400">Edit the Spanish and English labels shown publicly.</p>
              </div>
              <div className="flex items-center gap-2">
                {renderReorderControls(index, items.length)}
                <button type="button" onClick={() => removeArrayItem(index)} className="rounded-xl border border-red-500/30 px-3 py-2 text-red-300 transition-colors hover:bg-red-500/10" aria-label={`Remove ${config.itemLabel.toLowerCase()}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-5">
              {config.fields.map((field) => renderLocalizedInputs(item, index, field))}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem(config.createItem())}
          className="w-full rounded-2xl border border-dashed border-primary/40 px-4 py-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          Add {config.itemLabel.toLowerCase()}
        </button>
      </div>
    );
  };

  const renderGuidedEditor = () => {
    if (activeTab === 'technologies') return renderTechnologiesEditor();
    if (activeTab === 'experience') return renderExperienceEditor();
    if (activeTab === 'social') return renderSocialEditor();
    if (activeTab === 'certifications') {
      return renderSimpleLocalizedArrayEditor({
        itemLabel: 'Certification',
        fields: ['name', 'issuer'],
        createItem: () => ({ name: { es: '', en: '' }, issuer: { es: '', en: '' } }),
      });
    }
    if (activeTab === 'languages') {
      return renderSimpleLocalizedArrayEditor({
        itemLabel: 'Language',
        fields: ['name', 'level'],
        createItem: () => ({ name: { es: '', en: '' }, level: { es: '', en: '' } }),
      });
    }

    return null;
  };

  const renderMetaEditor = () => {
    const meta = content?.meta || { es: {}, en: {} };
    return (
      <div className="space-y-5">
        <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-gray-300">Keep titles below 60 characters and descriptions below 160 characters for clearer search results.</p>
        {['es', 'en'].map((language) => {
          const title = meta[language]?.title || '';
          const description = meta[language]?.description || '';
          return (
            <section key={language} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <h3 className="mb-4 text-lg font-semibold text-white">Search preview ({language === 'es' ? 'Spanish' : 'English'})</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor={`meta-title-${language}`} className="mb-2 block text-sm font-medium text-gray-300">Page title</label>
                  <input id={`meta-title-${language}`} type="text" maxLength={60} value={title} onChange={(event) => updateNestedContent(language, 'title', event.target.value)} className="w-full rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3 text-white outline-none focus:border-primary" />
                  <p className={`mt-1 text-xs ${title.length > 55 ? 'text-amber-300' : 'text-gray-500'}`}>{title.length}/60</p>
                </div>
                <div>
                  <label htmlFor={`meta-description-${language}`} className="mb-2 block text-sm font-medium text-gray-300">Meta description</label>
                  <textarea id={`meta-description-${language}`} maxLength={160} value={description} onChange={(event) => updateNestedContent(language, 'description', event.target.value)} className="min-h-28 w-full resize-y rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3 text-white outline-none focus:border-primary" />
                  <p className={`mt-1 text-xs ${description.length > 150 ? 'text-amber-300' : 'text-gray-500'}`}>{description.length}/160</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#111114] px-4 py-3 text-gray-100">
                  <p className="text-xs text-emerald-400">marioscorner.com/{language}/</p>
                  <p className="mt-1 text-lg leading-tight text-sky-400">{title || 'Page title'}</p>
                  <p className="mt-1 text-sm text-gray-400">{description || 'Meta description preview'}</p>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    );
  };

  const renderActivity = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className={`h-6 w-6 ${operations?.database === 'connected' ? 'text-green-400' : 'text-red-400'}`} />
            <div>
              <h3 className="font-semibold text-white">{copy.status}</h3>
              <p className="text-sm text-gray-400">{copy.database}: {operations?.database || 'checking'}</p>
              {operations?.lastActivity && <p className="mt-1 text-xs text-gray-500">Last change: {new Date(operations.lastActivity).toLocaleString()}</p>}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <h3 className="font-semibold text-white">Session security</h3>
          <p className="mt-1 text-sm text-gray-400">Keep this session and revoke every other admin login.</p>
          <button type="button" onClick={handleCloseOtherSessions} className="mt-4 rounded-xl border border-primary/30 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10">{copy.closeSessions}</button>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Back up your content</h3>
            <p className="text-sm text-gray-400">Export a JSON backup before large edits, or import a previous export after validation.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-gray-100 hover:bg-white/10">
              <Download className="h-4 w-4" /> Export
            </button>
            <input id="content-import" type="file" accept="application/json" onChange={handleImport} className="hidden" />
            <label htmlFor="content-import" className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
              <FileUp className="h-4 w-4" /> Import
            </label>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">Recent activity</h3>
        </div>
        {auditEntries.length ? (
          <div className="space-y-3">
            {auditEntries.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-white">{entry.action.replace('_', ' ')}: {getSectionLabel(entry.section, adminLanguage) || 'System'}</p>
                  <p className="mt-1 text-sm text-gray-400">{entry.changes?.user || 'Admin'} · {new Date(entry.created_at).toLocaleString()}</p>
                </div>
                {entry.changes?.after && entry.section && (
                  <button type="button" onClick={() => handleRestore(entry)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10">
                    <RotateCcw className="h-4 w-4" /> Restore
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-gray-400">No recent activity.</p>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="admin-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!authenticated || !content) {
    return null;
  }

  return (
    <div lang={adminLanguage} className="admin-shell">
      <a href="#admin-main" className="admin-skip">Skip to editor</a>
      {/* Header */}
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <div>
            <p className="admin-kicker">marioscorner / control</p>
            <h1 className="admin-title">Admin Dashboard</h1>
          </div>

          <div className="admin-topbar-actions flex items-center gap-3">
            <label htmlFor="admin-language" className="sr-only">Panel language</label>
            <select id="admin-language" value={adminLanguage} onChange={(event) => setAdminLanguage(event.target.value as AdminLanguage)} className="admin-select">
              <option value="es">ES</option>
              <option value="en">EN</option>
            </select>
          <button
            onClick={handleLogout}
            className="admin-utility-button"
          >
            <LogOut className="w-4 h-4" />
            {copy.logout}
          </button>
          </div>
        </div>
      </header>

      {/* Message Alert */}
      {message.text && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`admin-message ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/50'
              : 'bg-red-500/10 border border-red-500/50'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm ${
              message.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      {/* Main Content */}
      <main id="admin-main" className="admin-main">
        <div className="admin-layout">
          {/* Sidebar Navigation */}
          <div>
            <div className="admin-sidebar">
              <h2 className="admin-sidebar-title">
                {copy.sections}
              </h2>
              <nav aria-label={copy.sections}>
                {navGroups.map((group) => (
                  <section className="admin-nav-group" key={group.label.en} aria-label={group.label[adminLanguage]}>
                    <h3 className="admin-nav-group-title">{group.label[adminLanguage]}</h3>
                    <div className="admin-nav">
                      {group.tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      aria-current={activeTab === tab ? 'page' : undefined}
                      className={`admin-nav-item ${
                        activeTab === tab
                          ? 'admin-nav-item-active'
                          : ''
                      }`}
                    >
                      {getSectionLabel(tab, adminLanguage)}
                    </button>
                      ))}
                    </div>
                  </section>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Editor */}
          <div>
            <div className="admin-editor">
              <div className="admin-editor-header">
                <div>
                  <p className="admin-kicker">{copy.editing}</p>
                  <h2 className="admin-editor-title">{getSectionLabel(activeTab, adminLanguage)}</h2>
                </div>
                <div className="admin-editor-actions flex flex-wrap items-center gap-2">
                  <a href="/es/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10">
                    <Eye className="h-4 w-4" /> {copy.preview} ES
                  </a>
                  <a href="/en/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/10">
                    <Eye className="h-4 w-4" /> {copy.preview} EN
                  </a>
                {activeTab !== 'uploads' && activeTab !== 'activity' && isDirty && (
                    <Button onClick={handleDiscard} variant="outline" className="flex items-center gap-2 rounded-full border-white/20 bg-transparent px-4 py-2.5 text-white hover:bg-white/10">
                      <Undo2 className="h-4 w-4" /> {copy.discard}
                    </Button>
                  )}
                  {activeTab !== 'uploads' && activeTab !== 'activity' && (
                    <Button
                      onClick={handleSave}
                      disabled={saving || !isDirty}
                      className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-white hover:bg-primary/90"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : isDirty ? copy.save : copy.saved}
                    </Button>
                  )}
                </div>
              </div>

              {/* Uploads Section */}
              {activeTab === 'activity' ? renderActivity() : activeTab === 'uploads' ? (
                <div className="space-y-6">
                  {croppingFile && (
                    <ImageCropper
                      file={croppingFile}
                      onCancel={() => setCroppingFile(null)}
                      onComplete={async (file) => {
                        setCroppingFile(null);
                        const target = getUploadTarget('hero-photo');
                        if (target) await uploadFile(file, target);
                      }}
                    />
                  )}
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Upload target
                        </label>
                        <select
                          value={selectedUploadTarget}
                          onChange={(e) => setSelectedUploadTarget(e.target.value as UploadTargetValue)}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
                        >
                          {uploadTargets.map((target) => (
                            <option key={target.value} value={target.value}>{target.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {selectedUploadTarget.startsWith('cv-')
                            ? 'CV file (PDF - Max 10MB)'
                            : 'Hero photo (JPEG, PNG, or WebP - Max 10MB)'}
                        </label>
                        <div className="flex items-center justify-center gap-4">
                          <input
                            type="file"
                            id="file-input"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            accept={getUploadTarget(selectedUploadTarget)?.accept}
                            className="hidden"
                          />
                          <label
                            htmlFor="file-input"
                            className={`flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg cursor-pointer transition-colors ${
                              uploading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <Upload className="w-4 h-4" />
                            {uploading ? 'Uploading...' : 'Choose File'}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Media library */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Media library</h3>
                    <p className="mb-4 text-sm text-gray-400">Every upload is kept. Select a previous Hero image to reuse it.</p>
                    {uploads && uploads.length > 0 ? (
                      <div className="space-y-3">
                        {uploads.map((upload) => (
                          <div key={upload.filename} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600">
                            <div className="flex min-w-0 flex-1 items-center gap-4">
                              {upload.document_type === 'hero-photo' && (
                                <img src={`/uploads/${upload.filename}`} alt="" className="h-14 w-14 rounded-xl object-cover" />
                              )}
                              {upload.document_type !== 'hero-photo' && <ImageIcon className="h-8 w-8 shrink-0 text-gray-500" />}
                              <div className="min-w-0">
                              <p className="font-medium text-white">
                                {getUploadTarget(upload.slot)?.label || `${upload.document_type} (${upload.language.toUpperCase()})`}
                                {upload.is_active && <span className="ml-2 rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-300">Active</span>}
                              </p>
                              <p className="text-sm text-gray-400">
                                {upload.original_name} • {(upload.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Uploaded: {new Date(upload.created_at || upload.uploaded_at).toLocaleDateString()}
                              </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <a
                                href={`/uploads/${upload.filename}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                              >
                                Download
                              </a>
                              {upload.document_type === 'hero-photo' && !upload.is_active && (
                                <button
                                  onClick={() => handleActivateUpload(upload.filename)}
                                  className="px-3 py-1 text-sm bg-primary hover:bg-primary/90 text-white rounded transition-colors"
                                >
                                  Use image
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteUpload(upload.filename)}
                                className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No files uploaded yet</p>
                    )}
                  </div>
                </div>
              ) : (
                /* Regular Content Editor */
                <div className="space-y-5">
                  {renderGuidedEditor() || (activeTab === 'meta' ? renderMetaEditor() : content[activeTab] && typeof content[activeTab] === 'object' ? (
                    <div className="space-y-5">
                      {Object.entries(content[activeTab]).filter(([key]) => !hiddenFieldsBySection[activeTab]?.includes(key)).map(([key, value]) => (
                        <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                          {key === 'indicatorColor' && typeof value === 'string' ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <Palette className="h-5 w-5" />
                                </div>
                                <div>
                                  <label htmlFor="indicatorColor" className="block text-sm font-semibold text-white">
                                    {getFieldLabel(key)}
                                  </label>
                                  <p className="text-sm text-gray-400">Controls the little pulsing dot in the public Status card.</p>
                                </div>
                              </div>
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <input
                                  id="indicatorColor"
                                  type="color"
                                  value={value}
                                  onChange={(e) => updateContent(key, e.target.value)}
                                  className="h-12 w-20 cursor-pointer rounded-xl border border-white/10 bg-gray-900 p-1"
                                />
                                <input
                                  type="text"
                                  value={value}
                                  onChange={(e) => updateContent(key, e.target.value)}
                                  className="w-full rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-primary sm:max-w-xs"
                                  placeholder="#22c55e"
                                />
                                <span className="relative flex h-4 w-4 shrink-0">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: value }}></span>
                                  <span className="relative inline-flex h-4 w-4 rounded-full" style={{ backgroundColor: value }}></span>
                                </span>
                              </div>
                            </div>
                          ) : typeof value === 'object' && value && !Array.isArray(value) && ['es', 'en'].includes(key) ? (
                            <div className="space-y-4">
                              <div>
                                <h3 className="text-lg font-semibold text-white">{getFieldLabel(key)}</h3>
                                <p className="text-sm text-gray-400">Edit this section's public copy without touching JSON.</p>
                              </div>
                              <div className="grid gap-4">
                                 {Object.entries(value).filter(([nestedKey]) => !hiddenFieldsBySection[activeTab]?.includes(nestedKey)).map(([nestedKey, nestedValue]) => (
                                  <div key={nestedKey}>
                                    <label className="mb-2 block text-sm font-medium text-gray-300">
                                      {getFieldLabel(nestedKey)}
                                    </label>
                                    {typeof nestedValue === 'string' && isLongText(nestedKey, nestedValue) ? (
                                      <textarea
                                        value={nestedValue}
                                        onChange={(e) => updateNestedContent(key, nestedKey, e.target.value)}
                                        className="min-h-28 w-full resize-y rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-primary"
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={String(nestedValue)}
                                        onChange={(e) => updateNestedContent(key, nestedKey, e.target.value)}
                                        className="w-full rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-primary"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : typeof value === 'string' ? (
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-300">
                                {getFieldLabel(key)}
                              </label>
                              {isLongText(key, value) ? (
                                <textarea
                                  value={value}
                                  onChange={(e) => updateContent(key, e.target.value)}
                                  className="min-h-28 w-full resize-y rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-primary"
                                />
                              ) : (
                                <input
                                  type={key === 'url' ? 'url' : 'text'}
                                  value={value}
                                  onChange={(e) => updateContent(key, e.target.value)}
                                  className="w-full rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-primary"
                                />
                              )}
                            </div>
                          ) : (
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-300">
                                {getFieldLabel(key)}
                              </label>
                              <p className="mb-3 text-sm text-gray-500">Advanced editor for lists and complex content.</p>
                              <textarea
                                value={JSON.stringify(value, null, 2)}
                                onChange={(e) => {
                                  try {
                                    updateContent(key, JSON.parse(e.target.value));
                                  } catch {
                                    // Keep the previous value until the JSON is valid.
                                  }
                                }}
                                className="h-40 w-full resize-y rounded-xl border border-white/10 bg-gray-950 px-4 py-3 font-mono text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-primary"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No editable content for this section.</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
