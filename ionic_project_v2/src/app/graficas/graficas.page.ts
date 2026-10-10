
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';

import { ApiService } from '../services/api.service';
import * as d3 from 'd3';

type Movimiento = {
  usuario_id: number;
  tipo: string;
  monto: number;
  fecha: string;
  categoria: string;
};

@Component({
  selector: 'app-graficas',
  templateUrl: './graficas.page.html',
  styleUrls: ['./graficas.page.scss'],
  standalone: false
})
export class GraficasPage implements AfterViewInit, OnDestroy {
  @ViewChild('lienzo') lienzo!: ElementRef<HTMLDivElement>;

  tipoGrafica = 'dona';
  tipoMovimiento = 'gasto';
  periodo = 'todos';
  agrupacion = 'categoria';

  movimientos: Movimiento[] = [];
  mensaje = '';
  cargando = false;

  private observer?: ResizeObserver;

  constructor(private api: ApiService) {}

  ngAfterViewInit() {
    this.observer = new ResizeObserver(() => this.dibujar());
    this.observer.observe(this.lienzo.nativeElement);
    this.cargar();
  }

  ionViewWillEnter() {
    if (this.lienzo) this.cargar();
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  cargar() {
    this.cargando = true;
    this.mensaje = '';

    this.api.obtenerHistorial().subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.movimientos)
              ? res.movimientos
              : Array.isArray(res?.historial)
                ? res.historial
                : [];

        let user: any = {};

        try {
          user = JSON.parse(
            localStorage.getItem('usuarioLogueado') || '{}'
          );
        } catch {
          this.mensaje = 'No se pudo leer la sesión.';
        }

        console.log('Registros recibidos:', raw.length);
        console.log(
          'Campos disponibles:',
          raw.length ? Object.keys(raw[0]) : []
        );

        const propios = raw.filter((d: any) =>
          user.id != null &&
          d.usuario_id != null &&
          Number(d.usuario_id) === Number(user.id)
        );

        this.movimientos = propios
          .map((d: any) => ({
            usuario_id: Number(d.usuario_id),
            tipo: String(d.tipo || '').trim().toLowerCase(),
            monto: Number(d.monto) || 0,
            fecha: String(d.fecha || d.fecha_creacion || ''),
            categoria: String(d.categoria || 'Sin categoría')
          }))
          .filter((d: Movimiento) =>
            Number.isFinite(d.monto) &&
            d.monto > 0 &&
            (d.tipo === 'ingreso' || d.tipo === 'gasto')
          );

        this.cargando = false;

        if (!raw.length) {
          this.mensaje = 'La API no devolvió movimientos.';
        } else if (!propios.length) {
          this.mensaje =
            'No se encontraron movimientos asociados al usuario actual.';
        } else if (!this.movimientos.length) {
          this.mensaje =
            'Los movimientos no tienen un formato válido para las gráficas.';
        } else {
          this.mensaje = '';
        }

        this.dibujar();
      },

      error: (error: any) => {
        console.error('Error al cargar historial:', error);
        this.cargando = false;
        this.mensaje = 'No se pudo cargar el historial desde la API.';
        this.dibujar();
      }
    });
  }

  private filtrados(): Movimiento[] {
    const hoy = new Date();
    const limite = new Date(hoy);

    if (this.periodo === '30') limite.setDate(hoy.getDate() - 30);
    if (this.periodo === '90') limite.setDate(hoy.getDate() - 90);
    if (this.periodo === '365') limite.setDate(hoy.getDate() - 365);

    return this.movimientos.filter(m => {
      const coincideTipo =
        this.tipoGrafica === 'dispersion' ||
        m.tipo === this.tipoMovimiento;

      const fechaValida =
        !!m.fecha &&
        !Number.isNaN(new Date(m.fecha).getTime());

      const coincidePeriodo =
        this.periodo === 'todos' ||
        (fechaValida && new Date(m.fecha) >= limite);

      return coincideTipo && coincidePeriodo;
    });
  }

  dibujar() {
    if (!this.lienzo) return;

    const host = this.lienzo.nativeElement;
    d3.select(host).selectAll('*').remove();

    const data = this.filtrados();

    if (!data.length) {
      d3.select(host)
        .append('p')
        .attr('class', 'vacio')
        .text(
          this.mensaje ||
          'No hay movimientos para los filtros seleccionados.'
        );
      return;
    }

    const width = Math.max(320, host.clientWidth || 600);
    const height = Math.min(460, Math.max(310, width * 0.55));

    const svg = d3.select(host)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'img')
      .attr('color', '#dddddd')
      .attr('aria-label', `Gráfica financiera ${this.tipoGrafica}`);

    const color = d3.scaleOrdinal<string, string>(
      d3.schemeObservable10
    );

    if (this.tipoGrafica === 'dispersion') {
      const byMonth = d3.rollup(
        data,
        rows => ({
          ingresos: d3.sum(
            rows.filter(r => r.tipo === 'ingreso'),
            r => r.monto
          ),
          gastos: d3.sum(
            rows.filter(r => r.tipo === 'gasto'),
            r => r.monto
          )
        }),
        r => r.fecha.slice(0, 7)
      );

      const pts = Array.from(
        byMonth,
        ([mes, v]) => ({ mes, ...v })
      ).filter(p => /^\d{4}-\d{2}$/.test(p.mes));

      if (!pts.length) {
        d3.select(host).selectAll('*').remove();
        d3.select(host)
          .append('p')
          .text('Se necesitan movimientos con fecha válida.');
        return;
      }

      const x = d3.scaleLinear()
        .domain([0, d3.max(pts, p => p.ingresos) || 1])
        .nice()
        .range([56, width - 20]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(pts, p => p.gastos) || 1])
        .nice()
        .range([height - 48, 20]);

      svg.append('g')
        .attr('transform', `translate(0,${height - 48})`)
        .call(d3.axisBottom(x).ticks(5));

      svg.append('g')
        .attr('transform', 'translate(56,0)')
        .call(d3.axisLeft(y).ticks(5));

      svg.selectAll('circle')
        .data(pts)
        .join('circle')
        .attr('cx', p => x(p.ingresos))
        .attr('cy', p => y(p.gastos))
        .attr('r', 5)
        .attr('fill', '#5b8cff')
        .append('title')
        .text(p =>
          `${p.mes}: ingresos $${p.ingresos}, gastos $${p.gastos}`
        );

      if (pts.length >= 2) {
        const mx = d3.mean(pts, p => p.ingresos)!;
        const my = d3.mean(pts, p => p.gastos)!;

        const denom = d3.sum(
          pts,
          p => (p.ingresos - mx) ** 2
        );

        if (denom > 0) {
          const slope = d3.sum(
            pts,
            p => (p.ingresos - mx) * (p.gastos - my)
          ) / denom;

          const intercept = my - slope * mx;

          svg.append('line')
            .attr('x1', x(0))
            .attr('y1', y(intercept))
            .attr('x2', x(x.domain()[1]))
            .attr('y2', y(slope * x.domain()[1] + intercept))
            .attr('stroke', '#ffbd59')
            .attr('stroke-width', 2);
        }
      }

      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height - 7)
        .attr('fill', '#ddd')
        .attr('text-anchor', 'middle')
        .text('Ingresos por mes ($)');

      svg.append('text')
        .attr('x', 10)
        .attr('y', 13)
        .attr('fill', '#ddd')
        .text('Gastos ($)');

      return;
    }

    const grupos = Array.from(
      d3.rollup(
        data,
        v => d3.sum(v, r => r.monto),
        r => this.agrupacion === 'mes'
          ? r.fecha.slice(0, 7)
          : r.categoria
      ),
      ([nombre, valor]) => ({ nombre, valor })
    )
      .filter(d => d.valor > 0)
      .sort((a, b) => b.valor - a.valor);

    if (!grupos.length) return;

    if (this.tipoGrafica === 'dona') {
      const radius = Math.min(width, height) * 0.42;

      const g = svg.append('g')
        .attr(
          'transform',
          `translate(${width / 2},${height / 2})`
        );

      const pie = d3.pie<(typeof grupos)[number]>()
        .sort(null)
        .value(d => d.valor);

      const arc = d3.arc<
        d3.PieArcDatum<(typeof grupos)[number]>
      >()
        .innerRadius(radius * 0.62)
        .outerRadius(radius);

      g.selectAll('path')
        .data(pie(grupos))
        .join('path')
        .attr('fill', d => color(d.data.nombre))
        .attr('d', arc)
        .append('title')
        .text(d =>
          `${d.data.nombre}: $${d.data.valor.toFixed(2)}`
        );

      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', 18)
        .text(
          `$${d3.sum(grupos, d => d.valor).toFixed(2)}`
        );

    } else {
      const x = d3.scaleBand()
        .domain(grupos.map(d => d.nombre))
        .range([58, width - 15])
        .padding(0.15);

      const y = d3.scaleLinear()
        .domain([0, d3.max(grupos, d => d.valor) || 1])
        .nice()
        .range([height - 72, 18]);

      svg.append('g')
        .attr('transform', `translate(0,${height - 72})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'rotate(-35)')
        .style('text-anchor', 'end');

      svg.append('g')
        .attr('transform', 'translate(58,0)')
        .call(d3.axisLeft(y).ticks(5));

      svg.selectAll('rect')
        .data(grupos)
        .join('rect')
        .attr('x', d => x(d.nombre)!)
        .attr('y', d => y(d.valor))
        .attr('width', x.bandwidth())
        .attr('height', d => y(0) - y(d.valor))
        .attr('fill', d => color(d.nombre))
        .append('title')
        .text(d =>
          `${d.nombre}: $${d.valor.toFixed(2)}`
        );
    }

    const legend = d3.select(host)
      .append('div')
      .attr('class', 'leyenda');

    grupos.forEach(d => {
      legend.append('span')
        .style('border-left', `10px solid ${color(d.nombre)}`)
        .text(`${d.nombre}: $${d.valor.toFixed(2)}`);
    });
  }
}
