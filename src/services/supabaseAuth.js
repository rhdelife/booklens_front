/**
 * Supabase 인증 서비스
 * Supabase Auth를 사용한 인증 처리
 */

import { supabase } from '../lib/supabase'

/**
 * 이메일/비밀번호로 로그인
 */
export const supabaseLogin = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message || '로그인에 실패했습니다.')
    }

    if (!data.user) {
      throw new Error('사용자 정보를 가져올 수 없습니다.')
    }

    // 사용자 프로필 정보 가져오기 (profiles 테이블에서)
    let profile = null
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (!profileError && profileData) {
        profile = profileData
      }
    } catch (profileErr) {
      console.warn('프로필 정보를 가져오지 못했습니다:', profileErr)
    }

    const userData = {
      id: data.user.id,
      email: data.user.email,
      name: profile?.name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || '사용자',
      avatar_url: profile?.avatar_url || data.user.user_metadata?.avatar_url,
      created_at: data.user.created_at,
    }

    return {
      user: userData,
      token: data.session?.access_token,
      session: data.session,
    }
  } catch (error) {
    console.error('Supabase login error:', error)
    throw error
  }
}

/**
 * 이메일/비밀번호로 회원가입
 */
export const supabaseSignup = async (email, password, name) => {
  try {
    // 1. Supabase Auth에 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    })

    if (authError) {
      throw new Error(authError.message || '회원가입에 실패했습니다.')
    }

    if (!authData.user) {
      throw new Error('사용자 생성에 실패했습니다.')
    }

    // 2. 프로필 테이블에 사용자 정보 저장 (profiles 테이블이 있다고 가정)
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email,
          name: name,
          created_at: new Date().toISOString(),
        })

      if (profileError) {
        console.warn('프로필 생성 실패 (테이블이 없을 수 있음):', profileError)
        // 프로필 테이블이 없어도 계속 진행
      }
    } catch (profileErr) {
      console.warn('프로필 생성 중 오류 (무시됨):', profileErr)
    }

    const userData = {
      id: authData.user.id,
      email: authData.user.email,
      name: name,
      created_at: authData.user.created_at,
    }

    return {
      user: userData,
      token: authData.session?.access_token,
      session: authData.session,
    }
  } catch (error) {
    console.error('Supabase signup error:', error)
    throw error
  }
}

/**
 * 현재 사용자 정보 가져오기
 */
export const supabaseGetCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      throw new Error(error.message || '사용자 정보를 가져올 수 없습니다.')
    }

    if (!user) {
      throw new Error('로그인되어 있지 않습니다.')
    }

    // 프로필 정보 가져오기
    let profile = null
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileError && profileData) {
        profile = profileData
      }
    } catch (profileErr) {
      console.warn('프로필 정보를 가져오지 못했습니다:', profileErr)
    }

    const userData = {
      id: user.id,
      email: user.email,
      name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || '사용자',
      avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
      created_at: user.created_at,
    }

    return { user: userData }
  } catch (error) {
    console.error('Supabase getCurrentUser error:', error)
    throw error
  }
}

/**
 * 로그아웃
 */
export const supabaseLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message || '로그아웃에 실패했습니다.')
    }
  } catch (error) {
    console.error('Supabase logout error:', error)
    throw error
  }
}

/**
 * 세션 확인 및 자동 갱신
 */
export const supabaseGetSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      throw error
    }
    return session
  } catch (error) {
    console.error('Supabase getSession error:', error)
    return null
  }
}

/**
 * 인증 상태 변경 리스너 설정
 */
export const supabaseOnAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}
