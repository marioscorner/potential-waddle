import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';

type ContentContextValue = {
  // Content sections are JSONB and their editable shape varies by section.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: Record<string, any> | null;
  loading: boolean;
  error: string | null;
  refreshContent: () => Promise<void>;
};

const ContentContext = createContext<ContentContextValue | null>(null);

export const ContentProvider = ({ children }: { children: React.ReactNode }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshContent = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/content');
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      const data = await response.json();
      setContent(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError(err.message);
      // Don't set content to null on error - let it fail gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshContent();
  }, [refreshContent]);

  return (
    <ContentContext.Provider value={{ content, loading, error, refreshContent }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within ContentProvider');
  }
  return context;
};
