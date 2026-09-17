import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Wheat, Trash2, Droplets } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { useToast } from '../components/ui/Toast'
import { apiGetPaged, apiGet, apiPost, apiPut, getApiError } from '../lib/api'
import { formatPaiseCompact } from '../lib/utils'
import type { AdminProduct, Ingredient, ProductIngredientEntry } from '../types'

interface ProductForm { name: string; description: string; pricePerUnitPaise: string; unitLabel: string; imageUrl: string }
const EMPTY_FORM: ProductForm = { name: '', description: '', pricePerUnitPaise: '', unitLabel: '', imageUrl: '' }

interface RecipeRow { ingredientId: string; quantityPerUnit: string; unit: string }

export function ProductsPage() {
  const qc = useQueryClient()
  const { show } = useToast()
  const [modal, setModal] = useState<'create' | 'edit' | 'recipe' | null>(null)
  const [editing, setEditing] = useState<AdminProduct | null>(null)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [formErr, setFormErr] = useState('')
  const [recipeProduct, setRecipeProduct] = useState<AdminProduct | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => apiGetPaged<AdminProduct>('/admin/products', { size: 100 }),
  })

  const { data: ingredients } = useQuery({
    queryKey: ['admin-ingredients'],
    queryFn: () => apiGet<Ingredient[]>('/admin/ingredients'),
  })

  const createProduct = useMutation({
    mutationFn: () => apiPost('/admin/products', { ...form, pricePerUnitPaise: Math.round(parseFloat(form.pricePerUnitPaise) * 100) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); setModal(null); show('Product created!') },
    onError: (e) => setFormErr(getApiError(e)),
  })

  const updateProduct = useMutation({
    mutationFn: () => apiPut(`/admin/products/${editing!.id}`, { ...form, pricePerUnitPaise: Math.round(parseFloat(form.pricePerUnitPaise) * 100) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); setModal(null); show('Product updated!') },
    onError: (e) => setFormErr(getApiError(e)),
  })

  const disableProduct = useMutation({
    mutationFn: (id: string) => apiPost(`/admin/products/${id}/disable`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); show('Product disabled') },
    onError: (e) => show(getApiError(e), 'error'),
  })

  const enableProduct = useMutation({
    mutationFn: (id: string) => apiPost(`/admin/products/${id}/enable`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); show('Product enabled') },
    onError: (e) => show(getApiError(e), 'error'),
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

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products.length} products`}
        actions={
          <Button size="sm" icon={<Plus size={15} />} onClick={openCreate}>
            New Product
          </Button>
        }
      />

      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="flex justify-center p-12"><Spinner size={32} /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map((p, i) => (
              <Card
                key={p.id}
                padded={false}
                style={{ '--i': i } as React.CSSProperties}
                className={`stagger-item overflow-hidden ${p.isAvailable ? '' : '!border-status-error/30 opacity-70'}`}
              >
                {/* Image zone — always rendered, clipped to card corners */}
                <div className="relative w-full h-36 overflow-hidden rounded-t-[1.5rem] bg-primary-container/40">
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-contain p-3"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Droplets size={32} className="text-primary/30" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-jakarta font-semibold text-on-surface">{p.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.isAvailable ? 'bg-primary-container text-status-active' : 'bg-error-container text-status-error'}`}>
                      {p.isAvailable ? 'Available' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-sm mb-1">{p.description}</p>
                  <p className="text-on-surface-variant text-xs mb-2">{p.unitLabel}</p>
                  <p className="font-mono font-bold text-on-surface text-xl">
                    {formatPaiseCompact(p.pricePerUnitPaise)}
                    <span className="text-on-surface-variant text-xs font-normal">/unit</span>
                  </p>
                  <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-outline-variant/70">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" fullWidth onClick={() => openEdit(p)}>Edit</Button>
                      <Button size="sm" variant="outline" fullWidth icon={<Wheat size={13} />} className="!text-primary !border-primary/40" onClick={() => openRecipe(p)}>
                        Recipe
                      </Button>
                    </div>
                    {p.isAvailable ? (
                      <Button size="sm" variant="danger" fullWidth onClick={() => disableProduct.mutate(p.id)}>Disable</Button>
                    ) : (
                      <Button size="sm" fullWidth className="!bg-status-active" onClick={() => enableProduct.mutate(p.id)}>Enable</Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit product modal */}
      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'create' ? 'Create Product' : 'Edit Product'} size="md">
        <div className="space-y-4">
          <TextField label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <TextField label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <TextField
            label="Price per unit (₹)"
            required
            value={form.pricePerUnitPaise}
            onChange={(e) => setForm((f) => ({ ...f, pricePerUnitPaise: e.target.value }))}
            type="number"
            min="0"
            step="0.01"
            placeholder="25.00"
          />
          <TextField label="Unit label" value={form.unitLabel} onChange={(e) => setForm((f) => ({ ...f, unitLabel: e.target.value }))} placeholder="500ml bottle" />
          <TextField label="Image URL" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
          {formErr && <p className="text-error text-sm">{formErr}</p>}
          <Button
            fullWidth
            size="lg"
            loading={createProduct.isPending || updateProduct.isPending}
            disabled={!form.name || !form.pricePerUnitPaise}
            onClick={() => (modal === 'create' ? createProduct.mutate() : updateProduct.mutate())}
          >
            {modal === 'create' ? 'Create Product' : 'Save Changes'}
          </Button>
        </div>
      </Modal>

      {/* Recipe modal */}
      <Modal open={modal === 'recipe'} onClose={() => setModal(null)} title={`Recipe — ${recipeProduct?.name ?? ''}`} size="md">
        {recipeProduct && (
          <RecipeEditor
            key={recipeProduct.id}
            productId={recipeProduct.id}
            allIngredients={allIngredients}
            onSaved={() => { setModal(null); show('Recipe saved!') }}
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
      setRows(existing.map((e) => ({ ingredientId: e.ingredientId, quantityPerUnit: String(e.quantityPerUnit), unit: e.unit })))
      setLoaded(true)
    }
  }, [existing, loaded])

  const saveRecipe = useMutation({
    mutationFn: () => {
      const entries = rows
        .filter((r) => r.ingredientId && r.quantityPerUnit && r.unit)
        .map((r) => ({ ingredientId: r.ingredientId, quantityPerUnit: parseFloat(r.quantityPerUnit), unit: r.unit }))
      return apiPut<ProductIngredientEntry[]>(`/admin/products/${productId}/ingredients`, entries)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product-recipe', productId] })
      onSaved()
    },
    onError: (e) => setErr(getApiError(e)),
  })

  function addRow() {
    setRows((r) => [...r, { ingredientId: '', quantityPerUnit: '', unit: '' }])
  }
  function removeRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx))
  }
  function updateRow(idx: number, field: keyof RecipeRow, value: string) {
    setRows((prev) => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }
      if (field === 'ingredientId' && value && !updated[idx].unit) {
        const ing = allIngredients.find((i) => i.id === value)
        if (ing) updated[idx].unit = ing.defaultUnit
      }
      return updated
    })
  }

  const inputCls = 'focus-ring border border-outline-variant rounded-lg px-2.5 py-2 text-sm bg-surface-container-lowest focus:border-primary transition-colors'

  if (isLoading) return <div className="flex justify-center py-8"><Spinner size={28} /></div>

  return (
    <div className="space-y-4">
      <p className="text-on-surface-variant text-sm">
        Define what ingredients are needed <strong>per unit</strong> of this product. e.g. Orange Juice = 2 oranges per bottle.
      </p>

      {rows.length === 0 ? (
        <div className="bg-surface-container-low rounded-xl p-6 text-center border border-dashed border-outline-variant">
          <Wheat size={26} className="text-on-surface-variant mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-on-surface-variant text-sm">No ingredients yet. Add the first one below.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select value={row.ingredientId} onChange={(e) => updateRow(idx, 'ingredientId', e.target.value)} className={`flex-1 min-w-0 ${inputCls}`}>
                <option value="">Select ingredient…</option>
                {allIngredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>{ing.name}</option>
                ))}
              </select>
              <input type="number" min="0" step="0.01" placeholder="Qty" value={row.quantityPerUnit} onChange={(e) => updateRow(idx, 'quantityPerUnit', e.target.value)} className={`w-20 shrink-0 ${inputCls}`} />
              <input placeholder="unit" value={row.unit} onChange={(e) => updateRow(idx, 'unit', e.target.value)} className={`w-24 shrink-0 ${inputCls}`} />
              <button onClick={() => removeRow(idx)} aria-label="Remove ingredient" className="focus-ring shrink-0 text-status-error hover:bg-error-container rounded-lg p-1.5 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={addRow}
        className="focus-ring w-full py-2 border border-dashed border-outline-variant rounded-lg text-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
      >
        <Plus size={15} /> Add Ingredient
      </button>

      {err && <p className="text-error text-sm">{err}</p>}

      <Button fullWidth size="lg" loading={saveRecipe.isPending} onClick={() => saveRecipe.mutate()}>
        Save Recipe
      </Button>
    </div>
  )
}
