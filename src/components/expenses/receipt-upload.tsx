"use client";

import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface ReceiptUploadProps {
  value: string | null;
  onChange: (path: string | null) => void;
  userId: string;
}

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

export function ReceiptUpload({ value, onChange, userId }: ReceiptUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(value ? value.split("/").pop() ?? null : null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Only PNG, JPG, WEBP or PDF receipts are allowed");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Receipt must be smaller than 10MB");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage.from("receipts").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    setUploading(false);

    if (error) {
      toast.error(error.message || "Failed to upload receipt");
      return;
    }

    setFileName(file.name);
    onChange(path);
    toast.success("Receipt uploaded");
  }

  async function handleView() {
    if (!value) return;
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("receipts").createSignedUrl(value, 300);
    if (error || !data) {
      toast.error("Could not open receipt");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {fileName ? (
        <div className="flex items-center justify-between rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3.5 py-2.5">
          <button type="button" onClick={handleView} className="flex items-center gap-2 text-sm hover:underline">
            <FileText className="h-4 w-4 text-brand-500" />
            <span className="truncate max-w-[220px]">{fileName}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFileName(null);
              onChange(null);
            }}
            className="text-muted hover:text-danger-500"
            aria-label="Remove receipt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Button type="button" variant="outline" className="w-full" onClick={() => inputRef.current?.click()} isLoading={uploading}>
          {!uploading && <Upload className="h-4 w-4" />}
          {uploading ? "Uploading..." : "Upload receipt (image or PDF)"}
        </Button>
      )}
    </div>
  );
}
