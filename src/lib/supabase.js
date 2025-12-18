/**
 * Supabase 클라이언트 설정
 */

import { createClient } from '@supabase/supabase-js'

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ueffydcywfamsxdiggym.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZmZ5ZGN5d2Zhc214ZGlnZ3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzU0MTMsImV4cCI6MjA4MTYxMTQxM30.o9QVYLt8yA2npLdc6mAyyhFi_J74JW06UiXeGZ9D_Fo'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL 또는 Anon Key가 설정되지 않았습니다.')
}

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// 디버깅: Supabase 설정 확인
console.log('🔧 Supabase Configuration:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  envUrl: import.meta.env.VITE_SUPABASE_URL || 'not set',
  envAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'set' : 'not set',
})
