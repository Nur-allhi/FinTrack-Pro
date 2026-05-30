import React from 'react';
import { Tags, Pencil } from 'lucide-react';

interface CategorySettingsProps {
  categories: string[];
  onRename: (cat: string) => void;
}

export default function CategorySettings({ categories, onRename }: CategorySettingsProps) {
  return (
    <div className="card-xl space-y-4">
      <div className="flex items-center gap-3">
        <Tags className="w-5 h-5 text-primary" />
        <h4 className="text-base font-normal text-ink uppercase tracking-tight">Categories</h4>
      </div>
      {categories.length === 0 ? (
        <p className="text-xs text-muted">No categories found.</p>
      ) : (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {categories.map(cat => (
            <div key={cat} className="flex items-center justify-between px-3 py-2 bg-surface-soft rounded-xl border border-hairline">
              <span className="text-xs font-semibold text-ink">{cat}</span>
              <button type="button" onClick={() => onRename(cat)}
                className="p-1.5 text-muted hover:text-ink hover:bg-surface-strong rounded-full transition-all">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
