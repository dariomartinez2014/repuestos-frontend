import { api } from '../lib/axios'
import type { Categoria, Pagina, Producto, ProductoInterno } from '../types'
export type ProductoDTO = Pick<Producto, 'sku' | 'name' | 'description'> & { categoryId: number; salePrice: number; acquisitionCost: number }
export const productos = {
  async listar<T extends Producto>(interno: boolean, page: number, categoryId: number | undefined, signal: AbortSignal, search?: string) {
    return (await api.get<Pagina<T>>(interno ? '/products/internal' : '/products', { params: { page, categoryId, search }, signal })).data
  },
  async categorias(signal: AbortSignal) { return (await api.get<Categoria[]>('/categories', { signal })).data },
  guardar: (datos: ProductoDTO, id?: number) => id ? api.patch<ProductoInterno>(`/products/${id}`, datos) : api.post<ProductoInterno>('/products', datos),
  retirar: (id: number) => api.delete(`/products/${id}`),
  ajustar: (id: number, delta: number, reason: string) => api.post(`/products/${id}/stock`, { delta, reason }),
}
