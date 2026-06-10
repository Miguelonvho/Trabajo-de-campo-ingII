import crypto from 'crypto';
import { ICicloPago, IMoneda } from '@repo/types';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { PlanYaActivoException, PlanYaInactivoException } from '../exceptions';

export class PlanComunidad {
  private _id_plan_comunidad: string;
  private _precio: number;
  private _titulo: string;
  private _activa: boolean;
  private _fecha_creacion: Date;
  private _id_comunidad: string;
  private _id_ciclo_pago: string;
  private _id_moneda: string;
  private _descripcion?: string | null;
  private _mp_preapproval_plan_id?: string | null;
  private _ciclo_pago?: ICicloPago;
  private _moneda?: IMoneda;

  private constructor(
    id_plan_comunidad: string,
    precio: number,
    titulo: string,
    activa: boolean,
    fecha_creacion: Date,
    id_comunidad: string,
    id_ciclo_pago: string,
    id_moneda: string,
    descripcion?: string | null,
    mp_preapproval_plan_id?: string | null,
    ciclo_pago?: ICicloPago,
    moneda?: IMoneda,
  ) {
    this._id_plan_comunidad = id_plan_comunidad;
    this.precio = precio;
    this.titulo = titulo;
    this._activa = activa;
    this._fecha_creacion = fecha_creacion;
    this.id_comunidad = id_comunidad;
    this.id_ciclo_pago = id_ciclo_pago;
    this.id_moneda = id_moneda;
    this.descripcion = descripcion;
    this._mp_preapproval_plan_id = mp_preapproval_plan_id;
    this._ciclo_pago = ciclo_pago;
    this._moneda = moneda;
  }

  // Getters
  public get id_plan_comunidad(): string {
    return this._id_plan_comunidad;
  }
  public get precio(): number {
    return this._precio;
  }
  public get titulo(): string {
    return this._titulo;
  }
  public get activa(): boolean {
    return this._activa;
  }
  public get fecha_creacion(): Date {
    return this._fecha_creacion;
  }
  public get id_comunidad(): string {
    return this._id_comunidad;
  }
  public get id_ciclo_pago(): string {
    return this._id_ciclo_pago;
  }
  public get id_moneda(): string {
    return this._id_moneda;
  }
  public get descripcion(): string | null | undefined {
    return this._descripcion;
  }
  public get mp_preapproval_plan_id(): string | null | undefined {
    return this._mp_preapproval_plan_id;
  }
  public get ciclo_pago(): ICicloPago | undefined {
    return this._ciclo_pago;
  }
  public get moneda(): IMoneda | undefined {
    return this._moneda;
  }

  // Setters privados
  private set precio(value: number) {
    if (value <= 0)
      throw new DomainException('El precio debe ser mayor a cero');
    this._precio = value;
  }

  private set titulo(value: string) {
    if (!value || value.length > 100)
      throw new DomainException('El título es inválido');
    this._titulo = value;
  }

  private set id_comunidad(value: string) {
    if (!value) throw new DomainException('La comunidad es obligatoria');
    this._id_comunidad = value;
  }

  private set id_ciclo_pago(value: string) {
    if (!value) throw new DomainException('El ciclo de pago es obligatorio');
    this._id_ciclo_pago = value;
  }

  private set id_moneda(value: string) {
    if (!value) throw new DomainException('La moneda es obligatoria');
    this._id_moneda = value;
  }

  private set descripcion(value: string | null | undefined) {
    this._descripcion = value;
  }

  // Factory Methods
  public static crearPlanComunidad(props: {
    precio: number;
    titulo: string;
    id_comunidad: string;
    id_ciclo_pago: string;
    id_moneda: string;
    descripcion?: string | null;
    mp_preapproval_plan_id?: string | null;
  }): PlanComunidad {
    return new PlanComunidad(
      crypto.randomUUID(),
      props.precio,
      props.titulo,
      true, // Los planes suelen crearse activos por defecto o según lógica
      new Date(),
      props.id_comunidad,
      props.id_ciclo_pago,
      props.id_moneda,
      props.descripcion,
      props.mp_preapproval_plan_id,
    );
  }

  public static reconstituirPlanComunidad(props: {
    id_plan_comunidad: string;
    precio: number;
    titulo: string;
    activa: boolean;
    fecha_creacion: Date;
    id_comunidad: string;
    id_ciclo_pago: string;
    id_moneda: string;
    descripcion?: string | null;
    mp_preapproval_plan_id?: string | null;
    ciclo_pago?: ICicloPago;
    moneda?: IMoneda;
  }): PlanComunidad {
    const plan = Object.create(PlanComunidad.prototype) as PlanComunidad;
    plan._id_plan_comunidad = props.id_plan_comunidad;
    plan._precio = props.precio;
    plan._titulo = props.titulo;
    plan._activa = props.activa;
    plan._fecha_creacion = props.fecha_creacion;
    plan._id_comunidad = props.id_comunidad;
    plan._id_ciclo_pago = props.id_ciclo_pago;
    plan._id_moneda = props.id_moneda;
    plan._descripcion = props.descripcion;
    plan._mp_preapproval_plan_id = props.mp_preapproval_plan_id;
    plan._ciclo_pago = props.ciclo_pago;
    plan._moneda = props.moneda;

    return plan;
  }

  // Métodos de Comportamiento
  public desactivarPlanComunidad(): void {
    if (!this._activa)
      throw new PlanYaInactivoException(this._id_plan_comunidad);
    this._activa = false;
  }

  public reactivarPlanComunidad(): void {
    if (this._activa) throw new PlanYaActivoException(this._id_plan_comunidad);
    this._activa = true;
  }

  public actualizarPlanComunidad(props: {
    precio?: number;
    titulo?: string;
    descripcion?: string | null;
    id_ciclo_pago?: string;
    id_moneda?: string;
    mp_preapproval_plan_id?: string | null;
  }): void {
    if (props.precio !== undefined) this.precio = props.precio;
    if (props.titulo !== undefined) this.titulo = props.titulo;
    if (props.descripcion !== undefined) this.descripcion = props.descripcion;
    if (props.id_ciclo_pago !== undefined)
      this.id_ciclo_pago = props.id_ciclo_pago;
    if (props.id_moneda !== undefined) this.id_moneda = props.id_moneda;
    if (props.mp_preapproval_plan_id !== undefined)
      this._mp_preapproval_plan_id = props.mp_preapproval_plan_id;
  }
}
