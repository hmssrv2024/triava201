import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let client = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  client = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// In-memory fallback for tests or when no DB credentials are provided
const memory = {
  users: [
    {
      id: 1,
      username: 'alice',
      password: 'alice123',
      balance: 100,
      phase: 'desconectado',
      sessions: []
    },
    {
      id: 2,
      username: 'bob',
      password: 'bob456',
      balance: 200,
      phase: 'desconectado',
      sessions: []
    }
  ]
};

function nextId(list) {
  return list.length ? Math.max(...list.map(u => u.id)) + 1 : 1;
}

export async function getUsers() {
  if (client) {
    const { data, error } = await client.from('users').select('*');
    if (error) throw error;
    return data || [];
  }
  return memory.users;
}

export async function getUser(id) {
  if (client) {
    const { data, error } = await client.from('users').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116: row not found
    return data || null;
  }
  return memory.users.find(u => u.id === id) || null;
}

export async function createUser({ username, password, balance }) {
  if (client) {
    const { data, error } = await client
      .from('users')
      .insert({ username, password, balance, phase: 'desconectado', sessions: [] })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const user = {
    id: nextId(memory.users),
    username,
    password,
    balance: Number(balance),
    phase: 'desconectado',
    sessions: []
  };
  memory.users.push(user);
  return user;
}

export async function deleteUser(id) {
  if (client) {
    const { data, error } = await client.from('users').delete().eq('id', id).select().single();
    if (error) throw error;
    return data || null;
  }
  const index = memory.users.findIndex(u => u.id === id);
  if (index === -1) return null;
  const [removed] = memory.users.splice(index, 1);
  return removed;
}

export async function updateUserPassword(id, password) {
  if (client) {
    const { data, error } = await client
      .from('users')
      .update({ password })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const user = memory.users.find(u => u.id === id);
  if (user) {
    user.password = password;
  }
  return user || null;
}

export async function findUserByCredentials(username, password) {
  if (client) {
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }
  return memory.users.find(u => u.username === username && u.password === password) || null;
}

export async function addSession(id) {
  if (client) {
    const user = await getUser(id);
    if (!user) return null;
    const sessions = user.sessions || [];
    sessions.push({ login: Date.now(), logout: null });
    const { data, error } = await client
      .from('users')
      .update({ sessions, phase: 'activo' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const user = memory.users.find(u => u.id === id);
  if (user) {
    user.sessions.push({ login: Date.now(), logout: null });
    user.phase = 'activo';
  }
  return user || null;
}

export async function logoutSession(id) {
  if (client) {
    const user = await getUser(id);
    if (!user) return null;
    const sessions = user.sessions || [];
    const session = sessions[sessions.length - 1];
    if (session && !session.logout) {
      session.logout = Date.now();
    }
    const { data, error } = await client
      .from('users')
      .update({ sessions, phase: 'desconectado' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const user = memory.users.find(u => u.id === id);
  if (user) {
    const session = user.sessions[user.sessions.length - 1];
    if (session && !session.logout) {
      session.logout = Date.now();
    }
    user.phase = 'desconectado';
  }
  return user || null;
}

export async function getConnectedUsers() {
  if (client) {
    const { data, error } = await client.from('users').select('*');
    if (error) throw error;
    return (data || []).filter(u => (u.sessions || []).some(s => !s.logout));
  }
  return memory.users.filter(u => u.sessions.some(s => !s.logout));
}
