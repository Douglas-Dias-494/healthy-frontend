export interface LoginRequest {
    perfil: string,
    email: string,
    senha: string
}

export interface LoginResponse {
    token: string,
    nome: string,
    perfil: string
}