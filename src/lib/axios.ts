import axios from 'axios'
import { useAuthStore } from '../store'

// Los servicios comparten la dirección de la API definida en VITE_API_URL.
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL, timeout: 90000 })
// Las solicitudes de la sesión llevan el token como Bearer.
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().sesion?.token
  if (token && config.url !== '/auth/login' && config.url !== '/auth/register' && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`
  return config
})
// Un 401 cierra la sesión si la petición usó el token que sigue activo.
api.interceptors.response.use(undefined, (error: unknown) => {
  const token = useAuthStore.getState().sesion?.token
  if (axios.isAxiosError(error) && token && error.response?.status === 401 && error.config?.headers.Authorization === `Bearer ${token}`) useAuthStore.getState().salir()
  return Promise.reject(error)
})
