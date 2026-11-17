import { useCallback, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApi } from './hooks/useApi'
import { mensajeError } from './lib/errores'
import { compras } from './services/compras'
import { useAuthStore } from './store'

// El ID del carrito se conserva como código visible a lo largo de la compra.
export function Referencia({ id }: { id: number }) {
  return <p className="font-semibold">Código de compra: C-{id}</p>
}

export function CarritoPage() {
  const id = useAuthStore(s => s.carrito)
  const sesion = useAuthStore(s => s.sesion)
  const pedir = useCallback((signal: AbortSignal) => id ? compras.carrito(id, signal) : Promise.resolve(null), [id])
  const carrito = useApi(pedir)
  const direcciones = useApi(compras.direcciones)
  const navegar = useNavigate()
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  async function ejecutar(accion: () => Promise<void>) {
    setOcupado(true)
    setError('')
    try { await accion() }
    catch (err) { setError(mensajeError(err)) }
    finally { setOcupado(false) }
  }
  // La API devuelve el pedido. Ese ID abre la pantalla de pago correspondiente.
  function confirmar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const direccion = Number(new FormData(event.currentTarget).get('direccion'))
    if (!id || !sesion || !direccion) return
    void ejecutar(async () => {
      const pedido = await compras.confirmar(id, sesion.usuario.id, direccion)
      useAuthStore.getState().guardarCarrito(null)
      navegar('/pago/' + pedido.id, { replace: true })
    })
  }
  function agregarDireccion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const datos = new FormData(event.currentTarget)
    void ejecutar(async () => {
      await compras.direccion({ recipientName: String(datos.get('nombre')), phone: String(datos.get('telefono')), addressLine: String(datos.get('direccion')) })
      direcciones.recargar()
    })
  }
  return <section className="space-y-4">
    <h1 className="text-2xl font-bold">Carrito</h1>
    {id && <Referencia id={id} />}
    {error && <p role="alert">{error}</p>}
    {carrito.cargando && <p role="status">Cargando carrito…</p>}
    {carrito.error && <p role="alert">{carrito.error} <button onClick={carrito.recargar}>Reintentar</button></p>}
    {!id || carrito.data?.items.length === 0 ? <p>Tu carrito está vacío. <Link to="/">Ver catálogo</Link></p> : null}
    {carrito.data?.items.map(item => <article key={item.productId} className="flex flex-wrap items-center justify-between gap-3 rounded bg-white p-4">
      <p>{item.product.name} · {item.quantity} × Q {item.product.salePrice}</p>
      <button disabled={ocupado || carrito.data?.status !== 'OPEN'} onClick={() => ejecutar(async () => {
        if (!id) return
        await compras.quitar(id, item.productId)
        carrito.recargar()
      })}>Quitar</button>
    </article>)}
    {!!carrito.data?.items.length && <>
      {direcciones.cargando && <p>Cargando direcciones…</p>}
      {direcciones.error && <p role="alert">{direcciones.error} <button onClick={direcciones.recargar}>Reintentar</button></p>}
      <form onSubmit={confirmar} className="max-w-lg space-y-3">
        <label>Dirección de entrega<select name="direccion" required defaultValue=""><option value="">Selecciona</option>{direcciones.data?.map(d => <option key={d.id} value={d.id}>{d.addressLine}</option>)}</select></label>
        {/* ESTILO LOCAL: agrega className="bg-emerald-700 px-6 py-3" para personalizar solo este botón. */}
        <button disabled={ocupado || !direcciones.data?.length}>Continuar al pago</button>
      </form>
      <form onSubmit={agregarDireccion} className="max-w-lg space-y-3 rounded bg-white p-4">
        <h2 className="font-semibold">Guardar dirección</h2>
        <label>Destinatario<input name="nombre" required minLength={2} maxLength={150} /></label>
        <label>Teléfono<input name="telefono" required minLength={5} maxLength={30} /></label>
        <label>Dirección<input name="direccion" required minLength={5} maxLength={500} /></label>
        <button disabled={ocupado}>Guardar dirección</button>
      </form>
    </>}
  </section>
}

export function PagoPage() {
  const { id } = useParams()
  const pedido = useApi(useCallback((signal: AbortSignal) => compras.pedido(Number(id), signal), [id]))
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [enlacePago, setEnlacePago] = useState<string | null>(null)
  // El primer paso pide el enlace de MockPay y el segundo verifica el resultado con la API.
  async function operar(pagar: boolean) {
    if (!pedido.data) return
    setError('')
    setOcupado(true)
    try {
      if (pagar) {
        const intento = await compras.pagar(pedido.data.id)
        if (intento.checkoutUrl) setEnlacePago(intento.checkoutUrl)
        else pedido.recargar()
      } else {
        await compras.sincronizar(pedido.data.id)
        setEnlacePago(null)
        pedido.recargar()
      }
    } catch (err) { setError(mensajeError(err)) }
    finally { setOcupado(false) }
  }
  return <section className="space-y-4">
    <h1 className="text-2xl font-bold">Pago</h1>
    {pedido.cargando && <p role="status">Cargando pedido…</p>}
    {pedido.error && <p role="alert">{pedido.error} <button onClick={pedido.recargar}>Reintentar</button></p>}
    {error && <p role="alert">{error}</p>}
    {pedido.data && <>
      <Referencia id={pedido.data.cartId} />
      <p>Total: Q {pedido.data.total}</p>
      <p>Estado: {pedido.data.status}</p>
      {["PAID", "IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(pedido.data.status) && <p role="status">Pago confirmado</p>}
      {pedido.data.status === 'PENDING' && <div className="flex flex-wrap gap-3">
        {enlacePago
          ? <a href={enlacePago} target="_blank" rel="noreferrer">Abrir MockPay</a>
          : <button disabled={ocupado} onClick={() => operar(true)}>Pagar con MockPay</button>}
        <button disabled={ocupado} onClick={() => operar(false)}>Verificar pago</button>
      </div>}
    </>}
    <Link to="/">Volver a la tienda</Link>
  </section>
}
