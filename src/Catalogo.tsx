import { useCallback, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CategoriaForm } from './CategoriaForm'
import { FotoProducto, fotosDelProducto } from './FotoProducto'
import { useApi } from './hooks/useApi'
import { mensajeError } from './lib/errores'
import { productos, type ProductoDTO } from './services/productos'
import { compras } from './services/compras'
import { useAuthStore } from './store'
import type { Categoria, Producto, ProductoInterno } from './types'

const formatoPrecio = new Intl.NumberFormat('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Con 1 a 3 unidades se avisa que quedan pocas. Cero conserva el estado Agotado.
const LIMITE_STOCK_BAJO = 3

function Disponibilidad({ stock }: { stock: number }) {
  if (stock === 0) return <p className="text-sm font-medium text-rose-700">Agotado</p>
  if (stock <= LIMITE_STOCK_BAJO) return <p className="rounded-full bg-amber-100 px-2.5 py-1 text-sm font-semibold text-amber-900">
    Stock bajo · {stock === 1 ? 'Queda 1 unidad' : `Quedan ${stock} unidades`}
  </p>
  return <p className="text-sm font-medium text-emerald-700">{stock} disponibles</p>
}

export function Catalogo({ interno = false, search = '' }: { interno?: boolean; search?: string }) {
  const [categoria, setCategoria] = useState('')
  // Al cambiar el texto, se busca desde la página 1 y se conserva la categoría.
  const [paginacion, setPaginacion] = useState({ search, pagina: 1 })
  const pagina = paginacion.search === search ? paginacion.pagina : 1
  const setPagina = (numero: number) => setPaginacion({ search, pagina: numero })
  const [edicion, setEdicion] = useState<ProductoInterno>()
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const categorias = useApi(productos.categorias)
  // El backend aplica el filtro de categoría, la búsqueda y el número de página.
  const pedir = useCallback((signal: AbortSignal) => productos.listar<ProductoInterno>(interno, pagina, Number(categoria) || undefined, signal, search || undefined), [interno, pagina, categoria, search])
  const lista = useApi(pedir, true)
  const sesion = useAuthStore(s => s.sesion)
  const navegar = useNavigate()
  const mostrarPortada = !interno && !search
  const TituloCatalogo = mostrarPortada ? 'h2' : 'h1'
  const TituloProducto = mostrarPortada ? 'h3' : 'h2'

  async function agregar(event: FormEvent<HTMLFormElement>, producto: Producto) {
    event.preventDefault()
    if (!sesion) { navegar('/login'); return }
    const unidades = Number(new FormData(event.currentTarget).get('unidades'))
    setOcupado(true)
    setError('')
    try {
      const store = useAuthStore.getState()
      const id = store.carrito ?? (await compras.crear()).id
      store.guardarCarrito(id)
      const carrito = await compras.carrito(id, new AbortController().signal)
      // Suma lo que el cliente eligió a la cantidad que ya está guardada en el carrito.
      const linea = carrito.items.find(i => i.productId === producto.id)
      const enCarrito = linea?.quantity ?? 0
      const maximo = Math.min(linea?.product.stock ?? producto.stock, 10_000)
      if (enCarrito + unidades > maximo) {
        setError(`Puedes agregar hasta ${Math.max(0, maximo - enCarrito)} unidades más de ${producto.name}.`)
        return
      }
      await compras.agregar(id, producto.id, enCarrito + unidades)
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
    {/* PORTADA: imagen generada en Stitch. Las tarjetas se completan con la API. */}
    {mostrarPortada && <div className="grid overflow-hidden rounded-2xl bg-tienda-cabecera text-white md:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10">
        <h1 className="max-w-md text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Repuestos para tu vehículo
        </h1>
        <p className="mt-3 max-w-sm text-sm text-slate-200 sm:text-base">Busca por nombre o código y consulta las existencias antes de comprar.</p>
      </div>
      <img src="/portada-repuestos.jpg" alt="" width={512} height={286} className="h-36 w-full object-cover object-center sm:h-44 md:h-64" />
    </div>}
    {/* El selector sigue filtrando por las categorías recibidas del backend. */}
    <div className="flex flex-col gap-4 rounded-xl border border-tienda-borde bg-tienda-tarjeta px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <TituloCatalogo className="text-2xl font-bold tracking-tight">{interno ? 'Inventario' : 'Catálogo de repuestos'}</TituloCatalogo>
        {search && <p className="mt-1 text-sm text-tienda-secundario">Resultados para «{search}»</p>}
      </div>
      <label className="flex flex-wrap items-center gap-2 text-tienda-secundario">
        Categoría
        <select className="w-auto min-w-32 text-tienda-texto" value={categoria} onChange={e => { setCategoria(e.target.value); setPagina(1) }}>
          <option value="">Todas</option>{categorias.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
    </div>
    {categorias.error && <p role="alert">{categorias.error} <button onClick={categorias.recargar}>Reintentar categorías</button></p>}
    {interno && <CategoriaForm alCrear={categorias.recargar} />}
    {interno && <ProductoForm
      key={edicion?.id ?? 'nuevo'}
      producto={edicion}
      categorias={categorias.data ?? []}
      alGuardar={() => { setEdicion(undefined); lista.recargar() }}
      cancelar={() => setEdicion(undefined)}
    />}
    {error && <p role="alert">{error}</p>}
    {lista.cargando && <p role="status">Cargando productos…</p>}
    {lista.error && <p role="alert">{lista.error} <button onClick={lista.recargar}>Reintentar</button></p>}
    {lista.data?.data.length === 0 && <p>No hay productos que coincidan con la búsqueda y la categoría.</p>}
    {/* CUADRÍCULA: gap-5 separa tarjetas y lg:grid-cols-3 define tres columnas en escritorio. */}
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {lista.data?.data.map(p => <article key={p.id} className="flex min-w-0 flex-col gap-3 rounded-xl border border-tienda-borde bg-tienda-tarjeta p-5 shadow-sm transition-shadow hover:shadow-md">
        <FotoProducto producto={p} />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-tienda-secundario">
          <span className="font-mono font-semibold">{p.sku}</span>
          <span>{p.category.name}</span>
        </div>
        <TituloProducto className="text-lg leading-snug font-bold">{p.name}</TituloProducto>
        {p.description && <p className="mb-2 text-sm leading-relaxed text-tienda-secundario">{p.description}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-tienda-borde pt-3">
          <p className="text-2xl font-bold tracking-tight tabular-nums">Q {formatoPrecio.format(Number(p.salePrice))}</p>
          <Disponibilidad stock={p.stock} />
        </div>
        {interno ? <>
          <p>Costo Q {p.acquisitionCost} · {p.active ? 'Activo' : 'Retirado'}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setEdicion(p)}>Editar</button>
            <button disabled={ocupado || !p.active} onClick={() => retirar(p.id)}>Retirar</button>
          </div>
        </>
          : (!sesion || sesion.usuario.role === 'CUSTOMER') && <form onSubmit={event => agregar(event, p)}>
            <fieldset disabled={ocupado || p.stock < 1} className="flex min-w-0 items-end gap-3">
              {/* w-20 fija el ancho del selector y el botón ocupa el resto de la fila. */}
              <label className="w-20 shrink-0 text-xs text-tienda-secundario">Cantidad
                <input className="mt-1 h-10 text-sm text-tienda-texto" name="unidades" type="number" min={1} max={Math.max(1, Math.min(p.stock, 10_000))} step={1} defaultValue={1} required />
              </label>
              <button type="submit" className="min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold">{p.stock < 1 ? 'Sin stock' : 'Agregar al carrito'}</button>
            </fieldset>
          </form>}
      </article>)}
    </div>
    {lista.data && lista.data.total > 0 && <nav className="flex items-center gap-3" aria-label="Páginas del catálogo">
      <button disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
      <span>Página {pagina}</span><button disabled={pagina * lista.data.limit >= lista.data.total} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
    </nav>}
    {!interno && sesion?.usuario.role === 'CUSTOMER' && <Link to="/carrito">Ver carrito</Link>}
  </section>
}

function ProductoForm({ producto, categorias, alGuardar, cancelar }: {
  producto?: ProductoInterno
  categorias: Categoria[]
  alGuardar: () => void
  cancelar: () => void
}) {
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [modoFotos, setModoFotos] = useState('agregar')
  const [fotosQuitadas, setFotosQuitadas] = useState<number[]>([])
  const [principal, setPrincipal] = useState<number>()
  const fotos = producto ? fotosDelProducto(producto) : []
  const restantes = fotos.filter(foto => !fotosQuitadas.includes(foto.id))
  const principalVisible = restantes.find(foto => foto.id === principal)?.id ?? restantes[0]?.id

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const f = new FormData(form)
    const datos: ProductoDTO = {
      categoryId: Number(f.get('categoryId')), sku: String(f.get('sku')).trim(), name: String(f.get('name')).trim(),
      description: String(f.get('description')).trim(), acquisitionCost: Number(f.get('cost')), salePrice: Number(f.get('price')),
    }
    // El selector admite varios archivos y el backend vuelve a validar cada uno.
    const imagenes = f.getAll('imagenes').filter((archivo): archivo is File => archivo instanceof File && archivo.name !== '')
    const reemplazarImagenes = modoFotos === 'reemplazar'
    const fotosActuales = reemplazarImagenes ? 0 : restantes.length
    if (reemplazarImagenes && !imagenes.length) {
      setError('Selecciona al menos una imagen para reemplazar las actuales.')
      return
    }
    if (fotosActuales + imagenes.length > 5 || imagenes.some(imagen => imagen.size > 5 * 1024 * 1024)) {
      setError('Elige hasta 5 imágenes de 5 MB como máximo cada una.')
      return
    }
    setError('')
    setGuardando(true)
    // Los cambios se confirman al guardar. Cancelar descarta las selecciones.
    const edicionFotos = reemplazarImagenes ? { reemplazarImagenes } : {
      quitarImagenes: fotosQuitadas.length ? fotosQuitadas : undefined,
      imagenPrincipal: restantes.some(foto => foto.id === principal) ? principal : undefined,
    }
    try { await productos.guardar(datos, producto?.id, imagenes, edicionFotos); form.reset(); alGuardar() }
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
      {/* La galería permite marcar cambios antes de guardar el formulario. */}
      {fotos.length > 0 && modoFotos !== 'reemplazar' && <fieldset className="space-y-2 sm:col-span-2" disabled={guardando}>
        <legend className="text-sm font-semibold">Fotos actuales</legend>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {fotos.map((foto, indice) => {
            const quitar = fotosQuitadas.includes(foto.id)
            const titulo = foto.referencia ? 'Foto de referencia' : `Foto ${indice + 1}`
            return <div className="space-y-2 rounded-lg border border-tienda-borde p-2" key={foto.id}>
              <img src={foto.src} alt={titulo} className="aspect-[3/2] w-full object-contain" />
              {quitar ? <p className="text-sm text-rose-700">Se quitará al guardar</p> : <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="fotoPrincipal" className="w-auto" checked={principalVisible === foto.id} onChange={() => setPrincipal(foto.id)} />
                Principal <span className="sr-only">{titulo}</span>
              </label>}
              <button type="button" aria-label={`${quitar ? 'Conservar' : 'Quitar'} ${titulo.toLowerCase()}`} onClick={() => setFotosQuitadas(actuales =>
                quitar ? actuales.filter(id => id !== foto.id) : [...actuales, foto.id]
              )}>{quitar ? 'Conservar foto' : 'Quitar foto'}</button>
            </div>
          })}
        </div>
      </fieldset>}
      {producto && <label className="sm:col-span-2">Al seleccionar imágenes nuevas
        <select disabled={guardando} value={modoFotos} onChange={event => setModoFotos(event.target.value)}>
          <option value="agregar">Agregar a las imágenes actuales</option>
          <option value="reemplazar">Reemplazar todas las imágenes</option>
        </select>
      </label>}
      <label className="sm:col-span-2">Imágenes del producto
        <input name="imagenes" type="file" accept="image/jpeg,image/png,image/webp" disabled={guardando} multiple />
        <span className="text-xs text-tienda-secundario">Hasta 5 fotos por producto. Formatos JPG, PNG o WebP, de hasta 5 MB cada una.</span>
      </label>
      <button disabled={guardando || !categorias.length}>{guardando ? 'Guardando…' : 'Guardar producto'}</button>
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
