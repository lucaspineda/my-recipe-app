'use client';

import { Plus, Trash2 } from 'lucide-react';
import Modal from '../../../components/Modal/Modal';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { ShoppingList } from '../../../lista-de-compras/shared';
import {
  RecipeShoppingDraftItem,
  RecipeShoppingListSaveResult,
  ShoppingListFlowStep,
} from './types';

interface RecipeShoppingListModalProps {
  isOpen: boolean;
  step: ShoppingListFlowStep;
  loadingLists: boolean;
  lists: ShoppingList[];
  selectedList: ShoppingList | null;
  showCreateList: boolean;
  listName: string;
  savingList: boolean;
  preparingItems: boolean;
  draftItems: RecipeShoppingDraftItem[];
  savingItems: boolean;
  saveResult: RecipeShoppingListSaveResult | null;
  onClose: () => void;
  onSelectList: (list: ShoppingList) => void;
  onShowCreateList: () => void;
  onHideCreateList: () => void;
  onListNameChange: (value: string) => void;
  onCreateList: () => void;
  onContinueToConfirm: () => void;
  onToggleDraftItem: (draftItemId: string) => void;
  onBack: () => void;
  onSaveItems: () => void;
  onContinueViewingRecipe: () => void;
  onViewList: () => void;
}

export default function RecipeShoppingListModal({
  isOpen,
  step,
  loadingLists,
  lists,
  selectedList,
  showCreateList,
  listName,
  savingList,
  preparingItems,
  draftItems,
  savingItems,
  saveResult,
  onClose,
  onSelectList,
  onShowCreateList,
  onHideCreateList,
  onListNameChange,
  onCreateList,
  onContinueToConfirm,
  onToggleDraftItem,
  onBack,
  onSaveItems,
  onContinueViewingRecipe,
  onViewList,
}: RecipeShoppingListModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="mx-auto w-full max-w-lg text-left text-black">
        {step === 'select-list' && (
          <>
            <div className="mb-4 space-y-1.5 text-left">
              <h2 className="text-lg font-semibold leading-none tracking-tight text-black">Adicionar em uma lista</h2>
              <p className="text-sm text-black/90">
                Escolha uma lista para receber os ingredientes desta receita ou crie uma nova agora.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {loadingLists ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                  Carregando suas listas...
                </div>
              ) : showCreateList || lists.length === 0 ? (
                <div className="space-y-3 rounded-xl border border-secondary/15 bg-secondary/5 p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Criar nova lista</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Dê um nome para organizar os ingredientes desta receita.
                    </p>
                  </div>
                  <Input
                    value={listName}
                    onChange={(event) => onListNameChange(event.target.value)}
                    placeholder="Ex: Jantar da semana"
                    disabled={savingList || preparingItems}
                  />
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    {lists.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={onHideCreateList}
                        disabled={savingList || preparingItems}
                        className="text-gray-700 hover:bg-gray-100"
                      >
                        Cancelar
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={onCreateList}
                      disabled={savingList || preparingItems}
                      className="bg-secondary text-white hover:bg-secondary/90"
                    >
                      {savingList || preparingItems ? 'Criando...' : 'Criar e continuar'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {lists.map((list) => {
                      const isSelected = selectedList?.id === list.id;

                      return (
                        <button
                          key={list.id}
                          type="button"
                          onClick={() => onSelectList(list)}
                          className={`w-full rounded-xl border px-4 py-4 text-left transition-colors ${
                            isSelected
                              ? 'border-secondary bg-secondary/10'
                              : 'border-gray-200 bg-white hover:border-secondary/40 hover:bg-secondary/5'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-800">{list.name}</p>
                              <p className="mt-1 text-sm text-gray-500">
                                {list.pendingItemCount ?? 0} pendentes de {list.itemCount ?? 0} itens
                              </p>
                            </div>
                            {isSelected && (
                              <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-white">
                                Selecionada
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={onShowCreateList}
                    className="w-full border-secondary text-secondary hover:bg-secondary/10"
                  >
                    <Plus className="h-4 w-4" />
                    Criar nova lista
                  </Button>

                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onClose}
                      className="text-gray-700 hover:bg-gray-100"
                    >
                      Fechar
                    </Button>
                    <Button
                      type="button"
                      onClick={onContinueToConfirm}
                      disabled={!selectedList || preparingItems}
                      className="bg-secondary text-white hover:bg-secondary/90"
                    >
                      {preparingItems ? 'Preparando ingredientes...' : 'Continuar'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {step === 'confirm-items' && selectedList && (
          <>
            <div className="mb-4 space-y-1.5 text-left">
              <h2 className="text-lg font-semibold leading-none tracking-tight text-black">Confirmar ingredientes</h2>
              <p className="text-sm text-black/90">
                Revise o que vai entrar em <span className="font-semibold text-gray-900">{selectedList.name}</span>. Você pode remover o que não quiser adicionar agora.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-secondary/10 px-3 py-1 font-semibold text-secondary">
                  {draftItems.filter((item) => item.selected && !item.alreadyInList).length} para adicionar
                </span>
                {draftItems.some((item) => item.alreadyInList) && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-600">
                    {draftItems.filter((item) => item.alreadyInList).length} já estavam na lista
                  </span>
                )}
              </div>

              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {draftItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                      item.selected ? 'border-secondary/25 bg-secondary/5' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${item.selected ? 'text-gray-800' : 'text-gray-500'} ${!item.selected && !item.alreadyInList ? 'line-through' : ''}`}>
                        {item.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                        {item.quantityText && <span className="text-gray-500">{item.quantityText}</span>}
                        {item.alreadyInList && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                            Já está na lista
                          </span>
                        )}
                      </div>
                    </div>

                    {item.alreadyInList ? (
                      <Button type="button" variant="ghost" disabled className="text-gray-400">
                        Na lista
                      </Button>
                    ) : item.selected ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onToggleDraftItem(item.id)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onToggleDraftItem(item.id)}
                        className="text-secondary hover:bg-secondary/10"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onBack}
                  disabled={savingItems}
                  className="text-gray-700 hover:bg-gray-100"
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  onClick={onSaveItems}
                  disabled={savingItems}
                  className="bg-secondary text-white hover:bg-secondary/90"
                >
                  {savingItems ? 'Atualizando lista...' : 'Confirmar ingredientes'}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'success' && saveResult && (
          <>
            <div className="mb-4 space-y-1.5 text-left">
              <h2 className="text-lg font-semibold leading-none tracking-tight text-black">Sua lista foi atualizada</h2>
              <p className="text-sm text-black/90">
                {saveResult.addedCount > 0
                  ? `${saveResult.addedCount} ingrediente${saveResult.addedCount > 1 ? 's foram adicionados' : ' foi adicionado'} em ${saveResult.listName}.`
                  : `${saveResult.listName} já tinha todos os ingredientes selecionados.`}
              </p>
            </div>

            <div className="grid gap-2 pt-2">
              <Button
                type="button"
                onClick={onContinueViewingRecipe}
                className="w-full bg-secondary text-white hover:bg-secondary/90"
              >
                Continuar vendo a receita
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onViewList}
                className="w-full border-secondary text-secondary hover:bg-secondary/10"
              >
                Ver lista
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
