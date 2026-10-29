import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BIResumo } from "./useGestaoBI";

const COLORS = {
  primary: "var(--chart-line-primary)",
  forecast: "var(--chart-line-forecast)",
  loss: "var(--destructive)",
  pace: "var(--chart-line-pace)",
};

const CORES_SELECIONADOS = {
  azul: "oklch(0.65 0.14 245)",
  verdeClaro: "oklch(0.80 0.12 155)",
  azulClaro: "oklch(0.72 0.12 235)",
  verdeMaisClaro: "oklch(0.85 0.10 145)",
  azulEscuro: "oklch(0.60 0.15 255)",
  verdeAgua: "oklch(0.75 0.13 165)",
};

const PALETA_AZUL_VERDE = [
  CORES_SELECIONADOS.azul,
  CORES_SELECIONADOS.verdeClaro,
  CORES_SELECIONADOS.azulClaro,
  CORES_SELECIONADOS.verdeMaisClaro,
  CORES_SELECIONADOS.azulEscuro,
  CORES_SELECIONADOS.verdeAgua,
  "oklch(0.68 0.13 220)",
  "oklch(0.82 0.11 150)",
  "oklch(0.55 0.16 250)",
  "oklch(0.78 0.12 160)",
];

const FATIA_CORES = [
  "var(--chart-line-primary)",
  "var(--chart-line-forecast)",
  "var(--chart-line-pace)",
  "var(--destructive)",
  "oklch(0.72 0.12 200)",
  "oklch(0.65 0.15 150)",
  "oklch(0.7 0.14 90)",
  "oklch(0.68 0.13 300)",
  "oklch(0.62 0.12 250)",
  "oklch(0.7 0.1 30)",
];

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const inteiro = (v: number) => String(Math.round(v));
const pct = (v: number) => `${v.toFixed(2).replace(".", ",")}%`;
const cltFmt = (v: number) => v.toFixed(2).replace(".", ",");

const trunc = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

const axis = {
  stroke: "var(--chart-axis)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

function ChartTooltip({
  active,
  payload,
  label,
  fmt,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>;
  label?: string;
  fmt: (v: number) => string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="neu-raised min-w-[160px] max-w-[260px] rounded-xl px-3.5 py-2.5 shadow-2xl">
      {label !== undefined && (
        <p className="mb-2 truncate text-[11px] font-bold text-foreground">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={`${p.dataKey ?? i}`} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm"
                style={{ background: p.color ?? "var(--primary)" }}
              />
              <span className="text-[11px] text-muted-foreground">{p.name}</span>
            </div>
            <span className="text-[12px] font-bold tabular-nums text-foreground">
              {fmt(Number(p.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Viz = "coluna" | "barra" | "linha" | "area" | "rosca" | "pizza";

const VIZ_LABEL: Record<Viz, string> = {
  coluna: "Coluna",
  barra: "Barra",
  linha: "Linha",
  area: "Área",
  rosca: "Rosca",
  pizza: "Pizza",
};

function VizSelector({
  valor,
  onChange,
  opcoes,
}: {
  valor: Viz;
  onChange: (v: Viz) => void;
  opcoes: Viz[];
}) {
  return (
    <div className="neu-inset flex items-center gap-0.5 rounded-full p-0.5">
      {opcoes.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
            valor === v ? "neu-raised text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {VIZ_LABEL[v]}
        </button>
      ))}
    </div>
  );
}

function ChartCard({
  title,
  note,
  viz,
  onViz,
  opcoes,
  children,
}: {
  title: string;
  note?: string;
  viz: Viz;
  onViz: (v: Viz) => void;
  opcoes: Viz[];
  children: React.ReactNode;
}) {
  return (
    <div className="neu-card p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold leading-tight text-foreground">{title}</h3>
          {note ? <p className="text-[10px] text-chart-legend">{note}</p> : null}
        </div>
        <VizSelector valor={viz} onChange={onViz} opcoes={opcoes} />
      </div>
      <div className="h-[240px] w-full">{children}</div>
    </div>
  );
}

interface Serie {
  key: string;
  name: string;
  color: string;
}

/** Gráfico de série temporal (meses no eixo) nas visualizações Coluna/Barra/Linha/Área. */
function SeriesViz({
  viz,
  data,
  series,
  fmt,
  yTick,
  yDomain,
  idPrefix,
  labelPad = 16,
}: {
  viz: Viz;
  data: Record<string, unknown>[];
  series: Serie[];
  fmt: (v: number) => string;
  yTick?: (v: number) => string;
  yDomain?: [number | string, number | string];
  idPrefix: string;
  labelPad?: number;
}) {
  const multi = series.length > 1;
  const yTickFn = yTick ?? ((v: number) => String(v));
  const yWidth = yTick ? 72 : 36;
  const labelFont = multi ? 9 : 10;
  const labelStyle = { fontSize: labelFont, fill: "var(--chart-label)", fontWeight: 600 };
  const margin = { top: 24, right: 12, left: 0, bottom: 0 };
  const legend = multi ? (
    <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
  ) : null;

  if (viz === "barra") {
    return (
      <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ ...margin, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          {...axis}
          tickFormatter={yTickFn}
          allowDecimals={false}
          domain={yDomain ?? [0, "auto"]}
        />
        <YAxis type="category" dataKey="label" {...axis} width={64} interval={0} />
        <Tooltip content={<ChartTooltip fmt={fmt} />} />
        {legend}
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[0, 4, 4, 0]} barSize={multi ? 10 : 16} animationDuration={300}>
            <LabelList dataKey={s.key} position="right" formatter={fmt} style={labelStyle} />
          </Bar>
        ))}
      </BarChart>
      </ResponsiveContainer>
    );
  }

  if (viz === "linha") {
    return (
      <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={margin}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          {...axis}
          interval={0}
          fontSize={10}
          padding={{ left: labelPad, right: labelPad }}
        />
        <YAxis
          {...axis}
          tickFormatter={yTickFn}
          allowDecimals={false}
          domain={yDomain ?? [0, "auto"]}
          width={yWidth}
        />
        <Tooltip content={<ChartTooltip fmt={fmt} />} />
        {legend}
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2.5}
            dot={{ r: 3 }}
            animationDuration={300}
            label={{ position: "top", formatter: fmt, ...labelStyle }}
          />
        ))}
      </LineChart>
      </ResponsiveContainer>
    );
  }

  if (viz === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={margin}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`${idPrefix}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={multi ? 0.35 : 0.5} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          {...axis}
          interval={0}
          fontSize={10}
          padding={{ left: labelPad, right: labelPad }}
        />
        <YAxis
          {...axis}
          tickFormatter={yTickFn}
          allowDecimals={false}
          domain={yDomain ?? [0, "auto"]}
          width={yWidth}
        />
        <Tooltip content={<ChartTooltip fmt={fmt} />} />
        {legend}
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2.5}
            fill={`url(#${idPrefix}-${s.key})`}
            animationDuration={300}
            label={{ position: "top", formatter: fmt, ...labelStyle }}
          />
        ))}
      </AreaChart>
      </ResponsiveContainer>
    );
  }

  // coluna (padrão)
  return (
    <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={margin}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
      <XAxis
        dataKey="label"
        {...axis}
        interval={0}
        fontSize={10}
        padding={{ left: 16, right: 16 }}
      />
      <YAxis
        {...axis}
        tickFormatter={yTickFn}
        allowDecimals={false}
        domain={yDomain ?? [0, "auto"]}
        width={yWidth}
      />
        <Tooltip content={<ChartTooltip fmt={fmt} />} />
        {legend}
      {series.map((s) => (
        <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} animationDuration={300}>
          <LabelList dataKey={s.key} position="top" formatter={fmt} style={labelStyle} />
        </Bar>
      ))}
    </BarChart>
    </ResponsiveContainer>
  );
}

/** Gráfico categórico (Motivos de Cancelamento): Barra, Coluna, Rosca ou Pizza. */
function CategoriaViz({
  viz,
  data,
  cores = FATIA_CORES,
}: {
  viz: Viz;
  data: { motivo: string; total: number }[];
  cores?: string[];
}) {
  const total = data.reduce((acc, m) => acc + m.total, 0);

  function TooltipContent({ active, payload }: { active?: boolean; payload?: Array<{ name?: string; value?: number; payload?: { motivo: string; total: number } }> }) {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0];
    if (!p) return null;
    const motivo = p.payload?.motivo ?? p.name ?? "";
    const valor = Number(p.value ?? 0);
    const pct = total > 0 ? ((valor / total) * 100).toFixed(1).replace(".", ",") : "0,0";
    return (
      <div
        className="neu-raised min-w-[160px] max-w-[260px] rounded-xl px-3.5 py-2.5 shadow-2xl"
      >
        <div className="mb-1 text-[12px] font-bold leading-tight text-foreground">{motivo}</div>
        <div className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">{valor}</span> ({pct}%)
        </div>
      </div>
    );
  }

  if (viz === "rosca" || viz === "pizza") {
    return (
      <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <Pie
          data={data}
          dataKey="total"
          nameKey="motivo"
          innerRadius={viz === "rosca" ? 55 : 0}
          outerRadius={85}
          paddingAngle={1}
          animationDuration={300}
          label={(p: { value?: number }) => String(p.value ?? "")}
          fontSize={10}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={cores[i % cores.length]} />
          ))}
        </Pie>
        <Tooltip content={<TooltipContent />} />
        <Legend
          verticalAlign="bottom"
          wrapperStyle={{ fontSize: 10, paddingTop: 8, lineHeight: "16px" }}
        />
      </PieChart>
      </ResponsiveContainer>
    );
  }

  if (viz === "coluna") {
    return (
      <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 24, right: 12, left: 0, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="motivo"
          {...axis}
          fontSize={9}
          interval={0}
          angle={-30}
          textAnchor="end"
          tickFormatter={(s: string) => trunc(s, 16)}
        />
        <YAxis {...axis} allowDecimals={false} width={32} />
        <Tooltip content={<TooltipContent />} />
        <Bar dataKey="total" name="Cancelamentos" radius={[4, 4, 0, 0]} animationDuration={300}>
          {data.map((_, i) => (
            <Cell key={i} fill={cores[i % cores.length]} />
          ))}
          <LabelList
            dataKey="total"
            position="top"
            formatter={inteiro}
            style={{ fontSize: 10, fill: "var(--chart-label)", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
      </ResponsiveContainer>
    );
  }

  // barra horizontal (padrão)
  return (
    <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} layout="vertical" margin={{ top: 8, right: 32, left: 8, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
      <XAxis type="number" {...axis} allowDecimals={false} />
      <YAxis
        type="category"
        dataKey="motivo"
        {...axis}
        width={170}
        interval={0}
        tickFormatter={(s: string) => trunc(s, 30)}
      />
      <Tooltip content={<TooltipContent />} />
      <Bar dataKey="total" name="Cancelamentos" radius={[0, 4, 4, 0]} barSize={16} animationDuration={300}>
        {data.map((_, i) => (
          <Cell key={i} fill={cores[i % cores.length]} />
        ))}
        <LabelList
          dataKey="total"
          position="right"
          formatter={inteiro}
          style={{ fontSize: 10, fill: "var(--chart-label)", fontWeight: 600 }}
        />
      </Bar>
    </BarChart>
    </ResponsiveContainer>
  );
}

const TEMPORAIS_FLUXO: Viz[] = ["coluna", "barra", "linha", "area"];
const TEMPORAIS_NIVEL: Viz[] = ["linha", "area", "coluna", "barra"];
const TEMPORAIS_LINHA: Viz[] = ["linha", "coluna", "barra"];
const CATEGORICAS: Viz[] = ["barra", "coluna", "rosca", "pizza"];

export function GestaoBICharts({ bi }: { bi: BIResumo }) {
  const data = bi.meses;
  const [vizFluxoClientes, setVizFluxoClientes] = React.useState<Viz>("coluna");
  const [vizAtivos, setVizAtivos] = React.useState<Viz>("linha");
  const [vizClt, setVizClt] = React.useState<Viz>("linha");
  const [vizFluxoMrr, setVizFluxoMrr] = React.useState<Viz>("coluna");
  const [vizMrr, setVizMrr] = React.useState<Viz>("linha");
  const [vizChurnQtd, setVizChurnQtd] = React.useState<Viz>("linha");
  const [vizChurnMrr, setVizChurnMrr] = React.useState<Viz>("coluna");
  const [vizMotivos, setVizMotivos] = React.useState<Viz>("barra");

  const motivos = React.useMemo(
    () => [...bi.motivos].sort((a, b) => b.total - a.total),
    [bi.motivos],
  );

  // CLT é indicador de nível: o eixo acompanha o intervalo dos dados (com folga),
  // em vez de começar em zero — senão a linha parece reta.
  const cltDomain = React.useMemo<[number, number]>(() => {
    const valores = data.map((m) => m.clt).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (!valores.length) return [0, 1];
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    return [Math.max(0, Math.floor(min - 0.5)), Math.ceil(max + 0.5)];
  }, [data]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Entrada vs. Saída de Clientes" viz={vizFluxoClientes} onViz={setVizFluxoClientes} opcoes={TEMPORAIS_FLUXO}>
        <SeriesViz
          viz={vizFluxoClientes}
          data={data}
          idPrefix="fluxo-clientes"
          fmt={inteiro}
          series={[
            { key: "novos", name: "Novos", color: CORES_SELECIONADOS.azul },
            { key: "cancelados", name: "Cancelados", color: COLORS.loss },
          ]}
        />
      </ChartCard>

      <ChartCard title="Clientes Ativos" viz={vizAtivos} onViz={setVizAtivos} opcoes={TEMPORAIS_NIVEL}>
        <SeriesViz
          viz={vizAtivos}
          data={data}
          idPrefix="ativos"
          fmt={inteiro}
          series={[{ key: "ativos", name: "Projetos ativos", color: COLORS.primary }]}
        />
      </ChartCard>

      <ChartCard
        title="CLT (meses)"
        note="Eixo ajustado ao intervalo dos dados (não inicia em zero)."
        viz={vizClt}
        onViz={setVizClt}
        opcoes={TEMPORAIS_LINHA}
      >
        <SeriesViz
          viz={vizClt}
          data={data}
          idPrefix="clt"
          fmt={cltFmt}
          yTick={cltFmt}
          yDomain={cltDomain}
          series={[{ key: "clt", name: "CLT", color: COLORS.forecast }]}
        />
      </ChartCard>

      <ChartCard title="Entrada vs. Saída de MRR" viz={vizFluxoMrr} onViz={setVizFluxoMrr} opcoes={TEMPORAIS_FLUXO}>
        <SeriesViz
          viz={vizFluxoMrr}
          data={data}
          idPrefix="fluxo-mrr"
          labelPad={48}
          fmt={brl}
          yTick={brl}
          series={[
            { key: "nmrr", name: "nMRR", color: CORES_SELECIONADOS.azul },
            { key: "mrrPerdido", name: "MRR perdido", color: COLORS.loss },
          ]}
        />
      </ChartCard>

      <ChartCard title="MRR Ativo" viz={vizMrr} onViz={setVizMrr} opcoes={TEMPORAIS_NIVEL}>
        <SeriesViz
          viz={vizMrr}
          data={data}
          idPrefix="mrr"
          labelPad={48}
          fmt={brl}
          yTick={brl}
          series={[{ key: "mrr", name: "MRR", color: COLORS.forecast }]}
        />
      </ChartCard>

      <ChartCard title="Churn Quantitativo (%)" viz={vizChurnQtd} onViz={setVizChurnQtd} opcoes={TEMPORAIS_LINHA}>
        <SeriesViz
          viz={vizChurnQtd}
          data={data}
          idPrefix="churn-qtd"
          fmt={pct}
          yTick={(v) => `${v.toFixed(0)}%`}
          series={[{ key: "churnQtd", name: "Churn quantitativo", color: COLORS.pace }]}
        />
      </ChartCard>

      <ChartCard title="Churn (R$)" viz={vizChurnMrr} onViz={setVizChurnMrr} opcoes={TEMPORAIS_FLUXO}>
        <SeriesViz
          viz={vizChurnMrr}
          data={data}
          idPrefix="churn-mrr"
          labelPad={48}
          fmt={brl}
          yTick={brl}
          series={[{ key: "mrrPerdido", name: "MRR perdido", color: CORES_SELECIONADOS.azul }]}
        />
      </ChartCard>

      <ChartCard title="Motivos de Cancelamento" viz={vizMotivos} onViz={setVizMotivos} opcoes={CATEGORICAS}>
        {motivos.length ? (
          <CategoriaViz viz={vizMotivos} data={motivos} cores={PALETA_AZUL_VERDE} />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Sem motivos de cancelamento na planilha importada.
          </div>
        )}
      </ChartCard>
    </div>
  );
}
