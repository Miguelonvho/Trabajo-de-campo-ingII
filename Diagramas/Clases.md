@startuml
skinparam classAttributeIconSize 0
skinparam monochrome false
skinparam class {
    BackgroundColor White
    ArrowColor #2F4F4F
    BorderColor #2F4F4F
}

class Usuario {
  - nombre: string
  - apellido: string
  - email: string
  - fecha_alta: DateTime
  - activa: boolean
  - password_hash: string
  --
  + registrarUsuario(nombre: string, apellido: string, email: string, password: string): Usuario
  + iniciarSesion(usuario: Usuario): IRespuestaAuth
  + validarUsuario(email: string, pass: string): Usuario | null
  + buscarPorCorreo(email: string): Usuario | null
  + buscarPorId(id: string): Usuario | null
  + crearUsuario(nombre: string, apellido: string, email: string, password_hash: string): Usuario
  + actualizarDatosPersonales(id: string, nombre: string, apellido: string): void
  + desactivarUsuario(id: string): void
  + reactivarUsuario(id: string): void
  + cambiarPassword(nuevoHash: string): void
}

class Comunidad {
  - nombre: string
  - slug: string
  - activa: boolean
  - fecha_creacion: DateTime
  - descripcion: string
  - portada_url: string
  --
  + crearComunidad(nombre: string, descripcion: string, portada_url: string, id_categoria_comunidad: string, idCreador: string): Comunidad
  + getComunidades(): Comunidad[]
  + getMisComunidades(idCreador: string): Comunidad[]
  + getComunidad(id: string): Comunidad
  + getComunidadPorSlug(slug: string): Comunidad
  + actualizarComunidad(id: string, nombre: string, descripcion: string, portada_url: string, id_categoria_comunidad: string): Comunidad
  + desactivarComunidad(id: string): void
  + reactivarComunidad(id: string): void
  + obtenerRolUsuarioEnComunidad(idUsuario: string, slug: string): string | null
}

class Miembro {
  - fecha_ingreso: DateTime
  - fecha_actualizacion: DateTime
  - activo: boolean
  - rol: string 

  --
  + agregarMiembro(id_usuario: string, id_comunidad: string, id_rol: string): void
  + cambiarRolMiembro(id_usuario: string, id_comunidad: string, id_rol_nuevo: string): void
  + removerMiembro(id_usuario: string, id_comunidad: string): void
  + esCreador(id_usuario: string, id_comunidad: string): boolean
  + buscarMiembro(id_usuario: string, id_comunidad: string): Miembro | null
  + cambiarRol(nuevoRolId: string): void
  + activar(): void
  + desactivar(): void
}

class PlanComunidad {
  - precio: Decimal
  - titulo: string
  - descripcion: string
  - activa: boolean
  - fecha_creacion: DateTime
  - frecuencia: int
  - tipo_frecuencia: string
  - moneda: string
  - mp_preapproval_plan_id: string
  --
  + crearPlan(titulo: string, descripcion: string,
    precio: number, frecuencia: number, tipo_frecuencia: string, moneda: string,
    id_comunidad: string): PlanComunidad
  + getValidCiclosPago(): { frecuencia: int, tipo_frecuencia: string }[]
  + getPlanesPorComunidad(id_comunidad: string): PlanComunidad[]
  + getPlan(id: string): PlanComunidad
  + desactivarPlanComunidad(id: string): void
  + reactivarPlanComunidad(id: string): void
  + actualizarPlanComunidad(id: string, precio: number, titulo: string, 
    descripcion: string, frecuencia: number, tipo_frecuencia: string, 
    moneda: string, mp_preapproval_plan_id: string ): void
}

class CategoriaComunidad {
  - descripcion: string
  - activa: boolean
  --
  + getCategorias(): CategoriaComunidad[]
  + crear(descripcion: string): CategoriaComunidad
  + actualizarDescripcion(id: string, descripcion: string): void
  + desactivarCategoria(id: string): void
  + reactivarCategoria(): void
  + existeCategoria(id: string): boolean
  + validarExistencia(id: string): void
}

class Suscripcion {
  - fecha_suscripcion: DateTime
  - fecha_inicio: DateTime
  - fecha_fin: DateTime
  - external_reference: string
  - mp_subscription_id: string
  - init_point: string
  - fecha_actualizacion: DateTime
  - fecha_proximo_pago: DateTime
  - back_url: string
  - estado: string
  --
  + crearSuscripcion(id_plan_comunidad: string,
    token_tarjeta: string, email: string, back_url: string,
    idUsuario: string): Suscripcion
  + activar(idEstadoActiva: string, proximoCobro: DateTime): void
  + cancelar(idEstadoCancelada: string): void
  + renovar(proximoCobro: DateTime): void
}

class Pago {
  - monto: number
  - monto_neto: number
  - mp_payment_id: string
  - estado: string
  - fecha_pago: Date
  - moneda: string
  - mp_payload_respuesta: Json
  - fecha_creacion: DateTime
  - fecha_actualizacion: DateTime
  - mp_payment_method_id: string
  - descripcion: string
  --
  + crearPago(monto: number, monto_neto: number, mp_payment_id: string, estado: string,
    fecha_pago: Date, moneda: string, mp_payload_respuesta: Json, fecha_creacion: DateTime, 
    fecha_actualizacion: DateTime, mp_payment_method_id: string, descripcion: string): Pago
  + procesarPago(id_pago: string): void
  + aprobarPago(idEstadoAprobado: string): void
  + rechazarPago(idEstadoRechazado: string): void

  - esPagoDuplicado(id_pago: string): boolean
  - obtenerDatosPago(id_pago: string): { id_pago: string, externalPreapprovalId: string,
    amount: number, netAmount: number, currencyCode: string, paymentMethodId: string, description: string, status: string }
  - inicializarPagoEntidad(suscripcionId: string, id_pago: string, amount: number, netAmount: number,
    currencyCode: string, paymentMethodId: string, description: string, status: string): Pago
}

class MercadoPago {
  - accessToken: string
  - apiUrl: string
  --
  + createPreapprovalPlan(titulo: string, descripcion: string, precio: number, frecuencia: number, tipo_frecuencia: string, moneda: string, back_url: string): string
  + cancelPreapprovalPlan(mp_preapproval_plan_id: string): void
  + createSubscription(planId: string, email: string, cardTokenId: string): string
  + getPayment(paymentId: string): any
}

class Curso {
  - titulo: string
  - descripcion: string
  - imagen_url: string
  - certificado_habilitado: boolean
  - activa: boolean
  - fecha_creacion: DateTime
  - dificultad: string
  --
  + crearCurso(titulo: string, descripcion: string, imagen_url: string, certificado_habilitado: boolean, dificultad: string, id_comunidad: string): Curso
  + getCursosPorComunidad(id_comunidad: string): Curso[]
  + getCurso(id: string): Curso
  + actualizarCurso(id: string, titulo: string, descripcion: string, imagen_url: string, certificado_habilitado: boolean, dificultad: string): void
  + desactivarCurso(id: string): void
  + reactivarCurso(id: string): void
}

class Modulo {
  - titulo: string
  - descripcion: string
  - orden: int
  - activa: boolean
  - fecha_creacion: DateTime
  --
  + crearModulo(titulo: string, descripcion: string, orden: int, id_curso: string): Modulo
  + getModulosPorCurso(id_curso: string): Modulo[]
  + actualizarModulo(id: string, titulo: string, descripcion: string, orden: int): void
  + desactivarModulo(id: string): void
  + reactivarModulo(id: string): void
}

class Contenido {
  - titulo: string
  - descripcion: string
  - orden: int
  - activa: boolean
  - fecha_creacion: DateTime
  - url_contenido: string
  - duracion: int
  - tipo_contenido: string
  --
  + crearContenido(titulo: string, descripcion: string, orden: int, url_contenido: string, duracion: int, tipo_contenido: string, id_modulo: string): Contenido
  + getContenidosPorModulo(id_modulo: string): Contenido[]
  + actualizarContenido(id: string, titulo: string, descripcion: string, orden: int, url_contenido: string, duracion: int, tipo_contenido: string): void
  + desactivarContenido(id: string): void
  + reactivarContenido(id: string): void
}

' Relaciones de Composición (Contenedor -> Contenido)
Comunidad "1" *--> "*" Miembro : tiene >
Comunidad "1" *--> "*" PlanComunidad : ofrece >
Comunidad "1" *--> "*" Curso : ofrece >
Curso "1" *--> "*" Modulo : se divide en >
Modulo "1" *--> "*" Contenido : tiene >

' Relaciones de Asociación Unidireccional (Origen -> Destino)
Miembro "*" --> "1" Usuario : referencia a >
Pago "*" --> "1" Suscripcion : pertenece a >
Comunidad "*" --> "1" CategoriaComunidad : pertenece a >
Suscripcion "*" --> "1" Usuario : pertenece a >
Suscripcion "*" --> "1" PlanComunidad : basada en >

' Relaciones de Dependencia (Usa)
PlanComunidad ..> MercadoPago : usa >
Suscripcion ..> MercadoPago : usa >
Pago ..> MercadoPago : consulta >



rectangle "Patrón Observer (Eventos de Pago)" #a5c2dfff {
  class PagoEventManager {
    - listeners: Map<string, PagoListener[]>
    --
    + subscribe(eventType: string, listener: PagoListener): void
    + unsubscribe(eventType: string, listener: PagoListener): void
    + notify(eventType: string, pago: Pago): void
    + getListeners(eventType: string): PagoListener[]
  }

  interface PagoListener {
    + update(pago: Pago): void
  }

  class AccesoComunidadListener {
    --
    + update(pago: Pago): void
  }

  class ActualizarEstadoSuscripcionListener {
    --
    + update(pago: Pago): void
  }

  class DesactivarSuscripcionListener {
    --
    + update(pago: Pago): void
  }

  class NotificacionEmailListener {
    --
    + update(pago: Pago): void
  }

  class NotificacionEmailCancelacionListener {
    --
    + update(pago: Pago): void
  }

  class RemoverMiembroComunidadListener {
    --
    + update(pago: Pago): void
  }
  
  ' Relaciones internas del Patrón
  PagoEventManager "1" o--> "*" PagoListener : notifica a >
  PagoListener <|.. AccesoComunidadListener
  PagoListener <|.. ActualizarEstadoSuscripcionListener
  PagoListener <|.. DesactivarSuscripcionListener
  PagoListener <|.. NotificacionEmailListener
  PagoListener <|.. NotificacionEmailCancelacionListener
  PagoListener <|.. RemoverMiembroComunidadListener
}

' Relación del Sujeto (Pago) con el Event Manager
Pago "1" *--> "1" PagoEventManager :  notifica a través de >
@enduml