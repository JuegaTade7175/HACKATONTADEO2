import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { SectorStoryResponse, SectorStoryStage } from '../types/api'

const supportsViewTransition = typeof document !== 'undefined' && 'startViewTransition' in document

export default function SectorStoryPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [data, setData] = useState<SectorStoryResponse | null>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const stepsRef = useRef<(HTMLDivElement | null)[]>([])

    useEffect(() => {
        if (!id) return
        let active = true
        setLoading(true)
        setError(null)

        api
            .get<SectorStoryResponse>(`/sectors/${id}/story`)
            .then((response) => {
                if (!active) return
                setData(response.data)
            })
            .catch(() => {
                if (!active) return
                setError('No se pudo cargar la historia del sector. Intenta nuevamente.')
            })
            .finally(() => {
                if (!active) return
                setLoading(false)
            })

        return () => {
            active = false
        }
    }, [id])

    useEffect(() => {
        if (!data) return

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((entry) => entry.isIntersecting)
                if (visible.length === 0) return
                const nextIndex = Math.min(
                    data.stages.length - 1,
                    Math.max(...visible.map((entry) => Number(entry.target.getAttribute('data-index')))),
                )
                setActiveIndex(nextIndex)
            },
            { rootMargin: '-40% 0px -40% 0px', threshold: 0.2 },
        )

        stepsRef.current.forEach((step) => step && observer.observe(step))
        return () => observer.disconnect()
    }, [data])

    const progress = useMemo(() => {
        if (!data) return 0
        return ((activeIndex + 1) / data.stages.length) * 100
    }, [activeIndex, data])

    function handleTransition(callback: () => void) {
        if (supportsViewTransition) {
            ; (document as any).startViewTransition(() => callback())
        } else {
            callback()
        }
    }

    function handleBack() {
        handleTransition(() => {
            navigate(-1)
        })
    }

    if (loading) {
        return <p className="text-slate-300">Cargando story...</p>
    }

    if (error) {
        return <p className="text-rose-400">{error}</p>
    }

    if (!data) {
        return <p className="text-slate-300">Historia no disponible.</p>
    }

    return (
        <div className="space-y-8">
            <button
                type="button"
                onClick={handleBack}
                className="rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-2 text-sm text-slate-200 hover:border-slate-600 transition duration-200"
            >
                ← Volver
            </button>

            <section className="grid gap-8 xl:grid-cols-[1.4fr_0.8fr] view-transition-sector-header">
                <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/10">
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Sector {data.sector.name}</p>
                        <h1 className="mt-3 text-3xl font-semibold text-slate-100">Story Engine</h1>
                        <p className="mt-3 text-sm leading-6 text-slate-400">Una experiencia de scrollytelling construida con datos reales del backend.</p>
                        <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500 scroll-progress-bar" style={{ width: `${progress}%` }} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {data.stages.map((stage, index) => (
                            <div
                                key={stage.id}
                                ref={(element) => {
                                    stepsRef.current[index] = element
                                }}
                                data-index={index}
                                tabIndex={0}
                                onFocus={(e) => {
                                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                    setActiveIndex(index)
                                }}
                                className={`story-card rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/10 transition-all duration-300 outline-none focus:ring-2 focus:ring-emerald-500/50 ${index === activeIndex ? 'scale-100 border-emerald-500 bg-slate-900' : 'scale-[0.99] opacity-75'
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Etapa {index + 1}</p>
                                        <h2 className="mt-3 text-2xl font-semibold text-slate-100">{stage.title}</h2>
                                    </div>
                                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">{Math.round(stage.progress * 100)}%</span>
                                </div>
                                <p className="mt-4 text-slate-300 leading-7">{stage.narrative}</p>
                                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                    <Metric label="Evento" value={stage.dominantEvent} />
                                    <Metric label="Progreso" value={`${Math.round(stage.progress * 100)}%`} />
                                    <Metric label="Color" value={stage.colorToken} />
                                </div>
                                <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/90 p-4 text-sm text-slate-400">
                                    {Object.entries(stage.metrics).map(([name, value]) => (
                                        <div key={name} className="flex items-center justify-between gap-2 py-2 text-slate-200">
                                            <span className="capitalize">{name}</span>
                                            <strong>{value}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <aside className="xl:sticky xl:top-24 h-fit space-y-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/10">
                    <h2 className="text-xl font-semibold text-slate-100">Visual del sector</h2>
                    <p className="text-sm text-slate-400">La escena cambia según la etapa activa.</p>
                    
                    {/* Visual box representing the asset and color code */}
                    <div 
                        className="mt-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-slate-100 transition-all duration-500"
                        style={{
                            borderLeft: `8px solid ${
                                data.stages[activeIndex].colorToken === 'emerald' ? '#10b981' :
                                data.stages[activeIndex].colorToken === 'rose' ? '#f43f5e' :
                                data.stages[activeIndex].colorToken === 'amber' ? '#f59e0b' :
                                data.stages[activeIndex].colorToken === 'blue' ? '#3b82f6' :
                                data.stages[activeIndex].colorToken === 'purple' ? '#8b5cf6' : '#64748b'
                            }`
                        }}
                    >
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Escena Activa</p>
                        <h3 className="mt-3 text-2xl font-semibold text-slate-100">{data.stages[activeIndex].assetKey}</h3>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-wider text-slate-300">
                                {data.stages[activeIndex].dominantEvent}
                            </span>
                            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-wider text-slate-300">
                                Color: {data.stages[activeIndex].colorToken}
                            </span>
                        </div>
                    </div>
                    
                    <nav className="grid gap-3">
                        {data.stages.map((stage, index) => (
                            <button
                                key={stage.id}
                                type="button"
                                onClick={() => handleTransition(() => setActiveIndex(index))}
                                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition duration-200 outline-none focus:ring-2 focus:ring-emerald-500/50 ${index === activeIndex
                                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-100'
                                        : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                                    }`}
                            >
                                <span className="font-semibold">Etapa {index + 1}</span>
                                <p className="mt-1 text-slate-400">{stage.title}</p>
                            </button>
                        ))}
                    </nav>
                </aside>
            </section>
        </div>
    )
}

function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">{value}</p>
        </div>
    )
}
