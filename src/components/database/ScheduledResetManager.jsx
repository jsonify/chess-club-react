// src/components/database/ScheduledResetManager.jsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Save, Loader2, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function ScheduledResetManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [config, setConfig] = useState({
    enabled: false,
    dayOfWeek: "3", // Wednesday
    time: "15:30", // 3:30 PM
    lastReset: null
  });

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

  useEffect(() => {
    loadScheduleConfig();
  }, []);

  async function loadScheduleConfig() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'attendance_reset_schedule')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

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
  }

  async function createDefaultConfig() {
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
  }

  async function handleSave() {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('system_config')
        .update({ value: config })
        .eq('key', 'attendance_reset_schedule');

      if (error) throw error;

      toast.success('Schedule settings saved successfully');
    } catch (error) {
      console.error('Error saving schedule config:', error);
      toast.error('Failed to save schedule configuration');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* Header - Always visible */}
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

      {/* Content - Always visible on desktop, toggleable on mobile */}
      <div className={`space-y-6 ${isExpanded ? 'block' : 'hidden md:block'}`}>
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
          <div>
            <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700">
              Reset Day
            </label>
            <select
              id="dayOfWeek"
              value={config.dayOfWeek}
              onChange={(e) => setConfig(prev => ({ ...prev, dayOfWeek: e.target.value }))}
              disabled={!config.enabled}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {[
                { value: "0", label: "Sunday" },
                { value: "1", label: "Monday" },
                { value: "2", label: "Tuesday" },
                { value: "3", label: "Wednesday" },
                { value: "4", label: "Thursday" },
                { value: "5", label: "Friday" },
                { value: "6", label: "Saturday" }
              ].map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700">
              Reset Time
            </label>
            <input
              type="time"
              id="time"
              value={config.time}
              onChange={(e) => setConfig(prev => ({ ...prev, time: e.target.value }))}
              disabled={!config.enabled}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}