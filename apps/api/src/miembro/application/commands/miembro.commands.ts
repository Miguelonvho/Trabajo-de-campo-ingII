export interface AgregarMiembroCommand {
  readonly id_usuario: string;
  readonly id_comunidad: string;
  readonly id_rol: string;
}

export interface CambiarRolMiembroCommand {
  readonly id_usuario: string;
  readonly id_comunidad: string;
  readonly id_rol_nuevo: string;
}

export interface RemoverMiembroCommand {
  readonly id_usuario: string;
  readonly id_comunidad: string;
}
