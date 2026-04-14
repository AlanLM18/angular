import {
  Directive,
  Input,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect,
} from '@angular/core';
import { Permission, PermissionsService } from './permissions';

type PermissionMode = 'all' | 'any';

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective implements OnInit {

  @Input('hasPermission') required: Permission | Permission[] = [];
  @Input('hasPermissionMode') mode: PermissionMode = 'all';

  private templateRef   = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private permService   = inject(PermissionsService);

  constructor() {
    effect(() => {
      this.permService.getAllActive();
      this.updateView();
    });
  }

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const permissions = Array.isArray(this.required)
      ? this.required
      : [this.required];

    const granted =
      this.mode === 'any'
        ? this.permService.hasAny(permissions)
        : this.permService.hasAll(permissions);

    this.viewContainer.clear();

    if (granted) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
