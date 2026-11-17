import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Referencia } from './Compra'
import { useApi } from './hooks/useApi'
import { compras } from './services/compras'

const estados = ['carrito', 'pendiente', 'aprobado', 'rechazado', 'confirmado'] as const
type Estado = typeof estados[number]

// Al recargar, se recupera la etapa guardada en este navegador.
function leerEstado(clave: string): Estado {
  const guardado = localStorage.getItem(clave)
  return estados.find(estado => estado === guardado) ?? 'carrito'
}

export function MockPayDemo() {
  // La demo pública conserva su ejemplo cuando se abre desde el menú.
  return <Simulacion carritoId={26} total={125} regreso="/" />
}

export function MockPayDemoPedido() {
  const { id } = useParams()
  // La API comprueba la pertenencia del pedido y devuelve su código y monto.
  const pedir = useCallback((signal: AbortSignal) => compras.pedido(Number(id), signal), [id])
  const pedido = useApi(pedir)

  if (pedido.cargando) return <p role="status">Cargando pedido…</p>
  if (!pedido.data) return <p role="alert">{pedido.error} <button type="button" onClick={pedido.recargar}>Reintentar</button></p>
  if (!pedido.data.cartId) return <p>El pedido no tiene un código de carrito asociado. <Link to="/pedidos">Volver a pedidos</Link></p>

  return <Simulacion
    key={pedido.data.id}
    pedidoId={pedido.data.id}
    carritoId={pedido.data.cartId}
    total={Number(pedido.data.total)}
    regreso={`/pago/${pedido.data.id}`}
  />
}

function Simulacion({ carritoId, pedidoId, total, regreso }: { carritoId: number; pedidoId?: number; total: number; regreso: string }) {
  // Cada pedido usa una clave propia para guardar un solo resultado de simulación.
  const clave = pedidoId ? `repuestos:demo-mockpay:pedido:${pedidoId}:C-${carritoId}` : 'repuestos:demo-mockpay:C-26'
  const [estado, setEstado] = useState(() => leerEstado(clave))

  // Cada cambio reemplaza el estado del mismo intento, incluso si se vuelve a abrir la página.
  useEffect(() => {
    localStorage.setItem(clave, estado)
  }, [clave, estado])

  return <section className="mx-auto max-w-xl space-y-4">
    <h1 className="text-2xl font-bold">Demo de MockPay</h1>
    <p className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">
      {pedidoId
        ? 'Prueba con el código y monto de tu pedido. La simulación guarda su resultado en este navegador y el pedido conserva su estado en la tienda.'
        : 'Simulación con datos de prueba. El resultado se guarda en este navegador.'}
    </p>
    <article className="space-y-4 rounded-xl border border-tienda-borde bg-tienda-tarjeta p-5">
      <div className="space-y-2" aria-live="polite">
        <h2 className="text-lg font-semibold">
          {estado === 'carrito' ? 'Carrito de prueba' : estado === 'confirmado' ? 'Pago de prueba confirmado' : 'Pago de prueba'}
        </h2>
        {/* La misma referencia se muestra en el carrito, el pago y la confirmación. */}
        <Referencia id={carritoId} />
        <p>Total: Q {total.toFixed(2)}</p>
        {estado !== 'carrito' && <p>Intento de prueba: DEMO-C-{carritoId}</p>}
        {estado === 'aprobado' && <p className="text-emerald-700">Simulación aprobada. Verifica el pago para ver la confirmación.</p>}
        {estado === 'rechazado' && <p className="text-rose-700">Simulación rechazada. Puedes reiniciar la demo para volver a probar.</p>}
      </div>
      {/* Los botones cambian la etapa del intento de prueba guardado en el navegador. */}
      {estado === 'carrito' && <button type="button" onClick={() => setEstado('pendiente')}>Continuar al pago de prueba</button>}
      {estado === 'pendiente' && <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setEstado('aprobado')}>Aprobar prueba</button>
        <button type="button" onClick={() => setEstado('rechazado')}>Rechazar prueba</button>
      </div>}
      {estado === 'aprobado' && <button type="button" onClick={() => setEstado('confirmado')}>Verificar pago de prueba</button>}
      {estado !== 'carrito' && <button type="button" className="bg-slate-100 enabled:hover:bg-slate-200" onClick={() => setEstado('carrito')}>
        Reiniciar demo
      </button>}
    </article>
    <Link to={regreso}>{pedidoId ? 'Volver al pedido' : 'Volver a la tienda'}</Link>
  </section>
}
