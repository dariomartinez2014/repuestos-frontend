import { useCallback, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useApi } from './hooks/useApi'
import { mensajeError } from './lib/errores'
import { compras } from './services/compras'
import { operacion, type Metodo } from './services/operacion'
import { productos } from './services/productos'
import { useAuthStore } from './store'
import { Referencia } from './Compra'
import type { Pedido, Producto } from './types'

const metodos: Record<Metodo, string> = { CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia' }

function Metodos() {
  return <label>Método de pago<select name="metodo">{Object.entries(metodos).map(([valor, texto]) =>
    <option key={valor} value={valor}>{texto}</option>)}</select></label>
}

function EstadoCarga({ cargando, error, recargar }: { cargando: boolean; error: string | null; recargar: () => void }) {
  if (cargando) return <p role="status">Cargando…</p>
  return error && <p role="alert">{error} <button onClick={recargar}>Reintentar</button></p>
}

function useOperacion() {
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  async function ejecutar(accion: () => Promise<void>) {
    setOcupado(true)
    setError('')
    try { await accion() }
    catch (err) { setError(mensajeError(err)) }
    finally { setOcupado(false) }
  }
  return { ocupado, error, ejecutar }
}

export function CajaPage() {
  const cajas = useApi(operacion.cajas)
  const [seleccion, setSeleccion] = useState<number>()
  const pedirCorte = useCallback((signal: AbortSignal) => seleccion
    ? operacion.corte(seleccion, signal)
    : Promise.resolve(null), [seleccion])
  const corte = useApi(pedirCorte)
  const { ocupado, error, ejecutar } = useOperacion()
  const abierta = cajas.data?.find(caja => !caja.closedAt)
  function enviar(event: FormEvent<HTMLFormElement>, id?: number) {
    event.preventDefault()
    const monto = Number(new FormData(event.currentTarget).get('monto'))
    if (id && !window.confirm('¿Cerrar esta caja?')) return
    void ejecutar(async () => {
      if (id) await operacion.cerrar(id, monto)
      else await operacion.abrir(monto)
      cajas.recargar()
      corte.recargar()
    })
  }
  return <section className="space-y-5">
    <h1 className="text-2xl font-bold">Caja</h1>
    <EstadoCarga {...cajas} />
    {error && <p role="alert">{error}</p>}
    {cajas.data && <form className="max-w-sm space-y-3" onSubmit={event => enviar(event, abierta?.id)}>
      <label>{abierta ? 'Efectivo contado' : 'Fondo inicial'}<input name="monto" type="number" min="0" max="99999999" step=".01" required /></label>
      <button disabled={ocupado}>{abierta ? 'Cerrar caja' : 'Abrir caja'}</button>
    </form>}
    <label className="max-w-sm">Consultar corte<select value={seleccion ?? ''} onChange={event => setSeleccion(Number(event.target.value) || undefined)}>
      <option value="">Selecciona una caja</option>
      {cajas.data?.map(caja => <option key={caja.id} value={caja.id}>Caja #{caja.id} · {caja.closedAt ? 'Cerrada' : 'Abierta'}</option>)}
    </select></label>
    {seleccion && <EstadoCarga {...corte} />}
    {corte.data && <article className="space-y-2 rounded-xl bg-white p-5">
      <h2 className="font-bold">Corte de caja #{corte.data.id}</h2>
      <p>Fondo inicial: Q {corte.data.openingAmount}</p>
      {corte.data.totalsByMethod.map(fila => <p key={fila.method}>{metodos[fila.method]}: Q {fila._sum.amount ?? '0.00'}</p>)}
      <p>Efectivo esperado: Q {corte.data.expectedAmount}</p>
      {corte.data.countedAmount !== null && <p>Contado: Q {corte.data.countedAmount} · Diferencia: Q {corte.data.difference}</p>}
    </article>}
  </section>
}

export function VentaPage({ social = false }: { social?: boolean }) {
  const cajas = useApi(operacion.cajas)
  const [pagina, setPagina] = useState(1)
  const pedirProductos = useCallback((signal: AbortSignal) => productos.listar<Producto>(false, pagina, undefined, signal), [pagina])
  const catalogo = useApi(pedirProductos)
  const [carrito, setCarrito] = useState<number | null>(null)
  const pedirCarrito = useCallback((signal: AbortSignal) => carrito ? compras.carrito(carrito, signal) : Promise.resolve(null), [carrito])
  const venta = useApi(pedirCarrito)
  const [pedido, setPedido] = useState<Pedido>()
  const { ocupado, error, ejecutar } = useOperacion()
  const abierta = cajas.data?.find(caja => !caja.closedAt)

  function agregar(producto: Producto) {
    void ejecutar(async () => {
      const id = carrito ?? (await compras.crear(social ? 'SOCIAL' : 'POS')).id
      setCarrito(id)
      const cantidad = venta.data?.items.find(item => item.productId === producto.id)?.quantity ?? 0
      await compras.agregar(id, producto.id, cantidad + 1)
      venta.recargar()
    })
  }
  function cobrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!carrito || (!social && !abierta) || !window.confirm('¿Confirmar este pedido?')) return
    const campos = new FormData(event.currentTarget)
    void ejecutar(async () => {
      const resultado = social ? await compras.confirmarSocial(carrito, {
        recipientName: String(campos.get('destinatario')).trim(),
        recipientPhone: String(campos.get('telefono')).trim(),
        deliveryAddress: String(campos.get('direccion')).trim(),
      }) : abierta && await compras.confirmarPos(carrito, abierta.id, String(campos.get('metodo')) as Metodo)
      if (!resultado) return
      setPedido(resultado)
      setCarrito(null)
      catalogo.recargar()
    })
  }

  return <section className="space-y-5">
    <h1 className="text-2xl font-bold">{social ? 'Pedido por redes sociales' : 'Venta de mostrador'}</h1>
    {!social && <EstadoCarga {...cajas} />}
    {!social && cajas.data && !abierta && <p>No hay caja abierta. Solicita la apertura a Administración.</p>}
    {error && <p role="alert">{error}</p>}
    {pedido ? <article className="space-y-3 rounded-xl bg-white p-5">
      <h2 role="status" className="font-bold">{social ? 'Pedido registrado · pendiente de pago' : 'Venta confirmada'}</h2>
      <Referencia id={pedido.cartId} />
      <p>Total: Q {pedido.total}</p>
      <button onClick={() => setPedido(undefined)}>Nueva venta</button>
    </article> : <>
      <EstadoCarga {...catalogo} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {catalogo.data?.data.map(producto => <li key={producto.id} className="rounded-xl bg-white p-4">
          <p>{producto.sku} · {producto.name} · Q {producto.salePrice}</p>
          <button disabled={(!social && !abierta) || ocupado || venta.cargando || !!venta.error || producto.stock < 1} onClick={() => agregar(producto)}>Agregar</button>
        </li>)}
      </ul>
      {catalogo.data && <nav className="flex gap-3" aria-label="Páginas de productos">
        <button disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
        <button disabled={pagina * catalogo.data.limit >= catalogo.data.total} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
      </nav>}
      {carrito && <Referencia id={carrito} />}
      {carrito && <EstadoCarga {...venta} />}
      {venta.data?.items.map(item => <div key={item.productId} className="flex items-center gap-3">
        <p>{item.product.name} · {item.quantity} × Q {item.product.salePrice}</p>
        <button disabled={ocupado} onClick={() => ejecutar(async () => {
          if (!carrito) return
          await compras.quitar(carrito, item.productId)
          venta.recargar()
        })}>Quitar</button>
      </div>)}
      {!!venta.data?.items.length && <form onSubmit={cobrar} className="max-w-sm space-y-3">
        <Referencia id={venta.data.id} />
        {social ? <>
          <label>Destinatario<input name="destinatario" required minLength={2} maxLength={150} /></label>
          <label>Teléfono<input name="telefono" type="tel" required minLength={5} maxLength={30} /></label>
          <label>Dirección de entrega<input name="direccion" required minLength={5} maxLength={500} /></label>
        </> : <Metodos />}
        <button disabled={ocupado || (!social && !abierta)}>{social ? 'Registrar pedido' : 'Confirmar cobro'}</button>
      </form>}
    </>}
  </section>
}

const estados: Record<string, string> = {
  PENDING: 'Pendiente', PAID: 'Pagado', IN_TRANSIT: 'En camino', DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado', COMPLETED: 'Completado',
}

export function PedidosPage() {
  const rol = useAuthStore(s => s.sesion?.usuario.role)
  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState('')
  const pedir = useCallback((signal: AbortSignal) => operacion.pedidos(pagina, estado, signal), [pagina, estado])
  const pedidos = useApi(pedir)
  const { ocupado, error, ejecutar } = useOperacion()
  function cambiar(accion: () => Promise<unknown>) {
    void ejecutar(async () => { await accion(); pedidos.recargar() })
  }

  return <section className="space-y-5">
    <h1 className="text-2xl font-bold">{rol === 'CUSTOMER' ? 'Mis pedidos' : 'Historial de pedidos'}</h1>
    <label className="max-w-sm">Estado<select value={estado} onChange={event => { setEstado(event.target.value); setPagina(1) }}>
      <option value="">Todos</option>
      {Object.entries(estados).map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
    </select></label>
    <EstadoCarga {...pedidos} />
    {error && <p role="alert">{error}</p>}
    {pedidos.data?.data.length === 0 && <p>No hay pedidos para este filtro.</p>}
    {pedidos.data?.data.map(pedido => <article key={pedido.id} className="space-y-3 rounded-xl bg-white p-5">
      <Referencia id={pedido.cartId} />
      <p>{estados[pedido.status] ?? pedido.status} · Q {pedido.total}</p>
      <ul>{pedido.items.map(item => <li key={item.id}>{item.productName} · {item.quantity} × Q {item.unitPrice}</li>)}</ul>
      {rol === 'CUSTOMER' && pedido.status !== 'CANCELLED' && <Link to={'/pago/' + pedido.id}>Ver pago</Link>}
      {pedido.status === 'PENDING' && rol !== 'CASHIER' && <div className="flex flex-wrap items-end gap-3">
        {rol === 'ADMIN' && <form className="flex items-end gap-3" onSubmit={event => {
          event.preventDefault()
          const metodo = String(new FormData(event.currentTarget).get('metodo')) as Metodo
          if (window.confirm('¿Registrar el pago ya verificado?')) cambiar(() => operacion.pago(pedido.id, metodo))
        }}><Metodos /><button disabled={ocupado}>Registrar pago</button></form>}
        <button disabled={ocupado} onClick={() => {
          if (window.confirm('¿Cancelar este pedido?')) cambiar(() => operacion.cancelar(pedido.id))
        }}>Cancelar pedido</button>
      </div>}
      {rol === 'ADMIN' && pedido.status === 'PAID' && <button disabled={ocupado} onClick={() => cambiar(() => operacion.estado(pedido.id, 'IN_TRANSIT'))}>Marcar en camino</button>}
      {rol === 'ADMIN' && pedido.status === 'IN_TRANSIT' && <button disabled={ocupado} onClick={() => cambiar(() => operacion.estado(pedido.id, 'DELIVERED'))}>Marcar entregado</button>}
    </article>)}
    {pedidos.data && pedidos.data.total > 0 && <nav className="flex items-center gap-3" aria-label="Páginas de pedidos">
      <button disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
      <span>Página {pagina}</span>
      <button disabled={pagina * pedidos.data.limit >= pedidos.data.total} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
    </nav>}
  </section>
}
