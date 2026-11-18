import { useState } from 'react'
import { api } from './lib/axios'
import type { Producto } from './types'

// Asocia el SKU que devuelve la API con el archivo que guardamos en public/productos.
const fotosPorSku: Partial<Record<string, string>> = {
  'FRE-001': 'fre-001.webp',
  'FRE-002': 'fre-002.webp',
  'FRE-0022': 'fre-0022.webp',
  'FIL-001': 'fil-001.webp',
  'FIL-002': 'fil-002.webp',
  'ELE-001': 'ele-001.webp',
  'ELE-002': 'ele-002.webp',
  'LUB-001': 'lub-001.webp',
  'LUB-002': 'lub-002.webp',
  'LUB-003': 'lub-003.webp',
  'LUB-005': 'lub-005.webp',
}

type ProductoConFotos = Pick<Producto, 'id' | 'sku' | 'name' | 'images' | 'referenceImageSku'>

export function fotosDelProducto(producto: ProductoConFotos) {
  // La referencia conserva su clave aunque el administrador edite el SKU.
  const clave = producto.referenceImageSku === undefined && !producto.images?.length
    ? producto.sku.trim().toUpperCase()
    : producto.referenceImageSku
  const referencia = clave ? fotosPorSku[clave] : undefined
  const base = api.defaults.baseURL?.replace(/\/$/, '') ?? ''
  const subidas = producto.images?.map(({ id }) => ({
    src: `${base}/products/${producto.id}/images/${id}`,
    referencia: false,
  })) ?? []
  return referencia ? [{ src: `/productos/${referencia}`, referencia: true }, ...subidas] : subidas
}

export function FotoProducto({ producto }: { producto: ProductoConFotos }) {
  const [indice, setIndice] = useState(0)
  const fotos = fotosDelProducto(producto)
  if (!fotos.length) return null
  const actual = indice % fotos.length
  const foto = fotos[actual]

  return <figure className="overflow-hidden rounded-lg border border-tienda-borde bg-tienda-fondo">
    <img
      src={foto.src}
      alt={producto.name}
      loading="lazy"
      decoding="async"
      className="aspect-[3/2] w-full object-contain"
    />
    {foto.referencia && <figcaption className="px-2 pb-1.5 text-right text-xs text-tienda-secundario">Imagen de referencia</figcaption>}
    {fotos.length > 1 && <div className="flex items-center justify-center gap-3 p-2">
      <button type="button" aria-label="Imagen anterior" onClick={() => setIndice((actual - 1 + fotos.length) % fotos.length)}>‹</button>
      <span aria-live="polite" className="text-sm">Foto {actual + 1} de {fotos.length}</span>
      <button type="button" aria-label="Imagen siguiente" onClick={() => setIndice((actual + 1) % fotos.length)}>›</button>
    </div>}
  </figure>
}
