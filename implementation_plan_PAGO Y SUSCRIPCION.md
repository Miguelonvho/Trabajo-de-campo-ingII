# Plan de Implementación: Módulos de Pagos y Suscripciones con Mercado Pago

Este plan detalla el desarrollo de los módulos de **Suscripciones** y **Pagos** en la API. Seguimos los lineamientos de arquitectura limpia y DDD (Domain-Driven Design) para mantener la lógica de negocio desacoplada de NestJS y de la infraestructura de Mercado Pago. Se implementa el patrón **Observer clásico** para propagar la activación del acceso a las comunidades, notificaciones, y estados de facturación ante la llegada de webhooks de pagos.

---

## User Review Required

> [!IMPORTANT]
> **Resolución Dinámica de Estados en Base de Datos**
> Para evitar el acoplamiento a UUIDs estáticos cableados (hardcoded) en las tablas `estado_pago` y `estado_suscripcion`, los repositorios buscarán el ID correspondiente haciendo una consulta dinámica basada en la descripción textual del estado (ej: `"PENDIENTE"`, `"ACTIVA"`, `"APROBADO"`). Esto garantiza portabilidad total de la base de datos entre diferentes entornos.

> [!NOTE]
> **Integración con Mercado Pago SDK v2**
> Utilizaremos las clases `PreApproval` (para suscripciones) y `Payment` (para pagos) del SDK oficial de Mercado Pago ya instalado en la versión `2.12.0`.

---

## Proposed Changes

### 1. Componente: Integración con Mercado Pago (Infraestructura Compartida)
Añadiremos los métodos para crear contratos de preaprobación y obtener detalles de pagos al servicio de Mercado Pago.

#### [MODIFY] [mercadopago.service.interface.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/mercadopago/services/mercadopago.service.interface.ts)
*   Añadir definición del método `createSubscription(planId: string, email: string, cardTokenId: string): Promise<any>` para iniciar la preaprobación en la API de Mercado Pago.
*   Añadir definición del método `getPayment(paymentId: string): Promise<any>` para recuperar los detalles y verificar la legitimidad de un pago notificado vía webhook.

#### [MODIFY] [mercadopago.service.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/mercadopago/services/mercadopago.service.ts)
*   Implementar `createSubscription` instanciando la clase `PreApproval` del SDK oficial de Mercado Pago.
*   Implementar `getPayment` instanciando la clase `Payment` del SDK oficial de Mercado Pago.

---

### 2. Componente: Módulo de Suscripciones
Módulo encargado de formalizar el contrato inicial con Mercado Pago y registrar la suscripción en estado `PENDIENTE`.

#### [NEW] [suscripcion.entity.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/suscripciones/models/suscripcion.entity.ts)
*   Entidad de dominio para representar la `Suscripcion`.
*   Métodos factoría: `crearSuscripcion(...)` y `reconstituirSuscripcion(...)`.
*   Comportamientos: `activar()`, `cancelar()`, `actualizarFechaProximoPago(date: Date)`.

#### [NEW] [suscripciones.repository.interface.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/suscripciones/infrastructure/suscripciones.repository.interface.ts)
*   Interfaz abstracta para el repositorio de suscripciones (`ISuscripcionesRepository`).

#### [NEW] [suscripciones.prisma.repository.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/suscripciones/repositories/suscripciones.prisma.repository.ts)
*   Implementación concreta usando Prisma. Maneja las consultas de inserción, actualización, y la búsqueda dinámica de UUIDs en la tabla `estado_suscripcion`.

#### [NEW] [suscripciones.mapper.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/suscripciones/infrastructure/suscripciones.mapper.ts)
*   Mapea los tipos generados por Prisma (`suscripcion`) hacia la entidad de dominio `Suscripcion`.

#### [NEW] [suscripciones.service.interface.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/suscripciones/services/suscripciones.service.interface.ts)
*   Interfaz para el servicio de aplicación (`ISuscripcionesService`).

#### [NEW] [suscripciones.service.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/suscripciones/services/suscripciones.service.ts)
*   Implementa `ISuscripcionesService`. 
*   Lógica del flujo:
    1.  Valida la existencia del usuario y el plan de comunidad.
    2.  Llama a `MercadoPagoService.createSubscription` pasando el token de tarjeta e email del usuario.
    3.  Crea la entidad `Suscripcion` en estado `PENDIENTE` con el `mp_subscription_id` devuelto.
    4.  Guarda en la base de datos local y retorna los datos al controlador.

#### [NEW] [suscripciones.controller.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/suscripciones/controllers/suscripciones.controller.ts)
*   Endpoint `POST /api/suscripciones/comunidad` que recibe `{ id_plan, token_tarjeta, email }` (inyecta el ID del usuario logueado usando guards).

#### [NEW] [suscripciones.module.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/suscripciones/suscripciones.module.ts)
*   Declaración de dependencias y exportación de `ISuscripcionesService` e `ISuscripcionesRepository`.

---

### 3. Componente: Módulo de Pagos y Notificaciones (Observer)
Módulo encargado de verificar la procedencia de fondos, registrar el pago e iniciar el flujo de eventos reactivos del negocio.

#### [NEW] [pago.entity.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/pagos/models/pago.entity.ts)
*   Entidad de dominio `Pago` que contiene la propiedad pública `events: PagoEventManager` para invocar notificaciones.
*   Método `aprobarPago()` que cambia el estado interno y ejecuta `this.events.notify('pagoAprobado', this)`.

#### [NEW] [pago-listener.interface.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/pagos/domain/pago-listener.interface.ts)
*   Interfaz pura `PagoListener` con el método abstracto `update(pago: Pago): void`.

#### [NEW] [pago-event-manager.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/pagos/domain/pago-event-manager.ts)
*   Manejador de eventos clásico que almacena la lista de subscriptores en memoria y gestiona la notificación.

#### [NEW] [pago-events-registry.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/pagos/application/pago-events-registry.ts)
*   Clase pura configuradora que define el cableado (suscripción) de los observadores concretos.

#### [NEW] [actualizar-estado-suscripcion.listener.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/pagos/application/listeners/actualizar-estado-suscripcion.listener.ts)
*   Listener pasivo que implementa `PagoListener`. 
*   Busca la suscripción vinculada al pago y cambia su estado a `ACTIVA` registrando las fechas del cobro.

#### [NEW] [acceso-comunidad.listener.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/pagos/application/listeners/acceso-comunidad.listener.ts)
*   Listener pasivo que implementa `PagoListener`.
*   Valida si el usuario ya es miembro de la comunidad afectada y, si no lo es, lo da de alta con el rol `'SUSCRIPTOR'`.

#### [NEW] [notificacion-email.listener.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/pagos/application/listeners/notificacion-email.listener.ts)
*   Listener pasivo que implementa `PagoListener`.
*   Despacha un correo electrónico de bienvenida y comprobante de pago al usuario.

#### [NEW] [pagos.repository.interface.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/pagos/infrastructure/pagos.repository.interface.ts)
*   Interfaz abstracta `IPagosRepository`.

#### [NEW] [pagos.prisma.repository.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/pagos/repositories/pagos.prisma.repository.ts)
*   Implementación concreta del repositorio de pagos usando Prisma Client.

#### [NEW] [pagos.mapper.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/pagos/infrastructure/pagos.mapper.ts)
*   Mapea los datos relacionales de Prisma a la entidad de dominio `Pago`.

#### [NEW] [pagos.service.interface.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/pagos/services/pagos.service.interface.ts)
*   Interfaz `IPagosService`.

#### [NEW] [pagos.service.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/pagos/services/pagos.service.ts)
*   Implementa `IPagosService`.
*   Lógica del flujo:
    1.  Recibe el ID de pago de Mercado Pago.
    2.  Valida la legitimidad consultando a `MercadoPagoService.getPayment()`.
    3.  Crea localmente la entidad `Pago` en estado `PENDIENTE`.
    4.  Si la respuesta de Mercado Pago indica `approved`, invoca `pago.aprobarPago()`.
    5.  El método `aprobarPago()` activa el flujo del `PagoEventManager` internamente pasando `this`.
    6.  Persiste el pago en la base de datos.

#### [NEW] [webhooks.controller.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/pagos/controllers/webhooks.controller.ts)
*   Endpoint `POST /api/webhooks/mercadopago` que recibe las notificaciones de Mercado Pago. Responde inmediatamente un HTTP 200 OK y ejecuta el flujo en segundo plano llamando a `PagosService.procesarNotificacionPago()`.

#### [NEW] [pagos.module.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/pagos/pagos.module.ts)
*   Módulo de NestJS que registra el `PagoEventManager`, los Observadores, e implementa `OnModuleInit` para invocar a `PagoEventsRegistry.registrar()` con las dependencias inyectadas.

---

### 4. Cambios en la Configuración Global de la Aplicación

#### [MODIFY] [app.module.ts](file:///c:/Users/Usuario/UNIVERSIDAD/4to%20A%C3%91O/Ingenieria%20de%20software%202/Trabajo%20de%20campo/Trabajo-de-campo-ingII/apps/api/src/app.module.ts)
*   Importar y registrar `SuscripcionesModule` y `PagosModule` en la sección de `imports` del módulo raíz.

---

## Verification Plan

### Automated Tests
Para validar la lógica pura sin acoplamiento a NestJS ni a bases de datos o Mercado Pago, se implementarán los siguientes tests unitarios con Jest:

*   **`suscripciones.service.spec.ts`**: Validar que ante una creación exitosa de suscripción en MP, se genere la entidad `Suscripcion` en estado `PENDIENTE`.
*   **`pagos.service.spec.ts`**: Validar que ante la recepción de un pago aprobado, se invoque `aprobarPago()` y que la entidad lance el flujo del manager de eventos.
*   **`pago-events-registry.spec.ts`**: Validar que el configurador registre adecuadamente todos los listeners al evento `pagoAprobado`.
*   **`listeners.spec.ts`**: Validar individualmente que `ActivarMiembroListener` y `ActualizarEstadoSuscripcionListener` realizan las acciones de negocio esperadas al recibir un objeto `Pago`.

*Para ejecutar todos los tests:*
```bash
pnpm --filter api run test
```

### Manual Verification
Se verificará el flujo de punta a punta (End-to-End) en modo de desarrollo local:
1.  **Suscripción optimista**: Realizar una petición POST al endpoint de suscripción y confirmar el guardado del contrato con estado `PENDIENTE`.
2.  **Simulación de Webhook**: Usar herramientas como *Insomnia* o *Postman* para enviar un payload mockeado simulando la estructura del Webhook de Mercado Pago hacia `/api/webhooks/mercadopago`.
3.  **Inspección de efectos**:
    *   Confirmar que el estado del Pago cambió a `APROBADO`.
    *   Confirmar que el estado de la Suscripción asociada cambió a `ACTIVA`.
    *   Confirmar que el usuario fue dado de alta en la base de datos en la tabla `miembro_comunidad` con rol `SUSCRIPTOR`.
