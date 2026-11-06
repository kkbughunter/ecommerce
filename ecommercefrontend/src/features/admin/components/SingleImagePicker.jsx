import { useEffect, useId, useRef } from "react";

export default function SingleImagePicker({ file, existingUrl, onChange, width, height, disabled, required = false }) {
  const id = useId();
  const previewRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    if (!file) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const url = URL.createObjectURL(file);
    if (previewRef.current) previewRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 p-3">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">Image</label>
      <p id={`${id}-help`} className="text-xs text-slate-500">Recommended: {width} × {height} px (W × H). Select one JPEG, PNG, or WebP image.</p>
      {(file || existingUrl) && <img ref={previewRef} src={file ? undefined : existingUrl} alt="Image preview" className="max-h-48 w-full rounded-lg bg-slate-50 object-contain" />}
      <input ref={inputRef} id={id} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} required={required && !existingUrl && !file} aria-describedby={`${id}-help`} className="block w-full text-sm text-slate-600" onChange={(event) => {
        onChange(event.target.files?.[0] || null);
      }} />
      {file && <button type="button" disabled={disabled} className="text-xs font-semibold text-slate-600 underline" onClick={() => {
        onChange(null);
        inputRef.current.value = "";
      }}>Cancel selected image</button>}
    </div>
  );
}
