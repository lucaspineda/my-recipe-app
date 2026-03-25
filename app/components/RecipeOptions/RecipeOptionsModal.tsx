'use client';

import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Sparkles, RefreshCw, ArrowLeft, Wand2 } from 'lucide-react';
import Modal from '../Modal/Modal';
import { trackEvent } from '../../lib/analytics';
import { useState, useRef } from 'react';

interface LoadingMessage {
  title: string;
  subtitle: string;
}

interface RecipeOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  savingRecipe: boolean;
  loadingMsgIndex: number;
  loadingMessages: LoadingMessage[];
  recipeOptions: any[];
  onSelectRecipe: (recipe: any) => void;
  onRefresh: () => void;
  onChangeIngredients: () => void;
  onRefine: (refinement: string) => void;
  refining: boolean;
}

export default function RecipeOptionsModal({
  isOpen,
  onClose,
  loading,
  savingRecipe,
  loadingMsgIndex,
  loadingMessages,
  recipeOptions,
  onSelectRecipe,
  onRefresh,
  onChangeIngredients,
  onRefine,
  refining,
}: RecipeOptionsModalProps) {
  const [refinementText, setRefinementText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleRefinementChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRefinementText(e.target.value);
    // Auto-grow
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleSubmitRefine = () => {
    if (refinementText.trim() && !refining) {
      trackEvent('refine_recipe_options', { refinement: refinementText });
      onRefine(refinementText.trim());
      setRefinementText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={() => !loading && !savingRecipe && onClose()}>
      <div className="w-full max-w-2xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <DotLottieReact
              src="https://lottie.host/a4c75b0a-3bad-4479-80d9-8705fabc20f7/JK7A6PJh1v.json"
              loop
              autoplay
              style={{ width: 200, height: 200 }}
            />
            <div className="mt-4 min-h-[60px] flex flex-col items-center">
              <h3
                key={loadingMsgIndex}
                className="text-xl font-semibold text-gray-800 animate-fade-in"
              >
                {loadingMessages[loadingMsgIndex].title}
              </h3>
              <p
                key={`sub-${loadingMsgIndex}`}
                className="text-sm text-gray-500 mt-2 animate-fade-in"
              >
                {loadingMessages[loadingMsgIndex].subtitle}
              </p>
            </div>
            <div className="flex gap-1.5 mt-5">
              {loadingMessages.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i <= loadingMsgIndex ? 'bg-secondary w-6' : 'bg-gray-200 w-3'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : savingRecipe ? (
          <div className="flex flex-col items-center justify-center py-8">
            <DotLottieReact
              src="https://lottie.host/a4c75b0a-3bad-4479-80d9-8705fabc20f7/JK7A6PJh1v.json"
              loop
              autoplay
              style={{ width: 200, height: 200 }}
            />
            <h3 className="text-xl font-semibold mt-4 text-gray-800">Salvando sua receita...</h3>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-secondary" />
              <h3 className="text-xl font-bold text-gray-800">Escolha sua receita</h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">O Chefinho preparou 4 opções para você. Escolha a que mais te agrada!</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recipeOptions.map((recipe, index) => (
                <button
                  key={index}
                  onClick={() => {
                    trackEvent('select_recipe_option', { recipeTitle: recipe.titulo });
                    onSelectRecipe(recipe);
                  }}
                  className="text-left p-4 rounded-xl border-2 border-gray-200 hover:border-secondary hover:shadow-md transition-all bg-white group cursor-pointer"
                >
                  <div>
                    <h4 className="font-semibold text-gray-800 group-hover:text-secondary transition-colors text-sm leading-tight mb-2">
                      {recipe.titulo}
                    </h4>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                      {recipe.introducao}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-gray-100">
              {/* Refine recipes */}
              <div className="w-full mb-2">
                <div className="flex flex-col gap-2">
                  <textarea
                    ref={textareaRef}
                    rows={2}
                    value={refinementText}
                    onChange={handleRefinementChange}
                    placeholder="Ex: mais simples, adicione molho, remova ingredientes..."
                    disabled={refining}
                    className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 text-sm focus:outline-none focus:border-secondary disabled:bg-gray-100 disabled:text-gray-400 resize-none overflow-hidden"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitRefine();
                      }
                    }}
                  />
                  <button
                    onClick={handleSubmitRefine}
                    disabled={!refinementText.trim() || refining}
                    className="flex items-center justify-center gap-1.5 w-full sm:w-auto sm:self-end px-4 py-2.5 rounded-lg bg-secondary text-white font-medium text-sm hover:bg-secondary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Wand2 className="w-4 h-4" />
                    {refining ? 'Refinando...' : 'Refinar receitas'}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* <button
                onClick={() => {
                  trackEvent('refresh_recipe_options');
                  onRefresh();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-secondary text-white font-medium text-sm hover:bg-secondary/90 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Não gostei, me mostre outras opções
              </button> */}
              <button
                onClick={() => {
                  trackEvent('change_ingredients');
                  onChangeIngredients();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-gray-200 text-gray-700 font-medium text-sm hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Quero trocar meus ingredientes
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
