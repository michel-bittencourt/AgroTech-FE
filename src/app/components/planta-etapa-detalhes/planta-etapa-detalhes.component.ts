import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AgroTechService } from '../../services/agrotech.service';
import { Especie, Planta, DiarioNotaItem, AnaliseSaudeIaResponse } from '../../models/agrotech.models';

export interface EtapaConfig {
  numero: number;
  titulo: string;
  subtitulo: string;
  resumo: string;
  icone: string;
  corBadge: string;
  propriedadeKey: keyof Especie;
  dicas: string[];
  errosComuns: string[];
  materiaisRecomendados: string[];
}

@Component({
  selector: 'app-planta-etapa-detalhes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './planta-etapa-detalhes.component.html',
  styleUrls: ['./planta-etapa-detalhes.component.scss']
})
export class PlantaEtapaDetalhesComponent implements OnInit {
  plantaId: string | null = null;
  passoNumero = 1;
  planta: Planta | null = null;
  isLoading = true;

  isEditing = false;
  isSaving = false;
  conteudoEtapaEditavel = '';

  etapasMap: Record<number, EtapaConfig> = {
    1: {
      numero: 1,
      titulo: 'Preparo da Semente',
      subtitulo: 'Quebra de dormência, higienização e hidratação inicial',
      resumo: 'Seleção de sementes sadias e viáveis, higienização sanitária e hidratação/escarificação prévia para quebra de dormência e rápida germinação.',
      icone: 'fa-seedling',
      corBadge: 'bg-success',
      propriedadeKey: 'passo1PreparoSemente',
      dicas: [
        'Realize o teste de flutuação em copo de água: sementes que afundam geralmente são mais viáveis e férteis.',
        'Se a casca for muito dura (ex: coentro, pimenta), deixe em infusão em água morna por 12 a 24 horas antes do plantio.',
        'Mantenha as sementes em local fresco e arejado longe da luz solar direta enquanto hidrata.'
      ],
      errosComuns: [
        'Deixar as sementes submersas por mais de 24h, o que pode sufocar o embrião por falta de oxigênio.',
        'Usar água clorada em excesso sem deixar descansar previamente.'
      ],
      materiaisRecomendados: ['Copo com água morna', 'Papel toalha úmido', 'Pinça de precisão', 'Recipiente higienizado']
    },
    2: {
      numero: 2,
      titulo: 'Preparo do Substrato & Sementeira',
      subtitulo: 'Escolha dos recipientes iniciais e mistura de substrato leve',
      resumo: 'Escolha dos recipientes iniciais (sementeiras de células ou copinhos descartáveis de 200ml furados) e preparo de substrato leve, fofo, aerado e bem drenado.',
      icone: 'fa-mountain-sun',
      corBadge: 'bg-warning text-dark',
      propriedadeKey: 'passo2PreparoSolo',
      dicas: [
        'Escolha sementeiras de 64/128 células ou copinhos descartáveis de 200ml fazendo furos de drenagem no fundo.',
        'Misture a receita de substrato leve em copos de requeijão ou balança (ex: 2 copos terra + 2 copos pó de coco + 1 copo areia ou 400g terra + 400g pó de coco + 200g areia).',
        'Peneire a terra para remover pedras e torrões grandes que possam dificultar o brotamento inicial.'
      ],
      errosComuns: [
        'Compactar a terra excessivamente com as mãos, impedindo a aeração das raízes jovens.',
        'Utilizar sementeira ou recipiente sem furos de drenagem no fundo.'
      ],
      materiaisRecomendados: ['Sementeira / Copinhos de 200ml furados', 'Terra vegetal peneirada', 'Pó de coco / Húmus', 'Balança de cozinha / Copos de requeijão']
    },
    3: {
      numero: 3,
      titulo: 'Semeadura & Germinação',
      subtitulo: 'Profundidade de plantio, umedecimento delicado e despertar da semente',
      resumo: 'Semeadura dos grãos nos recipientes na profundidade correta (2 a 3x o tamanho da semente), umedecimento delicado com borrifador e iluminação indireta para despertar a semente.',
      icone: 'fa-sprout',
      corBadge: 'bg-success',
      propriedadeKey: 'passo3SemeaduraGerminacao',
      dicas: [
        'A regra de ouro é enterrar a semente a uma profundidade equivalente a 2 ou 3 vezes o seu tamanho (aprox. 0,5 cm a 1 cm).',
        'Deposite de 2 a 3 sementes por célula ou copinho para garantir a germinação.',
        'Umedeça o substrato suavemente usando um borrifador manual para não deslocar a semente do lugar.'
      ],
      errosComuns: [
        'Regar com jato forte de água, afundando a semente no fundo do recipiente.',
        'Deixar o substrato secar completamente durante o período crítico de germinação.'
      ],
      materiaisRecomendados: ['Borrifador de água manual', 'Etiqueta de identificação', 'Domo transparente ou filme PVC (estufa)']
    },
    4: {
      numero: 4,
      titulo: 'Cuidados do Broto & Desbaste',
      subtitulo: 'Rega leve da sementeira, luz solar da manhã e desbaste da muda fraca',
      resumo: 'Manutenção diária da umidade na sementeira, iluminação solar da manhã (2-3h), desbaste (thinning) das mudas sobressalentes e acompanhamento do desenvolvimento inicial.',
      icone: 'fa-sun',
      corBadge: 'bg-info text-dark',
      propriedadeKey: 'passo4CuidadosBrotoDesbaste',
      dicas: [
        'Mantenha a sementeira levemente úmida e forneça de 2 a 3 horas de sol fraco da manhã para evitar estiolamento (caule fino e comprido).',
        'Faça o desbaste (thinning): corte a muda mais fraca com tesoura fina se nascerem duas no mesmo copinho, mantendo apenas a mais forte.',
        'Observe o crescimento do broto até o aparecimento do segundo par de folhas verdadeiras.'
      ],
      errosComuns: [
        'Manter a muda na sombra total, fazendo com que o caule cresça fraco e tombado.',
        'Arrancar a muda sobressalente com a raiz em vez de cortá-la com tesoura fina, danificando a muda principal.'
      ],
      materiaisRecomendados: ['Tesoura fina de precisão', 'Borrifador ajustável', 'Medidor de iluminação/luz']
    },
    5: {
      numero: 5,
      titulo: 'Aclimatização & Preparo do Vaso Definitivo',
      subtitulo: 'Exposição solar gradual, escolha do vaso 5-10L e camada de drenagem',
      resumo: 'Exposição gradual da muda ao sol pleno (aclimatação) e montagem do vaso definitivo (mínimo 5-10L) com camada de drenagem (argila expandida/isopor + manta) e solo fértil.',
      icone: 'fa-shield-halved',
      corBadge: 'bg-primary text-white',
      propriedadeKey: 'passo5AclimatizacaoVasoDefinitivo',
      dicas: [
        'Exponha a sementeira ao sol pleno por 2 a 3 dias antes do transplante para acostumar a muda à intensidade solar.',
        'Monte o vaso definitivo (5 a 10L) colocando camada de 2 a 3 cm de argila expandida, pedrinhas ou isopor picado no fundo.',
        'Cubra a camada de drenagem com manta geotêxtil (Bidim) para evitar que a terra entupa os furos do vaso.'
      ],
      errosComuns: [
        'Levar a muda direto da sombra para o sol forte de meio-dia sem período de aclimatação.',
        'Montar o vaso definitivo sem camada de drenagem no fundo.'
      ],
      materiaisRecomendados: ['Vaso definitivo (5L a 10L)', 'Argila expandida / Isopor picado', 'Manta geotêxtil (Bidim)', 'Substrato fértil com húmus']
    },
    6: {
      numero: 6,
      titulo: 'Transplante das Mudas',
      subtitulo: 'Retirada com torrão intacto, descompactação de raízes e enraizamento',
      resumo: 'Retirada da muda com o torrão intacto ao atingir 4 a 6 folhas verdadeiras e descompactação suave das raízes enoveladas no fundo para enraizamento profundo no novo solo.',
      icone: 'fa-plant-wilt',
      corBadge: 'bg-warning text-dark',
      propriedadeKey: 'passo6TransplanteMudas',
      dicas: [
        'Aguarde a muda apresentar de 4 a 6 folhas verdadeiras (8 a 10 cm de altura) antes de realizar o transplante.',
        'Pressione suavemente as laterais do copinho para soltar o torrão inteiro sem puxar o caule.',
        'Desfaça delicadamente o enovelamento de raízes no fundo do torrão com os dedos para estimular a expansão no vaso definitivo.'
      ],
      errosComuns: [
        'Puxar a muda pelo caule delicado, correndo o risco de parti-la.',
        'Transplantar em horários de sol muito forte (prefira o final da tarde ou dias nublados).'
      ],
      materiaisRecomendados: ['Pá de jardinagem', 'Regador com bico chuveirinho', 'Vaso definitivo preparado']
    },
    7: {
      numero: 7,
      titulo: 'Nutrição, Rega & Podas de Topo',
      subtitulo: 'Regas na base, adubação orgânica de 20 dias e beliscamento apical (topping)',
      resumo: 'Manejo contínuo com regas na base do solo no início da manhã, adubação orgânica periódica a cada 15-30 dias e poda de beliscamento apical (topping) para multiplicar ramos.',
      icone: 'fa-droplet',
      corBadge: 'bg-info text-dark',
      propriedadeKey: 'passo7NutricaoPoda',
      dicas: [
        'Realize regas diretamente na base da planta pela manhã, evitando molhar as folhas para não atrair fungos.',
        'Faça a poda de beliscamento (apical/topping) cortando o broto principal superior para ramificar a planta e quadruplicar os frutos.',
        'Adube a cada 15 a 20 dias com húmus de minhoca, esterco curtido ou biofertilizante líquido.'
      ],
      errosComuns: [
        'Molhar a folhagem no período noturno.',
        'Excesso de adubo nitrogenado sintético que pode queimar as raízes.'
      ],
      materiaisRecomendados: ['Tesoura de poda de precisão', 'Adubo orgânico (Húmus/NPK)', 'Regador com bico chuveirinho']
    },
    8: {
      numero: 8,
      titulo: 'Floração, Maturação & Colheita',
      subtitulo: 'Manejo de botões florais, maturação dos frutos e colheita higienizada',
      resumo: 'Acompanhamento da fase reprodutiva, manejo de flores (remocão em plantas aromáticas para prolongar sabor) e colheita no ponto ideal de maturação com tesoura higienizada em álcool 70%.',
      icone: 'fa-scissors',
      corBadge: 'bg-danger text-white',
      propriedadeKey: 'passo8FloracaoColheita',
      dicas: [
        'Para ervas e temperos aromáticos, remova os botões florais assim que surgirem para manter a força e sabor concentrado nas folhas.',
        'Acompanhe a mudança de cor e firmeza dos frutos para colher no ponto máximo de maturação.',
        'Colha preferencialmente nas primeiras horas da manhã com tesoura higienizada com álcool 70%.'
      ],
      errosComuns: [
        'Arrancar frutos ou folhas puxando e rasgando a fibra dos galhos com a mão.',
        'Deixar frutos passarem do ponto no pé, esgotando a energia vital da planta.'
      ],
      materiaisRecomendados: ['Tesoura de colheita afiada', 'Álcool 70% para esterilizar lâminas', 'Cesto de recolhimento']
    }
  };

  get etapaAtual(): EtapaConfig {
    return this.etapasMap[this.passoNumero] || this.etapasMap[1];
  }

  get textoInstrucao(): string {
    if (!this.planta) return '';
    const key = this.etapaAtual.propriedadeKey as keyof Planta;
    const val = this.planta[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      return val;
    }
    return 'Nenhuma instrução específica cadastrada para esta etapa ainda. Clique em Editar para personalizar.';
  }

  get resumoEtapa(): string {
    return this.etapaAtual.resumo;
  }

  get passoAPassoItens(): { numero: number; texto: string }[] {
    const text = this.textoInstrucao;

    if (!text || text.includes('Nenhuma instrução específica cadastrada') || (this.passoNumero === 2 && (text.toLowerCase().includes('argila expandida') || text.toLowerCase().includes('vaso definitivo')))) {
      return this.obterPassosPadraoParaEtapa(this.passoNumero);
    }

    const itens: { numero: number; texto: string }[] = [];
    const cleanText = text.replace(/\*\*/g, '').replace(/^#+\s*/gm, '');

    // 1. Tentar extrair blocos numerados explicitamente (ex: "1.", "2.", "Passo 1:", "1)", etc.)
    const matches = Array.from(cleanText.matchAll(/(?:^|\n|\r|\s{2,}|(?<=\.|\;|\:|\!|\))\s+)(?:Passo\s*)?(\d+)[\.\)]?\s*[:\.-]?\s*([\s\S]*?)(?=(?:^|\n|\r|\s{2,}|(?<=\.|\;|\:|\!|\))\s+)(?:Passo\s*)?\d+[\.\)]|\s*$)/gi));

    if (matches.length > 0) {
      let index = 1;
      for (const match of matches) {
        const num = parseInt(match[1], 10) || index;
        let txt = match[2].trim();
        txt = txt.replace(/^(?:Passo\s*)?\d+[\.\)]?\s*[:\.-]?\s*/i, '');
        txt = txt.replace(/\s+(?:Passo\s*)?\d+[\.\)].*$/i, '').trim();

        if (txt.length > 3) {
          itens.push({ numero: num, texto: txt });
          index = num + 1;
        }
      }
    }

    // 2. Se a extração por números não encontrou mais de 1 passo:
    if (itens.length <= 1) {
      const sourceText = itens.length === 1 ? itens[0].texto : cleanText;
      const rawSentences = sourceText
        .split(/(?<=\.|\!|\;|\n)\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 8 && !s.toLowerCase().startsWith('materiais:') && !s.toLowerCase().startsWith('opção ideal'));

      if (rawSentences.length > 1) {
        const splitItens: { numero: number; texto: string }[] = [];
        let numCounter = 1;
        for (const sent of rawSentences) {
          const cleanSent = sent.replace(/^(?:Passo\s*)?\d+[\.\)]?\s*[:\.-]?\s*/i, '').trim();
          if (cleanSent.length > 5) {
            splitItens.push({ numero: numCounter++, texto: cleanSent });
          }
        }
        if (splitItens.length > 0) {
          return splitItens;
        }
      }
    }

    if (itens.length > 0) {
      return itens;
    }

    return this.obterPassosPadraoParaEtapa(this.passoNumero);
  }

  private obterPassosPadraoParaEtapa(passo: number): { numero: number; texto: string }[] {
    const padroes: Record<number, string[]> = {
      1: [
        'Selecione sementes sadias, inteiras e uniformes, descartando sementes murchas ou deformadas.',
        'Realize o teste de flutuação em um copo de água: sementes que afundam são mais viáveis e férteis.',
        'Para sementes com casca dura (como coentro, salsa ou pimenta), faça a hidratação prévia em água morna por 12 a 24 horas para quebrar a dormência.',
        'Mantenha as sementes hidratando em local fresco e protegido da luz solar direta antes da semeadura.'
      ],
      2: [
        'Escolha sementeiras de 64/128 células ou copinhos descartáveis de 200ml fazendo furos de drenagem no fundo.',
        'Prepare a receita de substrato leve: misture 2 copos de requeijão de terra vegetal + 2 copos de pó de coco/húmus + 1 copo de areia (ou 400g terra + 400g pó de coco + 200g areia na balança).',
        'Misture bem os componentes até obter um substrato solto, macio e aerado.',
        'Preencha as sementeiras ou copinhos até 1 cm abaixo da borda sem compactar a terra excessivamente com as mãos.'
      ],
      3: [
        'Faça pequenos furos no substrato com profundidade equivalente a 2 a 3 vezes o tamanho da semente (aprox. 0,5 cm a 1 cm).',
        'Deposite de 2 a 3 sementes por célula ou copinho no centro para garantir a germinação.',
        'Cubra suavemente as sementes com uma fina camada de substrato leve peneirado.',
        'Umedeça o substrato borrifando água delicadamente para não deslocar a semente do lugar.',
        'Mantenha o recipiente em local ilimitadamente iluminado porém protegido de sol forte direto até o surgimento dos primeiros brotos.'
      ],
      4: [
        'Mantenha a sementeira levemente úmida borrifando água delicadamente, sem encharcar nem deixar o solo secar.',
        'Forneça de 2 a 3 horas de sol fraco da manhã para fortalecer o caule e evitar que a muda fique estiolada (fina e comprida).',
        'Faça o desbaste (thinning): corte a muda mais fraca com tesoura fina de precisão se nascerem duas no mesmo copinho, mantendo apenas a mais forte.',
        'Observe o desenvolvimento inicial até a muda estar fortalecida.'
      ],
      5: [
        'Exponha a sementeira ao sol pleno gradualmente por 2 a 3 dias antes do transplante para aclimatar a muda.',
        'Escolha o vaso definitivo (mínimo 5 a 10 litros de capacidade) com furos de drenagem no fundo.',
        'Coloque a camada de drenagem no fundo (2 a 3 cm de argila expandida, pedrinhas ou isopor picado).',
        'Cubra a drenagem com manta geotêxtil (Bidim) para evitar o entupimento dos furos.',
        'Preencha o vaso definitivo com solo fértil rico em matéria orgânica (húmus de minhoca ou esterco curtido).'
      ],
      6: [
        'Aguarde a muda apresentar de 4 a 6 folhas verdadeiras (8 a 10 cm de altura) na sementeira.',
        'Pressione delicadamente as laterais do copinho/sementeira para retirar o torrão de terra intacto sem puxar pelo caule.',
        'Desfaça e solte suavemente as raízes enoveladas no fundo do torrão com os dedos para estimular a expansão no novo solo.',
        'Plante no berço do vaso definitivo, cubra até a base do caule e regue abundantemente no final da tarde.'
      ],
      7: [
        'Realize regas regulares diretamente na base da planta no início da manhã, evitando molhar as folhas para prevenir fungos.',
        'Faça a poda de beliscamento (apical/topping) nos brotos superiores para multiplicar os ramos laterais e aumentar a produtividade.',
        'Adube a cada 15 a 20 dias com adubo orgânico (húmus de minhoca, esterco curtido ou biofertilizante líquido).'
      ],
      8: [
        'Para ervas e temperos aromáticos, remova os botões florais assim que surgirem para concentrar os óleos essenciais nas folhas.',
        'Acompanhe a mudança de cor e maturação ideal dos frutos no pé.',
        'Efetue a colheita nas primeiras horas da manhã utilizando tesoura limpa e higienizada com álcool 70%.'
      ]
    };

    const lista = padroes[passo] || padroes[1];
    return lista.map((texto, i) => ({ numero: i + 1, texto }));
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private agroTechService: AgroTechService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.plantaId = params.get('id');
      const passoParam = params.get('passo');
      if (passoParam) {
        this.passoNumero = parseInt(passoParam, 10) || 1;
      }
      if (this.plantaId) {
        this.carregarPlanta(this.plantaId);
      } else {
        this.router.navigate(['/plantas']);
      }
    });
  }

  carregarPlanta(id: string): void {
    this.isLoading = true;
    this.agroTechService.getPlantaById(id).subscribe({
      next: (data) => {
        this.planta = data;
        this.conteudoEtapaEditavel = this.textoInstrucao;
        this.isLoading = false;
        this.carregarDiarioBordo();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar detalhes da planta para etapa:', err);
        this.isLoading = false;
        this.router.navigate(['/plantas']);
      }
    });
  }

  mudarEtapa(passo: number): void {
    if (passo < 1 || passo > 8 || !this.plantaId) return;
    this.router.navigate(['/plantas', this.plantaId, 'etapa', passo]);
  }

  getEtapaConfig(stepNum: number): EtapaConfig {
    return this.etapasMap[stepNum] || this.etapasMap[1];
  }

  iniciarEdicao(): void {
    this.isEditing = true;
    this.conteudoEtapaEditavel = this.textoInstrucao;
    this.cdr.detectChanges();
  }

  cancelarEdicao(): void {
    this.isEditing = false;
    this.conteudoEtapaEditavel = this.textoInstrucao;
    this.cdr.detectChanges();
  }

  salvar(): void {
    if (this.isSaving || !this.planta || !this.planta.especieId) return;

    this.isSaving = true;
    this.cdr.detectChanges();

    const propKey = this.etapaAtual.propriedadeKey as keyof Especie;
    const especieUpdate: Partial<Especie> = {
      [propKey]: this.conteudoEtapaEditavel
    };

    this.agroTechService.updateEspecie(this.planta.especieId, especieUpdate).subscribe({
      next: () => {
        this.isSaving = false;
        this.isEditing = false;
        this.carregarPlanta(this.plantaId!);
      },
      error: (err) => {
        console.error('Erro ao salvar etapa:', err);
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  voltarParaDetalhes(): void {
    if (this.plantaId) {
      this.router.navigate(['/plantas', this.plantaId]);
    } else {
      this.router.navigate(['/plantas']);
    }
  }

  // Métodos e Estado da IA (Pergunte à IA)
  showChatIa = false;
  perguntaIa = '';
  respostaIa = '';
  isConsultandoIa = false;
  erroIa = '';

  toggleChatIa(): void {
    this.showChatIa = !this.showChatIa;
    if (!this.showChatIa) {
      this.limparChatIa();
    }
    this.cdr.detectChanges();
  }

  enviarPerguntaIa(): void {
    if (!this.perguntaIa.trim() || this.isConsultandoIa || !this.planta) return;

    this.isConsultandoIa = true;
    this.respostaIa = '';
    this.erroIa = '';
    this.cdr.detectChanges();

    const payload = {
      nomePopular: this.planta.especieNomePopular || '',
      nomeCientifico: this.planta.especieNomeCientifico || '',
      apelidoLote: this.planta.apelidoLote || '',
      etapaNumero: this.passoNumero,
      etapaTitulo: this.etapaAtual.titulo,
      etapaResumo: this.etapaAtual.resumo,
      instrucaoEtapa: this.textoInstrucao,
      perguntaUsuario: this.perguntaIa.trim(),
      umidadeSoloMin: this.planta.umidadeSoloMin,
      umidadeSoloMax: this.planta.umidadeSoloMax,
      temperaturaMin: this.planta.temperaturaMin,
      temperaturaMax: this.planta.temperaturaMax,
      instrucoesManejo: this.planta.instrucoesManejo
    };

    this.agroTechService.perguntarIaEtapa(payload).subscribe({
      next: (res) => {
        this.isConsultandoIa = false;
        this.respostaIa = res.resposta;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao consultar IA:', err);
        this.isConsultandoIa = false;
        this.erroIa = 'Não foi possível obter a resposta da IA no momento. Tente novamente.';
        this.cdr.detectChanges();
      }
    });
  }

  limparChatIa(): void {
    this.perguntaIa = '';
    this.respostaIa = '';
    this.erroIa = '';
    this.cdr.detectChanges();
  }

  // ─── Estado & Métodos do Diário de Bordo ──────────────────────────────────
  notasDiario: DiarioNotaItem[] = [];
  diagnosticoSaudeIa: AnaliseSaudeIaResponse | null = null;
  novaNotaDiarioText = '';
  novaNotaData = this.obterDataHoraAtualLocal();
  isAdicionandoNota = false;
  isAnalisandoSaude = false;
  isRegistrandoDiagnostico = false;
  sucessoRegistroIa = false;
  erroDiario = '';
  erroAnaliseSaude = '';

  obterDataHoraAtualLocal(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

  carregarDiarioBordo(): void {
    if (!this.plantaId) return;
    this.agroTechService.getDiarioBordoEtapa(this.plantaId, this.passoNumero).subscribe({
      next: (res) => {
        this.notasDiario = this.ordenarNotasPorData(res.notas || []);
        this.diagnosticoSaudeIa = res.diagnosticoIa || null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar Diário de Bordo:', err);
      }
    });
  }

  ordenarNotasPorData(list: DiarioNotaItem[]): DiarioNotaItem[] {
    return list.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  adicionarNotaDiario(): void {
    if (!this.novaNotaDiarioText.trim() || !this.plantaId || this.isAdicionandoNota) return;

    this.isAdicionandoNota = true;
    this.erroDiario = '';
    const texto = this.novaNotaDiarioText.trim();
    const isoDate = this.novaNotaData ? new Date(this.novaNotaData).toISOString() : new Date().toISOString();

    this.agroTechService.adicionarNotaDiario(this.plantaId, {
      etapaNumero: this.passoNumero,
      textoNota: texto,
      criadoEm: isoDate,
      isIa: false
    }).subscribe({
      next: (novaNota) => {
        this.notasDiario = this.ordenarNotasPorData([novaNota, ...this.notasDiario]);
        this.novaNotaDiarioText = '';
        this.novaNotaData = this.obterDataHoraAtualLocal();
        this.isAdicionandoNota = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao adicionar nota ao diário:', err);
        this.isAdicionandoNota = false;
        this.erroDiario = 'Não foi possível salvar a nota no momento.';
        this.cdr.detectChanges();
      }
    });
  }

  registrarDiagnosticoIaNoDiario(): void {
    if (!this.diagnosticoSaudeIa || !this.plantaId || this.isRegistrandoDiagnostico) return;

    this.isRegistrandoDiagnostico = true;
    this.sucessoRegistroIa = false;
    this.erroDiario = '';

    const statusLabel = this.diagnosticoSaudeIa.statusSaude === 'ALERTA'
      ? 'ALERTA FITOSSANITÁRIO'
      : (this.diagnosticoSaudeIa.statusSaude === 'ATENCAO' ? 'REQUER ATENÇÃO' : 'EXCELENTE / SAUDÁVEL');

    let textoIa = `🤖 [Diagnóstico de Saúde IA - Status: ${statusLabel}]\n${this.diagnosticoSaudeIa.diagnosticoTexto}`;
    if (this.diagnosticoSaudeIa.observacoes?.length > 0) {
      textoIa += `\n\n📌 Observações Identificadas:\n• ` + this.diagnosticoSaudeIa.observacoes.join('\n• ');
    }
    if (this.diagnosticoSaudeIa.recomendacoes?.length > 0) {
      textoIa += `\n\n💡 Recomendações Práticas:\n• ` + this.diagnosticoSaudeIa.recomendacoes.join('\n• ');
    }

    this.agroTechService.adicionarNotaDiario(this.plantaId, {
      etapaNumero: this.passoNumero,
      textoNota: textoIa,
      criadoEm: new Date().toISOString(),
      isIa: true
    }).subscribe({
      next: (notaIa) => {
        this.notasDiario = this.ordenarNotasPorData([notaIa, ...this.notasDiario]);
        this.isRegistrandoDiagnostico = false;
        this.sucessoRegistroIa = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.sucessoRegistroIa = false;
          this.cdr.detectChanges();
        }, 4000);
      },
      error: (err) => {
        console.error('Erro ao registrar diagnóstico no diário:', err);
        this.isRegistrandoDiagnostico = false;
        this.erroDiario = 'Não foi possível registrar o diagnóstico no diário.';
        this.cdr.detectChanges();
      }
    });
  }

  excluirNotaDiario(notaId: string): void {
    if (!this.plantaId) return;
    this.agroTechService.excluirNotaDiario(this.plantaId, notaId).subscribe({
      next: () => {
        this.notasDiario = this.notasDiario.filter(n => n.id !== notaId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao excluir nota:', err);
      }
    });
  }

  analisarSaudeDiario(): void {
    if (!this.plantaId || !this.planta || this.isAnalisandoSaude) return;

    if (this.notasDiario.length === 0) {
      this.erroAnaliseSaude = 'Por favor, adicione ao menos uma nota no Diário de Bordo para que a IA possa analisar a saúde da planta.';
      return;
    }

    this.isAnalisandoSaude = true;
    this.erroAnaliseSaude = '';
    this.cdr.detectChanges();

    const payload = {
      nomePopular: this.planta.especieNomePopular || '',
      nomeCientifico: this.planta.especieNomeCientifico || '',
      apelidoLote: this.planta.apelidoLote || '',
      etapaNumero: this.passoNumero,
      etapaTitulo: this.etapaAtual.titulo,
      umidadeSoloMin: this.planta.umidadeSoloMin,
      umidadeSoloMax: this.planta.umidadeSoloMax,
      temperaturaMin: this.planta.temperaturaMin,
      temperaturaMax: this.planta.temperaturaMax,
      instrucoesManejo: this.planta.instrucoesManejo,
      notasDiario: this.notasDiario.map(n => n.textoNota)
    };

    this.agroTechService.analisarSaudeDiario(this.plantaId, this.passoNumero, payload).subscribe({
      next: (res) => {
        this.isAnalisandoSaude = false;
        this.diagnosticoSaudeIa = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao analisar saúde com IA:', err);
        this.isAnalisandoSaude = false;
        this.erroAnaliseSaude = 'Não foi possível concluir a análise fitossanitária no momento. Tente novamente.';
        this.cdr.detectChanges();
      }
    });
  }
}
