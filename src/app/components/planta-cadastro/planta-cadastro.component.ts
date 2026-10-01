import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, of, timeout, retry, debounceTime, distinctUntilChanged, switchMap, catchError, throwError } from 'rxjs';
import { AgroTechService } from '../../services/agrotech.service';
import { Especie, EspecieScraped, EspecieSugestao } from '../../models/agrotech.models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-planta-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './planta-cadastro.component.html',
  styleUrls: ['./planta-cadastro.component.scss']
})
export class PlantaCadastroComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  especies: Especie[] = [];
  sugestoes: EspecieSugestao[] = [];

  private searchSubject = new Subject<string>();

  isLoadingScraping = false;
  isUploadingImagem = false;
  isSaving = false;

  // Feedback de Demora, Erro e Re-tentativa IA
  erroScrapingMensagem: string | null = null;
  erroConexaoIa = false;
  erroConexaoIaMensagem: string | null = null;
  ultimaSugestaoSelecionada: EspecieSugestao | null = null;
  mensagemDemoraSugestoes: string | null = null;

  // Preview local da imagem selecionada
  imagemPreviewUrl: string | null = null;

  // URL da API para construir URLs absolutas de imagens
  readonly apiBaseUrl = environment.apiUrl.replace('/api', '');

  // Medidor de Progresso e Cronômetro da Coleta Botânica
  progressoPercentual = 0;
  mensagemProgresso = '';
  tempoDecorrido = 0;
  readonly tempoEstimado = 15;
  private startTime = 0;
  private timerInterval: any;
  private progressInterval: any;

  get tempoDecorridoDisplay(): string {
    return this.tempoDecorrido.toFixed(1) + 's';
  }

  get tempoEstimadoDisplay(): string {
    const restante = Math.max(0, this.tempoEstimado - this.tempoDecorrido);
    return restante.toFixed(1) + 's';
  }

  termoBuscaEspecie = '';
  showDropdownSugestoes = false;
  isBuscandoSugestoes = false;
  showSelectSugestoes = false;
  sugestaoSelecionada: EspecieSugestao | null = null;

  formData = {
    apelidoLote: '',
    especieId: '',
    nomePopular: '',
    nomeCientifico: '',
    imagemUrl: '',
    umidadeSoloMin: null as number | null,
    umidadeSoloMax: null as number | null,
    temperaturaMin: null as number | null,
    temperaturaMax: null as number | null,
    instrucoesManejo: '',
    passo1PreparoSemente: '',
    passo2PreparoSolo: '',
    passo3SemeaduraGerminacao: '',
    passo4CuidadosBrotoDesbaste: '',
    passo5AclimatizacaoVasoDefinitivo: '',
    passo6TransplanteMudas: '',
    passo7NutricaoPoda: '',
    passo8FloracaoColheita: '',
    passo4TransplanteMudas: '',
    passo5CrescimentoManejo: '',
    passo6FloracaoColheita: '',
    cuidadosDiaADia: '',
    fonteDadosScraping: '',
    isGeradoPorIa: false
  };

  constructor(
    private agroTechService: AgroTechService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarEspecies();
  }

  ngOnDestroy(): void {
    this.limparTimerProgresso();
    this.searchSubject.complete();
  }

  carregarEspecies(): void {
    this.agroTechService.getEspecies().subscribe({
      next: (data) => {
        this.especies = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar espécies:', err)
    });
  }

  todasSugestoes: EspecieSugestao[] = [];
  limiteExibicaoSugestoes = 5;

  get sugestoesExibidas(): EspecieSugestao[] {
    return this.todasSugestoes.slice(0, this.limiteExibicaoSugestoes);
  }

  get temMaisSugestoes(): boolean {
    return this.todasSugestoes.length > this.limiteExibicaoSugestoes;
  }

  mostrarMaisSugestoes(): void {
    this.limiteExibicaoSugestoes += 10;
    this.cdr.detectChanges();
  }

  onSearchChange(): void {
    this.formData.nomePopular = this.termoBuscaEspecie;
    this.showDropdownSugestoes = false;
    this.showSelectSugestoes = false;
    this.sugestaoSelecionada = null;
    this.todasSugestoes = [];
    this.erroScrapingMensagem = null;
    this.mensagemDemoraSugestoes = null;
    this.erroConexaoIa = false;
    this.erroConexaoIaMensagem = null;
  }

  buscarSugestoesIa(): void {
    if (!this.termoBuscaEspecie || !this.termoBuscaEspecie.trim()) return;

    const termo = this.termoBuscaEspecie.trim();
    this.isBuscandoSugestoes = true;
    this.showSelectSugestoes = false;
    this.sugestaoSelecionada = null;
    this.todasSugestoes = [];
    this.erroScrapingMensagem = null;
    this.mensagemDemoraSugestoes = null;
    this.erroConexaoIa = false;
    this.erroConexaoIaMensagem = null;
    this.cdr.detectChanges();

    const timerDemora = setTimeout(() => {
      if (this.isBuscandoSugestoes) {
        this.mensagemDemoraSugestoes = 'Conectando aos servidores de inteligência botânica... Por favor aguarde um momento.';
        this.cdr.detectChanges();
      }
    }, 4000);

    this.agroTechService.getSugestoes(termo).pipe(
      retry({ count: 1, delay: 1000 }),
      catchError((err) => {
        console.error('[PlantaCadastroComponent] Erro ao conectar/obter resposta da IA:', err);
        return throwError(() => err);
      })
    ).subscribe({
      next: (data) => {
        clearTimeout(timerDemora);
        this.isBuscandoSugestoes = false;
        this.mensagemDemoraSugestoes = null;

        if (!data || data.length === 0) {
          this.todasSugestoes = [];
          this.showSelectSugestoes = false;
          this.erroConexaoIa = true;
          this.erroConexaoIaMensagem = 'Não foi possível se conectar e obter resposta da IA para esta busca.';
        } else {
          this.todasSugestoes = data;
          this.erroConexaoIa = false;
          this.erroConexaoIaMensagem = null;
          this.showSelectSugestoes = true;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        clearTimeout(timerDemora);
        this.isBuscandoSugestoes = false;
        this.mensagemDemoraSugestoes = null;
        this.todasSugestoes = [];
        this.showSelectSugestoes = false;
        this.erroConexaoIa = true;
        this.erroConexaoIaMensagem = 'Não foi possível se conectar e obter resposta da IA.';
        this.cdr.detectChanges();
      }
    });
  }

  tentarNovamenteBuscaIa(): void {
    this.buscarSugestoesIa();
  }

  cadastrarManualmente(): void {
    this.erroConexaoIa = false;
    this.erroConexaoIaMensagem = null;
    this.erroScrapingMensagem = null;
    this.showSelectSugestoes = false;
    if (this.termoBuscaEspecie && this.termoBuscaEspecie.trim()) {
      this.formData.nomePopular = this.termoBuscaEspecie.trim();
      if (!this.formData.apelidoLote || this.formData.apelidoLote.startsWith('Mudas de ')) {
        this.formData.apelidoLote = `Mudas de ${this.formData.nomePopular} - Lote 01`;
      }
    }
    this.cdr.detectChanges();
  }

  onSelectSugestaoChange(): void {
    if (this.sugestaoSelecionada) {
      this.selecionarSugestao(this.sugestaoSelecionada);
    }
  }

  buscarEPreencherEspecie(nome: string): void {
    if (!nome || !nome.trim()) return;

    const termo = nome.trim();
    const sugestaoEncontrada = this.todasSugestoes.find(
      (s) => s.nomePopular.toLowerCase() === termo.toLowerCase()
    ) || {
      nomePopular: termo,
      nomeCientifico: ''
    };

    this.selecionarSugestao(sugestaoEncontrada);
  }

  selecionarSugestao(sugestao: EspecieSugestao): void {
    this.ultimaSugestaoSelecionada = sugestao;
    this.termoBuscaEspecie = sugestao.nomePopular;
    this.formData.nomePopular = sugestao.nomePopular;
    if (sugestao.nomeCientifico && sugestao.nomeCientifico !== 'Espécie digitada') {
      this.formData.nomeCientifico = sugestao.nomeCientifico;
    }
    this.showDropdownSugestoes = false;
    this.showSelectSugestoes = false;

    this.iniciarProgresso(sugestao.nomePopular);

    this.agroTechService.scrapeEspecie(sugestao.nomePopular, sugestao.nomeCientifico)
      .pipe(
        retry({ count: 1, delay: 1500 }),
        timeout(120000)
      )
      .subscribe({
        next: (scrapedData: EspecieScraped) => {
          const camposMap = scrapedData.camposOrigemIa || {};

          console.group('%c🌐 [AgroTech - Relatório de Fontes Oficiais & Origem dos Campos]', 'color: #059669; font-weight: bold; font-size: 14px;');
          console.log('%c🏛️ Fontes Científicas Consultadas:', 'color: #0284c7; font-weight: bold;', scrapedData.fonteDadosScraping);
          console.log('%c🌱 Planta / Espécie:', 'color: #16a34a; font-weight: bold;', `${scrapedData.nomePopular} (${scrapedData.nomeCientifico || 'Taxonomia Oficial'})`);

          const auditData = [
            { Campo: 'Umidade do Solo (Min/Max)', Origem: camposMap['umidadeSolo'] ? '✨ 100% Gerado por IA' : '🌐 Base Oficial (Refinado de dados botânicos)' },
            { Campo: 'Temperatura Ideal (Min/Max)', Origem: camposMap['temperatura'] ? '✨ 100% Gerado por IA' : '🌐 Base Oficial (Refinado de dados botânicos)' },
            { Campo: 'Instruções e Recomendações de Manejo', Origem: camposMap['instrucoesManejo'] ? '✨ 100% Gerado por IA' : '🌐 Base Oficial (Refinado de dados botânicos)' },
            { Campo: 'Passo 1: Preparo da Semente', Origem: camposMap['passo1PreparoSemente'] ? '✨ 100% Gerado por IA' : '🌐 Base Oficial (Refinado de dados botânicos)' },
            { Campo: 'Passo 2: Preparo do Substrato', Origem: camposMap['passo2PreparoSolo'] ? '✨ 100% Gerado por IA' : '🌐 Base Oficial (Refinado de dados botânicos)' },
            { Campo: 'Passo 3: Semeadura & Germinação', Origem: camposMap['passo3SemeaduraGerminacao'] ? '✨ 100% Gerado por IA' : '🌐 Base Oficial (Refinado de dados botânicos)' },
            { Campo: 'Passo 4: Transplante & Mudas', Origem: (camposMap['passo6TransplanteMudas'] ?? camposMap['passo4CuidadosBrotoDesbaste']) ? '✨ 100% Gerado por IA' : '🌐 Base Oficial (Refinado de dados botânicos)' },
            { Campo: 'Passo 5: Podas, Nutrição & Manejo', Origem: (camposMap['passo7NutricaoPoda'] ?? camposMap['passo5AclimatizacaoVasoDefinitivo']) ? '✨ 100% Gerado por IA' : '🌐 Base Oficial (Refinado de dados botânicos)' },
            { Campo: 'Passo 6: Floração & Colheita', Origem: camposMap['passo8FloracaoColheita'] ? '✨ 100% Gerado por IA' : '🌐 Base Oficial (Refinado de dados botânicos)' },
            { Campo: 'Cuidados do Dia a Dia', Origem: camposMap['cuidadosDiaADia'] ? '✨ 100% Gerado por IA' : '🌐 Base Oficial (Refinado de dados botânicos)' },
          ];

          console.table(auditData);
          console.groupEnd();

          this.finalizarProgressoSucesso(scrapedData);
        },
        error: (err) => {
          console.error(`[PlantaCadastroComponent] Erro no scraping:`, err);
          this.finalizarProgressoErro('Não foi possível obter a resposta completa no momento. O servidor pode estar ocupado. Você pode tentar novamente com 1 clique.');
        }
      });
  }

  tentarNovamenteScraping(): void {
    if (this.ultimaSugestaoSelecionada) {
      this.selecionarSugestao(this.ultimaSugestaoSelecionada);
    } else if (this.termoBuscaEspecie) {
      this.buscarEPreencherEspecie(this.termoBuscaEspecie);
    }
  }

  // ─── Upload Manual de Imagem ──────────────────────────────────────────────────

  abrirSeletorImagem(): void {
    this.fileInput.nativeElement.click();
  }

  onImagemSelecionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Preview local imediato
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagemPreviewUrl = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);

    // Upload para o servidor
    this.isUploadingImagem = true;
    this.cdr.detectChanges();

    this.agroTechService.uploadEspecieImagem(file).subscribe({
      next: (res) => {
        this.formData.imagemUrl = res.url;
        this.isUploadingImagem = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[PlantaCadastroComponent] Erro no upload da imagem:', err);
        this.isUploadingImagem = false;
        this.imagemPreviewUrl = null;
        alert('Não foi possível enviar a imagem. Tente novamente.');
        this.cdr.detectChanges();
      }
    });
  }

  removerImagem(): void {
    this.formData.imagemUrl = '';
    this.imagemPreviewUrl = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.cdr.detectChanges();
  }

  get imagemExibicaoUrl(): string | null {
    if (this.imagemPreviewUrl) return this.imagemPreviewUrl;
    if (this.formData.imagemUrl) {
      return this.formData.imagemUrl.startsWith('http')
        ? this.formData.imagemUrl
        : `${this.apiBaseUrl}${this.formData.imagemUrl}`;
    }
    return null;
  }

  // ─── Progresso do Scraping ────────────────────────────────────────────────────

  private iniciarProgresso(nomePlanta: string = ''): void {
    this.limparTimerProgresso();
    this.isLoadingScraping = true;
    this.erroScrapingMensagem = null;
    this.progressoPercentual = 15;
    this.tempoDecorrido = 0;
    this.mensagemProgresso = '🌐 Consultando a taxonomia oficial no Jardim Botânico do Rio de Janeiro (Flora do Brasil)...';
    this.startTime = Date.now();

    this.timerInterval = setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      this.tempoDecorrido = Math.max(0, elapsed);
    }, 100);

    this.progressInterval = setInterval(() => {
      if (this.progressoPercentual < 95) {
        this.progressoPercentual += 5;
        const s = this.tempoDecorrido;
        if (s < 4) {
          this.mensagemProgresso = '🌐 Consultando a taxonomia oficial no Jardim Botânico do Rio de Janeiro (Flora do Brasil)...';
        } else if (s >= 4 && s < 8) {
          this.mensagemProgresso = '🤖 Conectando à IA Agronômica (Gemini API) para calcular os parâmetros de solo, rega e clima...';
        } else if (s >= 8 && s < 13) {
          this.mensagemProgresso = `✨ A IA está gerando o guia técnico de 6 passos personalizado para ${nomePlanta || 'a espécie'}...`;
        } else {
          this.mensagemProgresso = '⚡ A consulta está demorando um pouco mais que o normal, mas o processamento continua ativo...';
        }
        this.cdr.detectChanges();
      }
    }, 800);
  }

  camposOrigemIa: { [key: string]: boolean } = {};

  private getCampoOrigemIaStatus(campoKey: string): boolean | undefined {
    if (!this.camposOrigemIa || Object.keys(this.camposOrigemIa).length === 0) {
      return undefined;
    }

    if (typeof this.camposOrigemIa[campoKey] === 'boolean') {
      return this.camposOrigemIa[campoKey];
    }

    const aliasMap: { [key: string]: string[] } = {
      'passo4TransplanteMudas': ['passo6TransplanteMudas', 'passo4CuidadosBrotoDesbaste'],
      'passo5CrescimentoManejo': ['passo7NutricaoPoda', 'passo5AclimatizacaoVasoDefinitivo'],
      'passo6FloracaoColheita': ['passo8FloracaoColheita'],
      'umidadeSolo': ['umidadeSoloMin', 'umidadeSoloMax'],
      'temperatura': ['temperaturaMin', 'temperaturaMax']
    };

    const aliases = aliasMap[campoKey];
    if (aliases) {
      for (const alias of aliases) {
        if (typeof this.camposOrigemIa[alias] === 'boolean') {
          return this.camposOrigemIa[alias];
        }
      }
    }

    return undefined;
  }

  isCampo100PercentIa(campoKey: string): boolean {
    // Exibe o selo '100% IA' SOMENTE se houver registro explícito no mapa de origem indicando 'true'.
    // Proibido qualquer tipo de presunção ou fallback genérico.
    const status = this.getCampoOrigemIaStatus(campoKey);
    return status === true;
  }

  isCampoBaseOficial(campoKey: string): boolean {
    if (!this.formData.nomePopular || !this.formData.fonteDadosScraping) {
      return false;
    }
    const status = this.getCampoOrigemIaStatus(campoKey);
    if (status === false) {
      return true;
    }
    if (status === undefined) {
      const fontes = this.formData.fonteDadosScraping || '';
      if (fontes.includes('Jardim Botânico') || fontes.includes('GBIF') || fontes.includes('Embrapa') || fontes.includes('Flora')) {
        return true;
      }
    }
    return false;
  }

  private finalizarProgressoSucesso(scrapedData: EspecieScraped): void {
    this.limparTimerProgresso();
    this.progressoPercentual = 100;
    this.mensagemProgresso = 'Dados botânicos coletados com sucesso! ✅';

    this.formData.nomePopular = scrapedData.nomePopular;
    this.formData.nomeCientifico = scrapedData.nomeCientifico || '';
    // ⚠️ NÃO preenchemos imagemUrl automaticamente — apenas upload manual
    this.formData.umidadeSoloMin = scrapedData.umidadeSoloMin ?? null;
    this.formData.umidadeSoloMax = scrapedData.umidadeSoloMax ?? null;
    this.formData.temperaturaMin = scrapedData.temperaturaMin ?? null;
    this.formData.temperaturaMax = scrapedData.temperaturaMax ?? null;
    this.formData.instrucoesManejo = scrapedData.instrucoesManejo || '';
    this.formData.passo1PreparoSemente = scrapedData.passo1PreparoSemente || '';
    this.formData.passo2PreparoSolo = scrapedData.passo2PreparoSolo || '';
    this.formData.passo3SemeaduraGerminacao = scrapedData.passo3SemeaduraGerminacao || '';
    this.formData.passo4TransplanteMudas = scrapedData.passo4TransplanteMudas || scrapedData.passo4CuidadosBrotoDesbaste || '';
    this.formData.passo5CrescimentoManejo = scrapedData.passo5CrescimentoManejo || scrapedData.passo5AclimatizacaoVasoDefinitivo || scrapedData.passo7NutricaoPoda || '';
    this.formData.passo6FloracaoColheita = scrapedData.passo6FloracaoColheita || scrapedData.passo8FloracaoColheita || '';
    this.formData.cuidadosDiaADia = scrapedData.cuidadosDiaADia || '';
    this.formData.fonteDadosScraping = scrapedData.fonteDadosScraping || '';
    this.formData.isGeradoPorIa = !!scrapedData.isGeradoPorIa;
    this.camposOrigemIa = scrapedData.camposOrigemIa || {};

    if (!this.formData.apelidoLote || this.formData.apelidoLote.startsWith('Mudas de ')) {
      this.formData.apelidoLote = `Mudas de ${scrapedData.nomePopular} - Lote 01`;
    }

    this.cdr.detectChanges();

    setTimeout(() => {
      this.isLoadingScraping = false;
      this.progressoPercentual = 0;
      this.cdr.detectChanges();
    }, 800);
  }

  private finalizarProgressoErro(mensagem?: string): void {
    this.limparTimerProgresso();
    this.isLoadingScraping = false;
    this.progressoPercentual = 0;
    this.erroScrapingMensagem = mensagem || 'Não foi possível obter a resposta completa no momento. O servidor pode estar ocupado. Você pode tentar novamente com 1 clique.';
    this.cdr.detectChanges();
  }

  private limparTimerProgresso(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ─── Salvar ───────────────────────────────────────────────────────────────────

  salvar(): void {
    if (this.isSaving) return;

    if (!this.formData.apelidoLote.trim()) {
      alert('Por favor, informe o apelido/lote da planta.');
      return;
    }

    if (!this.formData.nomePopular.trim()) {
      alert('Por favor, selecione ou informe a espécie da planta.');
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    const especieDados: Partial<Especie> = {
      nomePopular: this.formData.nomePopular,
      nomeCientifico: this.formData.nomeCientifico,
      imagemUrl: this.formData.imagemUrl || undefined,
      umidadeSoloMin: this.formData.umidadeSoloMin,
      umidadeSoloMax: this.formData.umidadeSoloMax,
      temperaturaMin: this.formData.temperaturaMin,
      temperaturaMax: this.formData.temperaturaMax,
      instrucoesManejo: this.formData.instrucoesManejo,
      passo1PreparoSemente: this.formData.passo1PreparoSemente,
      passo2PreparoSolo: this.formData.passo2PreparoSolo,
      passo3SemeaduraGerminacao: this.formData.passo3SemeaduraGerminacao,
      passo4TransplanteMudas: this.formData.passo4TransplanteMudas,
      passo5CrescimentoManejo: this.formData.passo5CrescimentoManejo,
      passo6FloracaoColheita: this.formData.passo6FloracaoColheita,
      cuidadosDiaADia: this.formData.cuidadosDiaADia,
      fonteDadosScraping: 'Reflora / Embrapa / GBIF'
    };

    const especieExistente = this.especies.find(
      (e) => e.nomePopular.toLowerCase() === this.formData.nomePopular.toLowerCase()
    );

    if (especieExistente) {
      this.executarCriacaoPlanta(especieExistente.id);
    } else {
      this.agroTechService.createEspecie(especieDados).subscribe({
        next: (especieCriada) => {
          this.executarCriacaoPlanta(especieCriada.id);
        },
        error: (err) => {
          console.error('Erro ao salvar espécie:', err);
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  private executarCriacaoPlanta(especieId: string): void {
    const payload = {
      apelidoLote: this.formData.apelidoLote,
      especieId: especieId
    };

    this.agroTechService.createPlanta(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/plantas']);
      },
      error: (err) => {
        console.error('Erro ao criar planta:', err);
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/plantas']);
  }
}
