import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Save, AlertCircle, CheckCircle, Upload, Trash2, Palette } from 'lucide-react';
import MonthPicker from '@/components/admin/MonthPicker';
import { normalizeExperiences, sortExperiences, toStructuredExperiences } from '@/lib/experience';

const tabs = ['hero', 'about', 'status', 'contact', 'featured', 'technologies', 'experience', 'certifications', 'languages', 'projects', 'social', 'uploads'];

const sectionLabels = {
  hero: 'Hero',
  about: 'About',
  status: 'Status',
  contact: 'Contact',
  featured: 'Featured Project',
  technologies: 'Technologies',
  experience: 'Experience',
  certifications: 'Certifications',
  languages: 'Languages',
  projects: 'Projects',
  social: 'Social Links',
  uploads: 'Uploads',
};

const fieldLabels = {
  es: 'Spanish',
  en: 'English',
  status: 'Section label',
  available: 'Status text',
  statusDetail: 'Status details',
  indicatorColor: 'Indicator colour',
  company: 'Company',
  url: 'Target URL',
  position: 'Position',
  period: 'Period',
  responsibilities: 'Responsibilities',
  name: 'Name',
  issuer: 'Issuer',
  level: 'Level',
  icon: 'Icon',
};

const getFieldLabel = (key) => fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());

const isLongText = (key, value) => value.length > 100 || ['description', 'description2', 'paragraph1', 'paragraph2', 'paragraphFullStack', 'statusDetail', 'cta'].includes(key);

const uploadTargets = [
  { value: 'cv-es', label: 'CV (Spanish)', accept: 'application/pdf', allowedTypes: ['application/pdf'] },
  { value: 'cv-en', label: 'CV (English)', accept: 'application/pdf', allowedTypes: ['application/pdf'] },
  { value: 'hero-photo', label: 'Hero photo', accept: 'image/jpeg,image/png,image/webp', allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] },
];

const getUploadTarget = (target) => uploadTargets.find((option) => option.value === target);

const createExperience = () => {
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
  const [content, setContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('hero');
  const [uploads, setUploads] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedUploadTarget, setSelectedUploadTarget] = useState('cv-es');

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const fetchContent = useCallback(async () => {
    try {
      const response = await fetch('/api/content');
      const data = await response.json();
      setContent({
        ...data,
        experience: Array.isArray(data.experience) ? normalizeExperiences(data.experience) : [],
      });
    } catch (err) {
      showMessage('error', 'Failed to load content');
    }
  }, []);

  const fetchUploads = useCallback(async () => {
    try {
      const response = await fetch('/api/uploads');
      const data = await response.json();
      setUploads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load uploads:', err);
      setUploads([]);
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
  }, [fetchContent, fetchUploads]);

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
        throw new Error('Failed to save');
      }

      setContent((currentContent) => ({
        ...currentContent,
        [activeTab]: sectionData,
      }));
      showMessage('success', 'Content saved successfully');
    } catch (err) {
      showMessage('error', 'Failed to save content');
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

  const updateContent = (key, value) => {
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

  const updateNestedContent = (groupKey, key, value) => {
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

  const setActiveSection = (value) => {
    if (!content) return;

    setContent({
      ...content,
      [activeTab]: value,
    });
  };

  const updateTechnologies = (items) => {
    if (!content) return;

    setContent({
      ...content,
      technologies: {
        ...content.technologies,
        items,
      },
    });
  };

  const updateArrayItem = (index, updater) => {
    const currentSection = content?.[activeTab];
    if (!Array.isArray(currentSection)) return;

    setActiveSection(currentSection.map((item, itemIndex) => (
      itemIndex === index ? updater(item) : item
    )));
  };

  const addArrayItem = (item) => {
    const currentSection = content?.[activeTab];
    if (!Array.isArray(currentSection)) return;

    setActiveSection([...currentSection, item]);
  };

  const addExperience = () => {
    const experiences = Array.isArray(content?.experience) ? content.experience : [];
    setActiveSection([createExperience(), ...experiences]);
  };

  const removeArrayItem = (index) => {
    const currentSection = content?.[activeTab];
    if (!Array.isArray(currentSection)) return;

    setActiveSection(currentSection.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateLocalizedField = (index, field, language, value) => {
    updateArrayItem(index, (item) => ({
      ...item,
      [field]: {
        ...item[field],
        [language]: value,
      },
    }));
  };

  const updateLocalizedListField = (index, field, language, listIndex, value) => {
    updateArrayItem(index, (item) => ({
      ...item,
      [field]: {
        ...item[field],
        [language]: item[field][language].map((entry, entryIndex) => (
          entryIndex === listIndex ? value : entry
        )),
      },
    }));
  };

  const addLocalizedListField = (index, field, language) => {
    updateArrayItem(index, (item) => ({
      ...item,
      [field]: {
        ...item[field],
        [language]: [...item[field][language], ''],
      },
    }));
  };

  const removeLocalizedListField = (index, field, language, listIndex) => {
    updateArrayItem(index, (item) => ({
      ...item,
      [field]: {
        ...item[field],
        [language]: item[field][language].filter((_, entryIndex) => entryIndex !== listIndex),
      },
    }));
  };

  const handleFileUpload = async (e) => {
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
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      showMessage('success', `${target.label} uploaded successfully`);
      await fetchUploads();
      // Reset file input
      e.target.value = '';
    } catch (err) {
      showMessage('error', `Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteUpload = async (filename) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/uploads/${filename}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      showMessage('success', 'File deleted successfully');
      await fetchUploads();
    } catch (err) {
      showMessage('error', 'Failed to delete file');
    }
  };

  const renderLocalizedInputs = (item, index, field) => (
    <div className="grid gap-4 md:grid-cols-2">
      {['es', 'en'].map((language) => (
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
    const items = content?.technologies?.items || [];

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
            <div key={`${item}-${index}`} className="flex gap-2">
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
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderExperienceEditor = () => {
    const items = Array.isArray(content?.experience) ? content.experience : [];

    return (
      <div className="space-y-5">
        {items.map((item, index) => (
          <div key={`${item.company}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Experience #{index + 1}</h3>
                <p className="text-sm text-gray-400">Company, role, dates, and responsibilities.</p>
              </div>
              <button
                type="button"
                onClick={() => removeArrayItem(index)}
                className="rounded-xl border border-red-500/30 px-3 py-2 text-red-300 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
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
                {['es', 'en'].map((language) => (
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
    const items = Array.isArray(content?.social) ? content.social : [];

    return (
      <div className="space-y-5">
        {items.map((item, index) => (
          <div key={`${item.name}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Social link #{index + 1}</h3>
                <p className="text-sm text-gray-400">Choose the name, destination, and icon shown in the hero.</p>
              </div>
              <button
                type="button"
                onClick={() => removeArrayItem(index)}
                className="rounded-xl border border-red-500/30 px-3 py-2 text-red-300 transition-colors hover:bg-red-500/10"
                aria-label="Remove social link"
              >
                <Trash2 className="h-4 w-4" />
              </button>
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
                  className="w-full rounded-xl border border-white/10 bg-gray-900/80 px-4 py-3 text-white outline-none transition-colors focus:border-primary"
                  placeholder="https://"
                />
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

  const renderSimpleLocalizedArrayEditor = (config) => {
    const items = Array.isArray(content?.[activeTab]) ? content[activeTab] : [];

    return (
      <div className="space-y-5">
        {items.map((item, index) => (
          <div key={`${activeTab}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{config.itemLabel} #{index + 1}</h3>
                <p className="text-sm text-gray-400">Edit the Spanish and English labels shown publicly.</p>
              </div>
              <button
                type="button"
                onClick={() => removeArrayItem(index)}
                className="rounded-xl border border-red-500/30 px-3 py-2 text-red-300 transition-colors hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!authenticated || !content) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,71,147,0.18),transparent_32rem),linear-gradient(135deg,#0d0d0f_0%,#17171b_55%,#0b0b0d_100%)] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-gray-950/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">marioscorner</p>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white transition-colors hover:border-primary/60 hover:bg-primary/10"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Message Alert */}
      {message.text && (
        <div
          className={`mx-auto max-w-7xl mt-4 px-4 sm:px-6 lg:px-8 p-4 rounded-lg flex gap-3 ${
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur">
              <h2 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">
                Sections
              </h2>
              <nav className="space-y-2">
                {tabs.map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all ${
                        activeTab === tab
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {sectionLabels[tab] || tab}
                    </button>
                  )
                )}
              </nav>
            </div>
          </div>

          {/* Content Editor */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-white/10 bg-gray-950/60 p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Editing</p>
                  <h2 className="text-2xl font-bold text-white">{sectionLabels[activeTab] || activeTab}</h2>
                </div>
                {activeTab !== 'uploads' && (
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-white hover:bg-primary/90"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
              </div>

              {/* Uploads Section */}
              {activeTab === 'uploads' ? (
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Upload target
                        </label>
                        <select
                          value={selectedUploadTarget}
                          onChange={(e) => setSelectedUploadTarget(e.target.value)}
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

                  {/* Uploaded Files List */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Uploaded Files</h3>
                    {uploads && uploads.length > 0 ? (
                      <div className="space-y-3">
                        {uploads.map((upload) => (
                          <div key={upload.filename} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600">
                            <div className="flex-1">
                              <p className="font-medium text-white">
                                {getUploadTarget(upload.slot)?.label || `Legacy: ${upload.document_type} (${upload.language.toUpperCase()})`}
                              </p>
                              <p className="text-sm text-gray-400">
                                {upload.original_name} • {(upload.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Uploaded: {new Date(upload.created_at || upload.uploaded_at).toLocaleDateString()}
                              </p>
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
                  {renderGuidedEditor() || (content[activeTab] && typeof content[activeTab] === 'object' ? (
                    <div className="space-y-5">
                      {Object.entries(content[activeTab]).map(([key, value]) => (
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
                                {Object.entries(value).map(([nestedKey, nestedValue]) => (
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
      </div>
    </div>
  );
};

export default AdminDashboard;
