export interface AuthUser {
    id: string
    displayName: string
    email: string
    teamCode: string
    role: string
}

export interface DashboardSummary {
    totalTropels: number
    criticalTropels: number
    openSignals: number
    sectorStabilityAvg: number
    signalsBySeverity: Record<'LEVE' | 'MODERADO' | 'GRAVE' | 'CRITICO', number>
    generatedAt: string
}

export interface Tropel {
    id: string
    name: string
    species: string
    vitalState: string
    energyLevel: number
    chaosIndex: number
    mutationStage: number
    guardianName: string
    sector: {
        id: string
        name: string
        sectorCode: string
    }
    createdAt: string
    updatedAt: string
}

export interface TropelPage {
    content: Tropel[]
    totalElements: number
    totalPages: number
    currentPage: number
    size: number
}

export interface SignalSummary {
    id: string
    signalType: string
    severity: string
    status: string
    rawContent: string
    tropel: {
        id: string
        name: string
        species: string
    }
    createdAt: string
    updatedAt: string
}

export interface SignalsFeedResponse {
    items: SignalSummary[]
    nextCursor: string | null
    hasMore: boolean
    totalEstimate: number
}

export interface SectorSummary {
    id: string
    sectorCode: string
    name: string
    climate: string
    capacity: number
    currentLoad: number
    stabilityLevel: number
}

export interface SectorStoryStage {
    id: string
    order: number
    title: string
    narrative: string
    dominantEvent: string
    metrics: Record<string, number>
    assetKey: string
    colorToken: string
    progress: number
}

export interface SectorStoryResponse {
    sector: {
        id: string
        name: string
        climate: string
    }
    stages: SectorStoryStage[]
}
