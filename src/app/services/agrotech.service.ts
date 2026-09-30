import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Especie, EspecieScraped, EspecieSugestao, Planta, CreatePlantaRequest, DiarioNotaItem, CriarDiarioNotaRequest, AnaliseSaudeIaResponse, DiarioBordoEtapaResponse } from '../models/agrotech.models';

@Injectable({
  providedIn: 'root'
})
export class AgroTechService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getSugestoes(query: string): Observable<EspecieSugestao[]> {
    console.log(`[AgroTechService] 🔍 Solicitando sugestões para query="${query}" -> ${this.apiUrl}/especies/sugestoes`);
    const params = new HttpParams().set('query', query);
    return this.http.get<EspecieSugestao[]>(`${this.apiUrl}/especies/sugestoes`, { params }).pipe(
      tap(res => console.log(`[AgroTechService] ✅ Sugestões recebidas:`, res))
    );
  }

  scrapeEspecie(nomeBusca: string, nomeCientifico?: string): Observable<EspecieScraped> {
    console.log(`[AgroTechService] 🤖 Solicitando scraping botânico para "${nomeBusca}" (${nomeCientifico || 'sem nome científico'}) -> ${this.apiUrl}/especies/scraping`);
    return this.http.post<EspecieScraped>(`${this.apiUrl}/especies/scraping`, { nomeBusca, nomeCientifico }).pipe(
      tap(res => console.log(`[AgroTechService] ✅ Dados de scraping recebidos:`, res))
    );
  }

  getEspecies(): Observable<Especie[]> {
    console.log(`[AgroTechService] 📋 Carregando catálogo de espécies -> ${this.apiUrl}/especies`);
    return this.http.get<Especie[]>(`${this.apiUrl}/especies`).pipe(
      tap(res => console.log(`[AgroTechService] ✅ Total espécies recebidas: ${res.length}`))
    );
  }

  createEspecie(especie: Partial<Especie>): Observable<Especie> {
    console.log(`[AgroTechService] ➕ Criando nova espécie no banco:`, especie);
    return this.http.post<Especie>(`${this.apiUrl}/especies`, especie).pipe(
      tap(res => console.log(`[AgroTechService] ✅ Espécie criada com ID=${res.id}`))
    );
  }

  updateEspecie(id: string, especie: Partial<Especie>): Observable<Especie> {
    console.log(`[AgroTechService] ✏️ Atualizando espécie ID=${id}:`, especie);
    return this.http.put<Especie>(`${this.apiUrl}/especies/${id}`, especie).pipe(
      tap(res => console.log(`[AgroTechService] ✅ Espécie atualizada com sucesso!`))
    );
  }

  uploadEspecieImagem(file: File): Observable<{ url: string }> {
    console.log(`[AgroTechService] 🖼️ Enviando imagem da espécie para -> ${this.apiUrl}/uploads/especie-imagem`);
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/uploads/especie-imagem`, formData).pipe(
      tap(res => console.log(`[AgroTechService] ✅ Imagem salva em: ${res.url}`))
    );
  }

  getPlantas(): Observable<Planta[]> {
    console.log(`[AgroTechService] 🌿 Carregando lista de plantas -> ${this.apiUrl}/plantas`);
    return this.http.get<Planta[]>(`${this.apiUrl}/plantas`).pipe(
      tap(res => console.log(`[AgroTechService] ✅ Total plantas cadastradas: ${res.length}`))
    );
  }

  getPlantaById(id: string): Observable<Planta> {
    console.log(`[AgroTechService] 🔍 Buscando planta ID=${id}`);
    return this.http.get<Planta>(`${this.apiUrl}/plantas/${id}`);
  }

  createPlanta(request: CreatePlantaRequest): Observable<Planta> {
    console.log(`[AgroTechService] 💾 Salvando nova planta no PostgreSQL:`, request);
    return this.http.post<Planta>(`${this.apiUrl}/plantas`, request).pipe(
      tap(res => console.log(`[AgroTechService] ✅ Planta salva com sucesso! ID=${res.id}`))
    );
  }

  updatePlanta(id: string, request: CreatePlantaRequest): Observable<Planta> {
    console.log(`[AgroTechService] ✏️ Atualizando planta ID=${id}:`, request);
    return this.http.put<Planta>(`${this.apiUrl}/plantas/${id}`, request).pipe(
      tap(res => console.log(`[AgroTechService] ✅ Planta atualizada com sucesso!`))
    );
  }

  deletePlanta(id: string): Observable<void> {
    console.log(`[AgroTechService] 🗑️ Deletando planta ID=${id}`);
    return this.http.delete<void>(`${this.apiUrl}/plantas/${id}`).pipe(
      tap(() => console.log(`[AgroTechService] ✅ Planta excluída!`))
    );
  }

  perguntarIaEtapa(request: {
    nomePopular: string;
    nomeCientifico?: string | null;
    apelidoLote?: string | null;
    etapaNumero: number;
    etapaTitulo: string;
    etapaResumo: string;
    instrucaoEtapa?: string | null;
    perguntaUsuario: string;
    umidadeSoloMin?: number | null;
    umidadeSoloMax?: number | null;
    temperaturaMin?: number | null;
    temperaturaMax?: number | null;
    instrucoesManejo?: string | null;
  }): Observable<{ resposta: string }> {
    console.log(`[AgroTechService] 💬 Enviando pergunta para a IA sobre a etapa ${request.etapaNumero}: "${request.perguntaUsuario}"`);
    return this.http.post<{ resposta: string }>(`${this.apiUrl}/especies/chat-etapa`, request);
  }

  // ─── Diário de Bordo & Análise Fitossanitária IA ─────────────────────────────

  getDiarioBordoEtapa(plantaId: string, etapaNumero: number): Observable<DiarioBordoEtapaResponse> {
    return this.http.get<DiarioBordoEtapaResponse>(`${this.apiUrl}/plantas/${plantaId}/diario/${etapaNumero}`);
  }

  adicionarNotaDiario(plantaId: string, payload: CriarDiarioNotaRequest): Observable<DiarioNotaItem> {
    return this.http.post<DiarioNotaItem>(`${this.apiUrl}/plantas/${plantaId}/diario`, payload);
  }

  excluirNotaDiario(plantaId: string, notaId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/plantas/${plantaId}/diario/${notaId}`);
  }

  analisarSaudeDiario(plantaId: string, etapaNumero: number, payload: any): Observable<AnaliseSaudeIaResponse> {
    console.log(`[AgroTechService] 🩺 Solicitando análise fitossanitária de saúde para PlantaId=${plantaId} Etapa=${etapaNumero}`);
    return this.http.post<AnaliseSaudeIaResponse>(`${this.apiUrl}/plantas/${plantaId}/diario/${etapaNumero}/analisar`, payload);
  }
}
