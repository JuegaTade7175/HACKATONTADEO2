import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
})

export function isApiError(error: unknown): error is { response: { data: { message: string } } } {
    return (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response === 'object' &&
        (error as any).response !== null
    )
}
