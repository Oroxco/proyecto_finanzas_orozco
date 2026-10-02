import { Injectable } from '@angular/core';

export interface OrigenDatos {
  protocol: 'http' | 'https';
  apiHost: string;
  apiPort: number;
  apiPath: string;
  dbProtocol: string;
  dbHost: string;
  dbPort: number;
  dbName: string;
  note?: string;
}
export interface DiagnosticoApi {
  fecha: string; metodo: string; url: string; protocolo: string;
  ipDestino: string; puertoApi: number; payload: any; cabeceras: Record<string,string>;
  dbProtocol: string; dbHost: string; dbPort: number; dbName: string;
  error?: string;
}
@Injectable({ providedIn: 'root' })
export class OrigenDatosService {
  private readonly key = 'origen_datos_config';
  private readonly diagKey = 'ultimo_diagnostico_api';
  private defaults: OrigenDatos = {
    protocol: 'http', apiHost: 'localhost', apiPort: 8080,
    apiPath: 'api_ionic/api.php', dbProtocol: 'mysql',
    dbHost: 'localhost', dbPort: 3306, dbName: 'app_ionic'
  };
  getConfig(): OrigenDatos {
    try {
      const saved = localStorage.getItem(this.key);
      return saved ? { ...this.defaults, ...JSON.parse(saved) } : { ...this.defaults };
    } catch { return { ...this.defaults }; }
  }
  saveConfig(config: OrigenDatos): void {
    localStorage.setItem(this.key, JSON.stringify(config, null, 2));
    localStorage.setItem('server_ip', `${config.protocol}://${config.apiHost}:${config.apiPort}`);
  }
  getApiUrl(): string {
    const c = this.getConfig();
    const protocol = c.protocol || 'http';
    const host = (c.apiHost || 'localhost').trim();
    const port = Number(c.apiPort) || (protocol === 'https' ? 443 : 80);
    const path = (c.apiPath || 'api_ionic/api.php').replace(/^\/+/, '');
    return `${protocol}://${host}:${port}/${path}`;
  }
  recordDiagnostic(data: Partial<DiagnosticoApi>): DiagnosticoApi {
    const c = this.getConfig();
    const diagnostic: DiagnosticoApi = {
      fecha: new Date().toISOString(), metodo: data.metodo || 'POST',
      url: data.url || this.getApiUrl(), protocolo: data.protocolo || c.protocol,
      ipDestino: c.apiHost, puertoApi: c.apiPort,
      payload: data.payload ?? {}, cabeceras: data.cabeceras || {
        'Content-Type': 'application/json', 'Accept': 'application/json'
      },
      dbProtocol: c.dbProtocol, dbHost: c.dbHost, dbPort: c.dbPort, dbName: c.dbName,
      error: data.error
    };
    localStorage.setItem(this.diagKey, JSON.stringify(diagnostic, null, 2));
    return diagnostic;
  }
  getDiagnostic(): DiagnosticoApi | null {
    try { const v = localStorage.getItem(this.diagKey); return v ? JSON.parse(v) : null; }
    catch { return null; }
  }
}
