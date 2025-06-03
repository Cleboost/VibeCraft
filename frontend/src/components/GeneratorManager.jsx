import React, { useState } from 'react';
import { Upload, File, Trash2, Plus, Check } from 'lucide-react';
import { SaveGenerator, DeleteGenerator } from '../../wailsjs/go/main/App';
import ConfirmModal from './ConfirmModal';

const GeneratorManager = ({ availableGenerators, onGeneratorSelect, onGeneratorsChange }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [generatorToDelete, setGeneratorToDelete] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.js')) {
      setSelectedFile(file);
      setUploadStatus('');
    } else {
      setUploadStatus('Veuillez sélectionner un fichier .js valide');
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadStatus('');
    
    try {
      const content = await selectedFile.text();
      await SaveGenerator(selectedFile.name, content);
      
      setUploadStatus('Générateur importé avec succès !');
      setSelectedFile(null);
      onGeneratorsChange();
      
      // Reset file input
      const fileInput = document.getElementById('generator-file');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      setUploadStatus('Erreur lors de l\'importation: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (generatorFilename) => {
    setGeneratorToDelete(generatorFilename);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!generatorToDelete) return;
    try {
      await DeleteGenerator(generatorToDelete);
      onGeneratorsChange();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setModalOpen(false);
      setGeneratorToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setModalOpen(false);
    setGeneratorToDelete(null);
  };

  const handleGeneratorClick = (generatorIdentifier) => {
    onGeneratorSelect(generatorIdentifier);
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.js')) {
      setSelectedFile(file);
      setUploadStatus('');
    } else {
      setUploadStatus('Veuillez sélectionner un fichier .js valide');
      setSelectedFile(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Import de fichier */}
      <div
        className={`border-2 border-dashed rounded-lg p-3 transition-colors ${
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <div className="text-xs text-gray-600 mb-2">
            Glisser un fichier .js ou cliquer pour importer
          </div>
          <input
            id="generator-file"
            type="file"
            accept=".js"
            onChange={handleFileSelect}
            className="hidden"
          />
          <label
            htmlFor="generator-file"
            className="inline-flex items-center space-x-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md cursor-pointer transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Choisir un fichier</span>
          </label>
        </div>

        {selectedFile && (
          <div className="mt-2 p-2 bg-blue-50 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <File className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-blue-800">{selectedFile.name}</span>
              </div>
              <button
                onClick={handleImport}
                disabled={isUploading}
                className="flex items-center space-x-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isUploading ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                <span>{isUploading ? 'Import...' : 'Importer'}</span>
              </button>
            </div>
          </div>
        )}

        {uploadStatus && (
          <div className={`mt-2 p-2 rounded-md text-xs ${
            uploadStatus.includes('succès') 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            {uploadStatus}
          </div>
        )}
      </div>

      {/* Liste des générateurs */}
      <div>
        <div className="text-xs font-medium text-gray-700 mb-2">Générateurs disponibles</div>
        <div className="space-y-1">
          {/* Générateur par défaut */}
          <button
            onClick={() => handleGeneratorClick('default')}
            className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-700">Balle rebondissante (défaut)</span>
            </div>
          </button>

          {/* Générateurs importés */}
          {availableGenerators && availableGenerators.map((generator, index) => {
            // Gérer le cas où generator peut être un objet ou une chaîne
            let generatorName = typeof generator === 'string' ? generator : generator.name;
            const generatorFilename = typeof generator === 'string' ? generator : generator.filename;
            // Si le manifeste est présent, utiliser son nom
            if (generator.manifest && generator.manifest.name) {
              generatorName = generator.manifest.name;
            }
            return (
              <div key={index} className="flex items-center space-x-1">
                <button
                  onClick={() => handleGeneratorClick(generatorFilename)}
                  className="flex-1 flex items-center space-x-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-xs text-gray-700 truncate">{generatorName}</span>
                </button>
                <button
                  onClick={() => handleDelete(generatorFilename)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {(!availableGenerators || availableGenerators.length === 0) && (
            <div className="text-xs text-gray-500 italic p-2">
              Aucun générateur personnalisé importé
            </div>
          )}
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Les fichiers .js contiennent une classe VideoGenerator
      </div>

      <ConfirmModal
        open={modalOpen}
        title="Supprimer le générateur"
        message={`Voulez-vous vraiment supprimer le générateur "${generatorToDelete}" ?`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default GeneratorManager; 