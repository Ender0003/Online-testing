import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const mapProfileToUser = (profile) => ({
  id: profile.id,
  name: profile.name ?? profile.full_name ?? '',
  email: profile.email,
  role: profile.role,
});

const sanitizeSavedUser = (user) => {
  if (!user || typeof user !== 'object') return null;

  return {
    id: user.id,
    name: user.name ?? '',
    email: user.email,
    role: user.role,
  };
};

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('current_user');
      return saved ? sanitizeSavedUser(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('current_user');
    }
  }, [currentUser]);

  const authenticate = async (credentials, isLoginMode) => {
    const { email, password, name, role } = credentials;
    const normalizedEmail = email.toLowerCase().trim();

    if (isLoginMode) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (error) {
        return { success: false, error: 'Не вдалося підключитися до бази профілів.' };
      }

      if (!data || data.password !== password) {
        return { success: false, error: 'Невірний email або пароль' };
      }

      if (data.role !== role) {
        const roleLabel = data.role === 'student' ? 'студент' : 'викладач';
        return {
          success: false,
          error: `Цей акаунт зареєстрований як ${roleLabel}.`,
        };
      }

      const user = mapProfileToUser(data);
      setCurrentUser(user);
      return { success: true, user };
    }

    const { data: existingUser, error: existingError } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingError) {
      return { success: false, error: 'Не вдалося перевірити email у базі.' };
    }

    if (existingUser) {
      const roleLabel = existingUser.role === 'student' ? 'студент' : 'викладач';
      return {
        success: false,
        error: `Email вже зайнятий роллю: ${roleLabel}`,
      };
    }

    const profilePayload = {
      name: name?.trim() || '',
      email: normalizedEmail,
      password,
      role,
    };

    const { data: createdProfile, error: createError } = await supabase
      .from('profiles')
      .insert([profilePayload])
      .select()
      .single();

    if (createError) {
      return { success: false, error: 'Не вдалося зберегти профіль у базі.' };
    }

    const user = mapProfileToUser(createdProfile);
    setCurrentUser(user);
    return { success: true, user };
  };

  const logout = () => setCurrentUser(null);

  return { currentUser, authenticate, logout };
}
