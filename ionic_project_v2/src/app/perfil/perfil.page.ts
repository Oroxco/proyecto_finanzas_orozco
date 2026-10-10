
import { Component, OnInit } from '@angular/core';
import { ToastController, ModalController } from '@ionic/angular';
import { MetadataBluetoothModalComponent } from '../components/metadata-bluetooth-modal/metadata-bluetooth-modal.component';
import { ApiService } from '../services/api.service';
import { OrigenDatosService } from '../services/origen-datos.service';
import * as exifr from 'exifr';

interface PerfilUsuario {
  id?: number;
  nombre: string;
  email: string;
  username: string;
}

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false
})
export class PerfilPage implements OnInit {
  perfil: PerfilUsuario = { nombre: '', email: '', username: '' };
  nuevaPassword = '';
  fotoDataUrl: string | null = null;
  metadata: Record<string, unknown> | null = null;
  guardando = false;

  private readonly fotoKey = 'foto_perfil_local';
  private usuarioId: number | null = null;

  constructor(
    private api: ApiService,
    private origen: OrigenDatosService,
    private toast: ToastController,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.restaurarFoto();
  }

  ionViewWillEnter() {
    this.restaurarFoto();

    const guardado = localStorage.getItem('usuarioLogueado');

    if (!guardado) {
      this.mensaje('No se encontró una sesión iniciada.');
      return;
    }

    try {
      const u = JSON.parse(guardado);
      this.usuarioId = Number(u.id) || null;

      this.perfil = {
        id: this.usuarioId ?? undefined,
        nombre: u.nombre || '',
        email: u.email || '',
        username: u.username || u.usuario || ''
      };

      if (this.usuarioId) {
        this.api.obtenerPerfil(this.usuarioId).subscribe({
          next: (r: any) => {
            const datos = r?.usuario || r?.data || r;

            this.perfil = {
              id: this.usuarioId ?? undefined,
              nombre: datos.nombre ?? this.perfil.nombre,
              email: datos.email ?? this.perfil.email,
              username: datos.username ?? this.perfil.username
            };
          },
          error: (e: any) => {
            this.origen.recordDiagnostic({
              metodo: 'GET',
              url: this.api.getPerfilUrl(this.usuarioId!),
              error: e?.message || 'No se pudo cargar el perfil'
            });

            this.mensaje('No se pudieron actualizar los datos del servidor.');
          }
        });
      }
    } catch {
      this.mensaje('No se pudieron leer los datos de la sesión.');
    }
  }

  private restaurarFoto() {
    try {
      const foto = localStorage.getItem(this.fotoKey);

      if (foto && foto.startsWith('data:image/')) {
        this.fotoDataUrl = foto;
      } else {
        this.fotoDataUrl = null;
      }
    } catch (error) {
      console.error('Error al recuperar la fotografía:', error);
      this.fotoDataUrl = null;
    }
  }

  async seleccionarFoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      await this.mensaje('Selecciona un archivo de imagen.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      await this.mensaje('La imagen debe pesar 8 MB o menos.');
      return;
    }

    try {
      const exif = await exifr.parse(file, true).catch(() => null);
      this.metadata = exif ? this.normalizarMetadata(exif) : {};

      const reader = new FileReader();

      reader.onload = async () => {
        const data = String(reader.result || '');

        try {
          localStorage.setItem(this.fotoKey, data);
          this.fotoDataUrl = data;
          await this.mensaje('Fotografía guardada correctamente.');
        } catch {
          await this.mensaje(
            'No hay espacio suficiente para guardar la fotografía.'
          );
        }
      };

      reader.onerror = () => {
        this.mensaje('No se pudo leer la imagen.');
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error procesando la imagen:', error);
      this.metadata = {};
      this.mensaje('No se pudo procesar la fotografía.');
    }

    input.value = '';
  }

  async abrirCompartirMetadata() {
    const modal = await this.modalController.create({
      component: MetadataBluetoothModalComponent,
      componentProps: { metadata: this.metadata },
      breakpoints: [0, 0.65, 0.95],
      initialBreakpoint: 0.95
    });

    await modal.present();
  }

  quitarFoto() {
    localStorage.removeItem(this.fotoKey);
    this.fotoDataUrl = null;
    this.metadata = null;
  }

  guardar() {
    if (
      !this.perfil.nombre.trim() ||
      !this.perfil.email.trim() ||
      !this.perfil.username.trim()
    ) {
      this.mensaje('Completa nombre, correo y usuario.');
      return;
    }

    if (!this.usuarioId) {
      this.mensaje('Vuelve a iniciar sesión.');
      return;
    }

    this.guardando = true;

    const payload: any = {
      nombre: this.perfil.nombre.trim(),
      email: this.perfil.email.trim(),
      username: this.perfil.username.trim()
    };

    if (this.nuevaPassword.trim()) {
      payload.password = this.nuevaPassword;
    }

    this.api.actualizarPerfil(this.usuarioId, payload).subscribe({
      next: (r: any) => {
        this.guardando = false;

        if (r?.success === false) {
          this.mensaje(r?.mensaje || 'No se guardaron los cambios.');
          return;
        }

        const sesion = JSON.parse(
          localStorage.getItem('usuarioLogueado') || '{}'
        );

        const actualizada = { ...sesion, ...this.perfil };
        delete actualizada.password;

        localStorage.setItem(
          'usuarioLogueado',
          JSON.stringify(actualizada)
        );

        this.nuevaPassword = '';
        this.mensaje('Perfil actualizado correctamente.');
      },
      error: (e: any) => {
        this.guardando = false;

        this.origen.recordDiagnostic({
          metodo: 'PUT',
          url: this.api.getPerfilUrl(this.usuarioId!),
          payload,
          error: e?.message || 'Error al guardar perfil'
        });

        this.mensaje('No se pudieron guardar los cambios.');
      }
    });
  }

  formatearMetadata(v: unknown): string {
    if (v instanceof Date) return v.toLocaleString();
    if (Array.isArray(v)) return v.join(', ');

    if (v && typeof v === 'object') {
      try {
        return JSON.stringify(v);
      } catch {
        return String(v);
      }
    }

    return String(v ?? '');
  }

  private normalizarMetadata(data: any): Record<string, unknown> {
    const out: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(data || {})) {
      if (typeof v !== 'function' && v !== undefined && v !== null) {
        out[k] = v;
      }
    }

    return out;
  }

  private async mensaje(message: string) {
    const t = await this.toast.create({
      message,
      duration: 3000,
      position: 'bottom'
    });

    await t.present();
  }
}
