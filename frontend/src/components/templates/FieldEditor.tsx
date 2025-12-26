import React, { useState } from 'react';
import { Trash2, GripVertical, Plus, X } from 'lucide-react';
import { TemplateField } from '../../types/template';
import { FieldTypeSelector } from './FieldTypeSelector';

interface FieldEditorProps {
  field: TemplateField;
  index: number;
  onUpdate: (field: TemplateField) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export const FieldEditor: React.FC<FieldEditorProps> = ({
  field,
  index,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) => {
  const [newOption, setNewOption] = useState('');

  const handleFieldChange = (key: keyof TemplateField, value: any) => {
    const updatedField = { ...field, [key]: value };

    // Auto-generate field_name from field_label
    if (key === 'field_label') {
      updatedField.field_name = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    }

    onUpdate(updatedField);
  };

  const addOption = () => {
    if (newOption.trim()) {
      const options = field.field_options || [];
      handleFieldChange('field_options', [...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (indexToRemove: number) => {
    const options = field.field_options || [];
    handleFieldChange(
      'field_options',
      options.filter((_, i) => i !== indexToRemove)
    );
  };

  const needsOptions = field.field_type === 'dropdown' || field.field_type === 'multi_select';

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-start gap-4">
        {/* Drag handle and order controls */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move up"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Move down"
            >
              ▼
            </button>
          </div>
        </div>

        {/* Field configuration */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Field {index + 1}</h4>
            <button
              type="button"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 p-1"
              title="Delete field"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Field Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Label *
            </label>
            <input
              type="text"
              value={field.field_label}
              onChange={(e) => handleFieldChange('field_label', e.target.value)}
              placeholder="e.g., Customer Name"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>

          {/* Field Type */}
          <FieldTypeSelector
            value={field.field_type}
            onChange={(type) => handleFieldChange('field_type', type)}
          />

          {/* Options for dropdown/multi-select */}
          {needsOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options *
              </label>
              <div className="space-y-2">
                {/* Existing options */}
                {(field.field_options || []).map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(field.field_options || [])];
                        newOptions[optIndex] = e.target.value;
                        handleFieldChange('field_options', newOptions);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(optIndex)}
                      className="p-2 text-red-600 hover:text-red-700"
                      title="Remove option"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Add new option */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                    placeholder="Add new option"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={addOption}
                    className="p-2 text-blue-600 hover:text-blue-700 border border-blue-600 rounded-md"
                    title="Add option"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Required checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id={`required-${index}`}
              checked={field.is_required}
              onChange={(e) => handleFieldChange('is_required', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={`required-${index}`} className="ml-2 block text-sm text-gray-900">
              Required field
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
