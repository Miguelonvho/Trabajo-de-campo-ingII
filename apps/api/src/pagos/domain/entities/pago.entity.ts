import crypto from 'crypto';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { PagoEventManager } from '../pago-event-manager';
import { PagoYaAprobadoException } from '../exceptions';

/**
 * Entidad de Dominio que representa un Pago en el sistema.
 * Gestiona el ciclo de vida de la transacción monetaria e inicia las notificaciones a observadores.
 */
export class Pago {
  public static readonly events = new PagoEventManager();

  private _id_pago: string;
  private _id_suscripcion: string;
  private _monto: number;
  private _monto_neto?: number | null;
  private _mp_payment_id?: string | null;
  private _id_estado: string;
  private _fecha_pago?: Date | null;
  private _id_moneda: string;
  private _mp_payload_respuesta?: any | null;
  private _fecha_creacion: Date;
  private _fecha_actualizacion?: Date | null;
  private _mp_payment_method_id?: string | null;
  private _descripcion?: string | null;

  private constructor(props: {
    id_pago: string;
    id_suscripcion: string;
    monto: number;
    id_estado: string;
    id_moneda: string;
    fecha_creacion: Date;
    monto_neto?: number | null;
    mp_payment_id?: string | null;
    fecha_pago?: Date | null;
    mp_payload_respuesta?: any | null;
    fecha_actualizacion?: Date | null;
    mp_payment_method_id?: string | null;
    descripcion?: string | null;
  }) {
    this._id_pago = props.id_pago;
    this.id_suscripcion = props.id_suscripcion;
    this.monto = props.monto;
    this.id_estado = props.id_estado;
    this.id_moneda = props.id_moneda;
    this._fecha_creacion = props.fecha_creacion;
    this._monto_neto = props.monto_neto;
    this._mp_payment_id = props.mp_payment_id;
    this._fecha_pago = props.fecha_pago;
    this._mp_payload_respuesta = props.mp_payload_respuesta;
    this._fecha_actualizacion = props.fecha_actualizacion;
    this._mp_payment_method_id = props.mp_payment_method_id;
    this._descripcion = props.descripcion;
  }

  // Getters
  public get id_pago(): string { return this._id_pago; }
  public get id_suscripcion(): string { return this._id_suscripcion; }
  public get monto(): number { return this._monto; }
  public get monto_neto(): number | null | undefined { return this._monto_neto; }
  public get mp_payment_id(): string | null | undefined { return this._mp_payment_id; }
  public get id_estado(): string { return this._id_estado; }
  public get fecha_pago(): Date | null | undefined { return this._fecha_pago; }
  public get id_moneda(): string { return this._id_moneda; }
  public get mp_payload_respuesta(): any | null | undefined { return this._mp_payload_respuesta; }
  public get fecha_creacion(): Date { return this._fecha_creacion; }
  public get fecha_actualizacion(): Date | null | undefined { return this._fecha_actualizacion; }
  public get mp_payment_method_id(): string | null | undefined { return this._mp_payment_method_id; }
  public get descripcion(): string | null | undefined { return this._descripcion; }

  // Setters privados con validación
  private set id_suscripcion(value: string) {
    if (!value) throw new DomainException('La suscripción asociada es obligatoria');
    this._id_suscripcion = value;
  }

  private set monto(value: number) {
    if (value <= 0) throw new DomainException('El monto debe ser mayor a cero');
    this._monto = value;
  }

  private set id_estado(value: string) {
    if (!value) throw new DomainException('El estado del pago es obligatorio');
    this._id_estado = value;
  }

  private set id_moneda(value: string) {
    if (!value) throw new DomainException('La moneda es obligatoria');
    this._id_moneda = value;
  }

  // Factory Methods
  /**
   * Crea un nuevo cobro/pago en estado PENDIENTE.
   */
  public static crearPago(props: {
    id_suscripcion: string;
    monto: number;
    id_moneda: string;
    id_estado_pendiente: string;
    mp_payment_id?: string | null;
    monto_neto?: number | null;
    mp_payload_respuesta?: any | null;
    mp_payment_method_id?: string | null;
    descripcion?: string | null;
  }): Pago {
    return new Pago({
      id_pago: crypto.randomUUID(),
      fecha_creacion: new Date(),
      id_suscripcion: props.id_suscripcion,
      monto: props.monto,
      id_estado: props.id_estado_pendiente,
      id_moneda: props.id_moneda,
      mp_payment_id: props.mp_payment_id,
      monto_neto: props.monto_neto,
      mp_payload_respuesta: props.mp_payload_respuesta,
      mp_payment_method_id: props.mp_payment_method_id,
      descripcion: props.descripcion,
    });
  }

  /**
   * Reconstituye una entidad Pago desde la persistencia (BD).
   */
  public static reconstituirPago(props: {
    id_pago: string;
    id_suscripcion: string;
    monto: number;
    id_estado: string;
    id_moneda: string;
    fecha_creacion: Date;
    monto_neto?: number | null;
    mp_payment_id?: string | null;
    fecha_pago?: Date | null;
    mp_payload_respuesta?: any | null;
    fecha_actualizacion?: Date | null;
    mp_payment_method_id?: string | null;
    descripcion?: string | null;
  }): Pago {
    return new Pago(props);
  }

  // Métodos de Comportamiento (Lógica de Dominio)
  /**
   * Aprueba el pago, actualizando su estado e invocando la notificación clásica a los observadores.
   *
   * @param idEstadoAprobado - ID UUID correspondiente al estado 'APROBADO'.
   */
  public aprobarPago(idEstadoAprobado: string): void {
    if (this._id_estado === idEstadoAprobado) {
      throw new PagoYaAprobadoException(this._id_pago);
    }
    this._id_estado = idEstadoAprobado;
    const ahora = new Date();
    this._fecha_pago = ahora;
    this._fecha_actualizacion = ahora;

    // Disparar evento a observadores pasando la instancia actual
    Pago.events.notify('pagoAprobado', this);
  }

  /**
   * Rechaza el pago.
   */
  public rechazarPago(idEstadoRechazado: string): void {
    this._id_estado = idEstadoRechazado;
    this._fecha_actualizacion = new Date();
  }
}
