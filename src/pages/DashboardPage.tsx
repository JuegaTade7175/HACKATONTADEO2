import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { DashboardSummary } from '../types/api'

export default function DashboardPage() {
    const [data, setData] = useState<DashboardSummary | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let active = true
        setLoading(true)
        setError(null)

        api
            .get<DashboardSummary>('/dashboard/summary')
            .then((response) => {
                if (!active) return
                setData(response.data)
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
        return <p className="text-slate-300">Cargando indicadores...</p>
    }

    if (error) {
        return <p className="text-rose-400">{error}</p>
    }

    if (!data) {
        return <p className="text-slate-300">No hay datos disponibles.</p>
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard title="Tropeles totales" value={data.totalTropels} />
                <SummaryCard title="Tropeles críticos" value={data.criticalTropels} />
                <SummaryCard title="Señales abiertas" value={data.openSignals} />
                <SummaryCard title="Estabilidad sectorial" value={`${data.sectorStabilityAvg}%`} />
            </div>

            <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/10">
                <h2 className="text-xl font-semibold text-slate-100">Señales por severidad</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Object.entries(data.signalsBySeverity).map(([severity, value]) => (
                        <div key={severity} className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
                            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{severity}</p>
                            <p className="mt-3 text-3xl font-semibold text-slate-100">{value}</p>
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
