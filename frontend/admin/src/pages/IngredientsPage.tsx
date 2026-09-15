import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { apiGet, apiPost, apiDelete, getApiError } from '../lib/api'
import type { Ingredient } from '../types'

interface IngredientForm { name: string; defaultUnit: string }
const EMPTY_FORM: IngredientForm = { name: '', defaultUnit: '' }

export function IngredientsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<IngredientForm>(EMPTY_FORM)
  const [formErr, setFormErr] = useState('')
  const [toast, setToast] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ingredients'],
    queryFn: () => apiGet<Ingredient[]>('/admin/ingredients'),
  })

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const createIngredient = useMutation({
    mutationFn: () => apiPost('/admin/ingredients', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-ingredients'] })
      setModal(false)
      setForm(EMPTY_FORM)
      showToast('Ingredient created!')
    },
    onError: (e) => setFormErr(getApiError(e)),
  })

  const deleteIngredient = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/ingredients/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-ingredients'] })
      setDeleteTarget(null)
      showToast('Ingredient deleted.')
    },
    onError: (e) => showToast(getApiError(e)),
  })

  const ingredients = data ?? []
  const inputCls = 'w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-primary'
  const labelCls = 'block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5'

  return (
    <div>
      <PageHeader
        title="Ingredients"
        subtitle={`${ingredients.length} ingredients in catalog`}
        actions={
          <button
            onClick={() => { setForm(EMPTY_FORM); setFormErr(''); setModal(true) }}
            className="px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-lg flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">add</span> New Ingredient
          </button>
        }
      />

      <div className="p-4 sm:p-6">
        {toast && (
          <div className="mb-4 p-3 bg-green-50 border-l-4 border-status-active rounded-r-lg text-status-active text-sm font-medium">
            {toast}
          </div>
        )}

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5">
          <span className="material-symbols-outlined text-blue-600 text-xl shrink-0">info</span>
          <p className="text-blue-800 text-xs leading-relaxed">
            Manage your ingredient catalog here. Then go to <strong>Products</strong> to assign a recipe (ingredients per unit) to each product.
            The <strong>Delivery</strong> page will show a shopping list after orders are locked each night.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12"><Spinner size={32} /></div>
        ) : ingredients.length === 0 ? (
          <div className="bg-white rounded-xl border border-outline-variant p-12 text-center">
            <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-3 block">eco</span>
            <p className="text-on-surface font-medium mb-1">No ingredients yet</p>
            <p className="text-on-surface-variant text-sm mb-4">Add your first ingredient to start building product recipes.</p>
            <button
              onClick={() => { setForm(EMPTY_FORM); setFormErr(''); setModal(true) }}
              className="px-4 py-2 bg-primary text-on-primary text-sm font-semibold rounded-lg"
            >
              Add First Ingredient
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full w-full text-sm">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Default Unit</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {ingredients.map(ing => (
                    <tr key={ing.id} className="hover:bg-surface-container-low/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-base">nutrition</span>
                          <span className="font-medium text-on-surface">{ing.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-surface-container rounded-full text-xs text-on-surface-variant font-medium">
                          {ing.defaultUnit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteTarget(ing)}
                          className="px-3 py-1.5 border border-status-error text-status-error text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Ingredient" size="sm">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Name <span className="text-error">*</span></label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Orange, Spinach, Ginger"
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className={labelCls}>Default Unit <span className="text-error">*</span></label>
            <input
              value={form.defaultUnit}
              onChange={e => setForm(f => ({ ...f, defaultUnit: e.target.value }))}
              placeholder="e.g. pieces, grams, kg, ml"
              className={inputCls}
            />
          </div>
          {formErr && <p className="text-error text-sm">{formErr}</p>}
          <button
            onClick={() => createIngredient.mutate()}
            disabled={createIngredient.isPending || !form.name || !form.defaultUnit}
            className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {createIngredient.isPending && <Spinner size={16} />}
            Create Ingredient
          </button>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Ingredient" size="sm">
        {deleteTarget && (
          <div>
            <p className="text-on-surface mb-1">
              Delete <strong>{deleteTarget.name}</strong>?
            </p>
            <p className="text-on-surface-variant text-sm mb-6">
              This will fail if the ingredient is currently used in any product recipe.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-outline-variant rounded-xl text-sm font-medium text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteIngredient.mutate(deleteTarget.id)}
                disabled={deleteIngredient.isPending}
                className="flex-1 py-2.5 bg-status-error text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleteIngredient.isPending && <Spinner size={16} />}
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
