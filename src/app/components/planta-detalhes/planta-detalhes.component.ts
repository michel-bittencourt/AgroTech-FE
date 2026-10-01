import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AgroTechService } from '../../services/agrotech.service';
import { Especie, Planta } from '../../models/agrotech.models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-planta-detalhes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './planta-detalhes.component.html',
  styleUrls: ['./planta-detalhes.component.scss']
})
export class PlantaDetalhesComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  plantaId: string | null = null;
  planta: Planta | null = null;

  isEditing = false;
  isSaving = false;
  isLoading = true;
  isUploadingImagem = false;
  showConfirmDelete = false;

  // Preview local da nova imagem durante edição
  imagemPreviewUrl: string | null = null;

  readonly apiBaseUrl = environment.apiUrl.replace('/api', '');

  // Form edit model com 8 passos da Wiki
  formData: {
    apelidoLote: string;
    especieId: string;
    nomePopular: string;
    nomeCientifico: string;
    imagemUrl: string;
    umidadeSoloMin: number | null;
    umidadeSoloMax: number | null;
    temperaturaMin: number | null;
    temperaturaMax: number | null;
    instrucoesManejo: string;
    passo1PreparoSemente: string;
    passo2PreparoSolo: string;
    passo3SemeaduraGerminacao: string;
    passo4CuidadosBrotoDesbaste: string;
    passo5AclimatizacaoVasoDefinitivo: string;
    passo6TransplanteMudas: string;
    passo7NutricaoPoda: string;
    passo8FloracaoColheita: string;
    passo4TransplanteMudas?: string;
    passo5CrescimentoManejo?: string;
    passo6FloracaoColheita?: string;
    cuidadosDiaADia: string;
    fonteDadosScraping: string;
    isGeradoPorIa: boolean;
  } = {
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
    private route: ActivatedRoute,
    private router: Router,
    private agroTechService: AgroTechService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.plantaId = this.route.snapshot.paramMap.get('id');
    if (this.plantaId) {
      this.carregarPlanta(this.plantaId);
    } else {
      this.router.navigate(['/plantas']);
    }
  }

  carregarPlanta(id: string): void {
    this.isLoading = true;
    this.agroTechService.getPlantaById(id).subscribe({
      next: (data) => {
        this.planta = data;
        this.populateFormData(data);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar detalhes da planta:', err);
        this.isLoading = false;
        this.router.navigate(['/plantas']);
      }
    });
  }

  getTextoPadraoEtapa(passo: number): string {
    const padroes: Record<number, string> = {
      1: 'Seleção de sementes sadias e viáveis, higienização sanitária e hidratação/escarificação prévia para quebra de dormência e rápida germinação.',
      2: 'Escolha dos recipientes iniciais (sementeiras de células ou copinhos descartáveis de 200ml furados) e preparo de substrato leve, fofo, aerado e bem drenado.',
      3: '1. Faça pequenos furos no substrato com profundidade equivalente a 2 a 3 vezes o tamanho da semente (aprox. 0,5 cm a 1 cm).\n2. Deposite de 2 a 3 sementes por célula ou copinho no centro para garantir a germinação.\n3. Cubra suavemente as sementes com uma fina camada de substrato leve peneirado.\n4. Umedeça o substrato borrifando água delicadamente para não deslocar a semente do lugar.\n5. Mantenha em local iluminado porém protegido de sol forte direto.',
      4: '1. Mantenha a sementeira levemente úmida borrifando água delicadamente, sem encharcar.\n2. Forneça de 2 a 3 horas de sol fraco da manhã para fortalecer o caule e evitar estiolamento.\n3. Faça o desbaste (thinning): corte a muda mais fraca com tesoura fina se nascerem duas no mesmo copinho.',
      5: '1. Exponha a sementeira ao sol pleno gradualmente por 2 a 3 dias antes do transplante para aclimatar a muda.\n2. Escolha o vaso definitivo (mínimo 5 a 10 litros) com furos de drenagem no fundo.\n3. Coloque camada de drenagem no fundo (2 a 3 cm de argila expandida/isopor) e cubra com manta geotêxtil (Bidim).\n4. Preencha o vaso definitivo com solo fértil rico em matéria orgânica.',
      6: '1. Aguarde a muda apresentar de 4 a 6 folhas verdadeiras (8 a 10 cm de altura).\n2. Pressione delicadamente as laterais do copinho para retirar o torrão intacto sem puxar pelo caule.\n3. Desfaça suavemente as raízes enoveladas no fundo com os dedos para estimular a expansão no novo solo.\n4. Plante no berço do vaso definitivo, cubra até a base do caule e regue no final da tarde.',
      7: '1. Realize regas regulares diretamente na base da planta no início da manhã, evitando molhar as folhas.\n2. Faça a poda de beliscamento (apical/topping) nos brotos superiores para multiplicar os ramos laterais.\n3. Adube a cada 15 a 20 dias com adubo orgânico (húmus de minhoca ou esterco curtido).',
      8: '1. Para ervas e temperos aromáticos, remova os botões florais assim que surgirem para concentrar os óleos essenciais nas folhas.\n2. Acompanhe a mudança de cor e maturação ideal dos frutos no pé.\n3. Efetue a colheita nas primeiras horas da manhã utilizando tesoura limpa e higienizada com álcool 70%.'
    };
    return padroes[passo] || '';
  }

  populateFormData(p: Planta): void {
    this.formData = {
      apelidoLote: p.apelidoLote,
      especieId: p.especieId,
      nomePopular: p.especieNomePopular,
      nomeCientifico: p.especieNomeCientifico || '',
      imagemUrl: p.imagemUrl || '',
      umidadeSoloMin: p.umidadeSoloMin ?? null,
      umidadeSoloMax: p.umidadeSoloMax ?? null,
      temperaturaMin: p.temperaturaMin ?? null,
      temperaturaMax: p.temperaturaMax ?? null,
      instrucoesManejo: p.instrucoesManejo || '',
      passo1PreparoSemente: p.passo1PreparoSemente || this.getTextoPadraoEtapa(1),
      passo2PreparoSolo: p.passo2PreparoSolo || this.getTextoPadraoEtapa(2),
      passo3SemeaduraGerminacao: p.passo3SemeaduraGerminacao || this.getTextoPadraoEtapa(3),
      passo4CuidadosBrotoDesbaste: p.passo4CuidadosBrotoDesbaste || p.passo4TransplanteMudas || this.getTextoPadraoEtapa(4),
      passo5AclimatizacaoVasoDefinitivo: p.passo5AclimatizacaoVasoDefinitivo || p.passo5CrescimentoManejo || this.getTextoPadraoEtapa(5),
      passo6TransplanteMudas: p.passo6TransplanteMudas || this.getTextoPadraoEtapa(6),
      passo7NutricaoPoda: p.passo7NutricaoPoda || this.getTextoPadraoEtapa(7),
      passo8FloracaoColheita: p.passo8FloracaoColheita || p.passo6FloracaoColheita || this.getTextoPadraoEtapa(8),
      cuidadosDiaADia: p.cuidadosDiaADia || '',
      fonteDadosScraping: p.fonteDadosScraping || '',
      isGeradoPorIa: !!p.isGeradoPorIa
    };
    // Limpa preview ao recarregar
    this.imagemPreviewUrl = null;
  }

  // ─── Upload Manual de Imagem ──────────────────────────────────────────────────

  abrirSeletorImagem(): void {
    this.fileInput.nativeElement.click();
  }

  onImagemSelecionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagemPreviewUrl = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);

    this.isUploadingImagem = true;
    this.cdr.detectChanges();

    this.agroTechService.uploadEspecieImagem(file).subscribe({
      next: (res) => {
        this.formData.imagemUrl = res.url;
        this.isUploadingImagem = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[PlantaDetalhesComponent] Erro no upload da imagem:', err);
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
    // Durante edição: preview local tem prioridade
    if (this.imagemPreviewUrl) return this.imagemPreviewUrl;
    // Senão: URL persistida
    const url = this.isEditing ? this.formData.imagemUrl : (this.planta?.imagemUrl || '');
    if (!url) return null;
    return url.startsWith('http') ? url : `${this.apiBaseUrl}${url}`;
  }

  // ─── Edição ───────────────────────────────────────────────────────────────────

  iniciarEdicao(): void {
    this.isEditing = true;
    if (this.planta) {
      this.populateFormData(this.planta);
    }
    this.cdr.detectChanges();
  }

  cancelarEdicao(): void {
    this.isEditing = false;
    this.imagemPreviewUrl = null;
    if (this.planta) {
      this.populateFormData(this.planta);
    }
    this.cdr.detectChanges();
  }

  salvar(): void {
    if (this.isSaving || !this.plantaId) return;

    if (!this.formData.apelidoLote.trim()) {
      alert('Por favor, informe o apelido/lote da planta.');
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
      passo4CuidadosBrotoDesbaste: this.formData.passo4CuidadosBrotoDesbaste,
      passo5AclimatizacaoVasoDefinitivo: this.formData.passo5AclimatizacaoVasoDefinitivo,
      passo6TransplanteMudas: this.formData.passo6TransplanteMudas,
      passo7NutricaoPoda: this.formData.passo7NutricaoPoda,
      passo8FloracaoColheita: this.formData.passo8FloracaoColheita,
      cuidadosDiaADia: this.formData.cuidadosDiaADia
    };

    const targetEspecieId = this.formData.especieId;

    if (targetEspecieId) {
      this.agroTechService.updateEspecie(targetEspecieId, especieDados).subscribe({
        next: () => this.executarAtualizacaoPlanta(),
        error: () => this.executarAtualizacaoPlanta()
      });
    } else {
      this.executarAtualizacaoPlanta();
    }
  }

  private executarAtualizacaoPlanta(): void {
    if (!this.plantaId) return;

    const payload = {
      apelidoLote: this.formData.apelidoLote,
      especieId: this.formData.especieId
    };

    this.agroTechService.updatePlanta(this.plantaId, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.isEditing = false;
        this.imagemPreviewUrl = null;
        this.carregarPlanta(this.plantaId!);
      },
      error: (err) => {
        console.error('Erro ao atualizar planta:', err);
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Exclusão ─────────────────────────────────────────────────────────────────

  confirmarExclusao(): void {
    this.showConfirmDelete = true;
    this.cdr.detectChanges();
  }

  cancelarExclusao(): void {
    this.showConfirmDelete = false;
    this.cdr.detectChanges();
  }

  executarExclusao(): void {
    if (!this.plantaId) return;

    this.showConfirmDelete = false;
    this.agroTechService.deletePlanta(this.plantaId).subscribe({
      next: () => {
        this.router.navigate(['/plantas']);
      },
      error: (err) => {
        console.error('Erro ao excluir planta:', err);
        alert('Ocorreu um erro ao excluir a planta.');
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/plantas']);
  }

  abrirEtapa(passo: number): void {
    if (this.plantaId) {
      this.router.navigate(['/plantas', this.plantaId, 'etapa', passo]);
    }
  }

  readonly resumosEtapas: Record<number, string> = {
    1: 'Seleção de sementes sadias e viáveis, higienização sanitária e hidratação/escarificação prévia para quebra de dormência e rápida germinação.',
    2: 'Escolha dos recipientes iniciais (sementeiras de células ou copinhos descartáveis de 200ml furados) e preparo de substrato leve, fofo, aerado e bem drenado.',
    3: 'Semeadura dos grãos nos recipientes na profundidade correta (2 a 3x o tamanho da semente), umedecimento delicado com borrifador e iluminação indireta para despertar a semente.',
    4: 'Manutenção diária da umidade na sementeira, iluminação solar da manhã (2-3h), desbaste (thinning) das mudas sobressalentes e acompanhamento do desenvolvimento inicial.',
    5: 'Exposição gradual da muda ao sol pleno (aclimatação) e montagem do vaso definitivo (mínimo 5-10L) com camada de drenagem (argila expandida/isopor + manta) e solo fértil.',
    6: 'Retirada da muda com o torrão intacto ao atingir 4 a 6 folhas verdadeiras e descompactação suave das raízes enoveladas no fundo para enraizamento profundo no novo solo.',
    7: 'Manejo contínuo com regas na base do solo no início da manhã, adubação orgânica periódica a cada 15-30 dias e poda de beliscamento apical (topping) para multiplicar ramos.',
    8: 'Acompanhamento da fase reprodutiva, manejo de flores (remocão em plantas aromáticas para prolongar sabor) e colheita no ponto ideal de maturação com tesoura higienizada em álcool 70%.'
  };

  getResumoEtapa(passo: number): string {
    return this.resumosEtapas[passo] || '';
  }
}
