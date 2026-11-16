/**
 * Produção (ng build). A API fica no MESMO endereço do site, atrás de um proxy reverso que encaminha "/api"
 * para o Spring Boot. Assim não há CORS e tudo trafega por HTTPS.
 */
export const environment = {
  production: true,
  apiUrl: '/api',
};
