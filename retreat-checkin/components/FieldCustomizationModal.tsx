"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";
import { RegistrationGroup } from "@/types";

interface FieldCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: RegistrationGroup[];
  availableFieldsByGroup: Map<string, string[]>;
  onSave: (groupId: string, fields: string[]) => void;
}

export function FieldCustomizationModal({
  isOpen,
  onClose,
  groups,
  availableFieldsByGroup,
  onSave
}: FieldCustomizationModalProps) {
  const [selectedFieldsByGroup, setSelectedFieldsByGroup] = useState<Map<string, Set<string>>>(new Map());

  useEffect(() => {
    if (isOpen) {
      const map = new Map<string, Set<string>>();
      groups.forEach(group => {
        map.set(group.id, new Set(group.visibleFields || []));
      });
      setSelectedFieldsByGroup(map);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, groups]);

  if (!isOpen) return null;

  const toggleField = (groupId: string, field: string) => {
    const next = new Map(selectedFieldsByGroup);
    const groupFields = new Set(next.get(groupId) || []);
    if (groupFields.has(field)) {
      groupFields.delete(field);
    } else {
      groupFields.add(field);
    }
    next.set(groupId, groupFields);
    setSelectedFieldsByGroup(next);
  };

  const handleSave = () => {
    selectedFieldsByGroup.forEach((fields, groupId) => {
      onSave(groupId, Array.from(fields));
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-background rounded-xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh]">

        <div className="flex items-center justify-between p-5 border-b border-border bg-card">
          <h2 className="text-xl font-semibold">Field Visibility</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <p className="text-sm text-muted-foreground mb-4">
            Select the fields you want to display as columns for attendees in each group.
          </p>

          <div className="space-y-6">
            {groups.map(group => {
              const availableFields = availableFieldsByGroup.get(group.id) || [];
              const groupSelectedFields = selectedFieldsByGroup.get(group.id) || new Set();

              return (
                <div key={group.id} className="border border-border rounded-lg p-4">
                  <h3 className="font-medium mb-3">{group.name}</h3>

                  {availableFields.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {availableFields.map(field => {
                        const isSelected = groupSelectedFields.has(field);
                        return (
                          <label
                            key={field}
                            onClick={(e) => {
                              e.preventDefault();
                              toggleField(group.id, field);
                            }}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                              isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                            }`}
                          >
                            <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              isSelected ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"
                            }`}>
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                            <span className="text-sm font-medium select-none">{field}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic text-center py-2">
                      No custom fields found for this group.
                    </div>
                  )}
                </div>
              );
            })}

            {groups.length === 0 && (
              <div className="text-sm text-muted-foreground italic text-center py-8">
                No groups found.
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
