import { useCallback, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApi } from './hooks/useApi'
import { mensajeError } from './lib/errores'
import { productos, type ProductoDTO } from './services/productos'
import { compras } from './services/compras'
import { useAuthStore } from './store'
import type { Categoria, ProductoInterno } from './types'

export function Catalogo({ interno = false, search = '' }: { interno?: boolean; search?: string }) {
  const [categoria, setCategoria] = useState('')
  const [pagina, setPagina] = useState(1)
  const [edicion, setEdicion] = useState<ProductoInterno>()
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const categorias = useApi(productos.categorias)
  const pedir = useCallback((signal: AbortSignal) => productos.listar<ProductoInterno>(interno, pagina, Number(categoria) || undefined, signal, search || undefined), [interno, pagina, categoria, search])
  const lista = useApi(pedir, true)
  const sesion = useAuthStore(s => s.sesion)
  const navegar = useNavigate()

  async function agregar(productoId: number) {
    if (!sesion) { navegar('/login'); return }
    setOcupado(true)
    setError('')
    try {
      const store = useAuthStore.getState()
      const id = store.carrito ?? (await compras.crear()).id
      store.guardarCarrito(id)
      const carrito = await compras.carrito(id, new AbortController().signal)
      const cantidad = carrito.items.find(i => i.productId === productoId)?.quantity ?? 0
      await compras.agregar(id, productoId, cantidad + 1)
      navegar('/carrito')
    } catch (err) { setError(mensajeError(err)) }
    finally { setOcupado(false) }
  }

  async function retirar(id: number) {
    if (!window.confirm('¿Retirar este producto del catálogo?')) return
    setOcupado(true)
    setError('')
    try { await productos.retirar(id); lista.recargar() }
    catch (err) { setError(mensajeError(err)) }
    finally { setOcupado(false) }
  }

  return <section className="space-y-5">
    {/* PORTADA: p-6 cambia el espacio interior y text-3xl el tamaño del título. */}
    <div className="rounded-xl bg-white p-6">
      <h1 className="text-3xl font-bold">{interno ? 'Inventario' : 'Catálogo de repuestos'}</h1>
      {search && <p className="mt-2 text-slate-600">Resultados para «{search}»</p>}
    </div>
    {categorias.error && <p role="alert">{categorias.error} <button onClick={categorias.recargar}>Reintentar categorías</button></p>}
    <label className="max-w-xs">Categoría<select value={categoria} onChange={e => { setCategoria(e.target.value); setPagina(1) }}>
      <option value="">Todas</option>{categorias.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select></label>
    {interno && <ProductoForm key={edicion?.id ?? 'nuevo'} producto={edicion} categorias={categorias.data ?? []} alGuardar={() => { setEdicion(undefined); lista.recargar() }} cancelar={() => setEdicion(undefined)} />}
    {error && <p role="alert">{error}</p>}
    {lista.cargando && <p role="status">Cargando productos…</p>}
    {lista.error && <p role="alert">{lista.error} <button onClick={lista.recargar}>Reintentar</button></p>}
    {lista.data?.data.length === 0 && <p>No hay productos que coincidan con la búsqueda y la categoría.</p>}
    {/* CUADRÍCULA: gap-4 separa tarjetas; lg:grid-cols-3 define tres columnas en escritorio. */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {lista.data?.data.map(p => <article key={p.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">{p.sku} · {p.category.name}</p>
        <h2 className="text-lg font-bold">{p.name}</h2>
        {p.description && <p className="text-sm text-slate-600">{p.description}</p>}
        <p className="mt-auto pt-2 text-2xl font-bold">Q {p.salePrice}</p>
        <p className={p.stock > 0 ? 'text-sm text-emerald-700' : 'text-sm text-rose-700'}>
          {p.stock > 0 ? `${p.stock} disponibles` : 'Agotado'}
        </p>
        {interno ? <><p>Costo Q {p.acquisitionCost} · {p.active ? 'Activo' : 'Retirado'}</p><div className="flex gap-2"><button onClick={() => setEdicion(p)}>Editar</button><button disabled={ocupado || !p.active} onClick={() => retirar(p.id)}>Retirar</button></div></>
          : (!sesion || sesion.usuario.role === 'CUSTOMER') && <button disabled={ocupado || p.stock < 1} onClick={() => agregar(p.id)}>{p.stock < 1 ? 'Sin stock' : 'Agregar al carrito'}</button>}
      </article>)}
    </div>
    {lista.data && lista.data.total > 0 && <nav className="flex items-center gap-3" aria-label="Páginas del catálogo">
      <button disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
      <span>Página {pagina}</span><button disabled={pagina * lista.data.limit >= lista.data.total} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
    </nav>}
    {!interno && sesion?.usuario.role === 'CUSTOMER' && <Link to="/carrito">Ver carrito</Link>}
  </section>
}

function ProductoForm({ producto, categorias, alGuardar, cancelar }: { producto?: ProductoInterno; categorias: Categoria[]; alGuardar: () => void; cancelar: () => void }) {
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const f = new FormData(form)
    const datos: ProductoDTO = {
      categoryId: Number(f.get('categoryId')), sku: String(f.get('sku')).trim(), name: String(f.get('name')).trim(),
      description: String(f.get('description')).trim(), acquisitionCost: Number(f.get('cost')), salePrice: Number(f.get('price')),
    }
    setError('')
    setGuardando(true)
    try { await productos.guardar(datos, producto?.id); form.reset(); alGuardar() }
    catch (err) { setError(mensajeError(err)) }
    finally { setGuardando(false) }
  }
  async function ajustar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!producto) return
    const f = new FormData(event.currentTarget)
    setError('')
    setGuardando(true)
    try { await productos.ajustar(producto.id, Number(f.get('delta')), String(f.get('reason'))); alGuardar() }
    catch (err) { setError(mensajeError(err)) }
    finally { setGuardando(false) }
  }
  return <div className="space-y-3 rounded-xl bg-white p-4">
    <h2 className="font-bold">{producto ? 'Editar producto' : 'Crear producto'}</h2>
    <form onSubmit={guardar} className="grid gap-3 sm:grid-cols-2">
      <label>Categoría<select name="categoryId" required defaultValue={producto?.category.id ?? ''}><option value="">Selecciona</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Código<input name="sku" required maxLength={60} defaultValue={producto?.sku} /></label>
      <label>Nombre<input name="name" required minLength={2} maxLength={150} defaultValue={producto?.name} /></label>
      <label>Descripción<input name="description" maxLength={2000} defaultValue={producto?.description ?? ''} /></label>
      <label>Costo<input name="cost" type="number" min="0" step=".01" required defaultValue={producto?.acquisitionCost} /></label>
      <label>Precio<input name="price" type="number" min=".01" step=".01" required defaultValue={producto?.salePrice} /></label>
      <button disabled={guardando || !categorias.length}>Guardar producto</button>
      {producto && <button type="button" onClick={cancelar}>Cancelar edición</button>}
    </form>
    {producto && <form onSubmit={ajustar} className="grid items-end gap-3 sm:grid-cols-3">
      <label>Ajuste de stock<input name="delta" type="number" step="1" required /></label>
      <label>Motivo<input name="reason" required minLength={5} maxLength={500} /></label>
      <button disabled={guardando}>Ajustar inventario</button>
    </form>}
    {error && <p role="alert">{error}</p>}
  </div>
}
