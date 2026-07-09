"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";

interface FieldCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  availableFields: string[];
  initialSelectedFields: string[];
  onSave: (fields: string[]) => void;
}

export function FieldCustomizationModal({ 
  isOpen, 
  onClose, 
  groupName, 
  availableFields, 
  initialSelectedFields, 
  onSave 
}: FieldCustomizationModalProps) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setSelectedFields(new Set(initialSelectedFields));
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, initialSelectedFields]);

  if (!isOpen) return null;

  const toggleField = (field: string) => {
    const next = new Set(selectedFields);
    if (next.has(field)) {
      next.delete(field);
    } else {
      next.add(field);
    }
    setSelectedFields(next);
  };

  const handleSave = () => {
    onSave(Array.from(selectedFields));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-background rounded-xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-5 border-b border-border bg-card">
          <h2 className="text-xl font-semibold">{groupName} Fields</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto max-h-[60vh] flex flex-col gap-3">
          <p className="text-sm text-muted-foreground mb-2">
            Select the fields you want to display as columns for attendees in this group.
          </p>
          
          <div className="flex flex-col gap-1">
            {availableFields.map(field => {
              const isSelected = selectedFields.has(field);
              return (
                <label 
                  key={field} 
                  onClick={(e) => {
                    e.preventDefault();
                    toggleField(field);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    isSelected ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"
                  }`}>
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-sm font-medium select-none">{field}</span>
                </label>
              );
            })}
            
            {availableFields.length === 0 && (
              <div className="text-sm text-muted-foreground italic text-center p-4">
                No custom fields found for this group.
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-border bg-muted/20 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
