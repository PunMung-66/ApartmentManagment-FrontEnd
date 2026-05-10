import { useState } from "react"
import { Link } from "react-router"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "./components/ui/button"
import Footer from "./components/Footer"
import {
  Building2,
  MapPin,
  Wifi,
  Shield,
  Car,
  Snowflake,
  ChevronDown,
  Menu,
  X,
} from "lucide-react"

const sections = [
  { id: "hero", label: "Home" },
  { id: "gallery", label: "Rooms" },
  { id: "location", label: "Location" },
  { id: "contact", label: "Contact" },
]

const rooms = [
  {
    name: "Standard Room",
    size: "28 m²",
    capacity: "1-2 Persons",
    price: "3,000 THB/mo",
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1080&auto=format&fit=crop",
  },
  {
    name: "Superior Room",
    size: "35 m²",
    capacity: "2 Persons",
    price: "3,500 THB/mo",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1170&auto=format&fit=crop",
  },
  {
    name: "Deluxe Room",
    size: "42 m²",
    capacity: "2-3 Persons",
    price: "3,500 THB/mo",
    image:
      "https://plus.unsplash.com/premium_photo-1676321046262-4978a752fb15?q=80&w=1171&auto=format&fit=crop",
  },
]

const amenities = [
  { icon: Wifi, label: "Free Wi-Fi" },
  { icon: Shield, label: "CCTV" },
  { icon: Shield, label: "Security Guard" },
  { icon: Car, label: "Parking" },
  { icon: Building2, label: "Fully Furnished" },
  { icon: Snowflake, label: "A/C & Water Heater" },
]

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  })

  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0])
  const heroScale = useTransform(scrollY, [0, 500], [1, 1.1])

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert("Thank you for your message! We will get back to you soon.")
    setContactForm({ name: "", email: "", message: "" })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <button onClick={() => scrollTo("hero")} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
              Y
            </div>
            <span className="font-display text-lg font-bold text-primary">Yensabai</span>
          </button>

          <div className="hidden items-center gap-6 md:flex">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-primary"
              >
                {s.label}
              </button>
            ))}
            <Link to="/login">
              <Button variant="ghost" className="text-sm">
                Sign In
              </Button>
            </Link>
            <Link to="/login">
              <Button className="bg-primary text-white text-sm hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-1.5 text-gray-600 md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-gray-100 bg-white px-4 py-3 md:hidden"
          >
            <div className="flex flex-col gap-3">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="text-left text-sm font-medium text-gray-600 hover:text-primary"
                >
                  {s.label}
                </button>
              ))}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <Link to="/login" className="flex-1">
                  <Button variant="ghost" className="w-full text-sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/login" className="flex-1">
                  <Button className="w-full bg-primary text-white text-sm hover:bg-primary/90">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <motion.section
        id="hero"
        style={{ opacity: heroOpacity }}
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
      >
        <motion.div
          style={{ scale: heroScale }}
          className="absolute inset-0"
        >
          <img
            src="https://plus.unsplash.com/premium_photo-1684175656320-5c3f701c082c?q=80&w=1170&auto=format&fit=crop"
            alt="Modern apartment"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70" />
        </motion.div>
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm"
          >
            Behind Chandrakasem Rajabhat University
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="font-display text-5xl font-extrabold leading-tight text-white md:text-7xl"
          >
            Find Your
            <br />
            <span className="bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-transparent">
              Sanctuary
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="mx-auto mt-5 max-w-lg text-base text-white/70 md:text-lg"
          >
            Modern, secure, and fully furnished apartments starting at just 3,000 THB/month.
            Your comfort is our priority.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Button
              onClick={() => scrollTo("gallery")}
              className="bg-white text-primary hover:bg-white/90 px-6 py-2.5 h-auto text-sm font-semibold"
            >
              View Rooms
            </Button>
            <Button
              onClick={() => scrollTo("contact")}
              variant="ghost"
              className="border border-white/30 text-white hover:bg-white/10 px-6 py-2.5 h-auto text-sm"
            >
              Contact Us
            </Button>
          </motion.div>
        </div>

        <motion.button
          onClick={() => scrollTo("gallery")}
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50"
        >
          <ChevronDown className="h-6 w-6" />
        </motion.button>
      </motion.section>

      {/* ===== AMENITIES STRIP ===== */}
      <section className="border-b border-gray-100 bg-gray-50/50 py-8">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {amenities.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <a.icon className="h-4 w-4 text-teal-600" />
                {a.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ROOM GALLERY ===== */}
      <section id="gallery" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-600">
              Our Rooms
            </p>
            <h2 className="font-display text-3xl font-bold text-gray-900 md:text-4xl">
              Choose Your Space
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500">
              Every room is designed with care — from cozy standards to spacious deluxe suites.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room, i) => (
              <motion.div
                key={room.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="relative h-52 overflow-hidden">
                  {room.image ? (
                    <>
                      <img
                        src={room.image}
                        alt={room.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </>
                    ) : null}
                  <div className="absolute bottom-3 left-3 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5">
                    <p className="text-xs font-medium text-white">{room.size}</p>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-gray-900">{room.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">Up to {room.capacity}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-teal-700">{room.price}</p>
                    <span className="text-xs font-medium text-teal-600 opacity-0 transition-opacity group-hover:opacity-100">
                      Learn more →
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LOCATION ===== */}
      <section id="location" className="bg-gray-50/50 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-600">
              Location
            </p>
            <h2 className="font-display text-3xl font-bold text-gray-900 md:text-4xl">
              Prime Location
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500">
              Situated in a peaceful neighborhood with easy access to everything you need.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center space-y-5"
            >
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                <div>
                  <p className="font-semibold text-gray-900">Address</p>
                  <p className="text-sm text-gray-500">
                    Behind Chandrakasem Rajabhat University, Bangkok, Thailand
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-600" />
                <div>
                  <p className="font-semibold text-gray-900">Nearby</p>
                  <p className="text-sm text-gray-500">
                    600m from Lotus Wang Hin · Local markets · Public transport
                  </p>
                </div>
              </div>
              <a
                href="https://maps.app.goo.gl/9YRLCmEVyfNKCZ2s5"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                <MapPin className="h-4 w-4" />
                Open in Google Maps
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="overflow-hidden rounded-2xl"
            >
              <iframe
                src="https://www.google.com/maps?q=Chandrakasem+Rajabhat+University+Bangkok+Thailand&output=embed&z=15"
                width="100%"
                height="320"
                className="rounded-2xl"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Apartment Location"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-600">
              Get in Touch
            </p>
            <h2 className="font-display text-3xl font-bold text-gray-900 md:text-4xl">
              Contact Us
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500">
              Have questions or want to schedule a visit? We'd love to hear from you.
            </p>
          </motion.div>

          <div className="mt-12 mx-auto max-w-2xl">
            <motion.form
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              onSubmit={handleContactSubmit}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <textarea
                placeholder="Your Message"
                rows={5}
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
              <Button
                type="submit"
                className="bg-primary text-white hover:bg-primary/90 px-6 py-2.5 h-auto text-sm"
              >
                Send Message
              </Button>
            </motion.form>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <Footer />
    </div>
  )
}

export default App
