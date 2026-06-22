import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import SignalDetailPage from './pages/SignalDetailPage'
import SignalsFeedPage from './pages/SignalsFeedPage'
import SectorStoryPage from './pages/SectorStoryPage'
import TropelsPage from './pages/TropelsPage'
import { clearAuth, getToken, getUser, setAuth } from './lib/auth'
import { api } from './lib/api'
import type { AuthUser } from './types/api'

interface AuthContextValue {
    token: string | null
    user: AuthUser | null
    signIn: (token: string, user: AuthUser) => void
    signOut: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}

function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(getToken())
    const [user, setUser] = useState<AuthUser | null>(getUser())
    const [verifying, setVerifying] = useState(!!token)

    useEffect(() => {
        if (token && user) {
            setAuth(token, user)
        }
    }, [token, user])

    useEffect(() => {
        if (token) {
            api.get<AuthUser>('/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then((res) => {
                    setUser(res.data)
                })
                .catch(() => {
                    clearAuth()
                    setToken(null)
                    setUser(null)
                })
                .finally(() => {
                    setVerifying(false)
                })
        } else {
            setVerifying(false)
        }
    }, [token])

    const value = useMemo(
        () => ({
            token,
            user,
            signIn: (nextToken: string, nextUser: AuthUser) => {
                setToken(nextToken)
                setUser(nextUser)
            },
            signOut: () => {
                clearAuth()
                setToken(null)
                setUser(null)
            },
        }),
        [token, user],
    )

    useEffect(() => {
        const requestInterceptor = api.interceptors.request.use((config) => {
            if (token) {
                config.headers = config.headers ?? {}
                config.headers.Authorization = `Bearer ${token}`
            }
            return config
        })

        return () => {
            api.interceptors.request.eject(requestInterceptor)
        }
    }, [token])

    if (verifying) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-slate-400 animate-pulse">Verificando sesión con TropelCare...</p>
                </div>
            </div>
        )
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function RequireAuth({ children }: { children: React.ReactNode }) {
    const auth = useAuth()
    const location = useLocation()

    if (!auth.token) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children as React.ReactElement
}

function AppLayout() {
    const auth = useAuth()

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50">
            <header className="border-b border-slate-800 bg-slate-950/90 sticky top-0 z-20 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
                    <div>
                        <Link to="/dashboard" className="text-xl font-semibold tracking-tight">
                            TropelCare Control Room
                        </Link>
                        <p className="text-sm text-slate-400">{auth.user?.displayName ?? 'Operador'}</p>
                    </div>
                    <nav className="flex flex-wrap items-center gap-2">
                        <Link to="/dashboard" className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700">
                            Dashboard
                        </Link>
                        <Link to="/tropels" className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700">
                            Tropeles
                        </Link>
                        <Link to="/signals" className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700">
                            Señales
                        </Link>
                        <button
                            type="button"
                            onClick={auth.signOut}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500"
                        >
                            Logout
                        </button>
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
                <Outlet />
            </main>
        </div>
    )
}

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                    path="/"
                    element={
                        <RequireAuth>
                            <AppLayout />
                        </RequireAuth>
                    }
                >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="tropels" element={<TropelsPage />} />
                    <Route path="signals" element={<SignalsFeedPage />} />
                    <Route path="signals/:id" element={<SignalDetailPage />} />
                    <Route path="sectors/:id/story" element={<SectorStoryPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </AuthProvider>
    )
}
