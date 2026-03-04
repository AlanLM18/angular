import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';

interface Product {
  id: number;
  name: string;
  category: string;
  stock: number;
  price: number;
  status: 'instock' | 'lowstock' | 'outofstock';
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, CardModule, TagModule, ButtonModule],
  templateUrl: './products.html',
  styleUrls: ['./products.css'],
})
export class ProductsComponent {
  products: Product[] = [
    { id: 1, name: 'Laptop Pro 15"',    category: 'Electrónica',  stock: 24,  price: 18500, status: 'instock'    },
    { id: 2, name: 'Monitor 4K 27"',    category: 'Electrónica',  stock: 8,   price: 7200,  status: 'lowstock'   },
    { id: 3, name: 'Teclado Mecánico',  category: 'Periféricos',  stock: 0,   price: 1850,  status: 'outofstock' },
    { id: 4, name: 'Mouse Inalámbrico', category: 'Periféricos',  stock: 45,  price: 650,   status: 'instock'    },
    { id: 5, name: 'Silla Ergonómica',  category: 'Mobiliario',   stock: 5,   price: 4200,  status: 'lowstock'   },
    { id: 6, name: 'Escritorio Doble',  category: 'Mobiliario',   stock: 12,  price: 3800,  status: 'instock'    },
  ];

  get advanceCount() {
    return this.products.filter(p => p.status === 'instock').length;
  }

  getSeverity(status: string) {
    if (status === 'instock')    return 'success';
    if (status === 'lowstock')   return 'warn';
    return 'danger';
  }

  getStatusLabel(status: string) {
    if (status === 'instock')    return 'En stock';
    if (status === 'lowstock')   return 'Stock bajo';
    return 'Sin stock';
  }
}
