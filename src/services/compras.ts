import { api } from '../lib/axios'
import type { Carrito, Direccion, Pedido } from '../types'
export const compras = {
  async crear() { return (await api.post<Pick<Carrito, 'id'>>('/carts', { channel: 'WEB' })).data },
  async carrito(id: number, signal: AbortSignal) { return (await api.get<Carrito>(`/carts/${id}`, { signal })).data },
  agregar: (id: number, productId: number, quantity: number) => api.put(`/carts/${id}/items`, { productId, quantity }),
  quitar: (id: number, producto: number) => api.delete(`/carts/${id}/items/${producto}`),
  async direcciones(signal: AbortSignal) { return (await api.get<Direccion[]>('/addresses', { signal })).data },
  direccion: (datos: Omit<Direccion, 'id'>) => api.post('/addresses', datos),
  async confirmar(id: number, usuarioId: number, addressId: number) {
    return (await api.post<Pedido>(`/carts/${id}/checkout`, { addressId, idempotencyKey: `web-${usuarioId}-cart-${id}` })).data
  },
  async pedido(id: number, signal: AbortSignal) { return (await api.get<Pedido>(`/orders/${id}`, { signal })).data },
  async pagar(id: number) { return (await api.post<{ checkoutUrl: string | null }>(`/orders/${id}/mockpay`)).data },
  sincronizar: (id: number) => api.post(`/orders/${id}/mockpay/sync`),
}
