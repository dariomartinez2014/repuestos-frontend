import { api } from '../lib/axios'
import type { Categoria, Pagina, Producto, ProductoInterno } from '../types'
export type ProductoDTO = Pick<Producto, 'sku' | 'name' | 'description'> & { categoryId: number; salePrice: number; acquisitionCost: number }
interface EdicionFotos {
  reemplazarImagenes?: boolean
  quitarImagenes?: number[]
  imagenPrincipal?: number
}

export const productos = {
  async listar<T extends Producto>(interno: boolean, page: number, categoryId: number | undefined, signal: AbortSignal, search?: string) {
    return (await api.get<Pagina<T>>(interno ? '/products/internal' : '/products', { params: { page, categoryId, search }, signal })).data
  },
  async categorias(signal: AbortSignal) { return (await api.get<Categoria[]>('/categories', { signal })).data },
  crearCategoria: (name: string) => api.post<Categoria>('/categories', { name }),
  guardar(datos: ProductoDTO, id?: number, imagenes: File[] = [], edicionFotos: EdicionFotos = {}) {
    // Los cambios de la galería viajan junto a los demás datos del producto.
    const cambios = { ...datos, ...edicionFotos }
    let cuerpo: typeof cambios | FormData = cambios
    if (imagenes.length) {
      const formulario = new FormData()
      Object.entries(cambios).forEach(([campo, valor]) => {
        if (valor !== undefined) formulario.append(campo, String(valor ?? ''))
      })
      imagenes.forEach(imagen => formulario.append('imagenes', imagen))
      cuerpo = formulario
    }
    return id ? api.patch<ProductoInterno>(`/products/${id}`, cuerpo) : api.post<ProductoInterno>('/products', cuerpo)
  },
  retirar: (id: number) => api.delete(`/products/${id}`),
  ajustar: (id: number, delta: number, reason: string) => api.post(`/products/${id}/stock`, { delta, reason }),
}
