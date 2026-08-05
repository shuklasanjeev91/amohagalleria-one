import { Link, useRouter } from 'one'
import { useEffect, useState } from 'react'
import { Platform, Pressable, TextInput } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import {
  sendEmailOtp,
  validateEmail,
  validateOtp,
  verifyEmailOtp,
} from '~/lib/auth'
import { useGalleryAuth } from '~/lib/AuthProvider'
import { isSupabaseConfigured } from '~/lib/supabase'
import { LabelCaps, Muted } from './primitives'

type Step = 'email' | 'otp'

/** Inline email OTP form for `/login` and `/register` routes. */
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter()
  const { refresh } = useGalleryAuth()
  const [step, setStep] = useState<Step>('email')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    setStep('email')
    setOtp('')
    setError(null)
    setInfo(null)
    setBusy(false)
    setCooldown(0)
  }, [mode])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function requestOtp() {
    setError(null)
    setInfo(null)

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add URL and anon key to .env.')
      return
    }
    if (!validateEmail(email)) {
      setError('Enter a valid email address.')
      return
    }
    if (mode === 'register' && name.trim().length < 2) {
      setError('Please enter your name.')
      return
    }

    setBusy(true)
    const result = await sendEmailOtp(email, {
      fullName: mode === 'register' ? name : name.trim() || undefined,
    })
    setBusy(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setStep('otp')
    setCooldown(60)
    setInfo(
      mode === 'register'
        ? `Welcome — we sent a six-digit code to ${result.email}.`
        : `Code sent to ${result.email}. New emails are registered automatically.`,
    )
  }

  async function confirmOtp(code = otp) {
    setError(null)
    if (!validateOtp(code)) {
      setError('Enter the 6-digit code from your email.')
      return
    }

    setBusy(true)
    const result = await verifyEmailOtp(email, code, {
      fullName: mode === 'register' ? name : undefined,
    })
    setBusy(false)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setInfo('Signed in. Welcome to Amoha.')
    await refresh()
    const role = result.user?.role
    const dest = role === 'admin' ? '/studio/admin' : role === 'artist' ? '/studio' : '/login'
    setTimeout(() => {
      router.replace(dest as any)
    }, 400)
  }

  async function resend() {
    if (cooldown > 0 || busy) return
    setError(null)
    setBusy(true)
    const result = await sendEmailOtp(email, {
      fullName: mode === 'register' ? name : name.trim() || undefined,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setCooldown(60)
    setInfo('A new code has been sent.')
  }

  function onOtpChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    setOtp(digits)
    if (digits.length === 6) {
      void confirmOtp(digits)
    }
  }

  const alternateHref = mode === 'login' ? '/register' : '/login'
  const submitLabel =
    busy
      ? 'Please wait…'
      : step === 'email'
        ? mode === 'register'
          ? 'Continue'
          : 'Send secure code'
        : 'Verify & enter'

  if (Platform.OS === 'web') {
    return (
      <div className="g-auth-panel">
        <nav className="g-auth-steps" aria-label="Sign-in steps">
          <span className={`g-auth-steps__item${step === 'email' ? ' is-active' : ' is-done'}`}>
            <span className="g-auth-steps__num">01</span>
            Email
          </span>
          <span className="g-auth-steps__rule" aria-hidden />
          <span className={`g-auth-steps__item${step === 'otp' ? ' is-active' : ''}`}>
            <span className="g-auth-steps__num">02</span>
            Verify
          </span>
        </nav>

        <form
          className="g-auth-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (step === 'email') void requestOtp()
            else void confirmOtp()
          }}
        >
          {step === 'email' ? (
            <>
              {mode === 'register' ? (
                <label className="g-auth-field">
                  <span className="g-label">Full name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="As you wish to be addressed"
                    autoComplete="name"
                    disabled={busy}
                  />
                </label>
              ) : null}
              <label className="g-auth-field">
                <span className="g-label">Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={busy}
                  autoFocus
                />
              </label>
              <p className="g-auth-assist">
                We email a one-time code. No password is stored or required.
              </p>
            </>
          ) : (
            <>
              <p className="g-auth-email-hint">
                Enter the code sent to <strong>{email.trim().toLowerCase()}</strong>
              </p>
              <label className="g-auth-field g-auth-field--otp">
                <span className="g-label">One-time code</span>
                <input
                  className="g-otp-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => onOtpChange(e.target.value)}
                  placeholder="······"
                  disabled={busy}
                  autoFocus
                  aria-label="Six digit verification code"
                />
              </label>
              <div className="g-otp-actions">
                <button
                  type="button"
                  className="g-otp-resend"
                  onClick={() => void resend()}
                  disabled={busy || cooldown > 0}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  className="g-otp-resend"
                  onClick={() => {
                    setStep('email')
                    setOtp('')
                    setError(null)
                    setInfo(null)
                  }}
                  disabled={busy}
                >
                  Change email
                </button>
              </div>
            </>
          )}

          {error ? (
            <p className="g-auth-error" role="alert">
              {error}
            </p>
          ) : null}
          {info ? <p className="g-auth-success">{info}</p> : null}

          <button type="submit" className="g-auth-submit" disabled={busy}>
            <span>{submitLabel}</span>
            <span className="g-arrow-icon" aria-hidden>
              →
            </span>
          </button>
        </form>

        {step === 'email' ? (
          <p className="g-auth-switch">
            {mode === 'login' ? 'New to Amoha?' : 'Already collecting with us?'}{' '}
            <Link href={alternateHref as any} className="g-auth-switch__link">
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </Link>
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <YStack gap={20} maxWidth={480} width="100%">
      <XStack gap={12} alignItems="center">
        <LabelCaps color={step === 'email' ? '$accent' : '$color11'}>01 Email</LabelCaps>
        <Text color="$color11">·</Text>
        <LabelCaps color={step === 'otp' ? '$accent' : '$color11'}>02 Verify</LabelCaps>
      </XStack>
      {step === 'email' ? (
        <>
          {mode === 'register' ? (
            <YStack gap={6}>
              <LabelCaps>Name</LabelCaps>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                autoCapitalize="words"
                editable={!busy}
                style={nativeInputStyle}
              />
            </YStack>
          ) : null}
          <YStack gap={6}>
            <LabelCaps>Email</LabelCaps>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              style={nativeInputStyle}
            />
          </YStack>
          <Muted fontSize={13}>We email a one-time code. No password required.</Muted>
        </>
      ) : (
        <>
          <Muted fontSize={13}>Code sent to {email.trim().toLowerCase()}</Muted>
          <YStack gap={6}>
            <LabelCaps>One-time code</LabelCaps>
            <TextInput
              value={otp}
              onChangeText={onOtpChange}
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              editable={!busy}
              style={{ ...nativeInputStyle, letterSpacing: 8, fontSize: 22 }}
            />
          </YStack>
          <XStack gap={16}>
            <Pressable onPress={() => void resend()} disabled={busy || cooldown > 0}>
              <LabelCaps color="$accent">
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </LabelCaps>
            </Pressable>
            <Pressable
              onPress={() => {
                setStep('email')
                setOtp('')
                setError(null)
              }}
              disabled={busy}
            >
              <LabelCaps color="$accent">Change email</LabelCaps>
            </Pressable>
          </XStack>
        </>
      )}
      {error ? (
        <Text color="$accent" fontSize={13}>
          {error}
        </Text>
      ) : null}
      {info ? (
        <Text color="$accent" fontSize={13}>
          {info}
        </Text>
      ) : null}
      <Pressable
        onPress={() => (step === 'email' ? void requestOtp() : void confirmOtp())}
        disabled={busy}
      >
        <XStack
          alignItems="center"
          justifyContent="center"
          backgroundColor="$accent"
          paddingVertical={14}
          paddingHorizontal={18}
          opacity={busy ? 0.6 : 1}
        >
          <Text fontSize={15} color="#fcfbf8" fontWeight="600">
            {busy ? 'Please wait…' : step === 'email' ? 'Send secure code →' : 'Verify & enter →'}
          </Text>
        </XStack>
      </Pressable>
      {step === 'email' ? (
        <Link href={alternateHref as any}>
          <LabelCaps color="$accent">
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </LabelCaps>
        </Link>
      ) : null}
    </YStack>
  )
}

const nativeInputStyle = {
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(221, 214, 203, 0.95)',
  paddingVertical: 12,
  fontSize: 16,
  color: '#141210',
} as const
