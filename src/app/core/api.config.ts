import { environment } from '../../environments/environment';

/**
 * Endereço base da API Spring Boot. Vem de src/environments: em desenvolvimento aponta para
 * http://localhost:8080/api; em produção é "/api" (mesmo endereço do site, atrás de um proxy reverso).
 */
export const API_URL = environment.apiUrl;
