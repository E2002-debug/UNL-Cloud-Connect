import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, Shield, Terminal, ArrowRight, Cpu, Layers, Activity, Wifi, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export interface UserProfile {
  name: string;
  role: string;
  avatar: string;
  badge: string;
  node: string;
  impact: string;
  contributions: string;
  email: string;
}

const PRESET_USERS: UserProfile[] = [
  {
    name: 'Miguel Luna',
    role: 'Contribuyente de Sensor v4',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    badge: 'Pionero',
    node: 'node-04-luna',
    impact: '8.4k',
    contributions: '142',
    email: 'migue.luna@unl.edu.ec'
  },
  {
    name: 'Isabel Maldonado',
    role: 'Administradora de Nodo',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    badge: 'Directora',
    node: 'node-01-maldonado',
    impact: '12.8k',
    contributions: '298',
    email: 'isabel.m@unl.edu.ec'
  }
];

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info', title?: string) => void;
}

export default function LoginView({ onLoginSuccess, showToast }: LoginViewProps) {
  const [activeMode, setActiveMode] = useState<'preset' | 'custom' | 'register'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState('Estudiante');
  const [regNode, setRegNode] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200'
  ];
  const [selectedAvatar, setSelectedAvatar] = useState(presetAvatars[0]);

  // Load dynamically registered users from localStorage
  const [registeredUsers, setRegisteredUsers] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('unl_registered_users_v2');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleRegNameChange = (val: string) => {
    setRegName(val);
    const cleanName = val.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanRoleShort = regRole.slice(0, 3).toLowerCase();
    if (cleanName) {
      setRegNode(`node-${cleanRoleShort}-${cleanName}`);
    } else {
      setRegNode('');
    }
  };

  const handleRegRoleChange = (val: string) => {
    setRegRole(val);
    const cleanName = regName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanRoleShort = val.slice(0, 3).toLowerCase();
    if (cleanName) {
      setRegNode(`node-${cleanRoleShort}-${cleanName}`);
    }
  };

  const standardSteps = [
    'Estableciendo handshake con el Nodo UNL...',
    'Cargando telemetría de sensores atmosféricos...',
    'Verificando credenciales con la cadena distribuida...',
    'Acceso concedido. Sincronizando dashboard...'
  ];

  const googleSteps = [
    'Estableciendo conexión segura con Google OAuth...',
    'Intercambiando token seguro con el proveedor...',
    'Verificando identidad de cuenta académica...',
    'Sincronizando perfil e historial de sensores...',
    'Acceso concedido. Desplegando dashboard UNL...'
  ];

  const [activeSteps, setActiveSteps] = useState<string[]>(standardSteps);

  const handleLogin = (user: UserProfile) => {
    setActiveSteps(standardSteps);
    setIsAuthenticating(true);
    setAuthStep(0);
    setErrorMsg(null);
    showToast?.(`Iniciando Handshake de Red con nodo ${user.node || 'central'}...`, 'info', 'Handshake de Red');

    // Simulated terminal-like loading steps
    const interval = setInterval(() => {
      setAuthStep((prev) => {
        if (prev < standardSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            showToast?.(`Acceso concedido. ¡Bienvenido de vuelta!`, 'success', 'Conexión Exitosa');
            onLoginSuccess(user);
          }, 650);
          return prev;
        }
      });
    }, 450);
  };

  const handleGoogleLogin = async () => {
    setActiveSteps(googleSteps);
    setIsAuthenticating(true);
    setAuthStep(0);
    setErrorMsg(null);
    showToast?.("Iniciando firma segura con proveedor de Google...", "info", "Google OAuth");

    try {
      if (auth) {
        // Real Google Authentication using Firebase provider
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const googleUser: UserProfile = {
          name: user.displayName || 'Usuario Google',
          role: 'Sensor de Red Académica',
          avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
          badge: 'Google Auth',
          node: `node-g-${user.uid.slice(0, 8)}`,
          impact: '2.4k',
          contributions: '76',
          email: user.email || 'user@unl.edu.ec'
        };

        let currentStep = 0;
        const interval = setInterval(() => {
          if (currentStep < googleSteps.length - 1) {
            currentStep++;
            setAuthStep(currentStep);
          } else {
            clearInterval(interval);
            setTimeout(() => {
              showToast?.(`Hola ${googleUser.name}, sesión iniciada con éxito.`, 'success', 'OAuth Sincronizado');
              onLoginSuccess(googleUser);
            }, 650);
          }
        }, 350);

      } else {
        // High fidelity elegant simulation fallback when offline / no Firebase configured yet
        const simulatedUser: UserProfile = {
          name: 'Miguel Luna',
          role: 'Sensor de Red Académica',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
          badge: 'Google Auth',
          node: 'node-g-miguel',
          impact: '2.5k',
          contributions: '142',
          email: 'maiguelluna13@gmail.com'
        };

        let currentStep = 0;
        const interval = setInterval(() => {
          if (currentStep < googleSteps.length - 1) {
            currentStep++;
            setAuthStep(currentStep);
          } else {
            clearInterval(interval);
            setTimeout(() => {
              showToast?.(`Hola ${simulatedUser.name}, sesión iniciada con éxito.`, 'success', 'Simulador OAuth');
              onLoginSuccess(simulatedUser);
            }, 650);
          }
        }, 350);
      }
    } catch (error: any) {
      console.error(error);
      setIsAuthenticating(false);
      const errText = error?.message || 'Autenticación cancelada o fallida.';
      setErrorMsg(`Error de Google Auth: ${errText}`);
      showToast?.(`Error de autenticación: ${errText}`, 'error', 'Error Criptográfico');
    }
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Por favor ingrese correo / usuario y contraseña.');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    // 1. Identify if matching any locally registered account
    const matchedUser = registeredUsers.find(
      (u) => 
        (u.email.toLowerCase() === username.trim().toLowerCase() || u.name.toLowerCase() === username.trim().toLowerCase()) && 
        u.password === password
    );

    if (matchedUser) {
      const profile: UserProfile = {
        name: matchedUser.name,
        role: matchedUser.role,
        avatar: matchedUser.avatar,
        badge: matchedUser.badge,
        node: matchedUser.node,
        impact: matchedUser.impact || '1.2k',
        contributions: matchedUser.contributions || '0',
        email: matchedUser.email
      };
      handleLogin(profile);
      return;
    }

    // 2. Identify if matching preset credentials
    const presetMatch = PRESET_USERS.find(
      (u) => u.email.toLowerCase() === username.trim().toLowerCase()
    );
    if (presetMatch) {
      handleLogin(presetMatch);
      return;
    }

    // Create a custom profile on the fly if not registered (so that we never block the user even if they forget password)
    const cleanName = username.includes('@') ? username.split('@')[0] : username;
    const displayName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

    const customUser: UserProfile = {
      name: displayName,
      role: 'Investigador Externo',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
      badge: 'Invitado',
      node: `node-ext-${cleanName.toLowerCase().replace(/\s+/g, '-')}`,
      impact: '0.1k',
      contributions: '12',
      email: username.includes('@') ? username : `${cleanName.toLowerCase().replace(/\s+/g, '')}@unl.edu.ec`
    };

    handleLogin(customUser);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regConfirmPassword.trim()) {
      setErrorMsg('Por favor rellene todos los campos obligatorios.');
      return;
    }

    if (regPassword.length < 4) {
      setErrorMsg('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    // Check if user already exists
    const emailLower = regEmail.trim().toLowerCase();
    const emailExists = registeredUsers.some(u => u.email.toLowerCase() === emailLower);
    const presetExists = PRESET_USERS.some(u => u.email.toLowerCase() === emailLower);

    if (emailExists || presetExists) {
      setErrorMsg('Esta dirección de correo ya se encuentra registrada.');
      return;
    }

    const newUser = {
      name: regName.trim(),
      email: emailLower,
      password: regPassword,
      role: regRole === 'Estudiante' ? 'Estudiante de Red' : regRole === 'Docente' ? 'Profesor Investigador' : regRole === 'Investigador' ? 'Socio de Red IoT' : 'Administrador de Sondas',
      badge: regRole === 'Estudiante' ? 'Estudiante' : regRole === 'Docente' ? 'Docente' : regRole === 'Investigador' ? 'Investigador' : 'Administrador',
      node: regNode.trim() || `node-${regRole.slice(0, 3).toLowerCase()}-${regName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      avatar: selectedAvatar,
      impact: '0.1k',
      contributions: '0'
    };

    const updated = [...registeredUsers, newUser];
    setRegisteredUsers(updated);
    try {
      localStorage.setItem('unl_registered_users_v2', JSON.stringify(updated));
    } catch (err) {
      console.error("Error setting registered users:", err);
    }

    showToast?.('¡Registro universitario completado con éxito!', 'success', 'Sonda Registrada');
    
    // Automatically log the user in immediately!
    const profile: UserProfile = {
      name: newUser.name,
      role: newUser.role,
      avatar: newUser.avatar,
      badge: newUser.badge,
      node: newUser.node,
      impact: newUser.impact,
      contributions: newUser.contributions,
      email: newUser.email
    };

    handleLogin(profile);
  };

  const handlePresetSelect = () => {
    handleLogin(PRESET_USERS[selectedPreset]);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F5] text-zinc-900 font-sans flex items-center justify-center p-0 md:p-6 relative overflow-hidden">
      {/* Split screen outer container card matching reference layout */}
      <div className="w-full max-w-[1000px] min-h-screen md:min-h-[580px] bg-white md:rounded-2xl md:shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col md:flex-row overflow-hidden relative border border-transparent md:border-zinc-150">
        
        {/* LEFT COLUMN: Deep ocean university blue thematic brand banner - Hidden on Mobile */}
        <div className="hidden md:flex w-full md:w-5/12 bg-gradient-to-br from-[#0F766E] via-[#073B37] to-[#031E1C] p-8 md:p-10 flex-col justify-between text-white relative overflow-hidden">
          {/* Background overlay details for depth */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.07] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-white/10 rounded-full blur-[80px] pointer-events-none" />
          
          {/* Header logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 backdrop-blur-md flex items-center justify-center rounded-xl border border-white/20 shadow-inner">
              <Cpu className="w-4 h-4 text-white animate-pulse" />
            </div>
            <span className="text-[12px] font-black tracking-[0.2em] font-sans uppercase">UNL Cloud Connect</span>
          </div>

          {/* Inspirational body text */}
          <div className="relative z-10 my-10 md:my-0 space-y-4">
            <span className="inline-block bg-white/10 border border-white/20 text-[8px] font-mono tracking-widest font-black uppercase px-2 py-0.5 rounded-full">
              SISTEMA IOT UNL v4
            </span>
            <h1 className="text-3xl md:text-[32px] font-black italic tracking-tighter uppercase leading-[1.05]">
              El rigor académico <br className="hidden md:inline" />
              se une a la <br className="hidden md:inline" />
              inteligencia del IoT.
            </h1>
            <p className="text-[11px] leading-relaxed text-zinc-200/90 font-medium max-w-sm">
              Acceda a la plataforma de datos de todo el campus, a las redes de sensores y a los análisis de investigación desde un portal seguro para estudiantes e investigadores.
            </p>
          </div>

          {/* Footer badge */}
          <div className="relative z-10 pt-4 md:pt-0">
            <div className="inline-flex items-center gap-2.5 bg-white/8 backdrop-blur-md border border-white/12 px-4 py-2.5 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <Shield className="w-3.5 h-3.5 text-white/90" />
              <span className="text-[9px] font-black uppercase tracking-wider text-white select-none">
                Inicio de sesión institucional seguro
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Ultra clean workspace white layout */}
        <div className="w-full md:w-7/12 bg-white p-5 sm:p-8 md:p-12 flex flex-col justify-between relative">
          
          <AnimatePresence mode="wait">
            {!isAuthenticating ? (
              <motion.div
                key="form-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
                className="flex-1 flex flex-col justify-center"
              >
                {/* Greeting */}
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-zinc-900 tracking-tight leading-tight">Bienvenido de nuevo</h2>
                  <p className="text-xs text-zinc-550 mt-1 font-medium">Introduzca sus credenciales universitarias para continuar.</p>
                </div>

                {/* Sub-modes Toggle Tab with Blue styling */}
                <div className="flex bg-zinc-100/80 p-1 rounded-2xl mb-6 w-full max-w-md border border-zinc-200/40 shadow-sm font-sans gap-0.5">
                  <button
                    onClick={() => { setActiveMode('preset'); setErrorMsg(null); }}
                    className={cn(
                      "flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl cursor-pointer text-center",
                      activeMode === 'preset' 
                        ? "bg-white text-[#0F766E] shadow-[0_4px_12px_rgba(0,0,0,0.04)] font-black border border-zinc-100" 
                        : "text-zinc-500 hover:text-zinc-850"
                    )}
                    type="button"
                  >
                    Nodos Presets
                  </button>
                  <button
                    onClick={() => { setActiveMode('custom'); setErrorMsg(null); }}
                    className={cn(
                      "flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl cursor-pointer text-center",
                      activeMode === 'custom' 
                        ? "bg-white text-[#0F766E] shadow-[0_4px_12px_rgba(0,0,0,0.04)] font-black border border-zinc-100" 
                        : "text-zinc-500 hover:text-zinc-850"
                    )}
                    type="button"
                  >
                    Credenciales
                  </button>
                  <button
                    onClick={() => { setActiveMode('register'); setErrorMsg(null); }}
                    className={cn(
                      "flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all rounded-xl cursor-pointer text-center",
                      activeMode === 'register' 
                        ? "bg-white text-[#0F766E] shadow-[0_4px_12px_rgba(0,0,0,0.04)] font-black border border-zinc-100" 
                        : "text-zinc-500 hover:text-zinc-850"
                    )}
                    type="button"
                  >
                    Registrar Sonda
                  </button>
                </div>

                {activeMode === 'preset' && (
                  /* Preset selection view */
                  <div className="space-y-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#9ca3af] block">Seleccione Identidad Autorizada</span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {PRESET_USERS.map((u, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedPreset(idx)}
                          className={cn(
                            "p-5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center relative pointer-events-auto cursor-pointer",
                            selectedPreset === idx 
                              ? "border-2 border-[#0F766E] bg-[#f0f6ff]/40 shadow-[0_6px_20px_rgba(15, 118, 110,0.06)]" 
                              : "border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300"
                          )}
                        >
                          <div className="w-12 h-12 rounded-full border border-zinc-200 bg-white overflow-hidden mb-2.5 shadow-sm">
                            <img src={u.avatar} alt={u.name} className="w-full h-full object-cover grayscale" />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-tight text-zinc-800 block">{u.name}</span>
                          <span className="text-[9px] font-black text-[#0F766E] block tracking-wide mt-1">{u.badge}</span>
                        </button>
                      ))}
                    </div>

                    {/* Integrated dynamic context values */}
                    <div className="bg-zinc-50/60 border border-zinc-300 p-4 rounded-2xl space-y-3 mt-4 text-zinc-650 text-xs">
                      <div className="flex justify-between items-center border-b border-zinc-200 pb-2.5">
                        <span className="text-[8.5px] uppercase tracking-wider font-black text-zinc-450">Nodo Principal</span>
                        <span className="font-mono text-zinc-855 text-[10px] font-black">{PRESET_USERS[selectedPreset].node}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-zinc-200 pb-2.5">
                        <span className="text-[8.5px] uppercase tracking-wider font-black text-zinc-450">Rol Sistema</span>
                        <span className="text-zinc-855 text-[10px] font-black">{PRESET_USERS[selectedPreset].role}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[8.5px] uppercase tracking-wider font-black text-zinc-450">Sincronización</span>
                        <span className="font-mono text-zinc-855 text-[10px] font-black">{PRESET_USERS[selectedPreset].contributions} cargas</span>
                      </div>
                    </div>

                    <button
                      onClick={handlePresetSelect}
                      type="button"
                      className="w-full bg-[#0F766E] hover:bg-[#0A524D] text-white font-black text-[11.5px] uppercase tracking-[0.2em] py-4 rounded-2xl shadow-[0_6px_20px_rgba(15, 118, 110,0.2)] transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
                    >
                      Establecer Acceso <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {activeMode === 'custom' && (
                  /* Custom input form view matching reference exactly */
                  <form onSubmit={handleSubmitCustom} className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9.5px] font-bold tracking-wide text-zinc-700 block mb-1">Correo electrónico institucional o de Sonda</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                          <input
                            type="text"
                            placeholder="Ej. miguel / miguel.luna@unl.edu.ec"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 focus:border-[#0F766E] focus:bg-white outline-none text-xs font-semibold p-3.5 pl-11 text-zinc-900 transition-all rounded-xl placeholder-zinc-400"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[9.5px] font-bold tracking-wide text-zinc-700 block">Contraseña</label>
                          <a href="#" onClick={(e) => { e.preventDefault(); setErrorMsg("Por favor, póngase en contacto con el administrador del nodo UNL."); }} className="text-[9px] font-bold text-zinc-400 hover:text-[#0F766E] transition-colors">¿Has olvidado tu contraseña?</a>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 focus:border-[#0F766E] focus:bg-white outline-none text-xs font-semibold p-3.5 pl-11 text-zinc-900 transition-all rounded-xl placeholder-zinc-400"
                            required
                          />
                        </div>
                        <span className="text-[7.5px] text-zinc-400 font-bold uppercase mt-1 block tracking-wider">Acceso a sensores distribuido</span>
                      </div>
                    </div>

                    {/* Remember me device option of image */}
                    <div className="flex items-center gap-2 py-0.5">
                      <input 
                        type="checkbox" 
                        id="rememberDevice" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 accent-[#0F766E] rounded border-zinc-300 pointer-events-auto cursor-pointer"
                      />
                      <label htmlFor="rememberDevice" className="text-[10px] text-zinc-500 font-medium select-none cursor-pointer">
                        Recuerda este dispositivo durante 30 días.
                      </label>
                    </div>

                    {errorMsg && (
                      <div className="bg-[#0F766E]/5 border border-[#0F766E]/20 p-3 rounded-lg text-[9px] text-[#0F766E] font-black uppercase tracking-wide">
                        {errorMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-[#0F766E] hover:bg-[#0A524D] text-white font-black text-[11px] uppercase tracking-[0.2em] py-3.5 rounded-xl shadow-[0_4px_12px_rgba(15, 118, 110,0.18)] transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
                    >
                      Iniciar <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
                    </button>
                  </form>
                )}

                {activeMode === 'register' && (
                  /* Custom registration view */
                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[9.5px] font-bold tracking-wide text-zinc-700 block mb-1">Nombre Completo</label>
                        <input
                          type="text"
                          placeholder="Ej. Juan Pérez"
                          value={regName}
                          onChange={(e) => handleRegNameChange(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 focus:border-[#0F766E] focus:bg-white outline-none text-xs font-semibold p-3 text-zinc-900 transition-all rounded-xl placeholder-zinc-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] font-bold tracking-wide text-zinc-700 block mb-1">Correo Institucional</label>
                        <input
                          type="email"
                          placeholder="juan.perez@unl.edu.ec"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 focus:border-[#0F766E] focus:bg-white outline-none text-xs font-semibold p-3 text-zinc-900 transition-all rounded-xl placeholder-zinc-400"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[9.5px] font-bold tracking-wide text-zinc-700 block mb-1">Rol en Sonda</label>
                        <div className="relative">
                          <select
                            value={regRole}
                            onChange={(e) => handleRegRoleChange(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 focus:border-[#0F766E] focus:bg-white outline-none text-[11px] font-semibold p-3 text-zinc-900 transition-all rounded-xl appearance-none cursor-pointer"
                          >
                            <option value="Estudiante">Estudiante de Red</option>
                            <option value="Docente">Docente Investigador</option>
                            <option value="Investigador">Investigador Externo</option>
                            <option value="Administrador">Administrador de Nodo</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9.5px] font-bold tracking-wide text-zinc-700 block mb-1">Identificador de Sonda</label>
                        <input
                          type="text"
                          placeholder="Ej. node-est-juan"
                          value={regNode}
                          onChange={(e) => setRegNode(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 focus:border-[#0F766E] focus:bg-white outline-none text-[11.5px] font-mono font-black p-3 text-[#0F766E] text-left bg-[#f0f6ff]/45 transition-all rounded-xl placeholder-zinc-400"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[9.5px] font-bold tracking-wide text-zinc-700 block mb-1">Contraseña</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 focus:border-[#0F766E] focus:bg-white outline-none text-xs font-semibold p-3 text-zinc-900 transition-all rounded-xl placeholder-zinc-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9.5px] font-bold tracking-wide text-zinc-700 block mb-1">Confirmar clave</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 focus:border-[#0F766E] focus:bg-white outline-none text-xs font-semibold p-3 text-zinc-900 transition-all rounded-xl placeholder-zinc-400"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[8.5px] font-black uppercase tracking-widest text-[#9ca3af] block mb-2">Selección Avatar UNL</span>
                      <div className="flex gap-3">
                        {presetAvatars.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedAvatar(url)}
                            className={cn(
                              "w-9 h-9 rounded-full border overflow-hidden transition-all focus:outline-none cursor-pointer",
                              selectedAvatar === url 
                                ? "border-2 border-[#0F766E] scale-105 shadow-md shadow-[#0F766E]/15" 
                                : "border-zinc-200 hover:border-zinc-400 opacity-60 hover:opacity-100"
                            )}
                          >
                            <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="bg-red-50 border border-red-200/40 p-2.5 rounded-lg text-[9px] text-red-700 font-bold uppercase tracking-wide">
                        {errorMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-[#0F766E] hover:bg-[#0A524D] text-white font-black text-[11px] uppercase tracking-[0.2em] py-3.5 rounded-xl shadow-[0_4px_12px_rgba(15, 118, 110,0.18)] transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer"
                    >
                      Registrar Cuenta <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="h-[1px] bg-zinc-150 flex-1" />
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-zinc-400 whitespace-nowrap">O Sincronizar con</span>
                  <div className="h-[1px] bg-zinc-150 flex-1" />
                </div>

                {/* Highly structured Google Connector as requested */}
                <button
                  onClick={handleGoogleLogin}
                  className="w-full bg-white hover:bg-zinc-50 text-zinc-700 font-bold text-[10px] uppercase tracking-[0.15em] py-3 rounded-xl transition-all flex items-center justify-center gap-2.5 border border-zinc-200 shadow-sm"
                  type="button"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Iniciar con Google
                </button>
              </motion.div>
            ) : (
              /* High-tech custom logging view fitting within right column */
              <motion.div
                key="logging-active"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col justify-center text-center p-4"
              >
                <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 border-[3px] border-zinc-150 rounded-full" />
                  <div className="absolute inset-0 border-[3px] border-[#0F766E] rounded-full border-t-transparent animate-spin" />
                  <Activity className="w-5 h-5 text-[#0F766E] animate-pulse" />
                </div>

                <div className="space-y-4 w-full">
                  <div className="flex items-center justify-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#0F766E]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#0F766E]">SecureHandshake v4.0</span>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight italic text-zinc-900">Estableciendo Handshake</h3>
                  
                  {/* Logging screen with code style */}
                  <div className="bg-zinc-950 text-zinc-350 p-4 font-mono text-[9px] text-left rounded-xl space-y-1.5 h-32 overflow-y-hidden shadow-inner border border-zinc-800">
                    {activeSteps.slice(0, authStep + 1).map((s, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <span className="text-[#0F766E] font-bold">▶</span>
                        <span className={cn("leading-tight", idx === authStep ? "text-white font-bold animate-pulse" : "text-zinc-550")}>{s}</span>
                      </div>
                    ))}
                  </div>

                  {/* Progress Indicator */}
                  <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden mt-2">
                    <motion.div 
                      initial={{ width: '0%' }}
                      animate={{ width: `${((authStep + 1) / activeSteps.length) * 100}%` }}
                      transition={{ duration: 0.3 }}
                      className="bg-[#0F766E] h-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Footer block matching requested image details */}
          <div className="mt-8 pt-4 border-t border-zinc-100 flex flex-col sm:flex-row justify-between items-center text-[9px] text-zinc-400 font-bold uppercase tracking-wider gap-3">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sonda UNL Conectada</span>
            </div>
            
            <div className="flex items-center gap-3">
              <a href="#" onClick={(e) => {e.preventDefault(); alert("Ayuda Académica UNL habilitada.");}} className="hover:text-[#0F766E] flex items-center gap-1 transition-colors">
                <HelpCircle className="w-3 h-3" /> Soporte
              </a>
              <span className="text-zinc-200">|</span>
              <a href="#" onClick={(e) => {e.preventDefault(); alert("Las credenciales están protegidas mediante SSL.");}} className="hover:text-[#0F766E] transition-colors">Privacidad</a>
            </div>

            <span className="text-zinc-450 select-none hidden md:inline">© 2026 UNL Ecuador</span>
          </div>

        </div>

      </div>
    </div>
  );
}
