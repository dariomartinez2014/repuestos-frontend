import { useCallback, useState } from 'react'
import { useApi } from './hooks/useApi'
import { productos } from './services/productos'

// Muestra la fecha de la API en la hora local del negocio.
const fechaAjuste = new Intl.DateTimeFormat('es-GT', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Guatemala',
})

export function HistorialAjustes({ productoId, nombre }: { productoId: number; nombre: string }) {
  const [pagina, setPagina] = useState(1)
  // useApi cancela la consulta al cerrar el historial o cambiar de página.
  const pedir = useCallback((signal: AbortSignal) => productos.historialAjustes(productoId, pagina, signal), [productoId, pagina])
  const { data, cargando, error, recargar } = useApi(pedir)

  return <section className="space-y-3 border-t border-slate-200 pt-3" aria-label={`Historial de ${nombre}`}>
    <h3 className="font-semibold">Historial de ajustes</h3>
    {cargando && <p role="status">Cargando ajustes…</p>}
    {error && <div className="space-y-2">
      <p role="alert">{error}</p>
      <button type="button" onClick={recargar}>Reintentar</button>
    </div>}
    {data?.total === 0 && <p>Este producto aún no tiene ajustes registrados.</p>}
    {data && data.total > 0 && <>
      <p className="text-sm text-tienda-secundario">{data.total} {data.total === 1 ? 'ajuste registrado' : 'ajustes registrados'}</p>
      <ul className="space-y-2">
        {data.data.map(ajuste => <li key={ajuste.id} className="break-words rounded-lg bg-slate-50 p-3 text-sm">
          {/* El signo del movimiento indica si entraron o salieron unidades. */}
          <p className={ajuste.quantityDelta > 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>
            {ajuste.quantityDelta > 0 ? 'Agregó' : 'Quitó'} {Math.abs(ajuste.quantityDelta)}{' '}
            {Math.abs(ajuste.quantityDelta) === 1 ? 'unidad' : 'unidades'}
          </p>
          <dl className="mt-1">
            <div><dt className="inline font-medium">Motivo </dt><dd className="inline">{ajuste.reason ?? 'Sin motivo registrado'}</dd></div>
            <div><dt className="inline font-medium">Por </dt><dd className="inline">{ajuste.actor.name}</dd></div>
            <div><dt className="inline font-medium">Fecha </dt><dd className="inline"><time dateTime={ajuste.createdAt}>{fechaAjuste.format(new Date(ajuste.createdAt))}</time></dd></div>
          </dl>
        </li>)}
      </ul>
      {data.total > data.limit && <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Páginas de ajustes">
        <button type="button" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
        <span>Página {pagina} de {Math.ceil(data.total / data.limit)}</span>
        <button type="button" disabled={pagina * data.limit >= data.total} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
      </nav>}
    </>}
  </section>
}
