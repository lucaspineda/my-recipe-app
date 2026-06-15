'use client';

import Modal from '../../../components/Modal/Modal';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { MEAL_SLOT_LABELS, MEAL_SLOT_ORDER, MealSlotKey, formatWeekdayLabel } from '../../../planejamento/shared';

interface RecipeMealPlannerModalProps {
  isOpen: boolean;
  savingMeal: boolean;
  selectedDateKey: string;
  selectedSlot: MealSlotKey;
  servings: string;
  note: string;
  recipeTitle?: string;
  weekDayOptions: Array<{ dateKey: string; label: string }>;
  onClose: () => void;
  onSelectedDateChange: (value: string) => void;
  onSelectedSlotChange: (value: MealSlotKey) => void;
  onServingsChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSave: () => void;
  onViewPlanner: () => void;
}

export default function RecipeMealPlannerModal({
  isOpen,
  savingMeal,
  selectedDateKey,
  selectedSlot,
  servings,
  note,
  recipeTitle,
  weekDayOptions,
  onClose,
  onSelectedDateChange,
  onSelectedSlotChange,
  onServingsChange,
  onNoteChange,
  onSave,
  onViewPlanner,
}: RecipeMealPlannerModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="mx-auto w-full max-w-lg text-left text-black">
        <div className="mb-6 space-y-1.5">
          <h2 className="text-lg font-semibold leading-none tracking-tight text-black">🎉 Adicionar ao planejamento</h2>
          <p className="text-sm text-black/90">
            {recipeTitle ? `Escolha quando você quer cozinhar ${recipeTitle}.` : 'Escolha o dia e a refeição da semana.'}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Dia da semana</label>
            <select
              value={selectedDateKey}
              onChange={(event) => onSelectedDateChange(event.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="" disabled>
                Selecione um dia
              </option>
              {weekDayOptions.map((option) => (
                <option key={option.dateKey} value={option.dateKey}>
                  {formatWeekdayLabel(option.dateKey)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Refeição</label>
            <select
              value={selectedSlot}
              onChange={(event) => onSelectedSlotChange(event.target.value as MealSlotKey)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {MEAL_SLOT_ORDER.map((slotKey) => (
                <option key={slotKey} value={slotKey}>
                  {MEAL_SLOT_LABELS[slotKey]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Porções</label>
            <Input type="number" min="1" value={servings} onChange={(event) => onServingsChange(event.target.value)} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Observação opcional</label>
            <textarea
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              rows={3}
              placeholder="Ex: fazer porção extra para o dia seguinte"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="border-secondary/20 text-secondary hover:bg-secondary/5"
            onClick={onViewPlanner}
          >
            Ver planejamento
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose} className="text-gray-700 hover:bg-gray-100">
              Cancelar
            </Button>
            <Button type="button" onClick={onSave} disabled={savingMeal} className="bg-secondary text-white hover:bg-secondary/90">
              {savingMeal ? 'Salvando...' : 'Salvar no planejamento'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}