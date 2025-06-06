import React, { useRef, useEffect, useState } from 'react';
import { Play, Square, Download, Eye, Loader2 } from 'lucide-react';
import { ConvertVideoToMP4, SaveTempFile, ReadTempFile, DeleteTempFile } from '../../wailsjs/go/main/App';

const VideoCanvas = ({ generator, params, globalSettings, onRecordingChange, canvasKey }) => {
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const animationRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [isConverting, setIsConverting] = useState(false);

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

    stopAnimation();
    if (typeof generator.cleanup === 'function') {
      generator.cleanup();
    }
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
    
    const pixelCount = width * height;
    let videoBitsPerSecond;
    if (pixelCount <= 1280 * 720) {
      videoBitsPerSecond = 5000000; 
    } else if (pixelCount <= 1920 * 1080) {
      videoBitsPerSecond = 8000000; 
    } else if (pixelCount <= 2560 * 1440) {
      videoBitsPerSecond = 12000000; 
    } else {
      videoBitsPerSecond = 20000000; 
    }
    
    stopAnimation();
    
    const stream = canvas.captureStream(globalSettings.framerate);
    
    let mimeType = 'video/webm';
    const codecOptions = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    
    for (const option of codecOptions) {
      if (MediaRecorder.isTypeSupported(option)) {
        mimeType = option;
        break;
      }
    }
    
    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: mimeType,
      videoBitsPerSecond: videoBitsPerSecond
    });

    const chunks = [];
    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      setRecordedVideo(blob);
      setIsRecording(false);
      onRecordingChange?.(false);
      startPreview();
    };

    setIsRecording(true);
    onRecordingChange?.(true);
    
    generator.setup(canvas, params);
    
    mediaRecorderRef.current.start(100); 
    
    const recordingAnimate = () => {
      generator.draw(canvas, params);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        animationRef.current = requestAnimationFrame(recordingAnimate);
      }
    };
    
    recordingAnimate();

    setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        stopAnimation();
      }
    }, globalSettings.duration * 1000);
  };

  const downloadVideo = async () => {
    if (!recordedVideo) return;

    if (globalSettings.format === 'mp4') {
      setIsConverting(true);
      try {
        const webmBlob = recordedVideo;
        const webmArrayBuffer = await webmBlob.arrayBuffer();
        const webmUint8Array = new Uint8Array(webmArrayBuffer);
        
        const timestamp = Date.now();
        const tempWebmPath = `${timestamp}_temp.webm`;
        const mp4Path = `${timestamp}_video.mp4`;
        
        await SaveTempFile(tempWebmPath, Array.from(webmUint8Array));
        await ConvertVideoToMP4(tempWebmPath, mp4Path);
        
        const mp4Data = await ReadTempFile(mp4Path);
        
        if (!mp4Data || mp4Data.length === 0) {
          throw new Error('Fichier MP4 vide reçu du backend');
        }
        
        const uint8Array = new Uint8Array(mp4Data);
        const mp4Blob = new Blob([uint8Array], { type: 'video/mp4' });
        
        if (mp4Blob.size === 0) {
          throw new Error('Erreur lors de la création du fichier MP4');
        }
        
        const url = URL.createObjectURL(mp4Blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `satisfying-video-${timestamp}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        await DeleteTempFile(tempWebmPath);
        await DeleteTempFile(mp4Path);
        
        setIsConverting(false);
      } catch (error) {
        alert(`Erreur lors de la conversion MP4: ${error.message}`);
        setIsConverting(false);
      }
    } else {
      const url = URL.createObjectURL(recordedVideo);
      const link = document.createElement('a');
      link.href = url;
      link.download = `satisfying-video-${Date.now()}.${globalSettings.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
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
      <div className="bg-black rounded-lg overflow-hidden border-2 border-gray-200 aspect-video">
        <canvas
          ref={canvasRef}
          key={canvasKey}
          width={canvasWidth}
          height={canvasHeight}
          className="w-full h-full object-contain"
        />
      </div>

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
            disabled={isConverting}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all"
          >
            {isConverting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Conversion...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Télécharger</span>
              </>
            )}
          </button>
        )}
      </div>

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
              <div className="text-sm text-green-800">
                <div>
                  Vidéo générée avec succès ! ({(recordedVideo.size / 1024 / 1024).toFixed(2)} MB)
                  {globalSettings.format === 'mp4' && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      MP4 avec conversion FFmpeg
                    </span>
                  )}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Format: {recordedVideo.type} • 
                  Résolution: {globalSettings.resolution} • 
                  Durée: {globalSettings.duration}s • 
                  {globalSettings.framerate} FPS
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isConverting && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm text-blue-800">
              Conversion en MP4 en cours...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCanvas; 