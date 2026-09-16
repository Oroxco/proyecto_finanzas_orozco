export interface Rol {
  id: number;
  nombre: string;
}

export interface Usuario {
  id?: number;
  nombre: string;
  email: string;
  username: string;
  password?: string;
  fecha_creacion?: string;
  rol_id: number;
  activo: number;
}

export interface MensajeContacto {
  id?: number;
  nombre: string;
  empresa: string;
  email: string;
  mensaje: string;
  fecha?: string;
}