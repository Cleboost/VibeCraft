import React from 'react';
import { Sparkles, X, Package, Star, Zap, Shield, Bug, ArrowRight } from 'lucide-react';

const ChangelogDialog = ({ isVisible, onClose, version, releaseNotes, isFirstTime = false, showContinueButton = true }) => {
  if (!isVisible) return null;

  const getChangelogIcon = (line) => {
    const text = line.toLowerCase();
    if (text.includes('✨') || text.includes('new') || text.includes('ajout')) return <Star className="w-4 h-4 text-yellow-500" />;
    if (text.includes('⚡') || text.includes('amélioration') || text.includes('optimisation')) return <Zap className="w-4 h-4 text-blue-500" />;
    if (text.includes('🐛') || text.includes('fix') || text.includes('correction')) return <Bug className="w-4 h-4 text-green-500" />;
    if (text.includes('🔒') || text.includes('sécurité') || text.includes('security')) return <Shield className="w-4 h-4 text-red-500" />;
    return <Package className="w-4 h-4 text-gray-500" />;
  };

  const formatChangelog = (notes) => {
    if (!notes) return [];
    return notes.split('\n').filter(line => line.trim()).map(line => line.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-1 sm:p-4 lg:p-6">
      <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl w-full max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] lg:max-h-[85vh] flex flex-col border border-gray-100">
        <div className="bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 px-3 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-xl sm:rounded-2xl lg:rounded-3xl flex items-center justify-center shadow-xl flex-shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg lg:text-2xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                  {isFirstTime ? '🎉 Bienvenue dans VibeCraft !' : '🚀 VibeCraft mis à jour !'}
                </h2>
                <p className="text-gray-600 mt-1 text-xs sm:text-sm lg:text-lg leading-relaxed">
                  {isFirstTime 
                    ? `Découvrez toutes les fonctionnalités de la version ${version}`
                    : `Découvrez les nouveautés de la version ${version}`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg hover:bg-white/70 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8">
          {isFirstTime ? (
            <div className="text-center py-2 sm:py-4 lg:py-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto mb-3 sm:mb-4 lg:mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 lg:mb-4 px-2">Créez des vidéos incroyables</h3>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg leading-relaxed mb-4 sm:mb-6 lg:mb-8 max-w-xs sm:max-w-sm lg:max-w-md mx-auto px-2">
                VibeCraft vous permet de générer facilement des vidéos satisfaisantes et hypnotiques. 
                Explorez les générateurs disponibles et créez vos propres animations !
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
                <div className="bg-blue-50 rounded-lg sm:rounded-xl p-3">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-blue-900 mb-1 text-xs sm:text-sm lg:text-base">Générateurs intégrés</h4>
                  <p className="text-xs sm:text-xs lg:text-sm text-blue-700">Plusieurs générateurs prêts à utiliser</p>
                </div>
                <div className="bg-green-50 rounded-lg sm:rounded-xl p-3">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-green-900 mb-1 text-xs sm:text-sm lg:text-base">Paramètres avancés</h4>
                  <p className="text-xs sm:text-xs lg:text-sm text-green-700">Personnalisez chaque animation</p>
                </div>
                <div className="bg-purple-50 rounded-lg sm:rounded-xl p-3">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-purple-900 mb-1 text-xs sm:text-sm lg:text-base">Export facile</h4>
                  <p className="text-xs sm:text-xs lg:text-sm text-purple-700">Exportez en WebM haute qualité</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4 lg:mb-6">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Nouveautés et améliorations</h3>
              </div>
              
              {releaseNotes ? (
                <div className="space-y-2 sm:space-y-3 lg:space-y-4 max-h-48 sm:max-h-60 lg:max-h-80 overflow-y-auto pr-1 sm:pr-2">
                  {formatChangelog(releaseNotes).map((line, index) => (
                    <div key={index} className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4 p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      {getChangelogIcon(line)}
                      <p className="text-gray-700 flex-1 leading-relaxed text-xs sm:text-sm lg:text-base">
                        {line.replace(/^[✨⚡🐛🔒]\s*/, '')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 sm:py-6 lg:py-8">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto mb-3 sm:mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-600" />
                  </div>
                  <h4 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mb-2">Mise à jour installée</h4>
                  <p className="text-gray-600 text-xs sm:text-sm lg:text-base px-4">
                    VibeCraft a été mis à jour vers la version {version}. Profitez des dernières améliorations !
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-blue-200 mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-start space-x-2 sm:space-x-3 lg:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-blue-900 mb-1 text-xs sm:text-sm lg:text-base">
                  {isFirstTime ? 'Prêt à commencer ?' : 'Merci d\'utiliser VibeCraft !'}
                </h4>
                <p className="text-blue-700 leading-relaxed text-xs sm:text-xs lg:text-sm">
                  {isFirstTime 
                    ? 'Explorez les générateurs disponibles et commencez à créer vos premières vidéos satisfaisantes.'
                    : 'Continuez à créer des vidéos incroyables avec les dernières fonctionnalités.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
        {showContinueButton && (
          <div className="flex-shrink-0 p-3 sm:p-4 lg:p-6 border-t border-gray-100 bg-white">
            <button
              onClick={onClose}
              className="w-full inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl lg:rounded-2xl font-bold text-sm sm:text-base lg:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <span>{isFirstTime ? 'Commencer à créer' : 'Continuer'}</span>
              <ArrowRight className="w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangelogDialog; 