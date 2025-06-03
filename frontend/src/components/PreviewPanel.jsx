import React from 'react';
import { FileVideo, Clock, Monitor, Info } from 'lucide-react';
import VideoCanvas from './VideoCanvas';

const PreviewPanel = ({ generator, params, globalSettings, isRecording, setIsRecording }) => {
  const manifest = generator?.constructor?.manifest;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FileVideo className="w-4 h-4 text-green-600" />
          <h2 className="text-sm font-semibold text-gray-900">Prévisualisation</h2>
          {manifest && (
            <div className="flex items-center space-x-2 text-xs text-gray-600 ml-4">
              <Info className="w-3 h-3" />
              <span>{manifest.name} v{manifest.version}</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <Clock className="w-3 h-3" />
          <span>{globalSettings.duration}s</span>
          <Monitor className="w-3 h-3 ml-2" />
          <span>{globalSettings.framerate} FPS</span>
          <span className="ml-2 bg-gray-100 px-2 py-1 rounded">{globalSettings.format.toUpperCase()}</span>
        </div>
      </div>
      <VideoCanvas 
        generator={generator}
        params={params}
        globalSettings={globalSettings}
        onRecordingChange={setIsRecording}
      />
      {/* Infos vidéo */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <Clock className="w-4 h-4 text-blue-600 mx-auto mb-1" />
          <div className="text-xs text-blue-800 font-medium">{globalSettings.duration}s</div>
          <div className="text-xs text-blue-600">Durée</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <Monitor className="w-4 h-4 text-purple-600 mx-auto mb-1" />
          <div className="text-xs text-purple-800 font-medium">{globalSettings.framerate} FPS</div>
          <div className="text-xs text-purple-600">Framerate</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <FileVideo className="w-4 h-4 text-green-600 mx-auto mb-1" />
          <div className="text-xs text-green-800 font-medium">{globalSettings.format.toUpperCase()}</div>
          <div className="text-xs text-green-600">Format</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <span className="text-xs text-orange-800 font-medium">{globalSettings.resolution.replace('x', '×')}</span>
          <div className="text-xs text-orange-600">Résolution</div>
        </div>
      </div>
      {manifest && (
        <div className="mt-4 text-xs text-gray-600">
          <p className="font-medium">{manifest.description}</p>
          <p className="mt-1">Par {manifest.author}</p>
        </div>
      )}
    </div>
  );
};

export default PreviewPanel; 