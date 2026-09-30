import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AgroTechService } from '../../services/agrotech.service';
import { Planta } from '../../models/agrotech.models';

@Component({
  selector: 'app-plantas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './plantas.component.html',
  styleUrls: ['./plantas.component.scss']
})
export class PlantasComponent implements OnInit {
  plantas: Planta[] = [];
  isLoading = true;

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
}
