export interface EspecieSugestao {
  nomePopular: string;
  nomeCientifico: string;
}

export interface ScrapingProgresso {
  percentual: number;
  etapa: string;
  mensagem: string;
  concluido: boolean;
  erro: boolean;
  mensagemErro?: string | null;
  tempoEstimadoSegundos: number;
  fontesConcluidas: number;
  totalFontes: number;
  decorridoSegundos: number;
}

export interface EspecieScraped {
  nomePopular: string;
  nomeCientifico?: string;
  imagemUrl?: string;
  umidadeSoloMin?: number | null;
  umidadeSoloMax?: number | null;
  temperaturaMin?: number | null;
  temperaturaMax?: number | null;
  fonteDadosScraping: string;
  instrucoesManejo?: string;
  passo1PreparoSemente?: string;
  passo2PreparoSolo?: string;
  passo3SemeaduraGerminacao?: string;
  passo4CuidadosBrotoDesbaste?: string;
  passo5AclimatizacaoVasoDefinitivo?: string;
  passo6TransplanteMudas?: string;
  passo7NutricaoPoda?: string;
  passo8FloracaoColheita?: string;
  // Aliases legados de 6 etapas
  passo4TransplanteMudas?: string;
  passo5CrescimentoManejo?: string;
  passo6FloracaoColheita?: string;
  cuidadosDiaADia?: string;
  isGeradoPorIa?: boolean;
  camposOrigemIa?: { [key: string]: boolean };
}

export interface Especie {
  id: string;
  nomePopular: string;
  nomeCientifico?: string;
  imagemUrl?: string;
  umidadeSoloMin?: number | null;
  umidadeSoloMax?: number | null;
  temperaturaMin?: number | null;
  temperaturaMax?: number | null;
  fonteDadosScraping?: string;
  instrucoesManejo?: string;
  passo1PreparoSemente?: string;
  passo2PreparoSolo?: string;
  passo3SemeaduraGerminacao?: string;
  passo4CuidadosBrotoDesbaste?: string;
  passo5AclimatizacaoVasoDefinitivo?: string;
  passo6TransplanteMudas?: string;
  passo7NutricaoPoda?: string;
  passo8FloracaoColheita?: string;
  // Aliases legados de 6 etapas
  passo4TransplanteMudas?: string;
  passo5CrescimentoManejo?: string;
  passo6FloracaoColheita?: string;
  cuidadosDiaADia?: string;
  isGeradoPorIa?: boolean;
  criadoEm: string;
}

export interface Planta {
  id: string;
  apelidoLote: string;
  especieId: string;
  especieNomePopular: string;
  especieNomeCientifico?: string;
  imagemUrl?: string;
  dispositivoId?: string;
  dispositivoHardwareId?: string;
  umidadeSoloMin?: number | null;
  umidadeSoloMax?: number | null;
  temperaturaMin?: number | null;
  temperaturaMax?: number | null;
  instrucoesManejo?: string;
  passo1PreparoSemente?: string;
  passo2PreparoSolo?: string;
  passo3SemeaduraGerminacao?: string;
  passo4CuidadosBrotoDesbaste?: string;
  passo5AclimatizacaoVasoDefinitivo?: string;
  passo6TransplanteMudas?: string;
  passo7NutricaoPoda?: string;
  passo8FloracaoColheita?: string;
  // Aliases legados de 6 etapas
  passo4TransplanteMudas?: string;
  passo5CrescimentoManejo?: string;
  passo6FloracaoColheita?: string;
  cuidadosDiaADia?: string;
  fonteDadosScraping?: string;
  isGeradoPorIa?: boolean;
  criadoEm: string;
}

export interface CreatePlantaRequest {
  apelidoLote: string;
  especieId: string;
  dispositivoId?: string;
}

export interface DiarioNotaItem {
  id: string;
  plantaId: string;
  etapaNumero: number;
  textoNota: string;
  criadoEm: string;
  isIa?: boolean;
}

export interface CriarDiarioNotaRequest {
  etapaNumero: number;
  textoNota: string;
  criadoEm?: string;
  isIa?: boolean;
}

export interface AnaliseSaudeIaResponse {
  statusSaude: 'EXCELENTE' | 'ATENCAO' | 'ALERTA' | string;
  diagnosticoTexto: string;
  observacoes: string[];
  recomendacoes: string[];
  dataAnalise: string;
}

export interface DiarioBordoEtapaResponse {
  notas: DiarioNotaItem[];
  diagnosticoIa: AnaliseSaudeIaResponse | null;
}
