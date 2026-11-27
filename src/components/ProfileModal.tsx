import React, { useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Save,
  Shield,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { ROLE_LABELS, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePermissions } from '../lib/permissions';
import { useModalAnimation } from '../hooks/useModalAnimation';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, isSupabaseActive, updateProfile, updatePassword, logout } = useAuth();
  const toast = useToast();
  const permissions = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { shouldRender, backdropClass, contentClass } = useModalAnimation(isOpen);

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'session'>('profile');

  // Form states: Perfil
  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Form states: Contraseña
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  if (!shouldRender || !user) return null;

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Formato inválido', 'Selecciona una imagen en formato PNG, JPG o WEBP.');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error('Archivo muy pesado', 'La imagen no debe superar los 4 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const res = await updateProfile({ avatarUrl: base64 });
      if (res.success) {
        toast.success('Foto actualizada', 'Tu imagen de perfil se guardó correctamente.');
      } else {
        toast.error('Error al guardar foto', res.error || 'No se pudo actualizar la imagen.');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await updateProfile({ avatarUrl: undefined });
    if (res.success) {
      toast.info('Foto eliminada', 'Se restablecieron tus iniciales.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nombre requerido', 'Por favor ingresá tu nombre completo.');
      return;
    }

    setIsSavingProfile(true);
    const res = await updateProfile({
      name: name.trim(),
      department: department.trim(),
    });
    setIsSavingProfile(false);

    if (res.success) {
      toast.success('Perfil actualizado', 'Tus datos fueron guardados correctamente.');
    } else {
      toast.error('Error al actualizar', res.error || 'No se pudieron guardar los cambios.');
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('Contraseña corta', 'La nueva contraseña debe contener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('No coinciden', 'Las contraseñas ingresadas no son iguales.');
      return;
    }

    setIsSavingPassword(true);
    const res = await updatePassword(newPassword);
    setIsSavingPassword(false);

    if (res.success) {
      toast.success('Contraseña actualizada', 'Tu clave de acceso ha sido cambiada con éxito.');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error('Error al cambiar contraseña', res.error || 'Ocurrió un problema.');
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#11314E]/60 backdrop-blur-xs ${backdropClass}`}
    >
      <div className={`bg-white rounded-2xl border border-[#EFE3D3] max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${contentClass}`}>
        {/* Header con Avatar Clickeable */}
        <div className="p-6 bg-[#FAF4EC] border-b border-[#EFE3D3] flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            {/* Cuadro de Avatar interactivo para cambiar foto */}
            <div
              className="relative group/avatar cursor-pointer shrink-0"
              onClick={handlePhotoClick}
              title="Hacé clic para cargar o cambiar tu foto de perfil"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EC623E] to-[#D95330] text-white flex items-center justify-center text-lg font-extrabold shadow-sm overflow-hidden relative border-2 border-white transition-transform group-hover/avatar:scale-105">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user.avatarInitials}</span>
                )}

                {/* Overlay hover con ícono de cámara */}
                <div className="absolute inset-0 bg-[#11314E]/75 text-white flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5" />
                  <span className="text-[9px] font-bold mt-0.5">Foto</span>
                </div>
              </div>

              {/* Botón flotante para eliminar foto si ya tiene una */}
              {user.avatarUrl ? (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  title="Quitar foto y usar iniciales"
                  className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-xs cursor-pointer transition-colors border border-white"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              ) : (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#11314E] text-white rounded-full flex items-center justify-center shadow-xs pointer-events-none border border-white">
                  <Camera className="w-2.5 h-2.5" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-[#11314E] leading-tight">{user.name}</h3>
                <span className="text-[10px] text-slate-400 bg-white border border-[#EFE3D3] px-2 py-0.5 rounded-full font-medium">
                  {user.avatarUrl ? 'Foto personalizada' : 'Iniciales'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {ROLE_LABELS[user.role] || user.role} · {user.department}
              </p>
              <button
                type="button"
                onClick={handlePhotoClick}
                className="text-[11px] font-semibold text-[#EC623E] hover:underline cursor-pointer mt-1 flex items-center gap-1"
              >
                <Camera className="w-3 h-3" />
                {user.avatarUrl ? 'Cambiar imagen...' : 'Cargar foto de perfil...'}
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-[#11314E] p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 border-b border-[#EFE3D3] flex gap-6 text-xs font-semibold text-slate-500 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-[#EC623E] text-[#11314E]'
                : 'border-transparent hover:text-[#11314E]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Datos Personales
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-[#EC623E] text-[#11314E]'
                : 'border-transparent hover:text-[#11314E]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Seguridad & Clave
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('session')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'session'
                ? 'border-[#EC623E] text-[#11314E]'
                : 'border-transparent hover:text-[#11314E]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Sesión & Conexión
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: DATOS PERSONALES */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[#FAF4EC]/40 border border-[#EFE3D3] rounded-lg text-[#11314E] focus:bg-white focus:border-[#EC623E] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100 border border-[#EFE3D3] rounded-lg text-slate-500 cursor-not-allowed outline-none"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  El correo es el identificador único de inicio de sesión.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Departamento / Área
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ej. Recursos Humanos, Tecnología, etc."
                  className="w-full px-3 py-2 text-sm bg-[#FAF4EC]/40 border border-[#EFE3D3] rounded-lg text-[#11314E] focus:bg-white focus:border-[#EC623E] outline-none"
                />
              </div>

              {/* Rol Asignado */}
              <div className="p-3.5 bg-[#FAF4EC]/60 border border-[#EFE3D3] rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Rol en la Plataforma
                </span>
                <div className="flex items-center gap-2 pt-0.5">
                  <Shield className="w-4 h-4 text-[#EC623E]" />
                  <span className="text-xs font-bold text-[#11314E]">
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {permissions.roleBadgeDescription}
                </p>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EC623E] hover:bg-[#D95330] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSavingProfile ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SEGURIDAD & CONTRASEÑA */}
          {activeTab === 'security' && (
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="p-3 bg-[#FAF4EC]/60 border border-[#EFE3D3] rounded-xl text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-[#11314E]">Seguridad de la Cuenta</p>
                <p className="text-[11px] leading-relaxed">
                  Cambiá tu contraseña regularmente. Debe contener como mínimo 6 caracteres alfanuméricos.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-10 py-2 text-sm bg-[#FAF4EC]/40 border border-[#EFE3D3] rounded-lg text-[#11314E] focus:bg-white focus:border-[#EC623E] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#11314E] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11314E] mb-1">
                  Confirmar Nueva Contraseña *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repetí la contraseña"
                    className="w-full pl-9 pr-10 py-2 text-sm bg-[#FAF4EC]/40 border border-[#EFE3D3] rounded-lg text-[#11314E] focus:bg-white focus:border-[#EC623E] outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingPassword || !newPassword}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#11314E] hover:bg-[#1A446C] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {isSavingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SESIÓN & CONEXIÓN */}
          {activeTab === 'session' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-white border border-[#EFE3D3] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Modo de Base de Datos:</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold ${
                      isSupabaseActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-[#FAF4EC] text-[#11314E] border border-[#EFE3D3]'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSupabaseActive ? 'bg-emerald-500' : 'bg-[#EC623E]'
                      }`}
                    />
                    {isSupabaseActive ? 'Supabase PostgreSQL Cloud' : 'Modo Seguro Local Demo'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-[#EFE3D3]/60 pt-2.5">
                  <span className="font-semibold text-slate-500">ID de Usuario:</span>
                  <span className="font-mono text-slate-600 text-[11px]">{user.id}</span>
                </div>

                <div className="flex items-center justify-between border-t border-[#EFE3D3]/60 pt-2.5">
                  <span className="font-semibold text-slate-500">Estado de Autenticación:</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sesión Activa
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EFE3D3] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#11314E]">Cerrar Sesión</p>
                  <p className="text-slate-500 text-[11px]">Finalizar la sesión en este dispositivo</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    logout();
                    toast.info('Sesión cerrada', 'Hasta pronto.');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
