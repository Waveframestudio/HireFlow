import { useAuth, UserRole } from '../context/AuthContext';

export interface RolePermissions {
  canCreateJob: boolean;
  canChangeJobStatus: boolean;
  canCreateCandidate: boolean;
  canMoveStage: boolean;
  canScheduleInterview: boolean;
  canCompleteInterview: boolean;
  canExportData: boolean;
  canViewReports: boolean;
  roleTitle: string;
  roleBadgeDescription: string;
}

export function getPermissions(role?: UserRole): RolePermissions {
  if (role === 'hiring_manager') {
    return {
      canCreateJob: false,
      canChangeJobStatus: false,
      canCreateCandidate: false,
      canMoveStage: false,
      canScheduleInterview: true,
      canCompleteInterview: true,
      canExportData: false,
      canViewReports: true,
      roleTitle: 'Hiring Manager (Evaluador Técnico & Comercial)',
      roleBadgeDescription: 'Permisos de evaluación de entrevistas y visualización de vacantes.',
    };
  }

  if (role === 'recruiter') {
    return {
      canCreateJob: true,
      canChangeJobStatus: true,
      canCreateCandidate: true,
      canMoveStage: true,
      canScheduleInterview: true,
      canCompleteInterview: true,
      canExportData: true,
      canViewReports: true,
      roleTitle: 'Recruiter RRHH (Gestión de Talento)',
      roleBadgeDescription: 'Permisos completos de selección, publicación de vacantes y pipeline.',
    };
  }

  // Default: Admin
  return {
    canCreateJob: true,
    canChangeJobStatus: true,
    canCreateCandidate: true,
    canMoveStage: true,
    canScheduleInterview: true,
    canCompleteInterview: true,
    canExportData: true,
    canViewReports: true,
    roleTitle: 'Administrador (Dirección & Head of Talent)',
    roleBadgeDescription: 'Acceso total y configuración de todas las áreas de la plataforma.',
  };
}

export function usePermissions(): RolePermissions {
  const { user } = useAuth();
  return getPermissions(user?.role);
}
