import React from 'react';
import { FieldType } from '../../types/template';

interface FieldTypeSelectorProps {
  value: FieldType;
  onChange: (type: FieldType) => void;
  disabled?: boolean;
}

export const FieldTypeSelector: React.FC<FieldTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const fieldTypes: { value: FieldType; label: string; description: string }[] = [
    { value: 'text', label: 'Short Text', description: 'Single line text input' },
    { value: 'long_text', label: 'Long Text', description: 'Multi-line text area' },
    { value: 'number', label: 'Number', description: 'Numeric input' },
    { value: 'dropdown', label: 'Dropdown', description: 'Single selection from list' },
    { value: 'multi_select', label: 'Multi Select', description: 'Multiple selections from list' },
  ];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Field Type</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as FieldType)}
        disabled={disabled}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {fieldTypes.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label} - {type.description}
          </option>
        ))}
      </select>
    </div>
  );
};
