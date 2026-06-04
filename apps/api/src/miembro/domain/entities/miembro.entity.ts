import { IComunidad, IRol, IUsuario } from '@repo/types';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { RolYaAsignadoException } from '../exceptions';

/**
 * Entidad de Dominio que representa la pertenencia de un Usuario a una Comunidad.
 * Gestiona la relación asociativa y el rol asignado al miembro.
 */
export class Miembro {
  private _id_usuario: string;
  private _id_comunidad: string;
  private _id_rol_comunidad: string;
  private _fecha_ingreso: Date;
  private _activo: boolean;
  private _fecha_actualizacion?: Date | null;
  private _comunidad?: IComunidad;
  private _rol?: IRol;
  private _usuario?: IUsuario;

  private constructor(
    id_usuario: string,
    id_comunidad: string,
    id_rol_comunidad: string,
    fecha_ingreso: Date,
    activo = true,
    fecha_actualizacion?: Date | null,
  ) {
    this._id_usuario = id_usuario;
    this._id_comunidad = id_comunidad;
    this.id_rol_comunidad = id_rol_comunidad;
    this._fecha_ingreso = fecha_ingreso;
    this._activo = activo;
    this._fecha_actualizacion = fecha_actualizacion;
  }

  // Getters
  /** ID del usuario miembro. */
  public get id_usuario(): string {
    return this._id_usuario;
  }
  /** ID de la comunidad a la que pertenece. */
  public get id_comunidad(): string {
    return this._id_comunidad;
  }
  /** ID del rol asignado dentro de la comunidad. */
  public get id_rol_comunidad(): string {
    return this._id_rol_comunidad;
  }
  /** Fecha exacta en la que se unió a la comunidad. */
  public get fecha_ingreso(): Date {
    return this._fecha_ingreso;
  }
  /** Indica si la membresía está activa (Soft Delete). */
  public get activo(): boolean {
    return this._activo;
  }
  /** Fecha de la última actualización de sus datos o rol. */
  public get fecha_actualizacion(): Date | null | undefined {
    return this._fecha_actualizacion;
  }

  /** Información extendida de la comunidad (opcional, cargada por persistencia). */
  public get comunidad(): IComunidad | undefined {
    return this._comunidad;
  }
  /** Información extendida del rol (opcional, cargada por persistencia). */
  public get rol(): IRol | undefined {
    return this._rol;
  }
  /** Información extendida del usuario (opcional, cargada por persistencia). */
  public get usuario(): IUsuario | undefined {
    return this._usuario;
  }

  // Setters privados
  private set id_rol_comunidad(value: string) {
    if (!value) throw new DomainException('El rol es obligatorio');
    this._id_rol_comunidad = value;
  }

  // Factory Methods
  /**
   * Crea una nueva instancia de membresía con los valores iniciales.
   * @param props Datos necesarios para la creación.
   * @returns Una nueva entidad Miembro.
   */
  public static crearMiembro(props: {
    id_usuario: string;
    id_comunidad: string;
    id_rol_comunidad: string;
  }): Miembro {
    return new Miembro(
      props.id_usuario,
      props.id_comunidad,
      props.id_rol_comunidad,
      new Date(),
      true,
    );
  }

  /**
   * Reconstituye una entidad Miembro desde el estado de persistencia.
   * Evita disparar lógica de creación o setters de validación.
   * @param props Datos crudos de la base de datos.
   * @returns La entidad Miembro hidratada.
   */
  public static reconstituirMiembro(props: {
    id_usuario: string;
    id_comunidad: string;
    id_rol_comunidad: string;
    fecha_ingreso: Date;
    activo: boolean;
    fecha_actualizacion?: Date | null;
    comunidad?: IComunidad;
    rol?: IRol;
    usuario?: IUsuario;
  }): Miembro {
    const miembro = Object.create(Miembro.prototype) as Miembro;
    miembro._id_usuario = props.id_usuario;
    miembro._id_comunidad = props.id_comunidad;
    miembro._id_rol_comunidad = props.id_rol_comunidad;
    miembro._fecha_ingreso = props.fecha_ingreso;
    miembro._activo = props.activo;
    miembro._fecha_actualizacion = props.fecha_actualizacion;
    miembro._comunidad = props.comunidad;
    miembro._rol = props.rol;
    miembro._usuario = props.usuario;
    return miembro;
  }

  // Métodos de Comportamiento
  /**
   * Cambia el rol del miembro dentro de la comunidad.
   * Lanza excepción de dominio si el nuevo rol es igual al actual.
   * @param nuevoRolId ID del nuevo rol a asignar.
   */
  public cambiarRol(nuevoRolId: string): void {
    if (this._id_rol_comunidad === nuevoRolId) {
      throw new RolYaAsignadoException(nuevoRolId);
    }
    this._id_rol_comunidad = nuevoRolId;
    this._fecha_actualizacion = new Date();
  }

  /**
   * Reactiva la membresía (Soft Delete revertido).
   */
  public activar(): void {
    this._activo = true;
    this._fecha_actualizacion = new Date();
  }

  /**
   * Desactiva la membresía (Soft Delete).
   */
  public desactivar(): void {
    this._activo = false;
    this._fecha_actualizacion = new Date();
  }
}
