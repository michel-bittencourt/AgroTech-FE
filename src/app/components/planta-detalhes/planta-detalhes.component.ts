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
      passo1PreparoSemente: p.passo1PreparoSemente || '',
      passo2PreparoSolo: p.passo2PreparoSolo || '',
      passo3SemeaduraGerminacao: p.passo3SemeaduraGerminacao || '',
      passo4CuidadosBrotoDesbaste: p.passo4CuidadosBrotoDesbaste || p.passo4TransplanteMudas || '',
      passo5AclimatizacaoVasoDefinitivo: p.passo5AclimatizacaoVasoDefinitivo || p.passo5CrescimentoManejo || '',
      passo6TransplanteMudas: p.passo6TransplanteMudas || '',
      passo7NutricaoPoda: p.passo7NutricaoPoda || '',
      passo8FloracaoColheita: p.passo8FloracaoColheita || '',
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
}
