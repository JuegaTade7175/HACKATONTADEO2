import { api } from './api'
import type { AuthUser } from '../types/api'

const TOKEN_KEY = 'tropelcare_token'
const USER_KEY = 'tropelcare_user'

export function getToken() {
    return localStorage.getItem(TOKEN_KEY)
}

export function getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) {
        return null
    }

    try {
        return JSON.parse(raw) as AuthUser
    } catch {
        return null
    }
}

export function setAuth(token: string, user: AuthUser) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
}

export async function login(payload: { teamCode: string; email: string; password: string }) {
    const response = await api.post('/auth/login', payload)
    return response.data as { token: string; user: AuthUser }
}
