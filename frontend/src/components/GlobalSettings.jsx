import React from 'react';
import { Clock, Monitor, FileVideo, Maximize2 } from 'lucide-react';

const GlobalSettings = ({ settings, onChange }) => {
  const handleDurationChange = (e) => {
    onChange({
      ...settings,
      duration: parseInt(e.target.value)
    });
  };

  const handleFramerateChange = (framerate) => {
    onChange({
      ...settings,
      framerate: framerate
    });
  };

  const handleFormatChange = (format) => {
    onChange({
      ...settings,
      format: format
    });
  };

  const handleResolutionChange = (resolution) => {
    onChange({
      ...settings,
      resolution: resolution
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="w-3 h-3 text-gray-600" />
          <label className="text-xs font-medium text-gray-700">
            Durée: {settings.duration}s
          </label>
        </div>
        <input
          type="range"
          min="1"
          max="60"
          value={settings.duration}
          onChange={handleDurationChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1s</span>
          <span>60s</span>
        </div>
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-2">
          <Monitor className="w-3 h-3 text-gray-600" />
          <label className="text-xs font-medium text-gray-700">Framerate</label>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[30, 60, 120].map((fps) => (
            <button
              key={fps}
              onClick={() => handleFramerateChange(fps)}
              className={`px-2 py-1 text-xs rounded-md transition-all ${settings.framerate === fps
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {fps} FPS
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-2">
          <Maximize2 className="w-3 h-3 text-gray-600" />
          <label className="text-xs font-medium text-gray-700">Résolution</label>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {[
            { label: '720p', value: '1280x720' },
            { label: '1080p', value: '1920x1080' },
            { label: '1440p', value: '2560x1440' },
            { label: '4K', value: '3840x2160' }
          ].map((res) => (
            <button
              key={res.value}
              onClick={() => handleResolutionChange(res.value)}
              className={`px-2 py-1 text-xs rounded-md transition-all ${settings.resolution === res.value
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {res.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-2">
          <FileVideo className="w-3 h-3 text-gray-600" />
          <label className="text-xs font-medium text-gray-700">Format</label>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => handleFormatChange('webm')}
            className={`px-2 py-1 text-xs rounded-md transition-all ${settings.format === 'webm'
                ? 'bg-green-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            WebM
          </button>
          <button
            onClick={() => handleFormatChange('mp4')}
            disabled
            className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-400 cursor-not-allowed"
          >
            MP4 (bientôt)
          </button>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-2 mt-3">
        <p className="text-xs text-blue-800">
          Vidéo de <strong>{settings.duration}s</strong> à <strong>{settings.framerate} FPS</strong> en <strong>{settings.resolution}</strong> format <strong>{settings.format.toUpperCase()}</strong>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Environ {settings.duration * settings.framerate} frames au total
        </p>
      </div>
    </div>
  );
};

export default GlobalSettings; 