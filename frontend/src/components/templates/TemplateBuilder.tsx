import React, { useState, useEffect } from 'react';
import { Plus, Save, X, Users } from 'lucide-react';
import { TemplateField, Template } from '../../types/template';
import { FieldEditor } from './FieldEditor';
import { templatesService } from '../../services/templatesService';
import { useToast } from '../common/CustomToast';

interface TemplateBuilderProps {
  template?: Template;
  onSave: () => void;
  onCancel: () => void;
}

export const TemplateBuilder: React.FC<TemplateBuilderProps> = ({
  template,
  onSave,
  onCancel,
}) => {
  const toast = useToast();
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [fields, setFields] = useState<TemplateField[]>(template?.fields || []);
  const [sharedWithTeam, setSharedWithTeam] = useState(template?.shared_with_team || false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description);
      setFields(template.fields || []);
      setSharedWithTeam(template.shared_with_team || false);
    }
  }, [template]);

  const addField = () => {
    const newField: TemplateField = {
      field_name: '',
      field_label: '',
      field_type: 'text',
      is_required: false,
      display_order: fields.length,
      field_options: [],
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updatedField: TemplateField) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    setFields(newFields);
  };

  const deleteField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    // Update display_order for remaining fields
    const reorderedFields = newFields.map((field, i) => ({
      ...field,
      display_order: i,
    }));
    setFields(reorderedFields);
  };

  const moveFieldUp = (index: number) => {
    if (index === 0) return;
    const newFields = [...fields];
    [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    // Update display_order
    const reorderedFields = newFields.map((field, i) => ({
      ...field,
      display_order: i,
    }));
    setFields(reorderedFields);
  };

  const moveFieldDown = (index: number) => {
    if (index === fields.length - 1) return;
    const newFields = [...fields];
    [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    // Update display_order
    const reorderedFields = newFields.map((field, i) => ({
      ...field,
      display_order: i,
    }));
    setFields(reorderedFields);
  };

  const validateTemplate = (): boolean => {
    if (!name.trim()) {
      toast.error('Template name is required');
      return false;
    }

    if (fields.length === 0) {
      toast.error('Template must have at least one field');
      return false;
    }

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];

      if (!field.field_label.trim()) {
        toast.error(`Field ${i + 1}: Label is required`);
        return false;
      }

      // Auto-generate field_name if empty
      if (!field.field_name || !field.field_name.trim()) {
        field.field_name = field.field_label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '');
      }

      if (field.field_type === 'dropdown' || field.field_type === 'multi_select') {
        if (!field.field_options || field.field_options.length === 0) {
          toast.error(`Field ${i + 1}: ${field.field_type} must have at least one option`);
          return false;
        }
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateTemplate()) return;

    setSaving(true);

    try {
      if (template) {
        // Update existing template
        await templatesService.updateTemplate(template.id, {
          name,
          description,
          fields,
          shared_with_team: sharedWithTeam,
        });
        toast.success('Template updated successfully!');
      } else {
        // Create new template
        await templatesService.createTemplate({
          name,
          description,
          fields,
          shared_with_team: sharedWithTeam,
        });
        toast.success('Template created successfully!');
      }

      onSave();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {template ? 'Edit Template' : 'Create New Template'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Template Info */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Template Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Customer Support Call"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe when to use this template..."
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Share to Team Toggle */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Share with Team
                </label>
                <p className="text-xs text-gray-600">
                  Team members can use this template but cannot edit it
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sharedWithTeam}
                onChange={(e) => setSharedWithTeam(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Fields</h3>
          <button
            type="button"
            onClick={addField}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </button>
        </div>

        {fields.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 mb-4">No fields added yet</p>
            <button
              type="button"
              onClick={addField}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add First Field
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <FieldEditor
                key={index}
                field={field}
                index={index}
                onUpdate={(updatedField) => updateField(index, updatedField)}
                onDelete={() => deleteField(index)}
                onMoveUp={() => moveFieldUp(index)}
                onMoveDown={() => moveFieldDown(index)}
                canMoveUp={index > 0}
                canMoveDown={index < fields.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </button>
      </div>
    </div>
  );
};
