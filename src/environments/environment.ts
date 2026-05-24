// ============================================================
// environments/environment.ts
// Configuração para desenvolvimento local
//
// INSTRUÇÕES:
// 1. Cria uma conta gratuita em https://finnhub.io/register
// 2. Obtém a tua API key (sandbox key começa com "sandbox_")
// 3. Substitui 'A_TUA_CHAVE_AQUI' pela tua chave real
// 4. Para desenvolvimento sem chave: muda useMockData para true
// ============================================================

export const environment = {
  production: false,
  finnhubApiKey: 'd89ms59r01qufj7otqd0d89ms59r01qufj7otqdg',
  alphaVantageApiKey: '',
  useMockData: false, // Define como true para usar dados mock sem necessidade de chave
  apiBackend: 'http://localhost:3000/api',
};