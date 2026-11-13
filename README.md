# Repuestos · POS y tienda web

En PowerShell, abre la carpeta del frontend y ejecuta:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

VITE_API_URL debe apuntar al backend con el prefijo /api. Para compilar, ejecuta npm run build.

Para la demo, usa cuentas de prueba de Administrador, Cajero y Cliente web de la API. El Administrador crea el Cajero desde Personal y el Cliente se registra desde la tienda.

La URL de Vercel y la verificación de los flujos con las cuentas de prueba están pendientes.
