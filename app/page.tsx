'use client'
import Image from 'next/image'
import React, { useState, useEffect, useRef } from 'react'

const Page = () => {
  const [time, setTime] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const innerScrollRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      )
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

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
    <div>
      {/* ── HERO SECTION ── */}
      <div className='grid p-8 grid-cols-4 lg:grid-cols-12 gap-4 min-h-screen'>

        {/* Left: Intro copy */}
        <div className='col-span-4 lg:col-start-1 lg:col-end-5 text-2xl flex flex-col'>
          <span className='mb-4'>It doesn't need to be this hard.</span>
          <span className='mb-4'>
            Cloudtec is a web experience studio run by{' '}
            <span className='underline'>Wandile ( Kenzo )</span>. We build
            change-making web experiences for B2B founders who refuse to be
            underestimated.
          </span>
          <span className='mb-4'>
            We help teams increase multi-layered media output at scale, eliminating
            operational drag and burnout, while maximizing cost efficiency.
          </span>
        </div>

        {/* Middle: Partnership columns */}
        <div className='col-span-4 lg:col-start-6 lg:col-end-10 flex justify-between'>
          <div className='flex flex-col'>
            <span className='mono text-sm text-white/80 font-bold mb-4'>BRAND PARTNERSHIP</span>
            <div className='flex gap-12'>
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

          <div className='flex flex-col'>
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

        {/* Right: CTA */}
        <div className='col-span-4 lg:col-start-11 lg:col-end-13 flex justify-end h-fit'>
          {/* Right: CTA <button className='bg-white uppercase mono text-black px-4 py-2 rounded-full text-sm hover:bg-[#0008ff] hover:text-white transition'>
            Partner with us
          </button>*/}
          <div className='flex justify-between gap-4'>
          <span className='text-sm font-bold mono cursor-pointer text-white/80'>WORK</span>
          <span className='text-sm font-bold mono cursor-pointer text-white/80'>ABOUT</span>
          <span className='text-sm font-bold mono cursor-pointer text-white/80'>CONTACT</span>
        </div>
        </div>
        <div className='min-h-60 col-span-4 lg:col-span-12 w-full bg-white rounded-full'>
         
        </div>

        {/* Bottom bar */}
        <div className='col-span-4 lg:col-span-12 font-bold mono flex justify-between items-end text-sm mt-auto pt-8'>
          <div className='flex flex-col'>
            <span className='tabular-nums'>{time}</span>
            <span>SOUTH AFRICA STANDARD TIME</span>
          </div>
          <div className='flex flex-col'>
            <span>29.8587° S, 31.0218° E</span>
            <span className='h-10 relative '>
              <Image src="/ct.svg" 
                     alt="Cloudtec" 
                     fill
                     className="object-contain" />
            </span>
          </div>
         
        </div>
      </div>


    </div>
  )
}

export default Page