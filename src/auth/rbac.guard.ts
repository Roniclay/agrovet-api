import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    // se não exigir nada, libera só pelo JwtAuthGuard
    if (requiredRoles.length === 0 && requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as {
      roles: string[];
      permissions: string[];
    };

    if (!user) {
      throw new ForbiddenException('Usuário não encontrado no contexto');
    }

    const hasRole =
      requiredRoles.length === 0 ||
      requiredRoles.some((role) => user.roles?.includes(role));

    const hasPermissions =
      requiredPermissions.length === 0 ||
      requiredPermissions.every((perm) => user.permissions?.includes(perm));

    if (!hasRole || !hasPermissions) {
      throw new ForbiddenException('Acesso negado (RBAC)');
    }

    return true;
  }
}
