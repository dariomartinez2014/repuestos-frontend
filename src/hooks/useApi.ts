import { useCallback, useEffect, useState } from 'react'
import { mensajeError } from '../lib/errores'

type Peticion<T> = (signal: AbortSignal) => Promise<T>

interface Resultado<T> {
  pedir: Peticion<T>
  intento: number
  data: T | null
  error: string | null
}

export function useApi<T>(pedir: Peticion<T>, alVolver = false) {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState<Resultado<T> | null>(null)

  useEffect(() => {
    const controlador = new AbortController()
    const { signal } = controlador
    pedir(signal).then((data) => {
      if (!signal.aborted) setResultado({ pedir, intento, data, error: null })
    }).catch((error: unknown) => {
      if (!signal.aborted) setResultado({ pedir, intento, data: null, error: mensajeError(error) })
    })
    return () => controlador.abort()
  }, [pedir, intento])

  const recargar = useCallback(() => setIntento(n => n + 1), [])

  // Al volver a la pestaña, consulta el inventario compartido con otros canales.
  useEffect(() => {
    if (!alVolver) return
    window.addEventListener('focus', recargar)
    return () => window.removeEventListener('focus', recargar)
  }, [alVolver, recargar])

  const actual = resultado?.pedir === pedir && resultado.intento === intento ? resultado : null
  return {
    data: actual?.data ?? null,
    error: actual?.error ?? null,
    cargando: actual === null,
    recargar,
  }
}
