import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { SignalSummary } from '../types/api'

const STATUS_OPTIONS = ['PROCESANDO', 'ATENDIDA'] as const

export default function SignalDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [signal, setSignal] = useState<SignalSummary | null>(null)
    const [status, setStatus] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (!id) return
        let active = true
        setLoading(true)
        setError(null)
        setSuccess(false)

        api
            .get<SignalSummary>(`/signals/${id}`)
            .then((response) => {
                if (!active) return
                setSignal(response.data)
                setStatus(response.data.status)
            })
            .catch(() => {
                if (!active) return
                setError('No se pudo cargar la señal. Intenta nuevamente.')
            })
            .finally(() => {
                if (!active) return
                setLoading(false)
            })

        return () => {
            active = false
        }
    }, [id])

    const canSave = useMemo(() => signal && status !== signal.status && STATUS_OPTIONS.includes(status as any), [signal, status])

    async function handleSave() {
        if (!signal) return
        setSaving(true)
        setSaveError(null)
        setSuccess(false)

        try {
            const response = await api.patch<SignalSummary>(`/signals/${signal.id}/status`, { status })
            setSignal(response.data)
            setSuccess(true)

            // Update status in signals feed cache in sessionStorage so it is reflected when going back
            const cachedItemsRaw = sessionStorage.getItem('signals_feed_items')
            if (cachedItemsRaw) {
                try {
                    const cachedItems = JSON.parse(cachedItemsRaw) as SignalSummary[]
                    const updatedItems = cachedItems.map((item) => 
                        item.id === response.data.id ? { ...item, status: response.data.status } : item
                    )
                    sessionStorage.setItem('signals_feed_items', JSON.stringify(updatedItems))
                } catch (e) {
                    console.error('Error updating signals feed cache:', e)
                }
            }
        } catch {
            setSaveError('No se pudo actualizar el estado de la señal. Por favor, intenta de nuevo.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <p className="text-slate-300">Cargando señal...</p>
    }

    if (error) {
        return <p className="text-rose-400">{error}</p>
    }

    if (!signal) {
        return <p className="text-slate-300">Señal no encontrada.</p>
    }

    return (
        <div className="space-y-8">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-2 text-sm text-slate-200 hover:border-slate-600 transition duration-200"
            >
                ← Volver al feed
            </button>

            <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/10">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{signal.severity}</p>
                        <h1 className="mt-2 text-3xl font-semibold text-slate-100">{signal.signalType}</h1>
                        <p className="mt-1 text-sm text-slate-400">Tropel: {signal.tropel.name} ({signal.tropel.species})</p>
                    </div>
                    <span className="rounded-full bg-slate-800 px-4 py-2 text-sm uppercase tracking-[0.24em] text-slate-300">{signal.status}</span>
                </header>

                <div className="mt-8 space-y-6">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
                        <p className="text-sm text-slate-400">Contenido de la señal</p>
                        <p className="mt-4 text-lg leading-8 text-slate-100">{signal.rawContent}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <InfoCard label="Creada" value={new Date(signal.createdAt).toLocaleString()} />
                        <InfoCard label="Actualizada" value={new Date(signal.updatedAt).toLocaleString()} />
                    </div>

                    <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/90 p-6">
                        <p className="text-sm text-slate-400 font-medium">Atender Señal</p>
                        
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <select
                                value={status}
                                onChange={(event) => {
                                    setStatus(event.target.value)
                                    setSuccess(false)
                                    setSaveError(null)
                                }}
                                disabled={saving}
                                className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition duration-200"
                            >
                                <option value="">Selecciona un estado</option>
                                {STATUS_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={!canSave || saving}
                                className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-700 duration-200"
                            >
                                {saving ? 'Guardando...' : 'Actualizar estado'}
                            </button>
                        </div>

                        {success && (
                            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400">
                                ✓ ¡Señal actualizada con éxito! El nuevo estado es <strong>{signal.status}</strong>.
                            </div>
                        )}

                        {saveError && (
                            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400 flex flex-col gap-2">
                                <span>✗ {saveError}</span>
                                <button 
                                    onClick={handleSave}
                                    className="self-start text-xs font-semibold text-rose-300 underline hover:text-rose-200 transition"
                                >
                                    Reintentar ahora
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}

function InfoCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-3 text-lg font-semibold text-slate-100">{value}</p>
        </div>
    )
}
