import React from 'react';
import { CENTRALIZED_FIELD_REGISTRY, getFieldDefinition } from '../../data/fieldRegistry';
import { CheckCircle, Info, Database } from 'lucide-react';

interface SchemeRequirement {
  fieldName: string;
  fieldLabel?: string;
  dataType?: string;
  operator: string;
  requiredValue: string;
  mandatory?: boolean;
}

interface Props {
  requirements: SchemeRequirement[];
}

export const RequiredCitizenInfo: React.FC<Props> = ({ requirements }) => {
  // Deduplicate referenced field keys
  const uniqueFieldKeys = Array.from(
    new Set(requirements.map((r) => r.fieldName).filter(Boolean))
  );

  return (
    <div className="bg-slate-900/60 border border-slate-700/80 rounded-2xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              Required Citizen Information
              <span className="px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 rounded-full font-mono">
                {uniqueFieldKeys.length} Data Wallet Fields
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Automatically computed from the scheme's eligibility rules above.
            </p>
          </div>
        </div>
      </div>

      {uniqueFieldKeys.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm flex items-center justify-center gap-2">
          <Info className="w-4 h-4 text-slate-500" />
          No eligibility rules configured yet. Add rules above to populate required citizen fields.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {uniqueFieldKeys.map((key) => {
            const def = getFieldDefinition(key);
            const label = def ? def.label : key;
            const category = def ? def.category : 'Custom Field';
            const reqRule = requirements.find((r) => r.fieldName === key);
            const isMandatory = reqRule?.mandatory ?? true;

            return (
              <div
                key={key}
                className="flex items-start justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/40 transition-all"
              >
                <div className="flex items-start space-x-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-slate-200 block">
                      {label}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      key: {key} • {category}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                    isMandatory
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isMandatory ? 'Mandatory' : 'Optional'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
