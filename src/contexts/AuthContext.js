/**
 * Contexto de Autenticación
 * Maneja el estado global de autenticación de la aplicación
 */

'use client';

import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { findByEmail, createProfessor } from '@/services/professor.service';
import { log, logError } from '@/constants/config';

const MODULE_NAME = 'AuthContext';

export const AuthContext = createContext({
  user: null,
  professor: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
});

export const AuthProvider = ({ children }) => {
  const supabase = createClient();
  const supabaseRef = useRef(supabase); // Ref estable para useCallback
  const [user, setUser] = useState(null);
  const [professor, setProfessor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar profesor basado en el usuario de Supabase Auth
  const loadProfessor = useCallback(async (authUser) => {
    try {
      if (!authUser) {
        setProfessor(null);
        return;
      }

      log(MODULE_NAME, 'Cargando datos del profesor', {
        userId: authUser.id,
        email: authUser.email,
      });

      const prof = await findByEmail(authUser.email, supabaseRef.current);
      
      if (prof) {
        setProfessor(prof);
        log(MODULE_NAME, 'Profesor cargado exitosamente', {
          professorId: prof.id,
        });
      } else {
        log(MODULE_NAME, 'Profesor no encontrado en BD', {
          email: authUser.email,
        });
        setProfessor(null);
      }
    } catch (error) {
      logError(MODULE_NAME, 'Error al cargar profesor', error);
      setProfessor(null);
    }
  }, []);

  // Inicializar autenticación
  useEffect(() => {
    log(MODULE_NAME, 'Inicializando AuthContext');

    // Obtener sesión inicial
    supabaseRef.current.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      loadProfessor(currentUser).finally(() => setLoading(false));
    });

    // Escuchar cambios en el estado de autenticación
    const {
      data: { subscription },
    } = supabaseRef.current.auth.onAuthStateChange((_event, session) => {
      log(MODULE_NAME, 'Cambio en estado de autenticación', { event: _event });
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      loadProfessor(currentUser);
    });

    return () => subscription.unsubscribe();
  }, [loadProfessor]);

  /**
   * Iniciar sesión
   * @param {string} email - Email del profesor
   * @param {string} password - Contraseña
   */
  const login = useCallback(async (email, password) => {
    try {
      log(MODULE_NAME, 'Iniciando sesión', { email });

      const { data, error } = await supabaseRef.current.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      log(MODULE_NAME, 'Sesión iniciada exitosamente', {
        userId: data.user.id,
      });

      return { success: true, user: data.user };
    } catch (error) {
      logError(MODULE_NAME, 'Error al iniciar sesión', error);
      
      let message = 'Error al iniciar sesión';
      if (error.message === 'Invalid login credentials') {
        message = 'Credenciales inválidas';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Email no confirmado';
      }

      return { success: false, error: message };
    }
  }, []);

  /**
   * Cerrar sesión
   * Siempre retorna success porque si la sesión no existe, es OK
   */
  const logout = useCallback(async () => {
    try {
      log(MODULE_NAME, 'Cerrando sesión');

      // Intentar cerrar sesión en Supabase
      // Ignoramos errores porque la sesión podría no existir
      await supabaseRef.current.auth.signOut();

      log(MODULE_NAME, 'Sesión cerrada exitosamente');
      return { success: true };
    } catch (error) {
      // Log del error pero retornamos success de todos modos
      // porque el estado local se limpiará con onAuthStateChange
      log(MODULE_NAME, 'Advertencia al cerrar sesión (ignorado)', error);
      return { success: true };
    }
  }, []);

  /**
   * Registrar nuevo profesor
   * @param {object} data - Datos del registro
   */
  const register = useCallback(async ({ name, lastName, email, password }) => {
    try {
      log(MODULE_NAME, 'Registrando nuevo profesor', { email });

      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabaseRef.current.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            lastName,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      log(MODULE_NAME, 'Usuario de auth creado', { userId: authData.user.id });

      // Crear registro en tabla Professors
      const professorData = await createProfessor({ name, lastName, email }, supabaseRef.current);

      log(MODULE_NAME, 'Profesor registrado exitosamente', {
        professorId: professorData.id,
      });

      return {
        success: true,
        user: authData.user,
        professor: professorData,
      };
    } catch (error) {
      logError(MODULE_NAME, 'Error al registrar profesor', error);

      let message = 'Error al registrar';
      if (error.message.includes('already registered')) {
        message = 'El email ya está registrado';
      } else if (error.message.includes('Password')) {
        message = 'La contraseña debe tener al menos 6 caracteres';
      }

      return { success: false, error: message };
    }
  }, []);

  const value = {
    user,
    professor,
    loading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
