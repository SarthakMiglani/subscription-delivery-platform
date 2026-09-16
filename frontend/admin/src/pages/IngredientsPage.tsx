import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Wheat, Info, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { useToast } from '../components/ui/Toast'
import { apiGet, apiPost, apiDelete, getApiError } from '../lib/api'
import type { Ingredient } from '../types'

interface IngredientForm { name: string; defaultUnit: string }
const EMPTY_FORM: IngredientForm = { name: '', defaultUnit: '' }

export function IngredientsPage() {
  const qc = useQueryClient()
  const { show } = useToast()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<IngredientForm>(EMPTY_FORM)
  const [formErr, setFormErr] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ingredients'],
    queryFn: () => apiGet<Ingredient[]>('/admin/ingredients'),
  })

  const createIngredient = useMutation({
    mutationFn: () => apiPost('/admin/ingredients', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-ingredients'] })
      setModal(false)
      setForm(EMPTY_FORM)
      show('Ingredient created!')
    },
    onError: (e) => setFormErr(getApiError(e)),
  })

  const deleteIngredient = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/ingredients/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-ingredients'] })
      setDeleteTarget(null)
      show('Ingredient deleted.')
    },
    onError: (e) => show(getApiError(e), 'error'),
  })

  const ingredients = data ?? []

  return (
    <div>
      <PageHeader
        title="Ingredients"
        subtitle={`${ingredients.length} ingredients in catalog`}
        actions={
          <Button size="sm" icon={<Plus size={15} />} onClick={() => { setForm(EMPTY_FORM); setFormErr(''); setModal(true) }}>
            New Ingredient
          </Button>
        }
      />

      <div className="p-4 sm:p-6">
        <div className="mb-4 p-3.5 bg-[#dce9f7] rounded-xl flex items-start gap-2.5">
          <Info size={18} className="text-status-future shrink-0 mt-0.5" />
          <p className="text-[#1b3a5c] text-xs leading-relaxed">
            Manage your ingredient catalog here. Then go to <strong>Products</strong> to assign a recipe (ingredients per unit) to each product.
            The <strong>Delivery</strong> page will show a shopping list after orders are locked each night.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12"><Spinner size={32} /></div>
        ) : ingredients.length === 0 ? (
          <Card className="text-center py-12">
            <Wheat size={40} className="text-on-surface-variant mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-on-surface font-medium mb-1">No ingredients yet</p>
            <p className="text-on-surface-variant text-sm mb-4">Add your first ingredient to start building product recipes.</p>
            <Button onClick={() => { setForm(EMPTY_FORM); setFormErr(''); setModal(true) }}>Add First Ingredient</Button>
          </Card>
        ) : (
          <Card padded={false} className="overflow-hidden">
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
                  {ingredients.map((ing) => (
                    <tr key={ing.id} className="hover:bg-surface-container-low/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Wheat size={16} className="text-primary" />
                          <span className="font-medium text-on-surface">{ing.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-surface-container rounded-full text-xs text-on-surface-variant font-medium">{ing.defaultUnit}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => setDeleteTarget(ing)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Ingredient" size="sm">
        <div className="space-y-4">
          <TextField label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Orange, Spinach, Ginger" autoFocus />
          <TextField label="Default unit" required value={form.defaultUnit} onChange={(e) => setForm((f) => ({ ...f, defaultUnit: e.target.value }))} placeholder="e.g. pieces, grams, kg, ml" />
          {formErr && <p className="text-error text-sm">{formErr}</p>}
          <Button fullWidth loading={createIngredient.isPending} disabled={!form.name || !form.defaultUnit} onClick={() => createIngredient.mutate()}>
            Create Ingredient
          </Button>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Ingredient" size="sm">
        {deleteTarget && (
          <div>
            <p className="text-on-surface mb-1">Delete <strong>{deleteTarget.name}</strong>?</p>
            <p className="text-on-surface-variant text-sm mb-6">This will fail if the ingredient is currently used in any product recipe.</p>
            <div className="flex gap-3">
              <Button fullWidth variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button fullWidth variant="danger" className="!bg-status-error !text-white !border-transparent" loading={deleteIngredient.isPending} onClick={() => deleteIngredient.mutate(deleteTarget.id)}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
