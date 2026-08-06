import { useEffect, useState } from 'react'

export const LOGIN_PHOTOS = [
  '/auth/finance-review.webp',
  '/auth/finance-advisory-couple.webp',
  '/auth/advisory.webp',
  '/auth/login-panel.webp',
]

export const SIGNUP_PHOTOS = [
  '/auth/team-collaboration.webp',
  '/auth/office-review.webp',
  '/auth/professional-urban.webp',
  '/auth/professional-rooftop.webp',
]

const PHOTO_INTERVAL_MS = 4500

export function AuthPhotoPanel({
  heading,
  subheading,
  photos,
}: {
  heading: string
  subheading: string
  photos: string[]
}) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % photos.length)
    }, PHOTO_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [photos])

  return (
    <aside className="relative hidden min-h-[100dvh] overflow-hidden bg-navy-900 lg:block">
      {photos.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={
            'absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-[1400ms] ease-in-out animate-safe-auth-zoom ' +
            (i === index ? 'opacity-100' : 'opacity-0')
          }
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/35 to-transparent" />

      <div className="relative flex h-full flex-col justify-end p-10 xl:p-14">
        <div key={index} className="animate-safe-auth-caption max-w-md">
          <h2 className="font-display text-3xl font-extrabold leading-tight text-white xl:text-4xl">
            {heading}
          </h2>
          <p className="mt-3 text-sm text-white/70">{subheading}</p>

          <div className="mt-6 flex gap-1.5">
            {photos.map((src, i) => (
              <span
                key={src}
                className={
                  'h-1.5 rounded-full transition-all duration-500 ' +
                  (i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/35')
                }
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
