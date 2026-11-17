import { api } from '../lib/axios'
import type { Categoria, Pagina, Producto, ProductoInterno } from '../types'
export type ProductoDTO = Pick<Producto, 'sku' | 'name' | 'description'> & { categoryId: number; salePrice: number; acquisitionCost: number }
export const productos = {
  async listar<T extends Producto>(interno: boolean, page: number, categoryId: number | undefined, signal: AbortSignal, search?: string) {
    return (await api.get<Pagina<T>>(interno ? '/products/internal' : '/products', { params: { page, categoryId, search }, signal })).data
  },
  async categorias(signal: AbortSignal) { return (await api.get<Categoria[]>('/categories', { signal })).data },
  crearCategoria: (name: string) => api.post<Categoria>('/categories', { name }),
  guardar(datos: ProductoDTO, id?: number, imagenes: File[] = []) {
    if (id) return api.patch<ProductoInterno>(`/products/${id}`, datos)
    if (!imagenes.length) return api.post<ProductoInterno>('/products', datos)

    // Axios y el navegador agregan el separador de multipart al enviar FormData.
    const formulario = new FormData()
    Object.entries(datos).forEach(([campo, valor]) => formulario.append(campo, String(valor ?? '')))
    imagenes.forEach(imagen => formulario.append('imagenes', imagen))
    return api.post<ProductoInterno>('/products', formulario)
  },
  retirar: (id: number) => api.delete(`/products/${id}`),
  ajustar: (id: number, delta: number, reason: string) => api.post(`/products/${id}/stock`, { delta, reason }),
}
