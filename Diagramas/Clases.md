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
  + getComunidad(id_comunidad: string): Comunidad
  + getComunidadPorSlug(slug: string): Comunidad
  + actualizarComunidad(id_comunidad: string, nombre: string, descripcion: string, portada_url: string, id_categoria_comunidad: string, activa:boolean): Comunidad
  + desactivarComunidad(id_comunidad: string): void
  + reactivarComunidad(id_comunidad: string): void
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

class Plan {
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
  + getCicloPago(tipo_frecuencia: string, frecuencia: number): string 
  + getValidCiclosPago(): { frecuencia: int, tipo_frecuencia: string }[]
  + getPlanesPorComunidad(id_comunidad: string): PlanComunidad[]
  + getPlan(id_plan: string): PlanComunidad
  + desactivarPlanComunidad(id_plan: string): void
  + reactivarPlanComunidad(id_plan: string): void
  + actualizarPlanComunidad(id_plan: string, precio: number, titulo: string, 
    descripcion: string, frecuencia: number, tipo_frecuencia: string, 
    moneda: string, mp_preapproval_plan_id: string ): void
  - validatePlanData(precio: number, frecuencia: number): void
}

class Categoria {
  - descripcion: string
  - activa: boolean
  --
  + getCategorias(): Categoria[]
  + getCategoria(id_categoria: string): Categoria
  + crear(descripcion: string): Categoria
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
  + activarSuscripcion(idEstadoActiva: string, proximoCobro: DateTime): void
  + cancelar(idEstadoCancelada: string): void
  + renovar(proximoCobro: DateTime): void
}

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

class MercadoPago {
  - accessToken: string
  - apiUrl: string
  --
  + createPreapprovalPlan(titulo: string, descripcion: string, precio: number, frecuencia: number, tipo_frecuencia: string, moneda: string, back_url: string): string
  + cancelPreapprovalPlan(mp_preapproval_plan_id: string): void
  + createSubscription(planId: string, email: string, cardTokenId: string): string
  + getPayment(id_pago: string): any
}



' Relaciones de Composición (Contenedor -> Contenido)
Comunidad "1" *--> "*" Miembro : tiene >
Comunidad "1" *--> "*" Plan : ofrece >

' Relaciones de Asociación Unidireccional (Origen -> Destino)
Miembro "*" --> "1" Usuario : referencia a >
Pago "*" --> "1" Suscripcion : pertenece a >
Comunidad "*" --> "1" Categoria : pertenece a >
Suscripcion "*" --> "1" Usuario : pertenece a >
Suscripcion "*" --> "1" Plan : basada en >

' Relaciones de Dependencia (Usa)
Plan ..> MercadoPago : usa >
Suscripcion ..> MercadoPago : usa >
Pago ..> MercadoPago : consulta >

