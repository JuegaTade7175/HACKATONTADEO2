import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { DashboardSummary, SectorSummary } from '../types/api'

export default function DashboardPage() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null)
    const [sectors, setSectors] = useState<SectorSummary[]>([])
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let active = true
        setLoading(true)
        setError(null)

        Promise.all([
            api.get<DashboardSummary>('/dashboard/summary'),
            api.get<{ items: SectorSummary[] }>('/sectors')
        ])
            .then(([summaryResponse, sectorsResponse]) => {
                if (!active) return
                setSummary(summaryResponse.data)
                setSectors(sectorsResponse.data.items)
            })
            .catch(() => {
                if (!active) return
                setError('No se pudo cargar el dashboard. Intenta nuevamente.')
            })
            .finally(() => {
                if (!active) return
                setLoading(false)
            })

        return () => {
            active = false
        }
    }, [])

    if (loading) {
        return (
            <div className="flex h-60 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/40">
                <p className="text-slate-300">Cargando indicadores...</p>
            </div>
        )
    }

    if (error) {
        return <p className="text-rose-400">{error}</p>
    }

    if (!summary) {
        return <p className="text-slate-300">No hay datos disponibles.</p>
    }

    return (
        <div className="space-y-8">
            { }
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard title="Tropeles totales" value={summary.totalTropels} />
                <SummaryCard title="Tropeles críticos" value={summary.criticalTropels} />
                <SummaryCard title="Señales abiertas" value={summary.openSignals} />
                <SummaryCard title="Estabilidad sectorial" value={`${summary.sectorStabilityAvg}%`} />
            </div>

            { }
            <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/10">
                <h2 className="text-xl font-semibold text-slate-100">Señales por severidad</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Object.entries(summary.signalsBySeverity).map(([severity, value]) => (
                        <div key={severity} className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{severity}</p>
                            <p className="mt-3 text-3xl font-semibold text-slate-100">{value}</p>
                        </div>
                    ))}
                </div>
            </section>

            { }
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-100">Sectores Operativos</h2>
                    <span className="text-sm text-slate-400">{sectors.length} sectores detectados</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {sectors.map((sector) => (
                        <div
                            key={sector.id}
                            className="view-transition-sector-card rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/10 flex flex-col justify-between"
                            style={{ viewTransitionName: `sector-card-${sector.id}` }}
                        >
                            <div>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{sector.sectorCode}</p>
                                        <h3 className="text-xl font-semibold text-slate-100 mt-1">{sector.name}</h3>
                                    </div>
                                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs text-slate-300">
                                        {sector.climate.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="mt-6 space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                            <span>Capacidad de Tropeles</span>
                                            <span>{sector.currentLoad} / {sector.capacity}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${(sector.currentLoad / sector.capacity) > 0.85 ? 'bg-rose-500' : 'bg-emerald-500'
                                                    }`}
                                                style={{ width: `${(sector.currentLoad / sector.capacity) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                                            <span>Estabilidad</span>
                                            <span className={
                                                sector.stabilityLevel < 50 ? 'text-rose-400' :
                                                    sector.stabilityLevel < 75 ? 'text-amber-400' : 'text-emerald-400'
                                            }>
                                                {sector.stabilityLevel}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${sector.stabilityLevel < 50 ? 'bg-rose-500' :
                                                        sector.stabilityLevel < 75 ? 'bg-amber-500' : 'bg-emerald-500'
                                                    }`}
                                                style={{ width: `${sector.stabilityLevel}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Link
                                    to={`/sectors/${sector.id}/story`}
                                    viewTransition
                                    className="block w-full text-center rounded-2xl bg-slate-800 border border-slate-700/80 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-750 hover:text-white transition duration-200"
                                >
                                    Iniciar Story Engine
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}

function SummaryCard({ title, value }: { title: string; value: string | number }) {
    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/10">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">{title}</p>
            <p className="mt-4 text-4xl font-semibold text-slate-100">{value}</p>
        </div>
    )
}
