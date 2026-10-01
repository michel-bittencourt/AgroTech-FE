import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AgroTechService } from '../../services/agrotech.service';
import { Planta } from '../../models/agrotech.models';

@Component({
  selector: 'app-plantas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './plantas.component.html',
  styleUrls: ['./plantas.component.scss']
})
export class PlantasComponent implements OnInit {
  plantas: Planta[] = [];
  isLoading = true;

  showApiModal = false;
  inputApiUrl = '';

  constructor(
    private agroTechService: AgroTechService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarPlantas();
  }

  carregarPlantas(): void {
    this.isLoading = true;
    this.agroTechService.getPlantas().subscribe({
      next: (data) => {
        console.log('[PlantasComponent] 🌿 Plantas recebidas:', data);
        this.plantas = data || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar plantas:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cadastrar(): void {
    this.router.navigate(['/plantas/nova']);
  }

  verDetalhes(id: string): void {
    this.router.navigate(['/plantas', id]);
  }

  abrirModalApi(): void {
    this.inputApiUrl = this.agroTechService.apiUrl;
    this.showApiModal = true;
    this.cdr.detectChanges();
  }

  fecharModalApi(): void {
    this.showApiModal = false;
    this.cdr.detectChanges();
  }

  salvarEConectarApi(): void {
    if (!this.inputApiUrl.trim()) {
      localStorage.removeItem('AGROTECH_API_URL');
      this.fecharModalApi();
      this.carregarPlantas();
      return;
    }

    let cleanUrl = this.inputApiUrl.trim().replace(/\/$/, '');
    if (!cleanUrl.endsWith('/api')) {
      cleanUrl += '/api';
    }

    localStorage.setItem('AGROTECH_API_URL', cleanUrl);
    this.fecharModalApi();
    this.carregarPlantas();
  }
}
