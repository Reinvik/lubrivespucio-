import React, { useState } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface ImageUploadProps {
  bucket: string;
  path: string;
  onUploadComplete: (url: string) => void;
  className?: string;
}

export function ImageUpload({ bucket, path, onUploadComplete, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onUploadComplete(data.publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen. Por favor intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-300 rounded-xl cursor-pointer hover:bg-zinc-50 hover:border-indigo-500 transition-all bg-white group">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
          ) : (
            <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-indigo-500 transition-colors mb-2" />
          )}
          <p className="mb-2 text-sm text-zinc-500 font-medium">
            <span className="font-semibold text-indigo-600">Haz clic para subir</span> o arrastra
          </p>
          <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">PNG, JPG (MAX. 5MB)</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
    </div>
  );
}
