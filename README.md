# Repuestos · POS y tienda web

[Abrir la tienda en Vercel](https://repuestos-frontend-nine.vercel.app)

En PowerShell, abre la carpeta del frontend y ejecuta:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

VITE_API_URL debe apuntar al backend con el prefijo /api. Para compilar, ejecuta npm run build.

El seed del backend define estas cuentas de demostración:

| Rol | Correo |
| --- | --- |
| Administrador | `admin@repuestos.demo` |
| Cajero | `cajero@repuestos.demo` |
| Cliente web | `cliente@repuestos.demo` |

Para la demo local, copia la contraseña desde `.local/ACCESOS-DEMO.md` en el repositorio del backend. El script `npm run local:start` del backend indica dónde encontrar ese archivo. La disponibilidad de estas cuentas en Render está pendiente de verificar.

Para conectar el frontend a esa demo local, pon `VITE_API_URL=http://localhost:3000/api` en `.env` y reinicia Vite.
