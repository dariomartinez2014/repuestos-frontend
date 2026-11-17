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
}

export function FotoProducto({ producto }: { producto: Pick<Producto, 'sku' | 'name'> }) {
  const foto = fotosPorSku[producto.sku.trim().toUpperCase()]
  if (!foto) return null

  // Vite sirve el contenido de public desde la raíz de la tienda.
  return <figure className="overflow-hidden rounded-lg border border-tienda-borde bg-tienda-fondo">
    <img
      src={`/productos/${foto}`}
      alt={producto.name}
      loading="lazy"
      decoding="async"
      className="aspect-[3/2] w-full object-contain"
    />
    <figcaption className="px-2 pb-1.5 text-right text-xs text-tienda-secundario">Imagen de referencia</figcaption>
  </figure>
}
