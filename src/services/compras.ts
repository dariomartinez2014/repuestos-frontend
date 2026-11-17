import { api } from '../lib/axios'
import type { Carrito, Direccion, Pedido } from '../types'
import type { Metodo } from './operacion'
export const compras = {
  async crear(channel: 'WEB' | 'POS' | 'SOCIAL' = 'WEB') { return (await api.post<Pick<Carrito, 'id'>>('/carts', { channel })).data },
  async carrito(id: number, signal: AbortSignal) { return (await api.get<Carrito>(`/carts/${id}`, { signal })).data },
  agregar: (id: number, productId: number, quantity: number) => api.put(`/carts/${id}/items`, { productId, quantity }),
  quitar: (id: number, producto: number) => api.delete(`/carts/${id}/items/${producto}`),
  async direcciones(signal: AbortSignal) { return (await api.get<Direccion[]>('/addresses', { signal })).data },
  direccion: (datos: Omit<Direccion, 'id'>) => api.post('/addresses', datos),
  async confirmar(id: number, usuarioId: number, addressId: number) {
    return (await api.post<Pedido>(`/carts/${id}/checkout`, { addressId, idempotencyKey: `web-${usuarioId}-cart-${id}` })).data
  },
  async pedido(id: number, signal: AbortSignal) { return (await api.get<Pedido>(`/orders/${id}`, { signal })).data },
  async confirmarPos(id: number, cashSessionId: number, paymentMethod: Metodo) {
    return (await api.post<Pedido>(`/carts/${id}/checkout`, {
      cashSessionId, paymentMethod, idempotencyKey: `pos-cart-${id}`,
    })).data
  },
  async confirmarSocial(id: number, entrega: { recipientName: string; recipientPhone: string; deliveryAddress: string }) {
    return (await api.post<Pedido>(`/carts/${id}/checkout`, {
      ...entrega, idempotencyKey: `social-cart-${id}`,
    })).data
  },
  async pagar(id: number) { return (await api.post<{ checkoutUrl: string | null }>(`/orders/${id}/mockpay`)).data },
  sincronizar: (id: number) => api.post(`/orders/${id}/mockpay/sync`),
}
