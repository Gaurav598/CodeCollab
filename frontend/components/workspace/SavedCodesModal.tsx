import React, { useEffect, useState, useMemo } from 'react';
import { X, Search, Trash2, Code2, Clock, Check } from 'lucide-react';
import { getSavedCodes, deleteSavedCode, SavedCode } from '@/services/workspaceService';
import { useModalStore } from '@/store/modalStore';

interface SavedCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (savedCode: SavedCode) => void;
}

export function SavedCodesModal({ isOpen, onClose, onRestore }: SavedCodesModalProps) {
  const [savedCodes, setSavedCodes] = useState<SavedCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      loadSavedCodes();
    }
  }, [isOpen]);

  const loadSavedCodes = async () => {
    try {
      setLoading(true);
      const data = await getSavedCodes();
      setSavedCodes(data);
    } catch (err) {
      console.error("Failed to load saved codes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const confirmed = await useModalStore.getState().showConfirm("Delete Saved Code", "Are you sure you want to delete this saved code?");
    if (!confirmed) return;
    try {
      await deleteSavedCode(id);
      setSavedCodes(prev => prev.filter(sc => sc.id !== id));
    } catch (err) {
      console.error("Failed to delete saved code", err);
    }
  };

  const filteredCodes = useMemo(() => {
    if (!search) return savedCodes;
    const lower = search.toLowerCase();
    return savedCodes.filter(sc => 
      sc.fileName.toLowerCase().includes(lower) || 
      sc.language.toLowerCase().includes(lower) ||
      sc.roomCode.toLowerCase().includes(lower)
    );
  }, [search, savedCodes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-3xl max-h-[80vh] flex flex-col bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Saved Codes</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-border bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files, languages, or room codes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3"></div>
              Loading...
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Code2 className="w-12 h-12 mb-3 opacity-20" />
              <p>No saved codes found.</p>
              {search && <p className="text-sm mt-1">Try adjusting your search.</p>}
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredCodes.map(sc => (
                <div 
                  key={sc.id} 
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => onRestore(sc)}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground truncate">{sc.fileName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider">
                        {sc.language}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        Room: <span className="font-mono bg-muted px-1 rounded">{sc.roomCode}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(sc.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestore(sc);
                      }}
                    >
                      Open
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, sc.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
