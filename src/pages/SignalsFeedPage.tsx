import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { SignalSummary, SignalsFeedResponse } from '../types/api'

const DEFAULT_LIMIT = 15

export default function SignalsFeedPage() {
    const [searchParams, setSearchParams] = useSearchParams()

    // Cache logic for preserving scroll position and items
    const cacheKey = searchParams.toString()
    const cachedKey = sessionStorage.getItem('signals_feed_cache_key')
    const hasCache = cachedKey === cacheKey

    const initialItems = useMemo(() => {
        if (hasCache) {
            const raw = sessionStorage.getItem('signals_feed_items')
            if (raw) {
                try {
                    return JSON.parse(raw) as SignalSummary[]
                } catch {
                    return []
                }
            }
        }
        return []
    }, [hasCache])

    const initialCursor = useMemo(() => {
        if (hasCache) {
            return sessionStorage.getItem('signals_feed_next_cursor') || null
        }
        return null
    }, [hasCache])

    const initialHasMore = useMemo(() => {
        if (hasCache) {
            return sessionStorage.getItem('signals_feed_has_more') !== 'false'
        }
        return true
    }, [hasCache])

    const [items, setItems] = useState<SignalSummary[]>(initialItems)
    const [nextCursor, setNextCursor] = useState<string | null>(initialCursor)
    const [hasMore, setHasMore] = useState(initialHasMore)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    const [signalType, setSignalType] = useState(searchParams.get('signalType') ?? '')
    const [severity, setSeverity] = useState(searchParams.get('severity') ?? '')
    const [status, setStatus] = useState(searchParams.get('status') ?? '')
    const [query, setQuery] = useState(searchParams.get('q') ?? '')
    
    const controllerRef = useRef<AbortController | null>(null)
    const loadingRef = useRef(false)
    const observerRef = useRef<IntersectionObserver | null>(null)
    const sentinelRef = useRef<HTMLDivElement | null>(null)

    const didRestore = useRef(hasCache)
    const [didScrollRestore, setDidScrollRestore] = useState(false)

    const filters = useMemo(
        () => ({
            signalType,
            severity,
            status,
            q: query,
        }),
        [query, severity, signalType, status],
    )

    // Sync state filters to search params
    useEffect(() => {
        const params = new URLSearchParams()
        if (signalType) params.set('signalType', signalType)
        if (severity) params.set('severity', severity)
        if (status) params.set('status', status)
        if (query) params.set('q', query)
        setSearchParams(params)
    }, [query, severity, signalType, status, setSearchParams])

    // Save cache to sessionStorage whenever items or filters change
    useEffect(() => {
        sessionStorage.setItem('signals_feed_cache_key', searchParams.toString())
        sessionStorage.setItem('signals_feed_items', JSON.stringify(items))
        sessionStorage.setItem('signals_feed_next_cursor', nextCursor ?? '')
        sessionStorage.setItem('signals_feed_has_more', String(hasMore))
    }, [items, nextCursor, hasMore, searchParams])

    // Listen to scroll to save position
    useEffect(() => {
        const handleScroll = () => {
            sessionStorage.setItem('signals_feed_scroll_pos', String(window.scrollY))
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    // Restore scroll position once items are loaded
    useEffect(() => {
        if (items.length > 0 && !didScrollRestore) {
            const savedPos = sessionStorage.getItem('signals_feed_scroll_pos')
            if (savedPos) {
                const scrollPos = Number(savedPos)
                if (scrollPos > 0) {
                    setTimeout(() => {
                        window.scrollTo(0, scrollPos)
                    }, 50)
                }
            }
            setDidScrollRestore(true)
        }
    }, [items, didScrollRestore])

    const fetchPage = useCallback(
        async (cursor: string | null) => {
            if (!hasMore || loadingRef.current) return
            loadingRef.current = true
            setLoading(true)
            setError(null)

            controllerRef.current = new AbortController()

            try {
                const response = await api.get<SignalsFeedResponse>('/signals/feed', {
                    params: {
                        cursor,
                        limit: DEFAULT_LIMIT,
                        ...filters,
                    },
                    signal: controllerRef.current.signal,
                })

                setItems((prev) => {
                    const ids = new Set(prev.map((item) => item.id))
                    const nextItems = response.data.items.filter((item) => !ids.has(item.id))
                    return [...prev, ...nextItems]
                })

                setNextCursor(response.data.nextCursor)
                setHasMore(response.data.hasMore)
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return
                }
                setError('No se pudo cargar el feed. Intenta de nuevo.')
            } finally {
                loadingRef.current = false
                setLoading(false)
            }
        },
        [filters, hasMore],
    )

    const loadFirstPage = useCallback(() => {
        controllerRef.current?.abort()
        setItems([])
        setNextCursor(null)
        setHasMore(true)
        setError(null)
        setDidScrollRestore(true) // Don't try restoring scroll for fresh filters
        sessionStorage.removeItem('signals_feed_scroll_pos')
        fetchPage(null)
    }, [filters, fetchPage])

    // Load first page on filter changes (excluding restore from cache)
    useEffect(() => {
        if (didRestore.current) {
            didRestore.current = false
            return
        }
        loadFirstPage()
    }, [loadFirstPage])

    // IntersectionObserver for infinite scrolling
    useEffect(() => {
        if (!sentinelRef.current) return
        observerRef.current?.disconnect()

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    fetchPage(nextCursor)
                }
            },
            { rootMargin: '240px' },
        )

        observerRef.current.observe(sentinelRef.current)

        return () => {
            observerRef.current?.disconnect()
        }
    }, [fetchPage, nextCursor])

    function handleResetFilters() {
        setSignalType('')
        setSeverity('')
        setStatus('')
        setQuery('')
        sessionStorage.removeItem('signals_feed_scroll_pos')
    }

    return (
        <div className="space-y-8">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-100">Feed de Señales</h1>
                        <p className="mt-2 text-sm text-slate-400">Desplázate para cargar más señales automáticamente. Filtros sincronizados con URL.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                    >
                        Reiniciar filtros
                    </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <FilterSelect label="Tipo" value={signalType} onChange={setSignalType} options={[{ value: '', label: 'Todos' }, { value: 'HAMBRE', label: 'HAMBRE' }, { value: 'ABANDONO', label: 'ABANDONO' }, { value: 'MUTACION', label: 'MUTACION' }, { value: 'FUGA', label: 'FUGA' }, { value: 'CONFLICTO', label: 'CONFLICTO' }, { value: 'REPRODUCCION_MASIVA', label: 'REPRODUCCION_MASIVA' }, { value: 'SENAL_CORRUPTA', label: 'SENAL_CORRUPTA' }]} />
                    <FilterSelect label="Severidad" value={severity} onChange={setSeverity} options={[{ value: '', label: 'Todas' }, { value: 'LEVE', label: 'LEVE' }, { value: 'MODERADO', label: 'MODERADO' }, { value: 'GRAVE', label: 'GRAVE' }, { value: 'CRITICO', label: 'CRITICO' }]} />
                    <FilterSelect label="Estado" value={status} onChange={setStatus} options={[{ value: '', label: 'Todos' }, { value: 'RECIBIDA', label: 'RECIBIDA' }, { value: 'PROCESANDO', label: 'PROCESANDO' }, { value: 'ATENDIDA', label: 'ATENDIDA' }]} />
                    <label className="block text-sm text-slate-200">
                        Buscar
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Buscar señales..."
                            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </label>
                </div>
            </div>

            {items.length === 0 && loading ? (
                <div className="flex h-40 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/40">
                    <p className="text-slate-300">Cargando el feed...</p>
                </div>
            ) : null}

            <div className="space-y-4">
                {items.map((signal) => (
                    <article key={signal.id} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/10">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{signal.severity}</p>
                                <h2 className="mt-2 text-xl font-semibold text-slate-100">{signal.signalType}</h2>
                                <p className="mt-2 text-sm text-slate-400">{signal.rawContent}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">{signal.status}</span>
                                <Link
                                    to={`/signals/${signal.id}`}
                                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                                >
                                    Ver detalle
                                </Link>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-slate-400">Tropel: {signal.tropel.name} · Actualizado {new Date(signal.updatedAt).toLocaleString()}</p>
                    </article>
                ))}
            </div>

            {error ? <p className="text-rose-400">{error}</p> : null}
            {loading ? <p className="text-slate-300">Cargando más señales...</p> : null}
            {!hasMore && !(loading && items.length === 0) ? <p className="text-slate-400">No hay más señales por cargar.</p> : null}

            <div ref={sentinelRef} className="h-4" />
        </div>
    )
}

function FilterSelect({
    label,
    value,
    onChange,
    options,
}: {
    label: string
    value: string
    onChange: (value: string) => void
    options: { value: string; label: string }[]
}) {
    return (
        <label className="block text-sm text-slate-200">
            {label}
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    )
}
