import crypto from 'crypto';
import { DomainException } from '../../../common/exceptions/domain.exception';

/**
 * Entidad de Dominio que representa una Suscripción.
 * Contiene la lógica de negocio para la gestión del contrato, vigencia, y estados de cobro.
 */
export class Suscripcion {
  private _suscripcion_id: string;
  private _fecha_suscripcion: Date;
  private _fecha_inicio?: Date | null;
  private _fecha_fin?: Date | null;
  private _external_reference?: string | null;
  private _mp_subscription_id?: string | null;
  private _init_point?: string | null;
  private _fecha_actualizacion?: Date | null;
  private _fecha_proximo_pago?: Date | null;
  private _back_url?: string | null;
  private _id_usuario: string;
  private _id_plan_comunidad: string;
  private _id_estado: string;

  private constructor(props: {
    suscripcion_id: string;
    fecha_suscripcion: Date;
    id_usuario: string;
    id_plan_comunidad: string;
    id_estado: string;
    fecha_inicio?: Date | null;
    fecha_fin?: Date | null;
    external_reference?: string | null;
    mp_subscription_id?: string | null;
    init_point?: string | null;
    fecha_actualizacion?: Date | null;
    fecha_proximo_pago?: Date | null;
    back_url?: string | null;
  }) {
    this._suscripcion_id = props.suscripcion_id;
    this._fecha_suscripcion = props.fecha_suscripcion;
    this.id_usuario = props.id_usuario;
    this.id_plan_comunidad = props.id_plan_comunidad;
    this.id_estado = props.id_estado;
    this._fecha_inicio = props.fecha_inicio;
    this._fecha_fin = props.fecha_fin;
    this._external_reference = props.external_reference;
    this._mp_subscription_id = props.mp_subscription_id;
    this._init_point = props.init_point;
    this._fecha_actualizacion = props.fecha_actualizacion;
    this._fecha_proximo_pago = props.fecha_proximo_pago;
    this._back_url = props.back_url;
  }

  // Getters
  public get suscripcion_id(): string {
    return this._suscripcion_id;
  }
  public get fecha_suscripcion(): Date {
    return this._fecha_suscripcion;
  }
  public get fecha_inicio(): Date | null | undefined {
    return this._fecha_inicio;
  }
  public get fecha_fin(): Date | null | undefined {
    return this._fecha_fin;
  }
  public get external_reference(): string | null | undefined {
    return this._external_reference;
  }
  public get mp_subscription_id(): string | null | undefined {
    return this._mp_subscription_id;
  }
  public get init_point(): string | null | undefined {
    return this._init_point;
  }
  public get fecha_actualizacion(): Date | null | undefined {
    return this._fecha_actualizacion;
  }
  public get fecha_proximo_pago(): Date | null | undefined {
    return this._fecha_proximo_pago;
  }
  public get back_url(): string | null | undefined {
    return this._back_url;
  }
  public get id_usuario(): string {
    return this._id_usuario;
  }
  public get id_plan_comunidad(): string {
    return this._id_plan_comunidad;
  }
  public get id_estado(): string {
    return this._id_estado;
  }

  // Setters privados con validación
  private set id_usuario(value: string) {
    if (!value) throw new DomainException('El usuario es obligatorio');
    this._id_usuario = value;
  }

  private set id_plan_comunidad(value: string) {
    if (!value)
      throw new DomainException('El plan de comunidad es obligatorio');
    this._id_plan_comunidad = value;
  }

  private set id_estado(value: string) {
    if (!value) throw new DomainException('El estado es obligatorio');
    this._id_estado = value;
  }

  // Factory Methods
  /**
   * Crea una nueva suscripción en estado inicial PENDIENTE.
   */
  public static crearSuscripcion(props: {
    id_usuario: string;
    id_plan_comunidad: string;
    id_estado_pendiente: string;
    mp_subscription_id?: string | null;
    init_point?: string | null;
    back_url?: string | null;
  }): Suscripcion {
    return new Suscripcion({
      suscripcion_id: crypto.randomUUID(),
      fecha_suscripcion: new Date(),
      id_usuario: props.id_usuario,
      id_plan_comunidad: props.id_plan_comunidad,
      id_estado: props.id_estado_pendiente,
      mp_subscription_id: props.mp_subscription_id,
      init_point: props.init_point,
      back_url: props.back_url,
      external_reference: crypto.randomUUID(), // Referencia única de la transacción
    });
  }

  /**
   * Reconstituye una entidad Suscripcion desde el estado de persistencia (BD).
   */
  public static reconstituirSuscripcion(props: {
    suscripcion_id: string;
    fecha_suscripcion: Date;
    id_usuario: string;
    id_plan_comunidad: string;
    id_estado: string;
    fecha_inicio?: Date | null;
    fecha_fin?: Date | null;
    external_reference?: string | null;
    mp_subscription_id?: string | null;
    init_point?: string | null;
    fecha_actualizacion?: Date | null;
    fecha_proximo_pago?: Date | null;
    back_url?: string | null;
  }): Suscripcion {
    return new Suscripcion(props);
  }

  // Métodos de Comportamiento (Lógica de Dominio)
  /**
   * Activa la suscripción registrando el inicio del servicio y la fecha del primer/próximo cobro.
   */
  public activarSuscripcion(idEstadoActiva: string, proximoCobro: Date): void {
    this.id_estado = idEstadoActiva;
    const ahora = new Date();
    if (!this._fecha_inicio) {
      this._fecha_inicio = ahora;
    }
    this._fecha_actualizacion = ahora;
    this._fecha_proximo_pago = proximoCobro;
  }

  /**
   * Cancela la suscripción y registra el fin del servicio.
   */
  public cancelar(idEstadoCancelada: string): void {
    this.id_estado = idEstadoCancelada;
    this._fecha_actualizacion = new Date();
    this._fecha_fin = new Date();
  }

  /**
   * Renueva la suscripción extendiendo la fecha del próximo cobro.
   */
  public renovar(proximoCobro: Date): void {
    this._fecha_actualizacion = new Date();
    this._fecha_proximo_pago = proximoCobro;
  }
}
