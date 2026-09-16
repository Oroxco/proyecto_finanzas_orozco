// Interfaz para la tabla 'roles'
export interface Rol {
  id: number;
  nombre: string;
}

// Interfaz para la tabla 'usuarios'
export interface Usuario {
  id?: number;          // Opcional porque MySQL lo autogenera
  nombre: string;
  email: string;
  username: string;
  password?: string;
  fecha_creacion?: string;
  rol_id: number;       // Llave foránea hacia roles
  activo: number;       // 1 para activo, 0 para inactivo
}

// Interfaz para la tabla 'mensajes_contacto'
export interface MensajeContacto {
  id?: number;
  nombre: string;
  empresa: string;
  email: string;
  mensaje: string;
  fecha?: string;
}