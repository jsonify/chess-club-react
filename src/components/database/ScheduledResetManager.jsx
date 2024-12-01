// src/components/database/ScheduledResetManager.jsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Save, Loader2, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import DatabaseConfirmationModal from './DatabaseConfirmationModal';

export default function ScheduledResetManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [config, setConfig] = useState({
    enabled: false,
    dayOfWeek: "3",
    time: "15:30",
    lastReset: null
  });

  useEffect(() => {
    loadScheduleConfig();
  }, []);

  // Database operations
  const loadScheduleConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'attendance_reset_schedule')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setConfig(data.value);
      } else {
        await createDefaultConfig();
      }
    } catch (error) {
      console.error('Error loading schedule config:', error);
      toast.error('Failed to load schedule configuration');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultConfig = async () => {
    const defaultConfig = {
      enabled: false,
      dayOfWeek: "3",
      time: "15:30",
      lastReset: null
    };

    try {
      const { error } = await supabase
        .from('system_config')
        .insert({
          key: 'attendance_reset_schedule',
          value: defaultConfig
        });

      if (error) throw error;
      setConfig(defaultConfig);
    } catch (error) {
      console.error('Error creating default config:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('system_config')
        .update({ value: config })
        .eq('key', 'attendance_reset_schedule');

      if (error) throw error;
      toast.success('Schedule settings saved successfully');
      setShowSaveConfirmation(false);
    } catch (error) {
      console.error('Error saving schedule config:', error);
      toast.error('Failed to save schedule configuration');
    } finally {
      setSaving(false);
    }
  };

  // Render helpers
  const formatLastResetTime = (timestamp) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short'
    });
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  const ScheduleForm = () => (
    <div className="space-y-6">
      <div className="flex items-center">
        <input
          type="checkbox"
          id="enabled"
          checked={config.enabled}
          onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
          Enable automatic resets
        </label>
      </div>

      {config.lastReset && (
        <div className="text-sm text-gray-500">
          <p>Last reset: {formatLastResetTime(config.lastReset)}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <TimeSettingField
          label="Reset Day"
          type="select"
          value={config.dayOfWeek}
          onChange={(value) => setConfig(prev => ({ ...prev, dayOfWeek: value }))}
          disabled={!config.enabled}
          options={[
            { value: "0", label: "Sunday" },
            { value: "1", label: "Monday" },
            { value: "2", label: "Tuesday" },
            { value: "3", label: "Wednesday" },
            { value: "4", label: "Thursday" },
            { value: "5", label: "Friday" },
            { value: "6", label: "Saturday" }
          ]}
        />

        <TimeSettingField
          label="Reset Time"
          type="time"
          value={config.time}
          onChange={(value) => setConfig(prev => ({ ...prev, time: value }))}
          disabled={!config.enabled}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Automatic Reset Schedule</h2>
          <div className="flex items-center mt-1">
            <Globe className="h-4 w-4 text-gray-400 mr-1" />
            <p className="text-sm text-gray-500">
              All times are in Pacific Time (PT)
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          {isExpanded ? (
            <ChevronUp className="h-6 w-6" />
          ) : (
            <ChevronDown className="h-6 w-6" />
          )}
        </button>
        <Clock className="hidden md:block h-6 w-6 text-gray-400" />
      </div>

      {/* Content */}
      <div className={`${isExpanded ? 'block' : 'hidden md:block'}`}>
        <ScheduleForm />
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowSaveConfirmation(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <DatabaseConfirmationModal
        isOpen={showSaveConfirmation}
        icon={Save}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-100"
        title="Save Schedule Settings"
        description="Are you sure you want to update the automatic reset schedule?"
        confirmButtonText="Save Changes"
        confirmButtonColor="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
        isProcessing={saving}
        processingText="Saving..."
        onConfirm={handleSave}
        onCancel={() => setShowSaveConfirmation(false)}
      />
    </div>
  );
}

// Form field component
function TimeSettingField({ 
  label, 
  type, 
  value, 
  onChange, 
  disabled, 
  options = [] 
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
        />
      )}
    </div>
  );
}