import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Referencia } from './Compra'

// Datos de la simulación. La página guarda su propio estado en el navegador.
const compra = { carritoId: 26, total: 125, intento: 'DEMO-C-26' }
const clave = 'repuestos:demo-mockpay:C-26'
const estados = ['carrito', 'pendiente', 'aprobado', 'rechazado', 'confirmado'] as const
type Estado = typeof estados[number]

function leerEstado(): Estado {
  const guardado = localStorage.getItem(clave)
  return estados.find(estado => estado === guardado) ?? 'carrito'
}

export function MockPayDemo() {
  const [estado, setEstado] = useState(leerEstado)

  // Cada cambio reemplaza el estado del mismo intento, incluso si se vuelve a abrir la página.
  useEffect(() => {
    localStorage.setItem(clave, estado)
  }, [estado])

  return <section className="mx-auto max-w-xl space-y-4">
    <h1 className="text-2xl font-bold">Demo de MockPay</h1>
    <p className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">
      Simulación con datos de prueba. El resultado se guarda en este navegador.
    </p>
    <article className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="space-y-2" aria-live="polite">
        <h2 className="text-lg font-semibold">
          {estado === 'carrito' ? 'Carrito de prueba' : estado === 'confirmado' ? 'Pago de prueba confirmado' : 'Pago de prueba'}
        </h2>
        {/* La misma referencia se muestra en el carrito, el pago y la confirmación. */}
        <Referencia id={compra.carritoId} />
        <p>Total: Q {compra.total.toFixed(2)}</p>
        {estado !== 'carrito' && <p>Intento de prueba: {compra.intento}</p>}
        {estado === 'aprobado' && <p className="text-emerald-700">Simulación aprobada. Verifica el pago para ver la confirmación.</p>}
        {estado === 'rechazado' && <p className="text-rose-700">Simulación rechazada. Puedes reiniciar la demo para volver a probar.</p>}
      </div>
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
    <Link to="/">Volver a la tienda</Link>
  </section>
}
