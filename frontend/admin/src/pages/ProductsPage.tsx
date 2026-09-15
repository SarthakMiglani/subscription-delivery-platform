import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { apiGetPaged, apiGet, apiPost, apiPut, getApiError } from '../lib/api'
import { formatPaiseCompact } from '../lib/utils'
import type { AdminProduct, Ingredient, ProductIngredientEntry } from '../types'

interface ProductForm { name: string; description: string; pricePerUnitPaise: string; unitLabel: string; imageUrl: string }
const EMPTY_FORM: ProductForm = { name: '', description: '', pricePerUnitPaise: '', unitLabel: '', imageUrl: '' }

interface RecipeRow { ingredientId: string; quantityPerUnit: string; unit: string }

export function ProductsPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'create' | 'edit' | 'recipe' | null>(null)
  const [editing, setEditing] = useState<AdminProduct | null>(null)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [toast, setToast] = useState('')
  const [formErr, setFormErr] = useState('')

  // Recipe state
  const [recipeProduct, setRecipeProduct] = useState<AdminProduct | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => apiGetPaged<AdminProduct>('/admin/products', { size: 100 }),
  })

  const { data: ingredients } = useQuery({
    queryKey: ['admin-ingredients'],
    queryFn: () => apiGet<Ingredient[]>('/admin/ingredients'),
  })

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const createProduct = useMutation({
    mutationFn: () => apiPost('/admin/products', { ...form, pricePerUnitPaise: Math.round(parseFloat(form.pricePerUnitPaise) * 100) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); setModal(null); showToast('Product created!') },
    onError: (e) => setFormErr(getApiError(e)),
  })

  const updateProduct = useMutation({
    mutationFn: () => apiPut(`/admin/products/${editing!.id}`, { ...form, pricePerUnitPaise: Math.round(parseFloat(form.pricePerUnitPaise) * 100) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); setModal(null); showToast('Product updated!') },
    onError: (e) => setFormErr(getApiError(e)),
  })

  const disableProduct = useMutation({
    mutationFn: (id: string) => apiPost(`/admin/products/${id}/disable`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); showToast('Product disabled') },
    onError: (e) => showToast(getApiError(e)),
  })

  const enableProduct = useMutation({
    mutationFn: (id: string) => apiPost(`/admin/products/${id}/enable`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); showToast('Product enabled') },
    onError: (e) => showToast(getApiError(e)),
  })

  function openCreate() { setForm(EMPTY_FORM); setFormErr(''); setModal('create') }
  function openEdit(p: AdminProduct) {
    setEditing(p)
    setForm({ name: p.name, description: p.description, pricePerUnitPaise: (p.pricePerUnitPaise / 100).toString(), unitLabel: p.unitLabel, imageUrl: p.imageUrl || '' })
    setFormErr('')
    setModal('edit')
  }
  function openRecipe(p: AdminProduct) {
    setRecipeProduct(p)
    setModal('recipe')
  }

  const products = data?.items ?? []
  const allIngredients = ingredients ?? []
  const inputCls = 'w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-primary'
  const labelCls = 'block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5'

  return (
    <div>
      <PageHeader title="Products" subtitle={`${products.length} products`}
        actions={<button onClick={openCreate} className="px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-lg flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">add</span> New Product</button>} />

      <div className="p-4 sm:p-6">
        {toast && <div className="mb-4 p-3 bg-green-50 border-l-4 border-status-active rounded-r-lg text-status-active text-sm font-medium">{toast}</div>}

        {isLoading ? <div className="flex justify-center p-12"><Spinner size={32} /></div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map(p => (
              <div key={p.id} className={`bg-white rounded-xl border overflow-hidden ${p.isAvailable ? 'border-outline-variant' : 'border-status-error/30 opacity-70'}`}>
                {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-full h-32 object-cover" />}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-jakarta font-semibold text-on-surface">{p.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.isAvailable ? 'bg-green-100 text-status-active' : 'bg-red-100 text-status-error'}`}>
                      {p.isAvailable ? 'Available' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-sm mb-1">{p.description}</p>
                  <p className="text-on-surface-variant text-xs mb-2">{p.unitLabel}</p>
                  <p className="font-mono font-bold text-on-surface text-xl">{formatPaiseCompact(p.pricePerUnitPaise)}<span className="text-on-surface-variant text-xs font-normal">/unit</span></p>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-outline-variant">
                    <button onClick={() => openEdit(p)} className="flex-1 py-2 text-xs font-medium border border-outline-variant rounded-lg text-on-surface">Edit</button>
                    <button onClick={() => openRecipe(p)} className="flex-1 py-2 text-xs font-medium border border-primary rounded-lg text-primary flex items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">nutrition</span> Recipe
                    </button>
                    {p.isAvailable
                      ? <button onClick={() => disableProduct.mutate(p.id)} className="flex-1 py-2 text-xs font-medium border border-status-error rounded-lg text-status-error">Disable</button>
                      : <button onClick={() => enableProduct.mutate(p.id)} className="flex-1 py-2 text-xs font-medium bg-status-active text-white rounded-lg">Enable</button>
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit product modal */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'create' ? 'Create Product' : 'Edit Product'} size="md">
        <div className="space-y-4">
          <div><label className={labelCls}>Name <span className="text-error">*</span></label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} /></div>
          <div><label className={labelCls}>Description</label><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} /></div>
          <div><label className={labelCls}>Price per unit (₹) <span className="text-error">*</span></label><input value={form.pricePerUnitPaise} onChange={e => setForm(f => ({ ...f, pricePerUnitPaise: e.target.value }))} type="number" min="0" step="0.01" placeholder="25.00" className={inputCls} /></div>
          <div><label className={labelCls}>Unit Label</label><input value={form.unitLabel} onChange={e => setForm(f => ({ ...f, unitLabel: e.target.value }))} placeholder="500ml bottle" className={inputCls} /></div>
          <div><label className={labelCls}>Image URL</label><input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className={inputCls} /></div>
          {formErr && <p className="text-error text-sm">{formErr}</p>}
          <button
            onClick={() => modal === 'create' ? createProduct.mutate() : updateProduct.mutate()}
            disabled={createProduct.isPending || updateProduct.isPending || !form.name || !form.pricePerUnitPaise}
            className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60">
            {(createProduct.isPending || updateProduct.isPending) && <Spinner size={16} />}
            {modal === 'create' ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* Recipe modal */}
      <Modal open={modal === 'recipe'} onClose={() => setModal(null)} title={`Recipe — ${recipeProduct?.name ?? ''}`} size="md">
        {recipeProduct && (
          <RecipeEditor
            key={recipeProduct.id}
            productId={recipeProduct.id}
            allIngredients={allIngredients}
            onSaved={() => { setModal(null); showToast('Recipe saved!') }}
          />
        )}
      </Modal>
    </div>
  )
}

// ─── Recipe editor sub-component ─────────────────────────────────────────────

function RecipeEditor({
  productId,
  allIngredients,
  onSaved,
}: {
  productId: string
  allIngredients: Ingredient[]
  onSaved: () => void
}) {
  const qc = useQueryClient()
  const [rows, setRows] = useState<RecipeRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [err, setErr] = useState('')

  const { data: existing, isLoading } = useQuery({
    queryKey: ['product-recipe', productId],
    queryFn: () => apiGet<ProductIngredientEntry[]>(`/admin/products/${productId}/ingredients`),
    enabled: !!productId,
  })

  useEffect(() => {
    if (!loaded && existing) {
      setRows(existing.map(e => ({
        ingredientId: e.ingredientId,
        quantityPerUnit: String(e.quantityPerUnit),
        unit: e.unit,
      })))
      setLoaded(true)
    }
  }, [existing, loaded])

  const saveRecipe = useMutation({
    mutationFn: () => {
      const entries = rows
        .filter(r => r.ingredientId && r.quantityPerUnit && r.unit)
        .map(r => ({ ingredientId: r.ingredientId, quantityPerUnit: parseFloat(r.quantityPerUnit), unit: r.unit }))
      return apiPut<ProductIngredientEntry[]>(`/admin/products/${productId}/ingredients`, entries)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-recipe', productId] })
      onSaved()
    },
    onError: (e) => setErr(getApiError(e)),
  })

  function addRow() {
    setRows(r => [...r, { ingredientId: '', quantityPerUnit: '', unit: '' }])
  }

  function removeRow(idx: number) {
    setRows(r => r.filter((_, i) => i !== idx))
  }

  function updateRow(idx: number, field: keyof RecipeRow, value: string) {
    setRows(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }
      if (field === 'ingredientId' && value && !updated[idx].unit) {
        const ing = allIngredients.find(i => i.id === value)
        if (ing) updated[idx].unit = ing.defaultUnit
      }
      return updated
    })
  }

  const inputCls = 'border border-outline-variant rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-primary'

  if (isLoading) return <div className="flex justify-center py-8"><Spinner size={28} /></div>

  return (
    <div className="space-y-4">
      <p className="text-on-surface-variant text-sm">
        Define what ingredients are needed <strong>per unit</strong> of this product.
        e.g. Orange Juice = 2 oranges per bottle.
      </p>

      {rows.length === 0 ? (
        <div className="bg-surface-container-low rounded-xl p-6 text-center border border-dashed border-outline-variant">
          <span className="material-symbols-outlined text-on-surface-variant text-3xl mb-2 block">nutrition</span>
          <p className="text-on-surface-variant text-sm">No ingredients yet. Add the first one below.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                value={row.ingredientId}
                onChange={e => updateRow(idx, 'ingredientId', e.target.value)}
                className={`flex-1 min-w-0 ${inputCls}`}
              >
                <option value="">Select ingredient…</option>
                {allIngredients.map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.name}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Qty"
                value={row.quantityPerUnit}
                onChange={e => updateRow(idx, 'quantityPerUnit', e.target.value)}
                className={`w-20 shrink-0 ${inputCls}`}
              />
              <input
                placeholder="unit"
                value={row.unit}
                onChange={e => updateRow(idx, 'unit', e.target.value)}
                className={`w-24 shrink-0 ${inputCls}`}
              />
              <button
                onClick={() => removeRow(idx)}
                className="shrink-0 text-status-error hover:bg-red-50 rounded-lg p-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={addRow}
        className="w-full py-2 border border-dashed border-outline-variant rounded-lg text-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
      >
        <span className="material-symbols-outlined text-[16px]">add</span> Add Ingredient
      </button>

      {err && <p className="text-error text-sm">{err}</p>}

      <button
        onClick={() => saveRecipe.mutate()}
        disabled={saveRecipe.isPending}
        className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saveRecipe.isPending && <Spinner size={16} />}
        Save Recipe
      </button>
    </div>
  )
}
