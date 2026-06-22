import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Tropel, TropelPage } from '../types/api'

const SORT_OPTIONS = [
    { value: 'updatedAt,desc', label: 'Actualizados' },
    { value: 'name,asc', label: 'Nombre' },
    { value: 'chaosIndex,desc', label: 'Caos' },
]

const PAGE_SIZES = [10, 20, 50]

export default function TropelsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [data, setData] = useState<TropelPage | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const page = Number(searchParams.get('page') ?? 0)
    const size = Number(searchParams.get('size') ?? 20)
    const sort = searchParams.get('sort') ?? 'updatedAt,desc'
    const q = searchParams.get('q') ?? ''

    const query = useMemo(() => ({
        page: String(page),
        size: String(size),
        sort,
        q,
    }), [page, size, sort, q])

    useEffect(() => {
        let active = true
        setLoading(true)
        setError(null)

        api
            .get<TropelPage>('/tropels', { params: query })
            .then((response) => {
                if (!active) return
                setData(response.data)
            })
            .catch(() => {
                if (!active) return
                setError('No se pudieron cargar los tropeles. Intenta nuevamente.')
            })
            .finally(() => {
                if (!active) return
                setLoading(false)
            })

        return () => {
            active = false
        }
    }, [query])

    function updateParam(key: string, value: string) {
        setSearchParams((current) => {
            const next = new URLSearchParams(current)
            if (value) {
                next.set(key, value)
            } else {
                next.delete(key)
            }
            if (key !== 'page') {
                next.delete('page')
            }
            return next
        })
    }

    return (
        <div className="space-y-8">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-100">Atlas de Tropeles</h1>
                        <p className="mt-2 text-sm text-slate-400">Explora, ordena y busca en tiempo real con filtros sincronizados en URL.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <input
                            value={q}
                            onChange={(event) => updateParam('q', event.target.value)}
                            placeholder="Buscar tropeles..."
                            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                        <select
                            value={sort}
                            onChange={(event) => updateParam('sort', event.target.value)}
                            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        >
                            {SORT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={String(size)}
                            onChange={(event) => updateParam('size', event.target.value)}
                            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        >
                            {PAGE_SIZES.map((value) => (
                                <option key={value} value={value}>
                                    {value} / página
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <p className="text-slate-300">Cargando tropeles...</p>
            ) : error ? (
                <p className="text-rose-400">{error}</p>
            ) : data?.content.length ? (
                <div className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        {data.content.map((tropel) => (
                            <article key={tropel.id} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/10">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-semibold text-slate-100">{tropel.name}</h2>
                                        <p className="mt-1 text-sm text-slate-400">{tropel.species} — {tropel.vitalState}</p>
                                    </div>
                                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">{tropel.sector.name}</span>
                                </div>
                                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                    <Stat label="Energía" value={tropel.energyLevel} />
                                    <Stat label="Caos" value={tropel.chaosIndex} />
                                    <Stat label="Mutación" value={tropel.mutationStage} />
                                </div>
                                <p className="mt-5 text-sm text-slate-400">Última actualización: {new Date(tropel.updatedAt).toLocaleString()}</p>
                            </article>
                        ))}
                    </div>

                    <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onChange={(nextPage) => updateParam('page', String(nextPage))} />
                </div>
            ) : (
                <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/80 p-10 text-center text-slate-400">
                    No se encontraron tropeles con estos criterios. Ajusta los filtros y prueba de nuevo.
                </div>
            )}
        </div>
    )
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-100">{value}</p>
        </div>
    )
}

function Pagination({ currentPage, totalPages, onChange }: { currentPage: number; totalPages: number; onChange: (page: number) => void }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-800 bg-slate-900/90 p-4 text-sm text-slate-300">
            <p>
                Página {currentPage + 1} de {totalPages}
            </p>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="rounded-2xl bg-slate-800 px-3 py-2 text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-900/60"
                >
                    Anterior
                </button>
                <button
                    type="button"
                    onClick={() => onChange(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="rounded-2xl bg-emerald-600 px-3 py-2 text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-900/60"
                >
                    Siguiente
                </button>
            </div>
        </div>
    )
}
