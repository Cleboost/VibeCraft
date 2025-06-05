import React, { useRef, useEffect, useState } from 'react';
import { Play, Square, Download, Eye } from 'lucide-react';

const VideoCanvas = ({ generator, params, globalSettings, onRecordingChange, canvasKey }) => {
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const animationRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);

  // Calculer la résolution courante
  const [canvasWidth, canvasHeight] = globalSettings.resolution.split('x').map(Number);

  useEffect(() => {
    if (generator && params && canvasRef.current) {
      startPreview();
    }
    return () => {
      stopAnimation();
    };
  }, [generator, params, globalSettings]);

  const startPreview = () => {
    if (!generator || !canvasRef.current) return;

    // Nettoyer l'animation précédente
    stopAnimation();
    if (typeof generator.cleanup === 'function') {
      generator.cleanup();
    }
    // Vider le canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    setIsPreviewing(true);
    generator.setup(canvas, params);
    
    const animate = () => {
      generator.draw(canvas, params);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsPreviewing(false);
  };

  const startRecording = async () => {
    if (!generator || !canvasRef.current || isRecording) return;

    const canvas = canvasRef.current;
    const [width, height] = globalSettings.resolution.split('x').map(Number);
    canvas.width = width;
    canvas.height = height;
    
    const stream = canvas.captureStream(globalSettings.framerate);
    
    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: `video/${globalSettings.format}`,
      videoBitsPerSecond: 2500000
    });

    const chunks = [];
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunks, { type: `video/${globalSettings.format}` });
      setRecordedVideo(blob);
      setIsRecording(false);
      onRecordingChange?.(false);
    };

    setIsRecording(true);
    onRecordingChange?.(true);
    mediaRecorderRef.current.start();

    // Arrêter l'enregistrement après la durée spécifiée
    setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }, globalSettings.duration * 1000);
  };

  const downloadVideo = () => {
    if (!recordedVideo) return;

    const url = URL.createObjectURL(recordedVideo);
    const link = document.createElement('a');
    link.href = url;
    link.download = `satisfying-video-${Date.now()}.${globalSettings.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const togglePreview = () => {
    if (isPreviewing) {
      stopAnimation();
    } else {
      startPreview();
    }
  };

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <div className="bg-black rounded-lg overflow-hidden border-2 border-gray-200 aspect-video">
        <canvas
          ref={canvasRef}
          key={canvasKey}
          width={canvasWidth}
          height={canvasHeight}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Contrôles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePreview}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isPreviewing
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{isPreviewing ? 'Arrêter' : 'Prévisualiser'}</span>
          </button>

          <button
            onClick={startRecording}
            disabled={isRecording || !generator}
            className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all"
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Générer la vidéo</span>
              </>
            )}
          </button>
        </div>

        {recordedVideo && (
          <button
            onClick={downloadVideo}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger</span>
          </button>
        )}
      </div>

      {/* État */}
      {isRecording && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-800">
              Enregistrement en cours... ({globalSettings.duration}s restantes)
            </span>
          </div>
        </div>
      )}

      {recordedVideo && !isRecording && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-800">
                Vidéo générée avec succès ! ({(recordedVideo.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCanvas; 