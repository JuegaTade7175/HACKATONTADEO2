import { FormEvent, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../lib/auth'
import { useAuth } from '../App'

export default function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard'
    const { signIn } = useAuth()

    const [teamCode, setTeamCode] = useState(import.meta.env.VITE_DEV_TEAM_CODE ?? '')
    const [email, setEmail] = useState(import.meta.env.VITE_DEV_EMAIL ?? '')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const response = await login({ teamCode, email, password })
            signIn(response.token, response.user)
            navigate(from, { replace: true })
        } catch (err: any) {
            if (err?.response) {
                const status = err.response.status
                const message = err.response.data?.message || err.response.data?.error || ''
                if (status === 401 || status === 403) {
                    setError(`Credenciales incorrectas (Error ${status}): ${message || 'Verifica tu Team Code, Email o Password.'}`)
                } else if (status === 404) {
                    setError(`Ruta del backend no encontrada (Error 404). Verifica si la URL base en el .env tiene el prefijo /api/v1`)
                } else {
                    setError(`Error en el servidor (Error ${status}): ${message || 'Error desconocido'}`)
                }
            } else if (err?.request) {
                setError('No se pudo conectar con el servidor backend. Verifica tu conexión de red o si el servidor está caído (Network Error).')
            } else {
                setError(`Error en la solicitud: ${err?.message || 'Error desconocido'}`)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid min-h-screen place-items-center bg-slate-950 px-4 py-8">
            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
                <h1 className="text-3xl font-semibold text-slate-100">TropelCare Login</h1>
                <p className="mt-3 text-sm text-slate-400">Ingresa con tus credenciales de equipo para continuar.</p>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <label className="block text-sm font-medium text-slate-200">
                        Team Code
                        <input
                            value={teamCode}
                            onChange={(event) => setTeamCode(event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </label>
                    <label className="block text-sm font-medium text-slate-200">
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </label>
                    <label className="block text-sm font-medium text-slate-200">
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </label>
                    {error ? <p className="text-sm text-rose-400">{error}</p> : null}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-600"
                    >
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
            </div>
        </div>
    )
}
