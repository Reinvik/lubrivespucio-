import React, { useState } from 'react';
import { UploadCloud, Loader2, ImageIcon, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface ImageUploadProps {
  bucket: string;
  path: string;
  onUploadComplete: (url: string) => void;
  className?: string;
  currentImageUrl?: string;       // ← muestra imagen existente
  previewClassName?: string;
}

export function ImageUpload({ bucket, path, onUploadComplete, className, currentImageUrl, previewClassName }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);

  // Sincronizar si la URL externa cambia (dados los settings que llegan de BD)
  React.useEffect(() => {
    if (currentImageUrl) setPreview(currentImageUrl);
  }, [currentImageUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local inmediato
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      setPreview(data.publicUrl);
      onUploadComplete(data.publicUrl);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(`Error al subir la imagen: ${error?.message || 'Error desconocido'}. Verifica que el bucket "${bucket}" está configurado en Supabase.`);
      setPreview(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreview(null);
    onUploadComplete('');
  };

  return (
    <div className={cn('relative', className)}>
      {preview ? (
        <div className="relative group">
          <div className={cn(
            'flex items-center justify-center rounded-xl border-2 border-zinc-200 bg-zinc-50 overflow-hidden',
            previewClassName || 'h-36'
          )}>
            <img
              src={preview}
              alt="Logo actual"
              className="max-h-full max-w-full object-contain p-2"
            />
          </div>
          {/* Overlay con botón de cambiar */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all rounded-xl flex items-center justify-center gap-3">
            <label className="cursor-pointer px-4 py-2 bg-white text-zinc-900 text-xs font-bold rounded-lg shadow flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5" />
              Cambiar
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-2 bg-red-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Quitar
            </button>
          </div>

          {/* Spinner mientras sube */}
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <label className={cn(
          'flex flex-col items-center justify-center w-full border-2 border-dashed border-zinc-300 rounded-xl cursor-pointer hover:bg-zinc-50 hover:border-indigo-400 transition-all bg-white group',
          previewClassName || 'h-36'
        )}>
          <div className="flex flex-col items-center justify-center py-4 px-2 text-center">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
            ) : (
              <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-indigo-500 transition-colors mb-2" />
            )}
            <p className="text-sm text-zinc-500 font-medium">
              <span className="font-semibold text-indigo-600">
                {uploading ? 'Subiendo...' : 'Clic o arrastra'}
              </span>
            </p>
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mt-1">PNG, JPG</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}
    </div>
  );
}
