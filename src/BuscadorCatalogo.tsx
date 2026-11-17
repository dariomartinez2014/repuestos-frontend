import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

export function BuscadorCatalogo() {
  const ubicacion = useLocation()
  const [params] = useSearchParams()
  const navegar = useNavigate()
  const enCatalogo = ubicacion.pathname === '/'
  const busqueda = enCatalogo ? params.get('search') ?? '' : ''
  const [edicion, setEdicion] = useState<{ pagina: string; texto: string }>()
  const borrador = edicion && (edicion.pagina === ubicacion.key || (enCatalogo && edicion.texto.trim() === busqueda)) ? edicion.texto : undefined
  const texto = borrador?.trim()

  // Espera una pausa al escribir y cancela la búsqueda pendiente al cambiar el texto.
  useEffect(() => {
    if (texto === undefined || texto === busqueda) return
    const espera = window.setTimeout(() => {
      const destino = texto ? '/?' + new URLSearchParams({ search: texto }) : '/'
      navegar(destino, { replace: enCatalogo })
    }, 350)
    return () => window.clearTimeout(espera)
  }, [texto, busqueda, enCatalogo, navegar])

  return <form
    role="search"
    className="order-last flex w-full min-w-0 overflow-hidden rounded-lg bg-tienda-tarjeta focus-within:ring-2 focus-within:ring-tienda-accion lg:order-none lg:w-auto lg:flex-1"
    onSubmit={event => {
      event.preventDefault()
      const destino = texto ?? busqueda
      if (enCatalogo && destino === busqueda) return
      navegar(destino ? '/?' + new URLSearchParams({ search: destino }) : '/', { replace: enCatalogo })
    }}
  >
    <input
      name="search"
      type="search"
      aria-label="Buscar repuestos"
      value={borrador ?? busqueda}
      onChange={event => setEdicion({ pagina: ubicacion.key, texto: event.target.value })}
      maxLength={100}
      placeholder="Busca por nombre o código"
      className="min-w-0 flex-1 rounded-none border-0 px-4 text-tienda-texto focus-visible:outline-none"
    />
    <button type="submit" className="shrink-0 rounded-none px-5 focus-visible:-outline-offset-4">Buscar</button>
  </form>
}
