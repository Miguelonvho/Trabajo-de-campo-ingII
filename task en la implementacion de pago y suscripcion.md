# Tareas: Implementación de Pagos y Suscripciones

- `[x]` **Paso 1: Modificar Integración con Mercado Pago**
  - `[x]` Agregar métodos a `IMercadoPagoService` (`createSubscription` y `getPayment`)
  - `[x]` Implementar métodos en `MercadoPagoService` utilizando el SDK `mercadopago` v2

- `[x]` **Paso 2: Desarrollar Módulo de Suscripciones**
  - `[x]` Crear entidad de dominio `Suscripcion` (`suscripcion.entity.ts`)
  - `[x]` Definir interfaz del repositorio `ISuscripcionesRepository`
  - `[x]` Implementar `PrismaSuscripcionesRepository` con resolución dinámica de estados
  - `[x]` Crear mapeador `SuscripcionesMapper`
  - `[x]` Definir interfaz `ISuscripcionesService` e implementar `SuscripcionesService`
  - `[x]` Crear DTOs para solicitudes y respuestas de suscripción
  - `[x]` Implementar `SuscripcionesController` (`POST /api/suscripciones/comunidad`)
  - `[x]` Declarar e inyectar dependencias en `SuscripcionesModule`

- `[x]` **Paso 3: Desarrollar Módulo de Pagos y Observer**
  - `[x]` Crear entidad de dominio `Pago` (`pago.entity.ts`)
  - `[x]` Definir interfaz `PagoListener` y clase `PagoEventManager`
  - `[x]` Implementar `PagoEventsRegistry` (configurador puro desacoplado)
  - `[x]` Desarrollar los 3 observadores pasivos:
    - `[x]` `ActualizarEstadoSuscripcionListener`
    - `[x]` `AccesoComunidadListener`
    - `[x]` `NotificacionEmailListener` (con envío mockeado)
  - `[x]` Definir interfaz `IPagosRepository` e implementar `PrismaPagosRepository`
  - `[x]` Crear mapeador `PagosMapper`
  - `[x]` Definir interfaz `IPagosService` e implementar `PagosService`
  - `[x]` Crear controlador `WebhooksController` (`POST /api/webhooks/mercadopago`)
  - `[x]` Registrar e inyectar dependencias y cableado en `PagosModule`

- `[x]` **Paso 4: Conectar Módulos Globalmente**
  - `[x]` Registrar `SuscripcionesModule` y `PagosModule` en `app.module.ts`

- `[x]` **Paso 5: Pruebas unitarias y de integración**
  - `[x]` Escribir pruebas para `SuscripcionesService` y `PagosService`
  - `[x]` Escribir prueba unitaria para `PagoEventsRegistry` y `Listeners`
  - `[x]` Ejecutar suite de pruebas de la API para confirmar éxito
