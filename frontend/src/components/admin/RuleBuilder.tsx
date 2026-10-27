import React, { useState } from 'react';
import { CENTRALIZED_FIELD_REGISTRY, type DataWalletFieldDefinition } from '../../data/fieldRegistry';
import { Plus, Trash2, Filter, AlertCircle, ShieldAlert } from 'lucide-react';

export interface SchemeRequirementItem {
  id?: number;
  fieldName: string;
  fieldLabel?: string;
  dataType?: string;
  operator: string;
  requiredValue: string;
  mandatory?: boolean;
  weight?: number;
  logicalGroup?: string;
  dependsOnField?: string;
  dependsOnValue?: string;
  questionText?: string;
  helpText?: string;
  unit?: string;
  optionsCsv?: string;
}

interface Props {
  requirements: SchemeRequirementItem[];
  onChange: (updated: SchemeRequirementItem[]) => void;
}

export const RuleBuilder: React.FC<Props> = ({ requirements, onChange }) => {
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);

  const addRule = (def?: DataWalletFieldDefinition) => {
    const newField = def ? def.key : 'income';
    const defaultOp = def?.type === 'number' ? '<=' : def?.type === 'boolean' ? '==' : '==';
    const defaultValue = def?.type === 'number' ? '250000' : def?.type === 'boolean' ? 'true' : def?.options?.[0] || '';

    const newRule: SchemeRequirementItem = {
      fieldName: newField,
      fieldLabel: def?.label || newField,
      dataType: def?.type ? def.type.toUpperCase() : 'TEXT',
      operator: defaultOp,
      requiredValue: defaultValue,
      mandatory: true,
      weight: 20,
      logicalGroup: 'AND',
      questionText: def?.description || '',
      optionsCsv: def?.options?.join(', ') || '',
    };

    onChange([...requirements, newRule]);
  };

  const addCustomFieldRule = () => {
    if (!customFieldKey.trim()) return;
    const key = customFieldKey.trim();
    const newRule: SchemeRequirementItem = {
      fieldName: key,
      fieldLabel: key,
      dataType: 'TEXT',
      operator: '==',
      requiredValue: '',
      mandatory: true,
      weight: 20,
      logicalGroup: 'AND',
    };
    onChange([...requirements, newRule]);
    setCustomFieldKey('');
    setShowCustomFieldModal(false);
  };

  const removeRule = (index: number) => {
    const copy = [...requirements];
    copy.splice(index, 1);
    onChange(copy);
  };

  const updateRule = (index: number, field: keyof SchemeRequirementItem, val: any) => {
    const copy = [...requirements];
    const item = { ...copy[index], [field]: val };

    if (field === 'fieldName') {
      const def = CENTRALIZED_FIELD_REGISTRY.find((f) => f.key.toLowerCase() === String(val).toLowerCase());
      if (def) {
        item.fieldLabel = def.label;
        item.dataType = def.type.toUpperCase();
        item.optionsCsv = def.options?.join(', ') || item.optionsCsv;
        if (def.type === 'boolean' && item.requiredValue !== 'true' && item.requiredValue !== 'false') {
          item.requiredValue = 'true';
        }
      }
    }

    copy[index] = item;
    onChange(copy);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-400" />
            Dynamic Eligibility Rule Builder
          </h3>
          <p className="text-xs text-slate-400">
            Define specific field criteria, operators, target values, and conditional prerequisites.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            onChange={(e) => {
              if (e.target.value === 'CUSTOM') {
                setShowCustomFieldModal(true);
              } else if (e.target.value) {
                const def = CENTRALIZED_FIELD_REGISTRY.find((f) => f.key === e.target.value);
                addRule(def);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-colors border border-indigo-400/30"
          >
            <option value="" disabled>
              + Add Field Rule...
            </option>
            {CENTRALIZED_FIELD_REGISTRY.map((f) => (
              <option key={f.key} value={f.key}>
                + {f.label} ({f.category})
              </option>
            ))}
            <option value="CUSTOM">+ Register Custom Data Wallet Field...</option>
          </select>
        </div>
      </div>

      {requirements.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-slate-800 rounded-2xl text-center space-y-3 bg-slate-900/30">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <p className="text-sm font-medium text-slate-300">
            No eligibility requirements added yet.
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click "+ Add Field Rule" above to select Data Wallet fields for this scheme.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requirements.map((req, index) => {
            const def = CENTRALIZED_FIELD_REGISTRY.find((f) => f.key.toLowerCase() === req.fieldName.toLowerCase());

            return (
              <div
                key={index}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all shadow-md space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-indigo-400 flex items-center justify-center">
                      {index + 1}
                    </span>
                    <select
                      value={req.fieldName}
                      onChange={(e) => updateRule(index, 'fieldName', e.target.value)}
                      className="bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                      {CENTRALIZED_FIELD_REGISTRY.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label} ({f.key})
                        </option>
                      ))}
                      {!def && <option value={req.fieldName}>{req.fieldName} (Custom)</option>}
                    </select>
                  </div>

                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-1.5 text-xs text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={req.mandatory ?? true}
                        onChange={(e) => updateRule(index, 'mandatory', e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      <span>Mandatory</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => removeRule(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete Rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Operator */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Operator
                    </label>
                    <select
                      value={req.operator}
                      onChange={(e) => updateRule(index, 'operator', e.target.value)}
                      className="w-full bg-slate-800 text-white text-xs rounded-lg px-3 py-2 border border-slate-700"
                    >
                      <option value="==">Equals (=)</option>
                      <option value="!=">Not Equals (!=)</option>
                      <option value="<=">Less Than Or Equal (&lt;=)</option>
                      <option value=">=">Greater Than Or Equal (&gt;=)</option>
                      <option value="<">Less Than (&lt;)</option>
                      <option value=">">Greater Than (&gt;)</option>
                      <option value="IN">In List (comma separated)</option>
                      <option value="CONTAINS">Contains Text</option>
                    </select>
                  </div>

                  {/* Required Value */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Target Value
                    </label>
                    {def?.type === 'boolean' ? (
                      <select
                        value={req.requiredValue}
                        onChange={(e) => updateRule(index, 'requiredValue', e.target.value)}
                        className="w-full bg-slate-800 text-white text-xs rounded-lg px-3 py-2 border border-slate-700"
                      >
                        <option value="true">True / Yes</option>
                        <option value="false">False / No</option>
                      </select>
                    ) : def?.options && def.options.length > 0 && req.operator !== 'IN' ? (
                      <select
                        value={req.requiredValue}
                        onChange={(e) => updateRule(index, 'requiredValue', e.target.value)}
                        className="w-full bg-slate-800 text-white text-xs rounded-lg px-3 py-2 border border-slate-700"
                      >
                        {def.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={def?.type === 'number' ? 'number' : 'text'}
                        value={req.requiredValue}
                        onChange={(e) => updateRule(index, 'requiredValue', e.target.value)}
                        placeholder={req.operator === 'IN' ? 'Tamil Nadu, Kerala' : 'Enter value...'}
                        className="w-full bg-slate-800 text-white text-xs rounded-lg px-3 py-2 border border-slate-700"
                      />
                    )}
                  </div>

                  {/* Weight / Unit */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Acres, ₹"
                        value={req.unit || ''}
                        onChange={(e) => updateRule(index, 'unit', e.target.value)}
                        className="w-full bg-slate-800 text-white text-xs rounded-lg px-2 py-2 border border-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Weight
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={req.weight ?? 20}
                        onChange={(e) => updateRule(index, 'weight', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-800 text-white text-xs rounded-lg px-2 py-2 border border-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Conditional Logic Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                      Depends On Prerequisite Field (Optional)
                    </label>
                    <select
                      value={req.dependsOnField || ''}
                      onChange={(e) => updateRule(index, 'dependsOnField', e.target.value)}
                      className="w-full bg-slate-800 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700"
                    >
                      <option value="">No Prerequisite (Always Applies)</option>
                      {CENTRALIZED_FIELD_REGISTRY.map((f) => (
                        <option key={f.key} value={f.key}>
                          IF {f.label} ({f.key})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                      Prerequisite Value Match
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. YES or true"
                      value={req.dependsOnValue || ''}
                      onChange={(e) => updateRule(index, 'dependsOnValue', e.target.value)}
                      className="w-full bg-slate-800 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Field Modal */}
      {showCustomFieldModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              Register New Data Wallet Field
            </h3>
            <p className="text-xs text-slate-400">
              If this scheme requires a citizen attribute that does not exist in standard registry, enter its key name here. It will be added to the wallet schema dynamically.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Field Key (camelCase)
              </label>
              <input
                type="text"
                value={customFieldKey}
                onChange={(e) => setCustomFieldKey(e.target.value)}
                placeholder="e.g. rationCardType, landIrrigationStatus"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomFieldModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addCustomFieldRule}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
              >
                Add Custom Field
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
