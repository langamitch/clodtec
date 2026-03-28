'use client'
import Image from 'next/image'
import React, { useCallback, useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import SiteIntro from "./components/SiteIntro"

const Page = () => {
  const [time, setTime] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showIntro, setShowIntro] = useState(true)   // ← was missing
  const wrapperRef = useRef<HTMLDivElement>(null)
  const innerScrollRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)

  // GSAP refs
  const navRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const heroIntroRef = useRef<HTMLDivElement>(null)
  const heroPartnersRef = useRef<HTMLDivElement>(null)
  const heroPillRef = useRef<HTMLDivElement>(null)
  const heroPillMobileRef = useRef<HTMLDivElement>(null)
  const heroBottomRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const sidebarNavRef = useRef<HTMLElement>(null)
  const sidebarBottomRef = useRef<HTMLDivElement>(null)
  const line1Ref = useRef<HTMLSpanElement>(null)
  const line2Ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      )
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  // ── HERO ENTRANCE ANIMATION — fires only after intro is done ──
  useEffect(() => {
    if (showIntro) return   // ← wait until intro unmounts

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      if (navRef.current) {
        tl.fromTo(
          navRef.current,
          { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
          { clipPath: 'inset(0 0% 0 0)', duration: 0.9 },
          0.2
        )
      }

      if (hamburgerRef.current) {
        tl.fromTo(
          hamburgerRef.current,
          { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
          { clipPath: 'inset(0 0% 0 0)', duration: 0.7 },
          0.2
        )
      }

      if (heroIntroRef.current) {
        const spans = heroIntroRef.current.querySelectorAll('span')
        tl.fromTo(
          spans,
          { clipPath: 'inset(0 0 100% 0)', y: 20, opacity: 0 },
          {
            clipPath: 'inset(0 0 0% 0)',
            y: 0,
            opacity: 1,
            duration: 0.75,
            stagger: 0.12,
          },
          0.35
        )
      }

      if (heroPillMobileRef.current) {
        tl.fromTo(
          heroPillMobileRef.current,
          { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
          { clipPath: 'inset(0 0% 0 0)', duration: 1, ease: 'power2.inOut' },
          0.5
        )
      }

      if (heroPartnersRef.current) {
        const cols = heroPartnersRef.current.querySelectorAll('.partner-col')
        tl.fromTo(
          cols,
          { clipPath: 'inset(100% 0 0 0)', opacity: 0 },
          {
            clipPath: 'inset(0% 0 0 0)',
            opacity: 1,
            duration: 0.7,
            stagger: 0.15,
          },
          0.6
        )
      }

      if (heroPillRef.current) {
        tl.fromTo(
          heroPillRef.current,
          { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
          { clipPath: 'inset(0 0% 0 0)', duration: 1, ease: 'power2.inOut' },
          0.6
        )
      }

      if (heroBottomRef.current) {
        tl.fromTo(
          heroBottomRef.current,
          { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
          { clipPath: 'inset(0 0% 0 0)', duration: 0.8 },
          0.85
        )
      }
    })

    return () => ctx.revert()
  }, [showIntro])   // ← re-runs when showIntro flips to false

  const handleIntroDone = useCallback(() => {
    setShowIntro(false)   // ← now correctly references the state above
  }, [])

  // ── SIDEBAR OPEN / CLOSE + HAMBURGER MORPH ANIMATION ──
  useEffect(() => {
    if (!sidebarRef.current) return

    if (menuOpen) {
      gsap.set(sidebarRef.current, { clipPath: 'inset(0 0 0 100%)' })
      gsap.to(sidebarRef.current, {
        clipPath: 'inset(0 0 0 0%)',
        duration: 0.55,
        ease: 'power3.inOut',
      })

      gsap.to(line1Ref.current, {
        y: 7,
        duration: 0.3,
        ease: 'power2.inOut',
      })
      gsap.to(line2Ref.current, {
        y: -7,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.inOut',
      })
    } else {
      gsap.to(sidebarRef.current, {
        clipPath: 'inset(0 0 0 100%)',
        duration: 0.45,
        ease: 'power3.inOut',
      })

      gsap.to(line1Ref.current, {
        y: 0,
        duration: 0.3,
        ease: 'power2.inOut',
      })
      gsap.to(line2Ref.current, {
        y: 0,
        opacity: 1,
        duration: 0.3,
        ease: 'power2.inOut',
      })
    }
  }, [menuOpen])

  // Lock body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    const wrapper = wrapperRef.current
    const innerScroll = innerScrollRef.current
    if (!wrapper || !innerScroll) return

    function setWrapperHeight() {
      const innerScrollHeight = innerScroll!.scrollHeight - innerScroll!.clientHeight
      wrapper!.style.height = `${window.innerHeight + innerScrollHeight}px`
    }

    function onWindowScroll() {
      const wrapperTop = wrapper!.offsetTop
      const scrolledPast = Math.max(0, window.scrollY - wrapperTop)
      const maxInnerScroll = innerScroll!.scrollHeight - innerScroll!.clientHeight
      const targetInner = Math.min(scrolledPast, maxInnerScroll)

      innerScroll!.scrollTop = targetInner

      if (progressRef.current) {
        const pct = maxInnerScroll > 0 ? (targetInner / maxInnerScroll) * 100 : 0
        progressRef.current.style.height = `${pct}%`
      }
      if (indicatorRef.current) {
        indicatorRef.current.style.opacity = targetInner > 30 ? '0' : '1'
      }
    }

    setWrapperHeight()
    window.addEventListener('resize', setWrapperHeight)
    window.addEventListener('scroll', onWindowScroll, { passive: true })
    onWindowScroll()

    return () => {
      window.removeEventListener('resize', setWrapperHeight)
      window.removeEventListener('scroll', onWindowScroll)
    }
  }, [])

  return (
    <div className="relative min-h-fit">

      {/* ── SITE INTRO OVERLAY ── */}
      {showIntro && <SiteIntro onDone={handleIntroDone} />}

      {/* ── FULLSCREEN MOBILE SIDEBAR ── */}
      <div
        ref={sidebarRef}
        className="fixed inset-0 z-50 price flex flex-col lg:hidden"
        style={{
          clipPath: 'inset(0 0 0 100%)',
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}
      >
        <nav ref={sidebarNavRef} className='flex flex-col px-4 pt-6'>
          {['HOME', 'WORK', 'ABOUT'].map((item) => (
            <span
              key={item}
              onClick={() => setMenuOpen(false)}
              className='text-white font-bold cursor-pointer uppercase leading-12 hover:opacity-50 transition-opacity'
              style={{ fontSize: 'clamp(3.5rem, 20vw, 4rem)' }}
            >
              {item}
            </span>
          ))}
        </nav>

        <div ref={sidebarBottomRef} className='flex-1 flex flex-col justify-end pb-10'>
          <div className='flex flex-col items-center text-center text-white text-sm gap-5'>
            <div className='flex flex-col gap-0.5 leading-snug'>
              <span>Durban {time}</span>
              <span>South Africa 29.8587° S</span>
              <span>31.0218° E</span>
            </div>
            <div className='flex flex-col gap-0.5 leading-snug'>
              <span>Work with us:</span>
              <span className='underline cursor-pointer'>hello@cloudtec.studio</span>
              <span>Founder: Wandile (Kenzo)</span>
            </div>
            <div className='flex flex-col gap-0.5 leading-snug'>
              <span className='underline cursor-pointer'>Instagram</span>
              <span className='underline cursor-pointer'>LinkedIn</span>
            </div>
            <div className='flex flex-col gap-0.5 leading-snug text-white/50 text-xs'>
              <span className='underline cursor-pointer'>Privacy Policy</span>
              <span className='underline cursor-pointer'>Terms of Use</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── HERO SECTION ── */}
      <div className='grid p-4 sm:p-6 lg:p-8 grid-cols-4 lg:grid-cols-12 gap-4 min-h-screen'>

        {/* Hamburger / Close toggle */}
        <div className='col-span-4 fixed right-4 top-4 z-[60] mix-blend-difference flex justify-end lg:hidden'>
          <button
            ref={hamburgerRef}
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className='w-10 h-10 flex flex-col justify-center items-end gap-[5px]'
            style={{ clipPath: 'inset(0 100% 0 0)' }}
          >
            <span
              ref={line1Ref}
              className='block w-9 h-1 bg-white'
              style={{ transformOrigin: 'center' }}
            />
            <span
              ref={line2Ref}
              className='block w-9 h-1 bg-white'
              style={{ transformOrigin: 'center' }}
            />
          </button>
        </div>

        {/* Left: Intro copy */}
        <div
          ref={heroIntroRef}
          className='col-span-4 lg:col-start-1 lg:col-end-5 text-xl sm:text-2xl flex flex-col'
        >
          <span className='mb-4' style={{ clipPath: 'inset(0 0 100% 0)', opacity: 0 }}>It doesn't need to be this hard.</span>
          <span className='mb-4' style={{ clipPath: 'inset(0 0 100% 0)', opacity: 0 }}>
            Cloudtec is a web experience studio run by{' '}
            <span className='underline'>Wandile,</span>
            <span className='underline pl'>Kenzo</span>
            . We build change-making web experiences for B2B founders who refuse to be underestimated.
          </span>
          <span className='mb-4' style={{ clipPath: 'inset(0 0 100% 0)', opacity: 0 }}>
            We help teams increase multi-layered media output at scale, eliminating
            operational drag and burnout, while maximizing cost efficiency.
          </span>
        </div>

        {/* ── MOBILE PILL ── */}
        <div
          ref={heroPillMobileRef}
          className='col-span-4 lg:hidden min-h-40 sm:min-h-60 w-full bg-white rounded-full'
          style={{ clipPath: 'inset(0 100% 0 0)' }}
        />

        {/* Middle: Partnership columns */}
        <div
          ref={heroPartnersRef}
          className='col-span-4 lg:col-start-6 lg:col-end-10 flex flex-col sm:flex-row sm:justify-between gap-8 sm:gap-4'
        >
          <div className='partner-col flex flex-col' style={{ clipPath: 'inset(100% 0 0 0)', opacity: 0 }}>
            <span className='mono text-sm text-white/80 font-bold mb-4'>BRAND PARTNERSHIP</span>
            <div className='flex gap-8 sm:gap-12'>
              <div className='flex flex-col'>
                <span>Apple</span>
                <span>Netflix</span>
                <span>Meta</span>
                <span>Google</span>
                <span>Sony</span>
                <span>Youtube</span>
              </div>
              <div className='flex flex-col'>
                <span>Galxboy</span>
                <span>Amaxhosa</span>
                <span>Shein</span>
                <span>Isthixo</span>
                <span>Cultish</span>
                <span>Rare Effect</span>
              </div>
            </div>
          </div>

          <div className='partner-col flex flex-col' style={{ clipPath: 'inset(100% 0 0 0)', opacity: 0 }}>
            <span className='mono text-sm font-bold text-white/80 mb-4'>CELEBRITIES & TALENT</span>
            <div className='flex flex-col'>
              <span>Rich Mnisi</span>
              <span>Tait</span>
              <span>Rico Lewis</span>
              <span>Mat Armstrong</span>
              <span>Sun-El Musician</span>
              <span>Carl Pei</span>
              <span>Msaki</span>
              <span>Nico Mueckay</span>
              <span>Asif Hassam</span>
            </div>
          </div>
        </div>

        {/* Right: CTA — desktop only */}
        <div className='hidden lg:flex col-span-4 lg:col-start-11 lg:col-end-13 justify-end h-fit'>
          <div
            ref={navRef}
            className='flex justify-between gap-4'
            style={{ clipPath: 'inset(0 100% 0 0)' }}
          >
            <span className='text-sm font-bold mono cursor-pointer text-white/80'>WORK</span>
            <span className='text-sm font-bold mono cursor-pointer text-white/80'>ABOUT</span>
            <span className='text-sm font-bold mono cursor-pointer text-white/80'>CONTACT</span>
          </div>
        </div>

        {/* ── DESKTOP PILL ── */}
        <div
          ref={heroPillRef}
          className='hidden lg:block lg:col-span-12 min-h-40 sm:min-h-60 w-full bg-white rounded-full'
          style={{ clipPath: 'inset(0 100% 0 0)' }}
        />

        {/* Bottom bar */}
        <div
          ref={heroBottomRef}
          className='col-span-4 lg:col-span-12 font-bold mono flex justify-between items-end text-xs sm:text-sm mt-auto pt-8'
          style={{ clipPath: 'inset(0 100% 0 0)' }}
        >
          <div className='flex flex-col'>
            <span className='tabular-nums'>{time}</span>
            <span>SOUTH AFRICA STANDARD TIME</span>
          </div>
          <div className='flex flex-col items-end'>
            <span>29.8587° S, 31.0218° E</span>
            <span className='h-8 sm:h-10 w-24 sm:w-32 relative'>
              <Image
                src="/ct.svg"
                alt="Cloudtec"
                fill
                className="object-contain"
              />
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Page