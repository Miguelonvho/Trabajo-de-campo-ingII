

class Pago {
  - monto: number
  - monto_neto: number
  - mp_payment_id: string
  - estado: string
  - fecha_pago: Date
  - mp_payload_respuesta: Json
  - fecha_creacion: DateTime
  - fecha_actualizacion: DateTime
  - mp_payment_method_id: string
  - descripcion: string
  --
  + crearPago(monto: number, monto_neto: number, mp_payment_id: string, estado: string,
    fecha_pago: Date, mp_payload_respuesta: Json, fecha_creacion: DateTime, 
    fecha_actualizacion: DateTime, mp_payment_method_id: string, descripcion: string): Pago
  + procesarPago(id_pago: string): void
  + aprobarPago(idEstado: string): void
  + rechazarPago(idEstado: string): void

  - esPagoDuplicado(id_pago: string): boolean
  - obtenerDatosPago(id_pago: string): { id_pago: string, externalPreapprovalId: string,
    amount: number, netAmount: number, currencyCode: string, paymentMethodId: string, description: string, status: string }
  - inicializarPagoEntidad(suscripcionId: string, id_pago: string, amount: number, netAmount: number,
    paymentMethodId: string, description: string, status: string): Pago
}


rectangle "Patrón Observer (Eventos de Pago)" #a5c2dfff {
  class PagoEventManager {
    - observers: Map<string, PagoObserver[]>
    --
    + suscribir(tipo_evento: string, observador: PagoObserver): void
    + desuscribir(tipo_evento: string, observador: PagoObserver): void
    + notificar(tipo_evento: string, pago: Pago): void
    + obtenerObservadores(tipo_evento: string): PagoObserver[]
  }

  interface PagoObserver {
    + actualizar(pago: Pago): void
  }

  class AccesoComunidadObserver {
    - rol_asignado_por_defecto: string
    - habilitar_notificacion_bienvenida: boolean
    --
    + actualizar(pago: Pago): void
  }

  class ActualizarEstadoSuscripcionObserver {
    - estado_destino_exito: string
    - reintentar_en_caso_fallo: boolean
    --
    + actualizar(pago: Pago): void
  }

  class DesactivarSuscripcionObserver {
    - estado_destino_cancelacion: string
    - cancelar_inmediatamente: boolean
    --
    + actualizar(pago: Pago): void
  }

  class NotificacionEmailObserver {
    - plantilla_id: string
    - email_soporte_remitente: string
    --
    + actualizar(pago: Pago): void
  }

  class NotificacionEmailCancelacionObserver {
    - plantilla_cancelacion_id: string
    - email_soporte_remitente: string
    --
    + actualizar(pago: Pago): void
  }

  class RemoverMiembroComunidadObserver {
    - conservar_historial_miembro: boolean
    - notificar_creador_comunidad: boolean
    --
    + actualizar(pago: Pago): void
  }
  
  ' Relaciones internas del Patrón
  PagoEventManager "1" o--> "*" PagoObserver : notifica a >
  PagoObserver <|.. AccesoComunidadObserver
  PagoObserver <|.. ActualizarEstadoSuscripcionObserver
  PagoObserver <|.. DesactivarSuscripcionObserver
  PagoObserver <|.. NotificacionEmailObserver
  PagoObserver <|.. NotificacionEmailCancelacionObserver
  PagoObserver <|.. RemoverMiembroComunidadObserver
}

' Relación del Sujeto (Pago) con el Event Manager
Pago "1" *--> "1" PagoEventManager :  notifica a través de >
@enduml